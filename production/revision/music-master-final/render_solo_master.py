#!/usr/bin/env python3
"""Render the frozen original Daybreak score using recorded Salamander piano.

No musical events or timing are invented here. The reverb is deterministic DSP
applied to the recorded grand. Python/NumPy/SciPy and FFmpeg are required.
"""
from __future__ import annotations
import argparse, bisect, collections, functools, hashlib, json, math, os, pathlib
import shutil, subprocess, time
from fractions import Fraction
import numpy as np
from scipy import signal
from scipy.io import wavfile

HERE=pathlib.Path(__file__).resolve().parent
SCORE_PATH=pathlib.Path(os.environ.get('DAYBREAK_SCORE_PATH','/workspace/scratch/2e8cc8e77f98/music-master-final/score-final-input.json'))
SAMPLE_MANIFEST=pathlib.Path(os.environ.get('DAYBREAK_SAMPLE_MANIFEST_PATH','/workspace/scratch/2e8cc8e77f98/piano-assets/sample-manifest.json'))
EXPECTED_SCORE_SHA='5b47b2ba244b70fd2b7a63b47baccc366bdd0c7faaccbf00959c9aa43ae05baa'
SR=44100
ROLE_GAIN={'melody':1.0,'countermelody':.94,'harmony':.87,'bass':.85}
ROLES=list(ROLE_GAIN)
ROOM_WET_DRY_DB=-22.5
ROOM_RT60=1.24
ROOM_PREDELAY=.018
WITHIN_LAYER_LIMIT=1.5
TARGET_LUFS=-18.0
SAFE_PEAK=-1.65

def log(*a): print(*a,flush=True)
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def db(x): return float(20*np.log10(max(float(x),1e-15)))
def rms(x): return float(np.sqrt(np.mean(np.asarray(x,dtype=np.float64)**2)))
def write_json(p,x): pathlib.Path(p).write_text(json.dumps(x,indent=2)+'\n')
def decode(p):
    r=subprocess.run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(p),
        '-f','f32le','-ar',str(SR),'-ac','2','-'],capture_output=True,check=True)
    if r.stderr: raise RuntimeError(r.stderr.decode())
    x=np.frombuffer(r.stdout,np.float32).reshape(-1,2).copy()
    assert np.all(np.isfinite(x))
    return x
def float_wav(name,x): wavfile.write(HERE/name,SR,np.asarray(x,np.float32))
def command(args): return subprocess.run(args,check=True,capture_output=True,text=True)
def lufs(p):
    r=command(['ffmpeg','-nostdin','-hide_banner','-nostats','-i',str(p),
        '-af','loudnorm=I=-18:TP=-1.5:LRA=15:print_format=json','-f','null','-'])
    data=json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}')+1])
    return {'integratedLufs':float(data['input_i']),'truePeakDbtp':float(data['input_tp']),
        'loudnessRangeLu':float(data['input_lra']),'relativeThresholdLufs':float(data['input_thresh'])}

assert sha(SCORE_PATH)==EXPECTED_SCORE_SHA,'The frozen score changed; refusing to render another performance.'
SCORE=json.loads(SCORE_PATH.read_text())
PM=json.loads(SAMPLE_MANIFEST.read_text())
assert not SCORE['accompaniment']
assert all(n['role'] in ROLES for n in SCORE['notes'])
N=round(SCORE['duration']*SR)
PEDALS=sorted(SCORE['pedals'],key=lambda e:e['time'])
PFRAMES=[round(e['time']*SR) for e in PEDALS]
PLAYERS=PM['velocityLayers']
SOURCES={}
AUDIT=[]
SOURCE_AUDIT={}

def layer_for(n):
    v=n['velocity']*127
    return next((a for a in PLAYERS if a['recommendedMidiRange'][0]<=v<=a['recommendedMidiRange'][1]),
        min(PLAYERS,key=lambda a:abs(a['midiVelocity']-v)))

@functools.lru_cache(maxsize=180)
def piano_sample(midi,layer):
    a=min((s for s in PM['samples'] if s['velocityLayer']==layer),key=lambda s:abs(s['midi']-midi))
    path=pathlib.Path(os.environ['DAYBREAK_SAMPLE_ROOT'])/a['sourceFilename'] if 'DAYBREAK_SAMPLE_ROOT' in os.environ else pathlib.Path(a['sourceLocalPath'])
    if str(path) not in SOURCES:
        assert sha(path)==a['sourceSha256'],path
        SOURCES[str(path)]=a
    semi=midi-a['midi']; assert abs(semi)<=1
    x=decode(path)
    x=x[round(a['recommendedOffsetSeconds']*SR):]
    ratio=Fraction(2**(-semi/12)).limit_denominator(4096)
    if semi:
        x=signal.resample_poly(x,ratio.numerator,ratio.denominator,axis=0,
            window=('kaiser',10.0)).astype(np.float32)
    # A 0.55 ms anti-click edge precedes the retained natural hammer attack.
    edge=min(24,len(x));x[:edge]*=np.sin(np.linspace(0,np.pi/2,edge,dtype=np.float32))[:,None]**2
    # Remove rumble once, before polyphony; do not normalize individual notes.
    x=signal.sosfilt(signal.butter(2,25,fs=SR,btype='highpass',output='sos'),x,axis=0).astype(np.float32)
    env=np.max(np.abs(x[:round(.18*SR)]),axis=1)
    onset=int(np.flatnonzero(env>max(env)*.03)[0])/SR
    key=f'{midi}:v{layer}'
    SOURCE_AUDIT[key]={
        'playedMidi':midi,'velocityLayer':layer,'sourceMidi':a['midi'],
        'sourceFilename':a['sourceFilename'],'sourceSha256':a['sourceSha256'],
        'sourceUrl':a['sourceUrl'],'transposeSemitones':semi,
        'resampleRatio':[ratio.numerator,ratio.denominator],
        'resamplePitchErrorCents':1200*math.log2(float(ratio)/(2**(-semi/12))),
        'sourceLeadRemovedSeconds':a['recommendedOffsetSeconds'],
        'measuredAttackAfterKeyMs':onset*1000,
        'availableTailSeconds':len(x)/SR,
    }
    return x,a,onset

def damping_rate(pedal,midi):
    # Continuous half-pedal model. Pedal changes act on their authored frames.
    # Fully retained strings decay only according to the real recording;
    # intermediate damper contact dissipates extra energy without increasing it.
    retention=float(np.clip((pedal-.20)/.60,0,1))
    closed=24.0 if midi<52 else 30.0
    return closed*(1-retention)**3.5

def release_envelope(start_frame,key_release_frame,length,midi):
    env=np.ones(length,np.float32)
    key_local=max(0,key_release_frame-start_frame)
    if key_local>=length:return env,[]
    end_frame=start_frame+length
    cuts=[key_release_frame]+[f for f in PFRAMES if key_release_frame<f<end_frame]+[end_frame]
    attenuation=0.0;history=[]
    for a,b in zip(cuts,cuts[1:]):
        idx=bisect.bisect_right(PFRAMES,a)-1
        p=PEDALS[idx]['value'] if idx>=0 else 0.0
        rate=damping_rate(p,midi)
        # Undamped high strings are not truncated by the sustain controller.
        if midi>=89:rate=0.0
        left=a-start_frame;right=b-start_frame
        local=np.arange(right-left,dtype=np.float32)/SR
        env[left:right]=np.exp(-attenuation-rate*local)
        history.append({'startFrame':a,'endFrame':b,'pedal':p,'extraDecayPerSecond':rate})
        attenuation+=rate*(b-a)/SR
        if attenuation>13.8:
            env[right:]=0
            break
    return env,history

def render():
    buses={role:np.zeros((N,2),np.float32) for role in ROLES}
    notes=SCORE['notes']
    next_strike={};next_by_pitch={}
    for note in reversed(notes):
        next_strike[note['id']]=next_by_pitch.get(note['midi'])
        next_by_pitch[note['midi']]=round(note['time']*SR)
    counts=collections.Counter()
    for i,n in enumerate(notes):
        layer=layer_for(n);v=n['velocity']*127
        sample,a,onset=piano_sample(n['midi'],layer['layer'])
        start=round(n['time']*SR)
        key_release=round((n['time']+n['duration'])*SR)
        length=min(len(sample),N-start)
        restrike=next_strike[n['id']]
        restrike_fade=round((.15 if n['midi']<52 else .12)*SR)
        if restrike is not None and restrike>start:
            length=min(length,restrike-start+restrike_fade)
        voice=sample[:length].copy()
        env,history=release_envelope(start,key_release,length,n['midi'])
        if restrike is not None and 0<restrike-start<length:
            begin=restrike-start
            z=np.arange(length-begin,dtype=np.float32)/restrike_fade
            env[begin:]*=.5+.5*np.cos(np.pi*np.clip(z,0,1))
        fine_db=float(np.clip(9*np.log10(v/layer['midiVelocity']),-WITHIN_LAYER_LIMIT,WITHIN_LAYER_LIMIT))
        gain=ROLE_GAIN[n['role']]*10**(fine_db/20)
        voice*=env[:,None]*gain
        buses[n['role']][start:start+length]+=voice
        counts[layer['layer']]+=1
        AUDIT.append({
            'id':n['id'],'role':n['role'],'bar':n['bar'],'midi':n['midi'],
            'scoreTime':n['time'],'renderFrame':start,'renderTime':start/SR,
            'physicalKeyReleaseTime':n['time']+n['duration'],'keyReleaseFrame':key_release,
            'velocity':n['velocity'],'velocityLayer':layer['layer'],
            'withinLayerGainDb':fine_db,'roleGainDb':db(ROLE_GAIN[n['role']]),
            'sourceFilename':a['sourceFilename'],'sourceMidi':a['midi'],
            'sourceSha256':a['sourceSha256'],'sourceUrl':a['sourceUrl'],
            'sourceLeadRemovedSeconds':a['recommendedOffsetSeconds'],
            'measuredAttackAfterKeyMs':onset*1000,
            'restrikeFrame':restrike,'restrikeFadeSeconds':restrike_fade/SR,
            'voiceFrames':length,'pedalDampingSegments':history,
        })
        if i%120==0:log('Rendered',i,'/',len(notes))
    for role,bus in buses.items():float_wav(f'dry-{role}.wav',bus)
    write_json(HERE/'event-audit.json',AUDIT)
    write_json(HERE/'source-mapping.json',{
        'scoreSha256':EXPECTED_SCORE_SHA,'sampleManifestSha256':sha(SAMPLE_MANIFEST),
        'sampleRepository':PM['repository'],'sampleRepositoryCommit':PM['repositoryCommit'],
        'recordingsUsed':list(SOURCES.values()),'playbackMappings':list(SOURCE_AUDIT.values()),
        'layerNoteCounts':dict(counts)})
    shutil.copy2(SCORE_PATH,HERE/'score-frozen.json')
    log('Recorded layers used',dict(counts))
    piano_sample.cache_clear()
    return buses

def peak_eq(x,freq,gain,q):
    a=10**(gain/40);w=2*np.pi*freq/SR;alpha=np.sin(w)/(2*q);c=np.cos(w)
    b=np.array([1+alpha*a,-2*c,1-alpha*a]);d=np.array([1+alpha/a,-2*c,1-alpha/a])
    return signal.lfilter(b/d[0],d/d[0],x,axis=0).astype(np.float32)

def room_ir(channel):
    # Schroeder-style comb/all-pass room. This is effect processing only;
    # no synthetic instrument signal is mixed into the performance.
    size=round(2.3*SR)
    ir=np.zeros(size,np.float64)
    delays=([.0297,.0371,.0411,.0437] if channel==0 else [.0307,.0353,.0397,.0451])
    for delay in delays:
        samples=round(delay*SR);g=10**(-3*(samples/SR)/ROOM_RT60)
        for k in range(1,size//samples):
            ir[k*samples]+=g**(k-1)/4
    for delay in ([.0051,.0017] if channel==0 else [.0057,.0023]):
        d=round(delay*SR);b=np.zeros(d+1);a=np.zeros(d+1)
        b[0]=-.63;b[-1]=1;a[0]=1;a[-1]=-.63
        ir=signal.lfilter(b,a,ir)
    ir=signal.sosfilt(signal.butter(2,6500,fs=SR,btype='lowpass',output='sos'),ir)
    ir=signal.sosfilt(signal.butter(2,170,fs=SR,btype='highpass',output='sos'),ir)
    # Early reflections preserve room definition ahead of the diffuse tail.
    for delay,gain in [(.008,.29),(.016,.20),(.025,.14),(.039,.09)]:
        ir[round((delay+.0013*channel)*SR)]+=gain
    ir/=np.sqrt(np.sum(ir*ir))
    return np.pad(ir,(round(ROOM_PREDELAY*SR),0)).astype(np.float32)

def mix(buses):
    dry=sum(buses.values())
    # A broad 0.7 dB reduction of room/body buildup; no bright transient boost.
    dry=peak_eq(dry,260,-.7,.62)
    wet=np.empty_like(dry)
    for c in range(2):
        wet[:,c]=signal.oaconvolve(.86*dry[:,c]+.14*dry[:,1-c],room_ir(c))[:N]
    wet*=10**(ROOM_WET_DRY_DB/20)*rms(dry)/max(rms(wet),1e-10)
    mixed=dry+wet
    # Only the last 0.2 s of the authored resonance tail gets an anti-cut edge.
    fade=round(.2*SR)
    mixed[-fade:]*=(.5+.5*np.cos(np.linspace(0,np.pi,fade)))[:,None]
    assert np.isfinite(mixed).all()
    float_wav('premaster.wav',mixed)
    section_stats=[]
    for section in SCORE['sections']:
        a=round(section['start']*SR);b=round(section['end']*SR)
        role_rms={role:db(rms(bus[a:b])) for role,bus in buses.items()}
        section_stats.append({'name':section['name'],'start':section['start'],'end':section['end'],
            'premasterRmsDbfs':db(rms(mixed[a:b])),'dryRoleRmsDbfs':role_rms})
    counter_mask=np.zeros(N,bool)
    for n in SCORE['notes']:
        if n['role']=='countermelody':
            a=round(n['time']*SR);b=min(N,round((n['time']+n['duration']+.12)*SR))
            counter_mask[a:b]=True
    counter_stats={role:db(rms(bus[counter_mask])) for role,bus in buses.items()}
    manifest={
        'scoreSha256':EXPECTED_SCORE_SHA,'frozenScoreUnmodified':sha(SCORE_PATH)==EXPECTED_SCORE_SHA,
        'authoredDurationSeconds':SCORE['duration'],'renderedDurationSeconds':N/SR,
        'sampleRate':SR,'channels':2,'frames':N,'notes':len(SCORE['notes']),
        'roles':dict(collections.Counter(n['role'] for n in SCORE['notes'])),
        'accompanimentEvents':0,'synthesizedInstrumentSignals':0,
        'roleGainDb':{k:db(v) for k,v in ROLE_GAIN.items()},
        'withinLayerGainLimitDb':[-WITHIN_LAYER_LIMIT,WITHIN_LAYER_LIMIT],
        'sourceHandling':'Original real recorded dynamic levels retained; discrete layers; no per-note normalization.',
        'pedalModel':'Continuous monotonic damping after exact physical key release; every pedal event applied at its rounded audio frame; same-note restrikes fade older residual voices over 0.12/0.15 s.',
        'rumbleFilter':{'type':'Butterworth high-pass','order':2,'frequencyHz':25},
        'equalizer':{'frequencyHz':260,'gainDb':-.7,'Q':.62},
        'reverb':{'type':'deterministic stereo comb/all-pass room','rt60Seconds':ROOM_RT60,
            'predelaySeconds':ROOM_PREDELAY,'wetDryRmsDb':ROOM_WET_DRY_DB},
        'maxNoteTimestampRoundingErrorSeconds':max(abs(round(n['time']*SR)/SR-n['time']) for n in SCORE['notes']),
        'maxKeyReleaseRoundingErrorSeconds':max(abs(round((n['time']+n['duration'])*SR)/SR-n['time']-n['duration']) for n in SCORE['notes']),
        'pedalEvents':[{**e,'renderFrame':round(e['time']*SR)} for e in PEDALS],
        'premasterPeakDbfs':db(np.max(np.abs(mixed))),'premasterRmsDbfs':db(rms(mixed)),
        'sectionStatistics':section_stats,'counterActiveWindowDryRmsDbfs':counter_stats,
        'tailLastHalfSecondPeakDbfs':db(np.max(np.abs(mixed[-round(.5*SR):]))),
        'listeningReview':{'performed':False,'reason':'No listening-capable tool is exposed. Signal, source, event and codec checks are performed; excerpts are provided for human review.'},
    }
    write_json(HERE/'mix-manifest.json',manifest)
    log('Premaster peak/RMS',manifest['premasterPeakDbfs'],manifest['premasterRmsDbfs'])
    return mixed

def encode_master(linear_gain,limiter=False):
    chain=f'volume={linear_gain:.9f}dB'
    if limiter:
        chain+=f',alimiter=limit={10**(SAFE_PEAK/20):.9f}:attack=4:release=90:level=false:latency=true'
    # FFmpeg triangular high-pass dither at 24-bit is below the recorded noise floor.
    chain+=',aresample=dither_method=triangular_hp:output_sample_bits=24'
    command(['ffmpeg','-nostdin','-y','-v','error','-i',str(HERE/'premaster.wav'),
        '-af',chain,'-ar',str(SR),'-ac','2','-c:a','pcm_s24le',
        '-metadata','title=DAYBREAK — Original Solo Piano',
        '-metadata','artist=Original composition for Daybreak',
        '-metadata','comment=Piano samples: Salamander Grand Piano v3 by Alexander Holm, CC BY 3.0. Original score; rendered, filtered and mixed for Daybreak.',
        str(HERE/'daybreak-solo-master.wav')])
    command(['ffmpeg','-nostdin','-y','-v','error','-i',str(HERE/'daybreak-solo-master.wav'),
        '-c:a','libmp3lame','-b:a','320k','-write_xing','1','-id3v2_version','3',
        str(HERE/'daybreak-solo-master.mp3')])

def check_file(path,expected_frames=None):
    probe=json.loads(command(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]).stdout)
    stream=probe['streams'][0]
    x=decode(path)
    assert int(stream['sample_rate'])==SR and int(stream['channels'])==2
    if expected_frames is not None: assert len(x)==expected_frames,(path,len(x),expected_frames)
    assert np.max(np.abs(x))<1,(path,np.max(np.abs(x)))
    loudness=lufs(path)
    result={'filename':path.name,'bytes':path.stat().st_size,'sha256':sha(path),
        'codec':stream['codec_name'],'sampleRate':SR,'channels':2,'decodedFrames':len(x),
        'decodedDurationSeconds':len(x)/SR,'fullDecodePassed':True,
        'samplePeakDbfs':db(np.max(np.abs(x))),'clippedSampleCount':int(np.sum(np.abs(x)>=1)),
        'finitePcm':bool(np.all(np.isfinite(x))),**loudness,
        'containerStartTimeSeconds':float(probe['format'].get('start_time',0)),
        'containerDurationSeconds':float(probe['format']['duration'])}
    if 'bits_per_raw_sample' in stream:result['bitDepth']=int(stream['bits_per_raw_sample'])
    return result,x

def codec_compare(reference,decoded):
    checks=[]
    for at in [1.0,35.0,100.0,185.0,224.6]:
        a=round(at*SR);b=min(N,a+round(1.8*SR))
        ref=reference[a:b].mean(axis=1);out=decoded[a:b].mean(axis=1)
        corr=signal.correlate(out,ref,mode='full',method='fft')
        mid=len(ref)-1;search=corr[mid-128:mid+129]
        lag=int(np.argmax(search))-128
        checks.append({'referenceStartSeconds':at,'measuredLagSamples':lag,'measuredLagMilliseconds':lag/SR*1000})
    return {'referenceFrames':len(reference),'decodedMp3Frames':len(decoded),
        'frameDifference':len(decoded)-len(reference),'lagChecks':checks,
        'errorRelativeRmsDb':db(rms(decoded-reference)/max(rms(reference),1e-10)),
        'interpretation':'FFmpeg honors MP3 delay/padding metadata; measured decoded alignment is separate from the MP3 container start timestamp.'}

def excerpts():
    starts=[('first-theme',12.391821,35.0),('climax',169.885523,30.0)]
    result=[]
    for label,start,duration in starts:
        path=HERE/f'daybreak-{label}-excerpt.wav'
        # Review excerpts keep the master level and get only short edge fades.
        af=f'atrim=start_sample={round(start*SR)}:end_sample={round((start+duration)*SR)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.012,afade=t=out:st={duration-.12}:d=0.12'
        command(['ffmpeg','-nostdin','-y','-v','error','-i',str(HERE/'daybreak-solo-master.wav'),
            '-af',af,'-c:a','pcm_s24le',str(path)])
        mp3=path.with_suffix('.mp3')
        command(['ffmpeg','-nostdin','-y','-v','error','-i',str(path),'-c:a','libmp3lame','-b:a','320k',str(mp3)])
        qa,_=check_file(path,round(duration*SR));qa_mp3,_=check_file(mp3,round(duration*SR))
        result.append({'label':label,'masterStartSeconds':start,'durationSeconds':duration,
            'sameMasterGain':True,'edgeFadeSeconds':{'in':.012,'out':.12},'wav':qa,'mp3':qa_mp3})
    return result

def master():
    pre=lufs(HERE/'premaster.wav');log('Premaster loudness',pre)
    target_gain=TARGET_LUFS-pre['integratedLufs']
    clean_gain=SAFE_PEAK-pre['truePeakDbtp']
    limiter=False
    if pre['integratedLufs']+min(target_gain,clean_gain)>=-19:
        gain=min(target_gain,clean_gain)
    else:
        gain=-19-pre['integratedLufs']
        limiter=True
        # Avoid pushing a piano limiter harder than 1.8 dB for an arbitrary target.
        gain=min(gain,clean_gain+1.8)
    encode_master(gain,limiter)
    wav_stats,wav=check_file(HERE/'daybreak-solo-master.wav',N)
    mp3_stats,mp3=check_file(HERE/'daybreak-solo-master.mp3',N)
    worst_tp=max(wav_stats['truePeakDbtp'],mp3_stats['truePeakDbtp'])
    if worst_tp>-1.2:
        adjustment=worst_tp+1.35
        gain-=adjustment
        encode_master(gain,limiter)
        wav_stats,wav=check_file(HERE/'daybreak-solo-master.wav',N)
        mp3_stats,mp3=check_file(HERE/'daybreak-solo-master.mp3',N)
    assert max(wav_stats['truePeakDbtp'],mp3_stats['truePeakDbtp'])<=-1.2
    offset=codec_compare(wav,mp3)
    assert all(e['measuredLagSamples']==0 for e in offset['lagChecks']),offset
    results={'scoreSha256':EXPECTED_SCORE_SHA,'durationSeconds':N/SR,
        'targetIntegratedLufs':TARGET_LUFS,'premaster':pre,'linearGainDb':gain,
        'compressorUsed':False,'peakLimiterUsed':limiter,
        'limiterCeilingDbfs':SAFE_PEAK if limiter else None,
        'maximumPotentialLimiterReductionDb':max(0,pre['truePeakDbtp']+gain-SAFE_PEAK) if limiter else 0,
        'files':{'wav':wav_stats,'mp3':mp3_stats},'codecAlignment':offset,
        'excerpts':excerpts(),
        'criticalListeningPerformed':False,
        'criticalListeningLimitation':'No listening-capable tool exposed; human listening excerpts delivered.',
        'scoreStillFrozen':sha(SCORE_PATH)==EXPECTED_SCORE_SHA}
    write_json(HERE/'mastering-analysis.json',results)
    log('MASTER',json.dumps({k:results[k] for k in ['linearGainDb','peakLimiterUsed','files','codecAlignment']},indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--master-only',action='store_true')
    parser.add_argument('--mix-only',action='store_true');args=parser.parse_args()
    if not args.master_only:
        buses={r:decode(HERE/f'dry-{r}.wav') for r in ROLES} if args.mix_only else render()
        mix(buses)
        del buses
    master()
