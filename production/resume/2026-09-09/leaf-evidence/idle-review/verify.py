from pathlib import Path
import sys,json,hashlib,gzip,math,re
from collections import Counter,defaultdict
root=Path(__file__).resolve().parent
load=lambda n:json.loads((root/n).read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def inputs():
 manifest=load('inputs.json')
 for rel,m in manifest.items(): assert sha(root/rel)==m['sha256'],rel
 score=load('sources/score-v11.json');data=load('sources/idle-nonthumb-data.json')
 assert data['sourceScoreSha256']==sha(root/'sources/score-v11.json')
 text=(root/'sources/pianist-candidate-baked.mjs').read_text()
 baked=json.loads(re.search(r'^const idleNonthumbData = (.+);$',text,re.M)[1]);assert baked==data
 base=(root/'sources/pianist-combined-thumbs.mjs').read_text();candidate=text.split('const idleNonthumbData = ')[0]
 candidate=candidate.replace('                    applyIdleNonthumb(time, hand.side, fi, finger.bones, hand.wrist, base, previous, next);\n','')
 assert candidate==base
 notes={n['id']:n for n in score['notes']}
 for c in data['supportedIndexGaps']+data['curves']:
  previous=notes.get(c.get('previous'));nxt=notes.get(c.get('next'))
  if previous: assert previous['hand']==('R' if c['hi'] else 'L') and previous['finger']==c['fi']+1 and abs(previous['time']+previous['duration']-c['previousEnd'])<1e-7
  else: assert c['previousEnd']==0
  if nxt: assert nxt['hand']==('R' if c['hi'] else 'L') and nxt['finger']==c['fi']+1 and abs(nxt['time']-c['nextTime'])<1e-7
  begin=c.get('knots',[[c['previousEnd']]])[0][0];end=c.get('knots',[[c['nextTime']]])[-1][0]
  assert begin>=c['previousEnd']-1e-7 and end<=c['nextTime']+1e-7
  assert not any(n['hand']==('R' if c['hi'] else 'L') and n['finger']==c['fi']+1 and n['id'] not in [c.get('previous'),c.get('next')] and n['time']>c['previousEnd']+1e-7 and n['time']<c['nextTime']-1e-7 for n in score['notes'])
 print('INPUTS PASS:',len(manifest),'frozen hashes; baked data identity; sole helper delta; endpoint bindings')

def harness():
 prefix='/workspace/sites/daybreak-piano-film/production/qa/compiled/'
 for src,dst in [('pianist-combined-thumbs.mjs','baseline.mjs'),('pianist-candidate-baked.mjs','candidate.mjs')]:assert (root/dst).read_text()==(root/'sources'/src).read_text().replace(prefix,'./compiled/')
 text=(root/'harness.mjs').read_text();original=(root/'sources/harness.mjs').read_text()
 expected=original.replace("process.env.DAYBREAK_RIG_MODULE?pathToFileURL(process.env.DAYBREAK_RIG_MODULE).href:'./pianist-candidate-baked.mjs'", "new URL(new URL(import.meta.url).searchParams.get('rig'), import.meta.url).href")
 expected=expected.replace(prefix,'./compiled/').replace("process.env.DAYBREAK_WRIST_MODULE?pathToFileURL(process.env.DAYBREAK_WRIST_MODULE).href:'./compiled/wrist-motion.mjs'", "'./compiled/wrist-motion.mjs'")
 expected=expected.replace("'/workspace/sites/daybreak-piano-film/public/assets/pianist.glb'", "new URL('./sources/pianist.glb',import.meta.url)").replace("process.env.DAYBREAK_SCORE??'score-v11.json'", "new URL('./sources/score-v11.json',import.meta.url)")
 expected=expected.replace('targetFinger=null,opposing=false','targetFinger=null,opposing=false,alreadyUpdated=false').replace(' update(time);const offset=',' if(!alreadyUpdated)update(time);const offset=')
 assert text.split('\nexport function snapshot(){')[0]==expected
 assert 'idle-nonthumb/audit-lib.mjs' not in text
 assert 'piano.update(time,score.notes,pedal)' in text and 'k.mesh.matrixWorld.clone().invert()' in text
 print('HARNESS PASS: exact preserved algorithms; only frozen paths, already-updated switch, snapshot export')

def coverage():
 data=load('sources/idle-nonthumb-data.json');score=load('sources/score-v11.json');x=load('schedule.json');times={}
 records=x['records'];assert len(records)==len(data['supportedIndexGaps'])+len(data['curves'])==120
 for c in records:
  def add(t,kind,outside=False):
   if t<0 or (not outside and (t<c['begin'] or t>c['end'])):return
   row=times.setdefault(t,{'sides':set(),'records':set(),'kinds':set()});row['sides'].add('R' if c['hi'] else 'L');row['records'].add(c['id']);row['kinds'].add(kind)
  for frame in range(math.ceil(c['begin']*60),math.floor(c['end']*60)+1):add(frame/60,'60Hz')
  for t in [c['begin'],c['end']]+[k[0] for k in c.get('knots',[])]:
   for dt in [-1e-6,0,1e-6]:add(t+dt,'exactCurveOrSupportBoundary' if dt==0 else 'curveOrSupportBoundaryProbe',True)
  for n in score['notes']:
   for t in [n['time'],n['time']+n['duration']]:
    for dt in [-1e-6,0,1e-6]:add(t+dt,'exactNoteBoundary' if dt==0 else 'noteBoundaryProbe')
 assert len(times)==len(x['schedule'])==x['coverage']['samples']
 for i,row in enumerate(x['schedule']):
  assert row['index']==i
  expect=times[row['time']]
  for k in ['sides','records','kinds']: assert set(row[k])==expect[k],(i,k)
 assert sum(len(x['sides']) for x in x['schedule'])==x['coverage']['handStates']
 print('COVERAGE PASS:',len(times),'timestamps;',x['coverage']['handStates'],'hand states;',x['coverage']['patchStates'],'six-patch states; all 120 records')

def iterrows(name='replay-rows.jsonl.gz'):
 with gzip.open(root/name,'rt') as f:
  for line in f:yield json.loads(line)

def recompute():
 notes=load('sources/score-v11.json')['notes']
 x=load('replay-summary.json');sch=load('schedule.json')['schedule'];names=['Thumb','Index','Middle','Ring','Pinky','Palm'];counts=Counter();event_total=0;queue=defaultdict(list);actual_rows=0;hands_total=0;parity=Counter();recordstats={c['id']:Counter() for c in load('schedule.json')['records']};regrows=[]
 for row,expected in zip(iterrows(),sch,strict=True):
  actual_rows+=1
  for k in ['index','time','sides','records','kinds']:assert row[k]==expected[k]
  expected_active={(n['hand'],n['finger']) for n in notes if n['time']<=row['time']<n['time']+n['duration']}
  assert row['parity']['activeFingerStates']==len(expected_active)
  p=row['parity'];parity['activeFingerStates']+=p['activeFingerStates'];parity['maxActiveLocalComponentDelta']=max(parity['maxActiveLocalComponentDelta'],p['maxActiveLocalComponentDelta']);parity['maxActiveWorldComponentDelta']=max(parity['maxActiveWorldComponentDelta'],p['maxActiveWorldComponentDelta']);parity['activeViolations']+=len(p['violations'])
  assert [h['side'] for h in row['hands']]==row['sides']
  for h in row['hands']:
   hands_total+=1;b=h['before'];a=h['after'];counts['changedHandStates']+=int(h['changed']);expected_events=[]
   for patch in [h['side']+n for n in names]:
    before=max([0]+[v['depth'] for v in b['keyHits'] if v['patch']==patch]);after=max([0]+[v['depth'] for v in a['keyHits'] if v['patch']==patch])
    counts['baseCorePatchStates']+=before>3;counts['candidateCorePatchStates']+=after>3
    for condition,kind,count in [(before<=3<after,'newCorePatch','newCorePatchStates'),(after>3 and after>before+.25,'worsenedCorePatch','worsenedCorePatchStates')]:
     if condition:counts[count]+=1;expected_events.append(dict(kind=kind,target=patch,before=before,after=after))
   oldkeys={v['patch']+':'+str(v['midi']):v['depth'] for v in b['keyHits']}
   counts['baseCoreKeyTypes']+=sum(v['depth']>3 for v in b['keyHits']);counts['candidateCoreKeyTypes']+=sum(v['depth']>3 for v in a['keyHits'])
   for v in a['keyHits']:
    target=v['patch']+':'+str(v['midi']);before=oldkeys.get(target,0);after=v['depth']
    for condition,kind,count in [(before<=3<after,'newCoreKey','newCoreKeyTypes'),(after>3 and after>before+.25,'worsenedCoreKey','worsenedCoreKeyTypes')]:
     if condition:counts[count]+=1;expected_events.append(dict(kind=kind,target=target,before=before,after=after))
   oldpairs={v['a']+':'+v['b']:v['trianglePairs'] for v in b['crossings']}
   for v in a['crossings']:
    target=v['a']+':'+v['b'];before=oldpairs.get(target,0);after=v['trianglePairs'];own=v['a'].endswith('Palm') or v['b'].endswith('Palm')
    if before==0 and after>0:counts['newOwnPalmTypes' if own else 'newNeighborPairTypes']+=1;expected_events.append(dict(kind='newOwnPalm' if own else 'newNeighborPair',target=target,before=before,after=after))
    if before>0 and after>before:counts['strictExistingOwnPalmIncreases' if own else 'strictExistingNeighborPairIncreases']+=1;expected_events.append(dict(kind='strictExistingOwnPalmIncrease' if own else 'strictExistingNeighborPairIncrease',target=target,before=before,after=after))
    if before>0 and after>before+2:counts['existingOwnPalmIncreasesOver2' if own else 'existingNeighborIncreasesOver2']+=1
   assert expected_events==h['events'],row['index']
   for support in h['supportIds']:
    s=recordstats[support];s['samples']+=1;s['changedSamples']+=int(h['changed']);s['regressionSamples']+=bool(expected_events);s['activeFingerStates']+=len(b['active'])
   if expected_events:
    counts['regressionHandStates']+=1;counts['strictOnlyHandStates']+=all(v['kind'].startswith('strictExisting') for v in expected_events)
    regrows.append({'index':row['index'],'time':row['time'],'side':h['side'],'supportIds':h['supportIds'],'events':h['events'],'before':b,'after':a})
   for e in expected_events:queue[(e['kind'],e['target'],tuple(h['supportIds']))].append(dict(time=row['time'],before=e['before'],after=e['after']))
   event_total+=len(expected_events)
 for k,v in x['counts'].items():assert counts[k]==v,(k,counts[k],v)
 for k,v in recordstats.items():assert dict(v)==x['recordStats'][k],k
 for k,v in parity.items():assert v==x['parity'][k],k
 assert x['parity']['activeLocalQuaternionComponents']==12*parity['activeFingerStates'];assert x['parity']['activeWorldMatrixComponents']==48*parity['activeFingerStates']
 assert actual_rows==x['processed']==len(sch);assert hands_total==x['handStates'];assert event_total==x['regressionEvents'];assert x['patchStates']==6*hands_total
 assert x['complete'] is True
 return x,queue,regrows

def results():
 x,q,reg=recompute()
 assert x['parity']['activeViolations']==0 and x['parity']['wristViolations']==0
 print('RESULTS PASS:',x['processed'],'finished timestamps;',x['regressionEvents'],'recomputed events; active parity exact =',x['parity']['maxActiveLocalComponentDelta']==x['parity']['maxActiveWorldComponentDelta']==0)

def evidence():
 x,q,reg=recompute();actualq=load('replay-queue.json');assert len(actualq)==len(q)==x['queueEntries']
 for a in actualq:
  events=q[(a['kind'],a['target'],tuple(a['supportIds']))]
  assert a['samples']==len(events);assert a['firstTime']==events[0]['time'];assert a['lastTime']==events[-1]['time'];assert a['peakAfter']==max(e['after'] for e in events);assert a['largestIncrease']==max(e['after']-e['before'] for e in events)
 assert list(iterrows('replay-regressions.jsonl.gz'))==reg
 m=load('sha256-manifest.json')
 for rel,digest in m.items():assert sha(root/rel)==digest,rel
 print('EVIDENCE PASS:',len(actualq),'finite queue entries;',len(reg),'regression rows;',len(m),'artifact hashes')

if __name__=='__main__':globals()[sys.argv[1]]()
