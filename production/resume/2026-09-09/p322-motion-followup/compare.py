import json,math,pathlib
p=pathlib.Path('.');trials=json.load(open('trials.json'));base=json.load(open('reference-probe.json'));summary=[];failures={}
def speeds(rows):
 out={'indexTipMps':0,'indexMcpRadps':0,'allTipMps':0,'allJointRadps':0,'indexTipPeak':None,'indexMcpPeak':None}
 for a,b in zip(rows,rows[1:]):
  dt=b['time']-a['time']
  if dt<1e-5:continue
  for fi,(f1,f2)in enumerate(zip(a['chains'],b['chains'])):
   speed=math.dist(f1['points'][-1],f2['points'][-1])/dt;out['allTipMps']=max(out['allTipMps'],speed)
   if fi==1 and speed>out['indexTipMps']:out['indexTipMps']=speed;out['indexTipPeak']=[a['time'],b['time']]
  for fi,(f1,f2)in enumerate(zip(a['quaternions'][0],b['quaternions'][0])):
   for j,(q1,q2)in enumerate(zip(f1,f2)):
    nn=math.sqrt(sum(v*v for v in q1)*sum(v*v for v in q2));dot=min(1,abs(sum(a*b for a,b in zip(q1,q2))/nn));speed=2*math.acos(dot)/dt;out['allJointRadps']=max(out['allJointRadps'],speed)
    if fi==1 and j==0 and speed>out['indexMcpRadps']:out['indexMcpRadps']=speed;out['indexMcpPeak']=[a['time'],b['time']]
 return out
for v in trials:
 r=json.load(open(v['name']+'-probe.json'));assert r['samples']==base['samples'];bad=[];before=0;after=0;rhmax=0;held=[]
 for a,b in zip(base['rows'],r['rows']):
  assert a['time']==b['time'];t=b['time'];keys=[k for k in b['keyHits']if k['depth']>3 and not any(k['patch']==x['patch']and k['midi']==x['midi']and x['depth']>=k['depth']-.05 for x in a['keyHits'])];pairs=[k for k in b['crossings']if not any(k['a']==x['a']and k['b']==x['b']and x['trianglePairs']>=k['trianglePairs']for x in a['crossings'])];contacts=[k for k in b['contacts']if(k['gap']is None or abs(k['gap'])>3)and not any(k['id']==x['id']and(x['gap']is None or abs(x['gap'])>=abs(k['gap'])-.05)for x in a['contacts'])]
  if keys or pairs or contacts:bad.append({'time':t,'keys':keys,'pairs':pairs,'contacts':contacts})
  delta=max(abs(x-y)for f1,f2 in zip(a['quaternions'][0],b['quaternions'][0])for q1,q2 in zip(f1,f2)for x,y in zip(q1,q2));rhmax=max(rhmax,max(abs(x-y)for f1,f2 in zip(a['quaternions'][1],b['quaternions'][1])for q1,q2 in zip(f1,f2)for x,y in zip(q1,q2)))
  if t<v['noteOff']:before=max(before,delta)
  if t>=v['arrival']:after=max(after,delta)
  if any(n['id']=='p00322'for n in b['active']):held.append(b)
 fields={k:v[k]for k in ['name','delta','mode','duration','noteOff','arrival']};fields.update({'samples':r['samples'],'pedal':r['pedalAtRelease'],'newBad':len(bad),'newKeyRows':sum(bool(x['keys'])for x in bad),'newPairRows':sum(bool(x['pairs'])for x in bad),'newContactRows':sum(bool(x['contacts'])for x in bad),'heldCoreMaxMm':max(x['activeCore']for x in held),'beforeReleaseQuaternionDelta':before,'afterArrivalQuaternionDelta':after,'rightQuaternionDelta':rhmax,**speeds(r['rows'])});fields['releaseTransfer']=speeds([x for x in r['rows'] if v['noteOff']<=x['time']<=v['arrival']]);summary.append(fields);failures[v['name']]=bad
json.dump({'summary':summary,'failures':failures},open('comparison.json','w'),indent=2);print(json.dumps(summary,indent=2))
