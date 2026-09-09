#!/usr/bin/env python3
"""Independently verify exact score, source mapping, PCM duration and codecs."""
import argparse, json, math, subprocess
from pathlib import Path
import numpy as np
from scipy import signal
from release_common import SR, preflight, require, sha, write_json

def decode(path):
    result=subprocess.run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(path),'-f','f32le','-ar',str(SR),'-ac','2','-'],check=True,capture_output=True)
    require(not result.stderr,f'Decode reported an error for {path.name}')
    x=np.frombuffer(result.stdout,dtype='<f4').reshape(-1,2)
    require(len(x)>0 and np.isfinite(x).all(),f'Empty/nonfinite PCM: {path.name}')
    return x

def measure(path,expected_frames,codec,levels=True):
    probe=json.loads(subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],check=True,capture_output=True,text=True).stdout)
    require(len(probe['streams'])==1,'Audio release must contain exactly one stream')
    s=probe['streams'][0]
    require(s['codec_name']==codec and int(s['sample_rate'])==SR and s['channels']==2,f'Wrong format: {path.name}')
    x=decode(path)
    require(len(x)==expected_frames,f'Decoded frame-count mismatch: {path.name} {len(x)} != {expected_frames}')
    clipped=int(np.count_nonzero(np.abs(x)>=1))
    require(clipped==0,f'Clipped samples in {path.name}')
    row={'filename':path.name,'sha256':sha(path),'decodedFrames':len(x),'decodedDurationSeconds':len(x)/SR,
         'sampleRate':SR,'channels':2,'codec':codec,'finitePcm':True,'fullDecodePassed':True,
         'clippedSampleCount':clipped,'samplePeakDbfs':float(20*np.log10(max(float(np.max(np.abs(x))),1e-15))),
         'containerStartTimeSeconds':float(probe['format'].get('start_time',0))}
    if codec=='pcm_s24le':require(int(s['bits_per_sample'])==24,'Master WAV is not 24-bit PCM')
    if levels:
        result=subprocess.run(['ffmpeg','-nostdin','-hide_banner','-nostats','-i',str(path),'-af','loudnorm=I=-18:TP=-1.5:LRA=15:print_format=json','-f','null','-'],check=True,capture_output=True,text=True)
        d=json.loads(result.stderr[result.stderr.rfind('{'):result.stderr.rfind('}')+1])
        row.update({'integratedLufs':float(d['input_i']),'truePeakDbtp':float(d['input_tp']),'loudnessRangeLu':float(d['input_lra'])})
        require(all(math.isfinite(row[k]) for k in ['integratedLufs','truePeakDbtp','loudnessRangeLu']),'Nonfinite loudness statistics')
        require(row['truePeakDbtp']<=-1.2,'Decoded true peak exceeds preserved -1.2 dBTP release ceiling')
        require(-21<=row['integratedLufs']<=-16,'Unexpected integrated level for this preserved piano master')
    return row,x

def alignment(reference,decoded,starts=None):
    require(reference.shape==decoded.shape,'Aligned audio frame/channel dimensions differ')
    if starts is None:starts=[1.,35.,100.,185.,224.6]
    rows=[]
    for at in starts:
        a=round(at*SR);b=min(len(reference),a+round(1.8*SR))
        require(b-a>256,'Alignment window is outside audio')
        ref=reference[a:b].mean(axis=1);out=decoded[a:b].mean(axis=1)
        require(float(np.sqrt(np.mean(ref.astype(np.float64)**2)))>1e-7,'Alignment window is silent')
        corr=signal.correlate(out,ref,mode='full',method='fft');mid=len(ref)-1
        lag=int(np.argmax(corr[mid-128:mid+129]))-128
        row={'referenceStartSeconds':at,'lagSamples':lag,'lagMilliseconds':lag/SR*1000}
        rows.append(row)
    require(all(row['lagSamples']==0 for row in rows),'Decoded audio alignment differs from PCM reference')
    error=np.sqrt(np.mean((decoded.astype(np.float64)-reference.astype(np.float64))**2))
    ref_rms=np.sqrt(np.mean(reference.astype(np.float64)**2))
    return {'lagChecks':rows,'errorRelativeRmsDb':float(20*np.log10(max(float(error/max(ref_rms,1e-15)),1e-15)))}

def verify_events(release,score,manifest,expected_sha):
    audit=json.loads((release/'event-audit.json').read_text())
    mapping=json.loads((release/'source-mapping.json').read_text())
    mix=json.loads((release/'mix-manifest.json').read_text())
    mastering=json.loads((release/'mastering-analysis.json').read_text())
    for obj in [mapping,mix,mastering]:require(obj['scoreSha256']==expected_sha,'Stale audio report score binding')
    require(mapping['sampleManifestSha256']==sha(release/'sample-manifest-frozen.json'),'Stale source map manifest binding')
    require(len(audit)==len(score['notes']),'Note-to-render count differs')
    sources={s['sourceFilename']:s for s in manifest['samples']}
    layers=manifest['velocityLayers']
    max_error=0
    for event,n in zip(audit,score['notes']):
        for k in ['id','midi','role','velocity']:require(event[k]==n[k],f'Audio event changed: {n["id"]}/{k}')
        require(event['scoreTime']==n['time'] and event['renderFrame']==round(n['time']*SR),'Rendered attack is not bound to score')
        require(event['physicalKeyReleaseTime']==n['time']+n['duration'] and event['keyReleaseFrame']==round((n['time']+n['duration'])*SR),'Rendered release is not bound to score')
        v=n['velocity']*127
        layer=next((a for a in layers if a['recommendedMidiRange'][0]<=v<=a['recommendedMidiRange'][1]),min(layers,key=lambda a:abs(a['midiVelocity']-v)))
        source=min((s for s in manifest['samples'] if s['velocityLayer']==layer['layer']),key=lambda s:abs(s['midi']-n['midi']))
        require(event['velocityLayer']==layer['layer'] and event['sourceFilename']==source['sourceFilename'],'Wrong source/layer mapping')
        require(event['sourceSha256']==source['sourceSha256'] and event['sourceUrl']==source['sourceUrl'],'Wrong source provenance')
        require(event['sourceLeadRemovedSeconds']==source['recommendedOffsetSeconds'],'Attack-offset policy changed')
        max_error=max(max_error,abs(event['renderFrame']/SR-n['time']),abs(event['keyReleaseFrame']/SR-n['time']-n['duration']))
    require(mix['pedalEvents']==[{**p,'renderFrame':round(p['time']*SR)} for p in sorted(score['pedals'],key=lambda p:p['time'])],'Pedal event frames differ')
    require(max_error<=.5/SR+1e-12,'Score/audio timestamp rounding exceeds half a sample')
    require(mix['notes']==len(audit) and mix['accompanimentEvents']==0 and mix['synthesizedInstrumentSignals']==0,'Unexpected instrumentation')
    return {'noteCount':len(audit),'allNoteFieldsAndSourceMappingsMatch':True,'allPedalFramesMatch':True,
            'maximumTimestampRoundingErrorSeconds':max_error,'sourceRecordingsUsed':len(mapping['recordingsUsed'])}

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--release',type=Path,required=True)
    p.add_argument('--score',type=Path,required=True)
    p.add_argument('--expected-score-sha',required=True)
    p.add_argument('--sample-root',type=Path)
    p.add_argument('--preflight-only',action='store_true')
    a=p.parse_args()
    binding,score,manifest,root=preflight(a.release,a.score,a.expected_score_sha,a.sample_root)
    if a.preflight_only:
        print(json.dumps({'preflightPassed':True,'scoreSha256':a.expected_score_sha,'sampleCount':160,'status':binding['status']},indent=2));return
    require(binding['status']=='accepted-final','Candidate release cannot pass final verification')
    release=a.release.resolve()
    reproduction=json.loads((release/'reproduction-manifest.json').read_text())
    require(reproduction['releaseInputSha256']==sha(release/'release-input.json'),'Release input changed after render')
    require(reproduction['scoreSha256']==a.expected_score_sha and reproduction['audioEventSha256']==binding['audioEventSha256'],'Stale render reproduction binding')
    for name,digest in reproduction['outputFiles'].items():require(sha(release/name)==digest,f'Rendered output changed: {name}')
    require(sha(release/'score-frozen.json')==a.expected_score_sha,'Rendered frozen score copy is stale')
    events=verify_events(release,score,manifest,a.expected_score_sha)
    frames=round(score['duration']*SR)
    wav,wav_pcm=measure(release/'daybreak-solo-master.wav',frames,'pcm_s24le')
    mp3,mp3_pcm=measure(release/'daybreak-solo-master.mp3',frames,'mp3')
    codecs=alignment(wav_pcm,mp3_pcm)
    require(codecs['errorRelativeRmsDb'] < -35,'Unexpected MP3 error relative to WAV')
    premaster=decode(release/'premaster.wav')
    pre_alignment=alignment(premaster,wav_pcm)
    excerpts=[]
    for label,seconds in [('first-theme',35),('climax',30)]:
        ew,ex=measure(release/f'daybreak-{label}-excerpt.wav',round(seconds*SR),'pcm_s24le',levels=False)
        em,ey=measure(release/f'daybreak-{label}-excerpt.mp3',round(seconds*SR),'mp3',levels=False)
        excerpts.append({'label':label,'wav':ew,'mp3':em,'codecAlignment':alignment(ex,ey,[.1,seconds/2,seconds-2])})
    report={'allPassed':True,'scoreSha256':a.expected_score_sha,'audioEventSha256':binding['audioEventSha256'],
            'sampleCountVerified':160,'events':events,'wav':wav,'mp3':mp3,'codecAlignment':codecs,
            'premasterToMasterAlignment':pre_alignment,'excerpts':excerpts,'creditsPreserved':True,
            'criticalListeningPerformed':False,'criticalListeningLimitation':'These are decoded signal and input-integrity checks, not a listening judgment.',
            'verifierSha256':sha(__file__)}
    write_json(release/'release-verification.json',report)
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
