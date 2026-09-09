from pathlib import Path
import json,gzip,sys,math
p=Path(__file__).parent
b=json.loads(gzip.decompress((p/sys.argv[1]).read_bytes()))
c=json.loads(gzip.decompress((p/sys.argv[2]).read_bytes()))
assert b['times']==c['times']
keyrows=[];pairrows=[];contacts=[];pointfail=[];improvedkeys=0;improvedpairs=0;targetheld=[]
for old,new in zip(b['rows'],c['rows']):
 t=old['time'];side=old['side'];assert (t,side)==(new['time'],new['side'])
 kb={(x['patch'],x['midi']):x for x in old['keyHits']};kc={(x['patch'],x['midi']):x for x in new['keyHits']}
 for k in kb.keys()|kc.keys():
  x=kb.get(k,{'depth':0,'count':0});y=kc.get(k,{'depth':0,'count':0})
  if y['depth']>x['depth']+1e-6 or y['count']>x['count']:keyrows.append({'time':t,'side':side,'patch':k[0],'midi':k[1],'before':x,'after':y})
  if y['depth']<x['depth']-1e-6:improvedkeys+=1
 pb={(x['a'],x['b']):x for x in old['crossings']};pc={(x['a'],x['b']):x for x in new['crossings']}
 for k in pb.keys()|pc.keys():
  x=pb.get(k,{'trianglePairs':0});y=pc.get(k,{'trianglePairs':0})
  if y['trianglePairs']>x['trianglePairs']:pairrows.append({'time':t,'side':side,'pair':k,'before':x,'after':y})
  if y['trianglePairs']<x['trianglePairs']:improvedpairs+=1
 prior={x['id']:x for x in old['meshContacts']}
 for y in new['meshContacts']:
  x=prior.get(y['id'])
  if x and x['minGap']!=y['minGap'] and (x['minGap'] is None or y['minGap'] is None or abs(x['minGap']-y['minGap'])>1e-6):contacts.append({'time':t,'side':side,'before':x,'after':y})
 for x in new['contacts']:
  n=next((n for n in new['active'] if n['midi']==x['midi'] and n['finger']==x['finger']),None)
  if not n:continue
  oldc=next((o for o in old['contacts'] if o['midi']==x['midi']),None)
  row={'time':t,'side':side,'id':n['id'],'finger':n['finger'],'beforeErrorMm':1000*oldc['error'] if oldc else None,'afterErrorMm':1000*x['error']}
  if x['error']>.00015:pointfail.append(row)
  if n['id'] in ['p00719','p00720','p00721','p00722','p00723']:targetheld.append(row)
severe=[x for x in keyrows if x['after']['depth']>3 and x['after']['depth']>x['before']['depth']+1e-6]
bykey={};bypair={};bypoint={}
for x in severe:
 key=x['patch']+':'+str(x['midi']);r=bykey.setdefault(key,{'rows':0,'maxDepthMm':0});r['rows']+=1
 if x['after']['depth']>r['maxDepthMm']:r.update({'maxDepthMm':x['after']['depth'],'time':x['time'],'beforeDepthMm':x['before']['depth'],'vertex':x['after'].get('vertex')})
for x in pairrows:
 key='–'.join(x['pair']);r=bypair.setdefault(key,{'rows':0,'newCrossingRows':0,'maxAdded':0});r['rows']+=1;r['newCrossingRows']+=x['before']['trianglePairs']==0
 d=x['after']['trianglePairs']-x['before']['trianglePairs']
 if d>r['maxAdded']:r.update({'maxAdded':d,'time':x['time'],'before':x['before']['trianglePairs'],'after':x['after']['trianglePairs']})
for x in pointfail:
 r=bypoint.setdefault(x['id'],{'rows':0,'maxErrorMm':0});r['rows']+=1
 if x['afterErrorMm']>r['maxErrorMm']:r.update({'maxErrorMm':x['afterErrorMm'],'worst':x})
summary={'sampleTimes':len(b['times']),'handStates':len(b['rows']),'interval':[b['min'],b['max']],'worseKeyRows':len(keyrows),'worseKeyRowsOver3mm':len(severe),'worsePairRows':len(pairrows),'newPairRows':sum(x['before']['trianglePairs']==0 for x in pairrows),'improvedKeyRows':improvedkeys,'improvedPairRows':improvedpairs,'changedContactGaps':len(contacts),'pointErrorRowsOver015mm':len(pointfail),'pointErrorsByNote':bypoint,'bySevereKey':bykey,'byPair':bypair,'targetHeldSamples':len(targetheld),'targetHeldWorstPointErrorMm':max(x['afterErrorMm'] for x in targetheld),'window':{}}
for a,z in [(158.5,160.5),(159.18,159.36)]:
 summary['window'][f'{a}–{z}']={'worseSevereKeyRows':sum(a<=x['time']<=z for x in severe),'worsePairRows':sum(a<=x['time']<=z for x in pairrows),'newPairRows':sum(a<=x['time']<=z and x['before']['trianglePairs']==0 for x in pairrows)}
stem=sys.argv[3];(p/(stem+'-summary.json')).write_text(json.dumps(summary,indent=2));(p/(stem+'-details.json.gz')).write_bytes(gzip.compress(json.dumps({'keyRows':keyrows,'pairRows':pairrows,'contacts':contacts,'pointfail':pointfail,'targetHeld':targetheld}).encode()));print(json.dumps({k:v for k,v in summary.items() if k not in ['bySevereKey','byPair']},indent=2))
