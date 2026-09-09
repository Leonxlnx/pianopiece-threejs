import json,math
base=json.load(open('full-baseline.json'));cand=json.load(open('full-candidate.json'));assert base['samples']==cand['samples'];bad=[];held=[];right=0;otherActive=0;otherDelta=0;outside=0;motion={label:{'tipMps':0,'mcpRadps':0,'tipPeak':None,'mcpPeak':None}for label in ['baseline','candidate']}
for i,(b,c)in enumerate(zip(base['rows'],cand['rows'])):
 assert b['time']==c['time'];t=c['time'];keys=[k for k in c['keyHits']if k['depth']>3 and not any(k['patch']==x['patch']and k['midi']==x['midi']and x['depth']>=k['depth']-.05 for x in b['keyHits'])];pairs=[k for k in c['crossings']if not any(k['a']==x['a']and k['b']==x['b']and x['trianglePairs']>=k['trianglePairs']for x in b['crossings'])];contacts=[k for k in c['contacts']if(k['gap']is None or abs(k['gap'])>3)and not any(k['id']==x['id']and(x['gap']is None or abs(x['gap'])>=abs(k['gap'])-.05)for x in b['contacts'])];point=c['point']>.2 and c['point']>b['point']+.01
 if keys or pairs or contacts or point:bad.append({'time':t,'keys':keys,'pairs':pairs,'contacts':contacts,'point':point,'baselineKeys':b['keyHits']})
 if any(n['id']=='p00172'for n in c['active']):held.append(c)
 right=max(right,max(abs(a-z)for f1,f2 in zip(b['quaternions'][1],c['quaternions'][1])for q1,q2 in zip(f1,f2)for a,z in zip(q1,q2)))
 for n in c['active']:
  if n['id']=='p00172':continue
  fi=n['finger']-1;otherActive+=1;otherDelta=max(otherDelta,max(abs(a-z)for q1,q2 in zip(b['quaternions'][0][fi],c['quaternions'][0][fi])for a,z in zip(q1,q2)))
 if t<40.2239 or t>40.8022:outside=max(outside,max(abs(a-z)for h1,h2 in zip(b['quaternions'],c['quaternions'])for f1,f2 in zip(h1,h2)for q1,q2 in zip(f1,f2)for a,z in zip(q1,q2)))
 if i and 40.2239<t<40.8022:
  dt=t-base['rows'][i-1]['time']
  if dt>=1e-5:
   for label,rows in [('baseline',base['rows']),('candidate',cand['rows'])]:
    x=rows[i-1];y=rows[i];v=math.dist(x['chains'][1]['points'][-1],y['chains'][1]['points'][-1])/dt
    if v>motion[label]['tipMps']:motion[label]['tipMps']=v;motion[label]['tipPeak']=[x['time'],t]
    q1=x['quaternions'][0][1][0];q2=y['quaternions'][0][1][0];norm=math.sqrt(sum(a*a for a in q1)*sum(a*a for a in q2));dot=min(1,abs(sum(a*b for a,b in zip(q1,q2))/norm));v=2*math.acos(dot)/dt
    if v>motion[label]['mcpRadps']:motion[label]['mcpRadps']=v;motion[label]['mcpPeak']=[x['time'],t]
keyWitnesses=[{'time':x['time'],**k}for x in bad for k in x['keys']];summary={'start':base['start'],'end':base['end'],'samples':base['samples'],'heldSamples':len(held),'heldCoreMaxMm':max(x['activeCore']for x in held),'heldOwnPalmMax':max(x['ownPairs']for x in held),'heldActivePairMax':max(x['activePairs']for x in held),'heldPointMaxMm':max(x['point']for x in held),'newBad':len(bad),'newKeyRows':sum(bool(x['keys'])for x in bad),'newPairRows':sum(bool(x['pairs'])for x in bad),'newContactRows':sum(bool(x['contacts'])for x in bad),'rightQuaternionMaxDelta':right,'otherActiveSamples':otherActive,'otherActiveQuaternionMaxDelta':otherDelta,'outsideQuaternionMaxDelta':outside,'maxKeyWitness':max(keyWitnesses,key=lambda x:x['depth'])if keyWitnesses else None,'motion':motion,'failures':bad};json.dump(summary,open('full-comparison.json','w'),indent=2);print(json.dumps({k:v for k,v in summary.items()if k!='failures'},indent=2))
