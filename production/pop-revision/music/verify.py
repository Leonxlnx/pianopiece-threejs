#!/usr/bin/env python3
"""Independent, failure-capable consumer verification for Daybreak assets.

No composer import and no automatic rerender: a stale master must fail.
--score-only is useful while a rig-specific fingering is being fitted.
"""
from pathlib import Path
import argparse, collections, copy, hashlib, json, math, subprocess
import numpy as np
from scipy import signal

HERE=Path(__file__).resolve().parent
SR=44100
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def dump(p,x):Path(p).write_text(json.dumps(x,indent=2)+'\n')
def signature(score):
    x={'notes':[{k:n[k] for k in ('id','time','duration','midi','velocity','hand','role')} for n in score['notes']],
       'duration':score['duration'],'pedals':score['pedals']}
    return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def score_check(score):
    assert score['title']=='Daybreak'
    assert 210<=score['duration']<=240
    assert len(score['notes'])>850
    assert score.get('accompaniment',[])==[]
    assert len(score['harmony'])==88
    assert {n['bar'] for n in score['notes']}==set(range(1,89))
    assert len(score['sections'])==11
    assert score['sections'][0]['start']==0
    assert score['sections'][-1]['end']==score['duration']
    for a,b in zip(score['sections'],score['sections'][1:]):assert a['end']==b['start']
    assert all(n['time']<=q['time'] for n,q in zip(score['notes'],score['notes'][1:]))
    ids=set();events=[];finger_counts=collections.Counter()
    for n in score['notes']:
        assert n['id'] not in ids;nid=n['id'];ids.add(nid)
        assert n['hand'] in ('L','R') and n['finger'] in range(1,6)
        for k in ('midi','velocity','time','duration'):assert math.isfinite(n[k])
        assert n['midi'] in range(21,109) and 0<n['velocity']<=1
        assert n['duration']>=.04 and n['time']>=0
        assert n['time']+n['duration']<score['duration']
        assert not(n['finger']==1 and n['midi']%12 in (1,3,6,8,10)),('black-key thumb',nid)
        events.extend([(n['time'],1,nid,n),(n['time']+n['duration'],0,nid,n)])
        finger_counts[n['hand'],n['finger']]+=1
    active={};max_poly={'L':0,'R':0};max_span={'L':0,'R':0}
    for time,on,nid,n in sorted(events,key=lambda e:(e[0],e[1],e[2])):
        if not on:active.pop(nid);continue
        for old in active.values():
            assert old['midi']!=n['midi'],('same key overlap',old['id'],nid,time)
            if old['hand']==n['hand']:
                assert old['finger']!=n['finger'],('same finger overlap',old['id'],nid,time)
                direction=(old['midi']-n['midi'])*(old['finger']-n['finger'])
                assert (direction>0 if n['hand']=='R' else direction<0),('crossed grip',old['id'],nid)
        active[nid]=n
        for hand in ('L','R'):
            ns=[v for v in active.values() if v['hand']==hand]
            max_poly[hand]=max(max_poly[hand],len(ns))
            if ns:max_span[hand]=max(max_span[hand],max(v['midi'] for v in ns)-min(v['midi'] for v in ns))
            assert len(ns)<=3
            assert max_span[hand]<=(12 if hand=='L' else 9)
    assert len([1 for h,f in finger_counts if h=='R'])>=4
    assert len([1 for h,f in finger_counts if h=='L'])>=4
    assert score['pedals'][-1]['value']==0
    assert all(0<=p['value']<=1 for p in score['pedals'])
    assert all(a['time']<=b['time'] for a,b in zip(score['pedals'],score['pedals'][1:]))
    assert score['pedals'][-1]['time']>max(n['time']+n['duration'] for n in score['notes'])
    assert score['duration']-score['pedals'][-1]['time']>=2.5
    melody=[n for n in score['notes'] if n['role']=='melody']
    assert {n['bar'] for n in melody}==set(range(1,89))
    chord_pcs={'C':{0,4,7},'G/B':{7,11,2},'G':{7,11,2},
               'Am7':{9,0,4,7},'Fadd9':{5,9,0,7},'C/E':{0,4,7},
               'Dm7':{2,5,9,0},'Gsus':{7,0,2},'Am/E':{9,0,4},
               'Em/G':{4,7,11},'Am':{9,0,4},'Am/G':{9,0,4,7},
               'Fmaj7':{5,9,0,4},'Fm6':{5,8,0,2}}
    for n in score['notes']:
        if n['role']!='melody':
            assert n['midi']%12 in chord_pcs[score['harmony'][n['bar']-1]['chord']],('non-chord support',n['id'])
    def hook(start):return [(n['bar']-start,n['beat'],n['midi']) for n in melody if start<=n['bar']<start+2]
    assert hook(29)==hook(57)==hook(73),'Main hook must return intact three times'
    assert max(n['midi'] for n in melody if n['bar']<73)<max(n['midi'] for n in melody if 73<=n['bar']<85)
    last=[n for n in score['notes'] if n['bar']==88]
    assert {n['midi']%12 for n in last}=={0,4,7},'Ending must sound a completed C-major tonic'
    mean=lambda ns:sum(n['velocity'] for n in ns)/len(ns)
    assert mean(melody)>mean([n for n in score['notes'] if n['role']!='melody'])+.14
    assert score['tempoMap'][-1]['bpm']<score['tempoMap'][-4]['bpm']<score['bpm']
    return {'notes':len(ids),'duration':score['duration'],'maximumPhysicalPolyphony':max_poly,
            'maximumHeldSpanSemitones':max_span,'fingers':{f'{h}{f}':c for (h,f),c in finger_counts.items()},
            'hookRepetitions':3,'sameFingerOverlaps':0,'sameKeyOverlaps':0,'blackKeyThumbs':0,
            'audioEventSignature':signature(score),'lastKeyRelease':max(n['time']+n['duration'] for n in score['notes'])}
def decode(path):
    r=subprocess.run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(path),'-f','f32le','-ar',str(SR),'-ac','2','-'],capture_output=True,check=True)
    assert not r.stderr,r.stderr.decode()
    return np.frombuffer(r.stdout,np.float32).reshape(-1,2).copy()
def loudness(path):
    r=subprocess.run(['ffmpeg','-nostdin','-hide_banner','-nostats','-i',str(path),'-af','loudnorm=I=-18:TP=-1.5:LRA=15:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    return json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}')+1])
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--score-only',action='store_true');parser.add_argument('--score',type=Path,default=HERE/'score.json');args=parser.parse_args()
    score=json.loads(args.score.read_text());report=score_check(score)
    # A known-invalid positive control confirms overlap rejection is exercised.
    bad=copy.deepcopy(score);bad['notes'][1].update({k:bad['notes'][0][k] for k in ('time','duration','midi','hand','finger')})
    try:score_check(bad)
    except AssertionError:report['overlapNegativeControlRejected']=True
    else:raise AssertionError('Broken score validator accepted duplicated key/finger')
    if args.score_only:
        print(json.dumps(report,indent=2));print('SCORE VERIFIED');return
    master=json.loads((HERE/'mastering-analysis.json').read_text())
    mix=json.loads((HERE/'mix-manifest.json').read_text())
    audit=json.loads((HERE/'event-audit.json').read_text())
    frozen=json.loads((HERE/'score-frozen.json').read_text())
    assert master['scoreSha256']==sha(HERE/'score-frozen.json')==mix['scoreSha256']
    # Animation-only fields may be added after the master. Every audible field
    # must remain identical, and exact current/frozen hashes are both reported.
    assert signature(score)==signature(frozen),'Audio no longer matches current score'
    assert len(audit)==len(score['notes'])
    for n,e in zip(score['notes'],audit):
        assert n['id']==e['id'] and n['midi']==e['midi'] and n['velocity']==e['velocity']
        assert round(n['time']*SR)==e['renderFrame']
        assert round((n['time']+n['duration'])*SR)==e['keyReleaseFrame']
        assert abs(e['renderTime']-n['time'])<=.5/SR+1e-9
    expected=round(score['duration']*SR)
    decoded={};stats={}
    for ext in ('wav','mp3'):
        path=HERE/f'daybreak-solo-master.{ext}'
        assert sha(path)==master['files'][ext]['sha256'],'Master bytes changed after analysis'
        x=decode(path);assert len(x)==expected,(ext,len(x),expected)
        assert np.isfinite(x).all() and np.abs(x).max()<1
        loud=loudness(path)
        assert -23<float(loud['input_i'])<-14
        assert float(loud['input_tp'])<=-1.2
        assert 2<float(loud['input_lra'])<16
        assert np.abs(x[-round(.2*SR):]).max()<.015,'Abrupt loud tail'
        decoded[ext]=x;stats[ext]={'frames':len(x),'peak':float(np.abs(x).max()),'loudness':loud,'sha256':sha(path)}
    lags=[]
    for at in [1,35,75,150,190,219]:
        a=round(at*SR);b=a+round(1.2*SR)
        ref=decoded['wav'][a:b].mean(axis=1);mp3=decoded['mp3'][a:b].mean(axis=1)
        corr=signal.correlate(mp3,ref,mode='full',method='fft');mid=len(ref)-1
        lag=int(np.argmax(corr[mid-128:mid+129]))-128
        assert lag==0,(at,lag);lags.append({'time':at,'lagSamples':lag})
    source=json.loads((HERE/'source-mapping.json').read_text())
    assert source['sampleRepositoryCommit']=='3382bf9496bba2486f5ab0de55a264d1dfc38404'
    assert len(source['recordingsUsed'])>40
    assert (HERE/'piano-samples-LICENSE.txt').stat().st_size>10000
    assert 'Attribution' in (HERE/'piano-samples-LICENSE.txt').read_text()
    for recording in source['recordingsUsed']:
        assert sha(HERE/'samples'/recording['sourceFilename'])==recording['sourceSha256']
    assert max(abs(m['transposeSemitones']) for m in source['playbackMappings'])<=1
    assert max(m['measuredAttackAfterKeyMs'] for m in source['playbackMappings'])<8
    report.update({'currentScoreSha256':sha(args.score),'frozenScoreSha256':sha(HERE/'score-frozen.json'),
                   'audioMatchesAudibleScoreFields':True,'masters':stats,'codecAlignment':lags,
                   'legalRecordingsVerified':len(source['recordingsUsed']),
                   'criticalListeningPerformed':False,'limitation':'No audio listening capability is available; score, source, signal and codec checks are real, but they are not critical listening.'})
    dump(HERE/'verification.json',report)
    print(json.dumps({k:report[k] for k in ('notes','duration','maximumPhysicalPolyphony','maximumHeldSpanSemitones','audioMatchesAudibleScoreFields','legalRecordingsVerified')},indent=2))
    print('MUSIC VERIFIED')
if __name__=='__main__':main()
