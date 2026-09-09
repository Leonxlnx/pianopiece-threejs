import json,math,pathlib
b=json.load(open('p322-final-baseline.json'));c=json.load(open('p322-final-candidate.json'));assert b['samples']==c['samples'];added=[];held=[];changed=[];rhmax=0;thumbmax=0;outsideMax=0;motion={k:{'maxTipSpeed':0,'maxJointSpeed':0,'maxQuaternionSpeed':0}for k in ['baseline','candidate']}
for i,(x,y) in enumerate(zip(b['rows'],c['rows'])):
 assert x['time']==y['time'];t=x['time'];keys=[k for k in y['keyHits']if k['depth']>3 and not any(k['patch']==a['patch']and k['midi']==a['midi']and a['depth']>=k['depth']-.05 for a in x['keyHits'])];pairs=[k for k in y['crossings']if not any(k['a']==a['a']and k['b']==a['b']and a['trianglePairs']>=k['trianglePairs']for a in x['crossings'])];contacts=[k for k in y['contacts']if(k['gap']is None or abs(k['gap'])>3)and not any(a['id']==k['id']and(a['gap']is None or abs(a['gap'])>=abs(k['gap'])-.05)for a in x['contacts'])]
 if keys or pairs or contacts:added.append({'time':t,'keys':keys,'pairs':pairs,'contacts':contacts,'basePairs':x['crossings']})
 if any(n['id']=='p00322'for n in y['active']):held.append((x,y))
 delta=max(abs(a-b)for h1,h2 in zip(x['quaternions'],y['quaternions'])for f1,f2 in zip(h1,h2)for j1,j2 in zip(f1,f2)for a,b in zip(j1,j2))
 rhmax=max(rhmax,max(abs(a-b)for f1,f2 in zip(x['quaternions'][1],y['quaternions'][1])for j1,j2 in zip(f1,f2)for a,b in zip(j1,j2)));thumbmax=max(thumbmax,max(abs(a-b)for j1,j2 in zip(x['quaternions'][0][0],y['quaternions'][0][0])for a,b in zip(j1,j2)))
 if delta>1e-9:changed.append(t)
 if t<70.8216 or t>71.568396:outsideMax=max(outsideMax,delta)
 if i and 70.8216<=t<=71.568396:
  dt=t-b['rows'][i-1]['time']
  if dt>1e-5:
   for name,rows in [('baseline',b['rows']),('candidate',c['rows'])]:
    old=rows[i-1];new=rows[i]
    for f1,f2 in zip(old['chains'],new['chains']):
     for j,(v1,v2) in enumerate(zip(f1['points'],f2['points'])):
      v=math.dist(v1,v2)/dt;motion[name]['maxJointSpeed']=max(motion[name]['maxJointSpeed'],v)
      if j==3:motion[name]['maxTipSpeed']=max(motion[name]['maxTipSpeed'],v)
    for f1,f2 in zip(old['quaternions'][0],new['quaternions'][0]):
     for q1,q2 in zip(f1,f2):
      angle=2*math.acos(min(1,abs(sum(a*b for a,b in zip(q1,q2)))));motion[name]['maxQuaternionSpeed']=max(motion[name]['maxQuaternionSpeed'],angle/dt)
summary={'start':b['start'],'end':b['end'],'hz':b['hz'],'denseHz':b['denseHz'],'samples':b['samples'],'heldSamples':len(held),'heldBeforeCoreMax':max(x['activeCore']for x,y in held),'heldAfterCoreMax':max(y['activeCore']for x,y in held),'heldBeforeOwnMax':max(x['ownPairs']for x,y in held),'heldAfterOwnMax':max(y['ownPairs']for x,y in held),'heldAfterActivePairMax':max(y['activePairs']for x,y in held),'heldAfterPointMaxMm':max(y['point']for x,y in held),'heldAfterPadRange':[min(k['gap']for x,y in held for k in y['contacts']if k['id']=='p00322'),max(k['gap']for x,y in held for k in y['contacts']if k['id']=='p00322')],'newBad':len(added),'newKeyRows':sum(bool(x['keys'])for x in added),'newPairRows':sum(bool(x['pairs'])for x in added),'newContactRows':sum(bool(x['contacts'])for x in added),'rightQuaternionMaxDelta':rhmax,'leftThumbQuaternionMaxDelta':thumbmax,'outsideQuaternionMaxDelta':outsideMax,'changedRange':[min(changed),max(changed)],'changedWindowMotion':motion,'added':added};json.dump(summary,open('p322-final-comparison.json','w'),indent=2);print(json.dumps(summary,indent=2))
