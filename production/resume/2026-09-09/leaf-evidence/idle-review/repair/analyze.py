from pathlib import Path
import json,gzip,math
from collections import Counter,defaultdict
root=Path(__file__).resolve().parent
load=lambda n:json.loads((root/n).read_text())
with gzip.open(root/'qualified-rows.jsonl.gz','rt') as f:rows=[json.loads(l) for l in f]
summary={}
def norm(x):return math.sqrt(sum(v*v for v in x))
def angle(a,b):return 2*math.acos(min(1,abs(sum(x*y for x,y in zip(a,b)))/(norm(a)*norm(b))))*180/math.pi
for scope in ['curve-007','index-059']:
 sample=[r for r in rows if r['scope']==scope];inside=[r for r in sample if r['insideGap']];grid=[r for r in sample if '240Hz' in r['kinds']];result={'samples':len(sample),'insideGapSamples':len(inside),'metrics':{},'comparisons':{},'motion':{}}
 for rig in ['base','original','fixed']:
  result['metrics'][rig]={'corePositivePatchStates':sum(r['core'][rig]['deepPatches'] for r in inside),'corePositiveKeyStates':sum(r['core'][rig]['deepKeys'] for r in inside),'indexMaxMm':max(r['core'][rig]['indexMax'] for r in inside),'indexDepthSumMm':sum(r['core'][rig]['indexMax'] for r in inside),'trianglePairStateSum':sum(r['core'][rig]['pairTotal'] for r in inside)}
  speeds=[];accels=[];angular=[]
  for i,(a,b) in enumerate(zip(grid,grid[1:])):
   dt=b['time']-a['time'];va=a['metrics'][rig]['chains'][1]['points'][-1];vb=b['metrics'][rig]['chains'][1]['points'][-1]
   speed=norm([y-x for x,y in zip(va,vb)])/dt;speeds.append({'time':b['time'],'value':speed})
   angular.append({'time':b['time'],'value':max(angle(a['joints'][rig][1][j],b['joints'][rig][1][j])/dt for j in range(3))})
   if i:
    prev=grid[i-1]['metrics'][rig]['chains'][1]['points'][-1];accels.append({'time':a['time'],'value':norm([(vb[k]-2*va[k]+prev[k])*240**2 for k in range(3)])})
  result['motion'][rig]={'indexTipSpeedMps':max(speeds,key=lambda x:x['value']),'indexTipAccelerationMps2':max(accels,key=lambda x:x['value']),'indexJointAngularSpeedDegps':max(angular,key=lambda x:x['value'])}
 for rel in ['originalVsBase','fixedVsBase','fixedVsOriginal']:
  count=Counter(e['kind'] for r in inside for e in r['comparisons'][rel]);witnesses=[{'time':r['time'],**e} for r in inside for e in r['comparisons'][rel] if not e['kind'].startswith('strict')];result['comparisons'][rel]={'counts':dict(count),'nonStrictWitnesses':witnesses}
 result['parity']={k:max(r['parity'][k] for r in sample) for k in ['activeLocal','activeWorld','outsideLocal','wristWorld','indexVsBase']};result['parity']['activeStates']=sum(r['parity']['activeStates'] for r in sample)
 summary[scope]=result
search=[x for n in ['search-results.json','search-second-results.json','search-third-results.json'] for x in load(n)]
summary['search']={'completedTrials':len(search),'nonzeroTrials':sum(not x.get('remove',False) for x in search),'nonzeroClearTrials':sum(not x.get('remove',False) and x['newCore']==x['worseCore']==x['newPairs']==0 for x in search),'trialFiles':['search-results.json','search-second-results.json','search-third-results.json'],'note':'Trials use finite local 480 Hz grids and original boundary probes. Only deletion was clear; this is not proof that no possible curve exists.'}
(root/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:{f:v for f,v in x.items() if f!='comparisons'} for k,x in summary.items() if k!='search'},indent=2));print('SEARCH',json.dumps(summary['search']))
