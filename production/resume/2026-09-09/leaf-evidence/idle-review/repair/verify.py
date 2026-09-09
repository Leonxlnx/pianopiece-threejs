from pathlib import Path
from collections import Counter
import json,hashlib,gzip,re,math,sys
root=Path(__file__).resolve().parent;parent=root.parent
load=lambda n:json.loads((root/n).read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def rows():
 with gzip.open(root/'qualified-rows.jsonl.gz','rt') as f:return [json.loads(l) for l in f]
def inputs():
 m=load('inputs.json')
 for n,h in m.items():assert sha(parent/n)==h,n
 old=json.loads((parent/'sources/idle-nonthumb-data.json').read_text());delta=load('delta.json');fix=load('data-fixed.json');expected=json.loads(json.dumps(old));expected['supportedIndexGaps'][58]['earlyRelease']=[176.02,176.065]
 assert fix==expected;assert delta['operations'][0]['expectedBefore']==old['supportedIndexGaps'][58];assert delta['remainingBlocker']['match']==old['curves'][6]
 assert delta['operations'][0]['fields']=={'earlyRelease':[176.02,176.065]}
 src=(parent/'candidate.mjs').read_text().replace("'./compiled/","'../compiled/").replace(delta['helperChange']['before'],delta['helperChange']['after'])
 src=re.sub(r'^const idleNonthumbData = .+;$','const idleNonthumbData = '+json.dumps(fix,separators=(',',':'))+';',src,flags=re.M)
 assert src==(root/'fixed.mjs').read_text()
 print('INPUTS PASS:',len(m),'immutable sources; one bound record field and default-preserving helper multiplier; curve unchanged')

def compare(b,a):
 events=[];old={x['patch']+':'+str(x['midi']):x['depth'] for x in b['keyHits']};pairs={x['a']+':'+x['b']:x['trianglePairs'] for x in b['crossings']}
 for x in a['keyHits']:
  target=x['patch']+':'+str(x['midi']);before=old.get(target,0);after=x['depth']
  if before<=3<after:events.append(dict(kind='newCoreKey',target=target,before=before,after=after))
  if after>3 and after>before+.25:events.append(dict(kind='worsenedCoreKey',target=target,before=before,after=after))
 for x in a['crossings']:
  target=x['a']+':'+x['b'];before=pairs.get(target,0);after=x['trianglePairs'];own=x['a'].endswith('Palm') or x['b'].endswith('Palm')
  if not before:events.append(dict(kind='newOwnPalm' if own else 'newFingerPair',target=target,before=before,after=after))
  elif after>before:events.append(dict(kind='strictOwnPalmIncrease' if own else 'strictFingerPairIncrease',target=target,before=before,after=after))
 return events

def coverage():
 data=rows();c=load('coverage.json');notes=json.loads((parent/'sources/score-v11.json').read_text())['notes'];assert len(data)==c['totalSamples']
 for target in load('targets.json'):
  expected={};start=target['previousEnd']-.15;end=target['nextTime']+.15
  def add(t,kind):
   if start<=t<=end:expected.setdefault(t,set()).add(kind)
  for f in range(math.ceil(start*240),math.floor(end*240)+1):add(f/240,'240Hz')
  if target['id']=='index-059':
   for f in range(math.ceil((target['nextTime']-1)*480),math.floor((target['nextTime']+.05)*480)+1):add(f/480,'480HzArrival')
  times=[start,end,target['previousEnd'],target['nextTime'],target['previousEnd']+.25,target['nextTime']-.32,target['nextTime']-.8,176.02,176.065]+[k[0] for k in target.get('knots',[])]+[t for n in notes for t in [n['time'],n['time']+n['duration']]]
  for t in times:
   if start<=t<=end:
    for d in [-1e-6,0,1e-6]:add(t+d,'exactBoundary' if d==0 else 'boundaryProbe')
  sub=[r for r in data if r['scope']==target['id']];assert len(sub)==len(expected)==c['results'][target['id']]['samples']
  for r in sub:assert set(r['kinds'])==expected[r['time']]
 return data

def geometry():
 data=coverage();summary=load('summary.json');actualqueue=[]
 for r in data:
  for rel,(before,after) in {'originalVsBase':('base','original'),'fixedVsBase':('base','fixed'),'fixedVsOriginal':('original','fixed')}.items():
   events=compare(r['metrics'][before],r['metrics'][after]);assert events==r['comparisons'][rel]
   if events:actualqueue.append(dict(scope=r['scope'],time=r['time'],relation=rel,events=events))
  if r['scope']=='curve-007':assert r['metrics']['fixed']==r['metrics']['original']
 assert actualqueue==load('qualified-queue.json')
 for scope in ['index-059','curve-007']:
  sub=[r for r in data if r['scope']==scope and r['insideGap']]
  for rig in ['base','original','fixed']:
   keys=sum(sum(h['depth']>3 for h in r['metrics'][rig]['keyHits']) for r in sub)
   patches=sum(len({h['patch'] for h in r['metrics'][rig]['keyHits'] if h['depth']>3}) for r in sub)
   assert keys==summary[scope]['metrics'][rig]['corePositiveKeyStates'];assert patches==summary[scope]['metrics'][rig]['corePositivePatchStates']
  for rel in ['originalVsBase','fixedVsBase','fixedVsOriginal']:
   counts=Counter(e['kind'] for r in sub for e in r['comparisons'][rel]);assert dict(counts)==summary[scope]['comparisons'][rel]['counts']
 index=summary['index-059']['comparisons']['fixedVsBase']['counts']
 for k in ['newCoreKey','worsenedCoreKey','newFingerPair','newOwnPalm']:assert index.get(k,0)==0
 assert summary['curve-007']['comparisons']['fixedVsBase']['counts']['newCoreKey']>0
 print('GEOMETRY PASS:',len(data),'complete states; index novelty/worsening clear vs base; curve blocker and restored old contacts explicitly retained')

def motion():
 data=rows();summary=load('summary.json');notes=json.loads((parent/'sources/score-v11.json').read_text())['notes'];active=0;outside=0;other=0;after=0
 for r in data:
  current={(n['hand'],n['finger']) for n in notes if n['time']<=r['time']<n['time']+n['duration']};assert len(current)==r['parity']['activeStates'];active+=len(current)
  for k in ['activeLocal','activeWorld','outsideLocal','wristWorld']:assert r['parity'][k]==0
  for fi in range(5):
   qdiff=max(abs(a-b) for j in range(3) for a,b in zip(r['joints']['fixed'][fi][j],r['joints']['original'][fi][j]))
   if ('L',fi+1) in current:assert qdiff==0
   if fi!=1:other=max(other,qdiff);assert r['metrics']['fixed']['chains'][fi]==r['metrics']['original']['chains'][fi]
   if r['scope']=='index-059' and (r['time']<=176.02 or r['time']>=176.201552):outside=max(outside,qdiff)
   if r['scope']=='index-059' and 176.065<=r['time']<=176.201552:after=max(after,max(abs(a-b) for j in range(3) for a,b in zip(r['joints']['fixed'][fi][j],r['joints']['base'][fi][j])))
 assert outside==other==after==0
 for scope in ['index-059','curve-007']:
  grid=[r for r in data if r['scope']==scope and '240Hz' in r['kinds']]
  for rig in ['base','original','fixed']:
   speeds=[]
   for a,b in zip(grid,grid[1:]):
    p=a['metrics'][rig]['chains'][1]['points'][-1];q=b['metrics'][rig]['chains'][1]['points'][-1];speeds.append((b['time'],math.dist(p,q)/(b['time']-a['time'])))
   t,v=max(speeds,key=lambda x:x[1]);expect=summary[scope]['motion'][rig]['indexTipSpeedMps'];assert abs(v-expect['value'])<1e-12 and t==expect['time']
 assert summary['index-059']['motion']['fixed']['indexTipSpeedMps']['value']<=summary['index-059']['motion']['original']['indexTipSpeedMps']['value']
 print('MOTION PASS:',active,'active finger states; exact active/other-finger/outside-change parity; index tip peak does not increase')

def evidence():
 m=load('hashes.json')
 for n,h in m.items():assert sha(root/n)==h,n
 assert load('blocker.json')['status']=='unresolved'
 search=[x for n in ['search-results.json','search-second-results.json','search-third-results.json'] for x in load(n)]
 assert len(search)==113;assert not any(not x.get('remove') and x['newCore']==x['worseCore']==x['newPairs']==0 for x in search)
 text=(root/'FINDINGS.md').read_text();assert 'restores' in text and 'blocker' in text and 'does not measure penetration depth' in text
 print('EVIDENCE PASS:',len(m),'hashes; 113 completed curve trials; finite blocker; losses and strict pair counts explicit')
if __name__=='__main__':globals()[sys.argv[1]]()
