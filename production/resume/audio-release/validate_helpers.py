#!/usr/bin/env python3
"""Focused failure-injection checks; renders no Daybreak master."""
import argparse, copy, json, shutil, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io import wavfile
from release_common import SR, audio_signature, preflight, require, sha, write_json
from verify_release import alignment, measure, verify_events

def main():
    p=argparse.ArgumentParser();p.add_argument('--project',type=Path,required=True)
    p.add_argument('--sample-root',type=Path,required=True);a=p.parse_args()
    here=Path(__file__).resolve().parent;rows=[]
    def rejection(label,fn):
        try:fn()
        except (ValueError,subprocess.CalledProcessError) as exc:
            detail=exc.stderr if isinstance(exc,subprocess.CalledProcessError) else str(exc)
            if label=='Existing release directory cannot reuse stale intermediates':
                require('Output exists; use a new release directory' in detail,'Failure did not reach stale-directory guard')
            if label=='Candidate score cannot trigger final render':
                require('Final render requires an accepted-final score freeze' in detail,'Failure did not reach final-freeze guard')
            rows.append({'check':label,'passed':True,'rejection':detail.strip().splitlines()[-1]});return
        raise RuntimeError('Failure was accepted: '+label)
    source=a.project/'public/assets/score.json';expected=sha(source)
    score=json.loads(source.read_text())
    with tempfile.TemporaryDirectory(prefix='daybreak-release-tests-',dir=here) as d:
        temp=Path(d);release=temp/'candidate'
        args=[sys.executable,str(here/'prepare_release.py'),'--project',str(a.project),'--score',str(source),'--expected-score-sha',expected,
              '--sample-root',str(a.sample_root),'--output',str(release),'--status','candidate']
        subprocess.run(args,check=True,capture_output=True,text=True)
        preflight(release,source,expected);rows.append({'check':'Valid candidate preflight, exact score and 160 source hashes','passed':True})
        rejection('Wrong explicitly expected score SHA',lambda:preflight(release,source,'0'*64))
        changed=temp/'changed-score.json'
        modified=copy.deepcopy(score);modified['notes'][0]['duration']-=.001;write_json(changed,modified)
        require(audio_signature(modified)!=audio_signature(score),'Physical duration edit must alter audio signature')
        rejection('Changed physical key hold',lambda:preflight(release,changed,expected))
        modified=copy.deepcopy(score);modified['notes'][0]['finger']=(modified['notes'][0]['finger']%5)+1;write_json(changed,modified)
        require(audio_signature(modified)==audio_signature(score),'Fingering-only edit must preserve diagnostic audio signature')
        rejection('Changed exact score bytes even when audio signature matches',lambda:preflight(release,changed,expected))
        renderer=release/'render_solo_master.py';original=renderer.read_bytes();renderer.write_bytes(original+b'\n# changed\n')
        rejection('Modified prepared renderer',lambda:preflight(release,source,expected));renderer.write_bytes(original)
        rejection('Existing release directory cannot reuse stale intermediates',lambda:subprocess.run(args,check=True,capture_output=True,text=True))
        rejection('Candidate score cannot trigger final render',lambda:subprocess.run([sys.executable,str(here/'render_release.py'),'--release',str(release),'--score',str(source),'--expected-score-sha',expected],check=True,capture_output=True,text=True))
        historical=a.project/'production/revision/music-master-final'
        oldscore=json.loads((historical/'score-final-input.json').read_text())
        manifest=json.loads((here/'sample-manifest-frozen.json').read_text())
        oldsha=sha(historical/'score-final-input.json')
        verify_events(historical,oldscore,manifest,oldsha);rows.append({'check':'Saved real event/source/pedal audit validates against its exact historical input','passed':True})
        rejection('Historical event report cannot validate current score',lambda:verify_events(historical,score,manifest,expected))
        # Nonmusical codec fixture: chirps and filtered noise, never a replacement musical render.
        count=6*SR;t=np.arange(count)/SR;rng=np.random.default_rng(2718)
        noise=signal.sosfilt(signal.butter(3,3800,fs=SR,output='sos'),rng.normal(0,.04,count))
        mono=.13*signal.chirp(t,310,6,2900)+noise
        edge=np.minimum(1,np.minimum(t/.02,(6-t)/.04));stereo=np.column_stack([mono*edge,np.roll(mono,13)*edge]).astype(np.float32)
        raw=temp/'fixture-float.wav';wavfile.write(raw,SR,stereo)
        wav=temp/'fixture.wav';mp3=temp/'fixture.mp3'
        subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(raw),'-af','loudnorm=I=-19:TP=-2:LRA=10','-ar',str(SR),'-c:a','pcm_s24le',str(wav)],check=True)
        subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(wav),'-c:a','libmp3lame','-b:a','320k','-write_xing','1',str(mp3)],check=True)
        w,x=measure(wav,count,'pcm_s24le');m,y=measure(mp3,count,'mp3')
        aligned=alignment(x,y,[.1,2,4]);rows.append({'check':'Real WAV/MP3 full decode, level, exact frames and zero lag','passed':True,'wav':w,'mp3':m,'alignment':aligned})
        rejection('One decoded frame removed',lambda:alignment(x,y[:-1],[.1,2,4]))
        rejection('Seven-sample codec shift',lambda:alignment(x,np.roll(y,7,axis=0),[.1,2,4]))
        rejection('Wrong expected decoded duration',lambda:measure(wav,count+1,'pcm_s24le'))
        clipped=temp/'clipped.wav';wavfile.write(clipped,SR,np.ones((SR,2),np.float32))
        rejection('Clipped PCM rejection',lambda:measure(clipped,SR,'pcm_f32le',levels=False))
    report={'allPassed':True,'checks':rows,'checkCount':len(rows),'daybreakMasterRendered':False,
            'criticalListeningPerformed':False,'currentCandidateScoreSha256':expected,
            'helpers':{p.name:sha(p) for p in [here/'prepare_release.py',here/'render_release.py',here/'verify_release.py',here/'release_common.py',here/'recover_samples.py']}}
    write_json(here/'helper-validation.json',report)
    print(json.dumps({'allPassed':True,'checkCount':len(rows),'daybreakMasterRendered':False},indent=2))

if __name__=='__main__':main()
