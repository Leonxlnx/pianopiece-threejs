from pathlib import Path
import json,gzip,math
p=Path(__file__).parent
b=json.loads(gzip.decompress((p/'baseline-full.json.gz').read_bytes()))
c=json.loads(gzip.decompress((p/'coordinated-full.json.gz').read_bytes()))
assert b['times']==c['times']
key_rows=[];pair_rows=[];contact_rows=[];active_changes=[];outside_changes=[];wristmax=0.;key_improvements=0;pair_improvements=0;active_samples=0
for rb,rc in zip(b['rows'],c['rows']):
 t=rb['time'];side=rb['side'];assert (t,side)==(rc['time'],rc['side'])
 wristmax=max(wristmax,max(abs(x-y) for x,y in zip(rb['wrist'],rc['wrist'])))
 for a in rb['active']:
  active_samples+=1;fi=a['finger']-1
  d=max(abs(x-y) for qb,qc in zip(rb['pose'][fi],rc['pose'][fi]) for x,y in zip(qb,qc))
  if d>1e-12:active_changes.append({'time':t,'side':side,'id':a['id'],'maxComponentDelta':d})
 for fi in range(5):
  if any(g['side']==side and g['finger']==fi+1 and g['end']<t<g['start'] for g in b['gaps']):continue
  d=max(abs(x-y) for qb,qc in zip(rb['pose'][fi],rc['pose'][fi]) for x,y in zip(qb,qc))
  if d>1e-12:outside_changes.append({'time':t,'side':side,'finger':fi+1,'maxComponentDelta':d})
 kb={(k['patch'],k['midi']):k for k in rb['keyHits']};kc={(k['patch'],k['midi']):k for k in rc['keyHits']}
 for key in kb.keys()|kc.keys():
  old=kb.get(key,{'depth':0,'count':0});new=kc.get(key,{'depth':0,'count':0})
  if new['depth']>old['depth']+1e-6 or new['count']>old['count']:
   key_rows.append({'time':t,'side':side,'patch':key[0],'midi':key[1],'before':old,'after':new})
  if new['depth']<old['depth']-1e-6:key_improvements+=1
 pb={(k['a'],k['b']):k for k in rb['crossings']};pc={(k['a'],k['b']):k for k in rc['crossings']}
 for key in pb.keys()|pc.keys():
  old=pb.get(key,{'trianglePairs':0});new=pc.get(key,{'trianglePairs':0})
  if new['trianglePairs']>old['trianglePairs']:pair_rows.append({'time':t,'side':side,'pair':key,'before':old,'after':new})
  elif new['trianglePairs']<old['trianglePairs']:pair_improvements+=1
 for old,new in zip(rb['meshContacts'],rc['meshContacts']):
  if old['minGap']!=new['minGap'] and (old['minGap'] is None or new['minGap'] is None or abs(old['minGap']-new['minGap'])>1e-6):contact_rows.append({'time':t,'side':side,'before':old,'after':new})
severe=[x for x in key_rows if x['after']['depth']>3 and x['after']['depth']>x['before']['depth']+1e-6]
by_pair={}
for x in pair_rows:
 key='–'.join(x['pair']);s=by_pair.setdefault(key,{'rows':0,'first':x['time'],'last':x['time'],'newCrossingRows':0,'maxAdded':0,'worst':None});s['rows']+=1;s['last']=x['time'];s['newCrossingRows']+=x['before']['trianglePairs']==0
 added=x['after']['trianglePairs']-x['before']['trianglePairs']
 if added>s['maxAdded']:s['maxAdded']=added;s['worst']={k:x[k] for k in ['time','side'] }|{'before':x['before']['trianglePairs'],'after':x['after']['trianglePairs']}
by_key={}
for x in severe:
 key=x['patch']+':'+str(x['midi']);s=by_key.setdefault(key,{'rows':0,'maxDepth':0,'worst':None});s['rows']+=1
 if x['after']['depth']>s['maxDepth']:s['maxDepth']=x['after']['depth'];s['worst']=x
motion={}
for source,data in [('before',b),('after',c)]:
 for g in b['gaps']:
  key=f"{g['side']}{g['finger']}:{g['previous']}→{g['next']}";rows=[r for r in data['rows'] if r['side']==g['side'] and g['end']<=r['time']<=g['start']];fi=g['finger']-1;worstTip={'value':0};worstJoint=[{'value':0} for _ in range(3)]
  for x,y in zip(rows,rows[1:]):
   dt=y['time']-x['time']
   if dt<1e-7:continue
   vx=x['chains'][fi]['points'][-1];vy=y['chains'][fi]['points'][-1];v=math.dist(vx,vy)/dt
   if v>worstTip['value']:worstTip={'value':v,'from':x['time'],'to':y['time']}
   for j in range(3):
    qa=x['pose'][fi][j];qb=y['pose'][fi][j];dot=abs(sum(a*b for a,b in zip(qa,qb)));a=2*math.acos(min(1,dot))/dt
    if a>worstJoint[j]['value']:worstJoint[j]={'value':a,'from':x['time'],'to':y['time']}
  motion.setdefault(key,{})[source]={'tipMps':worstTip,'jointRadps':worstJoint}
summary={'sampleTimes':len(b['times']),'handStatesPerVersion':len(b['rows']),'interval':[b['min'],b['max']],'gaps':b['gaps'],'heldSamples':active_samples,'heldPoseChanges':len(active_changes),'outsidePoseChanges':len(outside_changes),'wristPositionMaxDeltaM':wristmax,'contactGapChanges':len(contact_rows),'worsePerKeyRowsAll':len(key_rows),'worsePerKeyRowsOver3mm':len(severe),'worsePairRows':len(pair_rows),'newPairRows':sum(x['before']['trianglePairs']==0 for x in pair_rows),'improvedKeyDepthRows':key_improvements,'improvedPairRows':pair_improvements,'byPair':by_pair,'bySevereKey':by_key,'motion':motion}
(p/'comparison-summary.json').write_text(json.dumps(summary,indent=2))
(p/'comparison-details.json.gz').write_bytes(gzip.compress(json.dumps({'keyRows':key_rows,'severeKeyRows':severe,'pairRows':pair_rows,'contactRows':contact_rows,'activeChanges':active_changes,'outsideChanges':outside_changes}).encode()))
print(json.dumps({k:v for k,v in summary.items() if k not in ['gaps','motion','bySevereKey']},indent=2))
