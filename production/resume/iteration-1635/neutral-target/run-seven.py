import json,subprocess,pathlib
p=pathlib.Path('.');manifest=json.loads((p/'manifest.json').read_text())
for name in ['pianist-baseline']+[v['name']for v in manifest['variants']]:subprocess.run(['node','seven.mjs',name],check=True)
base=json.loads((p/'pianist-baseline-seven.json').read_text());results=[]
for v in manifest['variants']:
 data=json.loads((p/(v['name']+'-seven.json')).read_text());deltas=[];held=0;heldQ=0;heldTip=0;summary=dict(inactive=0,cores=0,palms=0,neighbors=0,maxCore=0,strictRegressions=0,strictClear=0,qualified=0)
 for br,cr in zip(base['rows'],data['rows']):
  for b,c in zip(br['digits'],cr['digits']):
   if c['held']:
    held+=1;heldQ=max(heldQ,max(abs(x-y)for a,bb in zip(b['quaternions'],c['quaternions'])for x,y in zip(a,bb)));heldTip=max(heldTip,max(abs(x-y)for a,bb in zip(b['points'],c['points'])for x,y in zip(a,bb)))
   before={(x['a'],x['b']):x['pairs']for x in b['neighbors']};newCore=c['core']>max(3,b['core']+.25);newPalm=c['palmPairs']>b['palmPairs'];newNeighbors=[x for x in c['neighbors']if x['pairs']>before.get((x['a'],x['b']),0)];regress=newCore or newPalm or bool(newNeighbors)
   if regress:summary['strictRegressions']+=1
   if c['finger']>1 and not c['held']:
    summary['inactive']+=1;summary['cores']+=c['core']>3;summary['palms']+=c['palmPairs']>0;summary['neighbors']+=bool(c['neighbors']);summary['maxCore']=max(summary['maxCore'],c['core']);summary['strictClear']+=not regress
    qualified=c['core']<=3 and not c['palmPairs'] and not c['neighbors'] and not regress and c['pipTurnDegrees']>=15 and c['dipTurnDegrees']>=7
    summary['qualified']+=qualified;deltas.append(dict(time=cr['time'],side=c['side'],finger=c['finger'],qualified=qualified,regression=regress,before=b,after=c))
 results.append(dict(**v,summary=summary,heldSamples=held,heldQuaternionMaxComponentDelta=heldQ,heldPointMaxComponentDelta=heldTip,rows=deltas))
(p/'seven-comparison.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps([{k:v[k]for k in ['name','summary','heldQuaternionMaxComponentDelta','heldPointMaxComponentDelta']}for v in results],indent=2))
