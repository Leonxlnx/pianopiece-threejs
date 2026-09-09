import json,collections,hashlib,math
from pathlib import Path
root=Path('nonthumb-plane');a=json.load(open(root/'baseline-rows.json'));b=json.load(open(root/'candidate-rows.json'));score=json.load(open('r79-frozen-v2.json'));names=['Thumb','Index','Middle','Ring','Pinky'];assert len(a)==len(b)
def classify(r):
 active={r['side']+names[n['finger']-1] for n in r['active']}
 k=r['keyHits'];p=r['crossings'];return {
  'anyCore': [h for h in k if h['depth']>3],
  'activeDigitCore':[h for h in k if h['active'] and h['depth']>3],
  'activeNonthumbCore':[h for h in k if h['active'] and not h['patch'].endswith('Thumb') and h['depth']>3],
  'palmCore':[h for h in k if h['patch'].endswith('Palm') and h['depth']>3],
  'idleDigitCore':[h for h in k if not h['active'] and not h['patch'].endswith('Palm') and h['depth']>3],
  'allPairs':p,
  'activeOwnedPalm':[c for c in p if (c['a'] in active or c['b'] in active) and (c['a'].endswith('Palm') or c['b'].endswith('Palm'))],
  'activeActive':[c for c in p if c['a'] in active and c['b'] in active],
  'activeIdle':[c for c in p if (c['a'] in active) != (c['b'] in active) and not c['a'].endswith('Palm') and not c['b'].endswith('Palm')],
  'idlePairs':[c for c in p if c['a'] not in active and c['b'] not in active],
  'ik':[c for c in r['contacts'] if c['error']>.0003],
  'pad':[c for c in r['meshContacts'] if c['minGap'] is None or c['minGap']>3]}
def summary(rows):
 cats=[classify(r) for r in rows];return {'handFrames':len(rows),'frameCounts':{k:sum(bool(x[k])for x in cats)for k in cats[0]},'maxCoreMm':max([h['depth']for r in rows for h in r['keyHits']]+[0]),'maxActiveCoreMm':max([h['depth']for r in rows for h in r['keyHits']if h['active']]+[0]),'maxIkMm':max([c['error']*1000 for r in rows for c in r['contacts']]+[0]),'maxPadGapMm':max([c['minGap']for r in rows for c in r['meshContacts']if c['minGap'] is not None]+[0])}
def identity(x):
 if 'patch'in x:return(x['patch'],x['midi'])
 if 'a'in x:return(x['a'],x['b'])
 return x.get('id',x.get('finger'))
def novel(new,old):
 found=next((x for x in old if identity(x)==identity(new)),None)
 if found is None:return True
 if 'depth'in new:return new['depth']>found['depth']+.3
 if 'error'in new:return new['error']>found['error']+.00005
 if 'minGap'in new:return found['minGap']is not None and (new['minGap']is None or new['minGap']>found['minGap']+.1)
 return False
regressions=[];improvements=[];active_queue={};gaps={};thumb_wrist_exact=True;nonfinite=0
for x,y in zip(a,b):
 assert (x['side'],x['time'])==(y['side'],y['time']);thumb_wrist_exact &= x['thumbAndWristQuaternions']==y['thumbAndWristQuaternions'];nonfinite+=any(not math.isfinite(v)for c in y['chains']for p in c['points']for v in p)
 ca,cb=classify(x),classify(y);new={k:[h for h in cb[k]if novel(h,ca[k])]for k in cb};new={k:v for k,v in new.items()if v};removed={k:[h for h in ca[k]if novel(h,cb[k])]for k in ca};removed={k:v for k,v in removed.items()if v}
 if removed:improvements.append({'time':y['time'],'side':y['side'],'active':y['active'],'removed':removed})
 if not new:continue
 row={'time':y['time'],'side':y['side'],'active':y['active'],'new':new};regressions.append(row)
 active_types=[k for k in new if k in ['activeDigitCore','palmCore','activeOwnedPalm','activeActive','ik','pad']]
 if active_types:
  for n in y['active']:
   d=active_queue.setdefault(n['id'],{'id':n['id'],'side':y['side'],'finger':n['finger'],'midi':n['midi'],'types':set(),'samples':[]});d['types'].update(active_types);d['samples'].append(row)
 active={y['side']+names[n['finger']-1]for n in y['active']};patches={h['patch']for h in new.get('idleDigitCore',[])}
 for p in new.get('allPairs',[]):patches.update(q for q in [p['a'],p['b']]if q not in active and not q.endswith('Palm'))
 for patch in patches:
  side=patch[0];fi=names.index(patch[1:])+1;ns=[n for n in score['notes']if n['hand']==side and n['finger']==fi];prev=next((n for n in reversed(ns)if n['time']+n['duration']<=y['time']),None);nxt=next((n for n in ns if n['time']>=y['time']),None);key=(patch,prev['id']if prev else None,nxt['id']if nxt else None)
  d=gaps.setdefault(key,{'patch':patch,'previous':key[1],'next':key[2],'start':prev['time']+prev['duration']if prev else 0,'end':nxt['time']if nxt else score['duration'],'samples':[]});d['samples'].append(y['time'])
for d in active_queue.values():d['types']=sorted(d['types'])
report={'scoreSha256':hashlib.sha256(Path('r79-frozen-v2.json').read_bytes()).hexdigest(),'baseline':summary(a),'candidate':summary(b),'newFrameCounts':dict(collections.Counter(k for r in regressions for k in r['new'])),'removedFrameCounts':dict(collections.Counter(k for r in improvements for k in r['removed'])),'thumbAndWristQuaternionsExact':thumb_wrist_exact,'nonfiniteFrames':nonfinite,'regressionFrames':len(regressions),'activeAffectedNotes':len(active_queue),'idleAffectedGaps':len(gaps),'scope':'1070 note-midpoint/start/end instants; both hands; actual owned mesh. Midpoint screening alone is not full-interval acceptance.'}
(root/'comparison.json').write_text(json.dumps(report,indent=2));(root/'regressions.json').write_text(json.dumps(regressions,indent=2));(root/'improvements.json').write_text(json.dumps(improvements,indent=2));(root/'active-affected-queue.json').write_text(json.dumps(list(active_queue.values()),indent=2));(root/'idle-affected-queue.json').write_text(json.dumps(list(gaps.values()),indent=2));print(json.dumps(report,indent=2))
