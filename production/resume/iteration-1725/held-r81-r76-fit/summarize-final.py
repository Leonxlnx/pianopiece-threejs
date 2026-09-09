from pathlib import Path
import json,collections,hashlib
p=Path(__file__).parent
base=json.loads((p/'v7-all-full-baseline-rows.json').read_text());old=json.loads((p/'v7-all-full-candidate-rows.json').read_text());late=json.loads((p/'v8-late-full-candidate-rows.json').read_text());cand=sorted([r for r in old if r['time']<190]+late,key=lambda r:(r['time'],r['side']))
assert len(base)==len(cand)
s=json.loads((p/'candidate-v8.json').read_text());ids={r['id'] for r in json.loads((p/'guarded-delta.json').read_text())['noteChanges']};contacts=[];queue=[]
for a,b in zip(base,cand):
 assert a['time']==b['time'] and a['side']==b['side']
 contacts.extend(c for c in b['padContacts'] if c['id'] in ids)
 for c in b['crossings']:
  if not any(x['a']==c['a'] and x['b']==c['b'] for x in a['crossings']):
   active={b['side']+['Thumb','Index','Middle','Ring','Pinky'][n['finger']-1] for n in b['active']};assert c['a'] not in active and c['b'] not in active
   queue.append({'kind':'newIdlePair','time':b['time'],'patches':[c['a'],c['b']],'trianglePairs':c['trianglePairs']})
 for c in b['keyHits']:
  if c['depth']>3 and not any(x['patch']==c['patch'] and x['midi']==c['midi'] and x['depth']>=c['depth']-.3 for x in a['keyHits']):
   assert not c['active'] and c['patch']!='RPalm'
   queue.append({'kind':'newIdleCore','time':b['time'],'patches':[c['patch']],'midi':c['midi'],'depth':c['depth']})
assert all(c['gap'] is not None and c['gap']<=3 for c in contacts)
groups={}
for r in queue:
 key=(r['kind'],tuple(r['patches']),r.get('midi'));groups.setdefault(key,[]).append(r)
g=[]
for key,rs in groups.items():
 rs.sort(key=lambda r:r['time']);chunks=[]
 for r in rs:
  if not chunks or r['time']-chunks[-1][-1]['time']>.04:chunks.append([])
  chunks[-1].append(r)
 for chunk in chunks:g.append({'kind':key[0],'patches':key[1],'midi':key[2],'firstObserved':chunk[0]['time'],'lastObserved':chunk[-1]['time'],'sampleRows':len(chunk),'maximum':max(r.get('depth',r.get('trianglePairs')) for r in chunk),'gaps':[]})
for x in g:
 for patch in x['patches']:
  fi=['Thumb','Index','Middle','Ring','Pinky'].index(patch[1:])+1 if patch[1:]!='Palm' else 0
  if not fi:continue
  t=(x['firstObserved']+x['lastObserved'])/2;ns=[n for n in s['notes'] if n['hand']==patch[0] and n['finger']==fi];prev=max((n for n in ns if n['time']+n['duration']<=t),key=lambda n:n['time'],default=None);nxt=min((n for n in ns if n['time']>t),key=lambda n:n['time'],default=None)
  x['gaps'].append({'patch':patch,'previous':prev['id'] if prev else None,'previousEnd':prev['time']+prev['duration'] if prev else None,'next':nxt['id'] if nxt else None,'nextTime':nxt['time'] if nxt else None})
r={'candidateSha256':hashlib.sha256((p/'candidate-v8.json').read_bytes()).hexdigest(),'actualStates':len(cand),'targetPadSamples':len(contacts),'padMinMm':min(c['gap'] for c in contacts),'padMaxMm':max(c['gap'] for c in contacts),'padMissing':0,'padOver3mm':0,'newIdleRows':len(queue),'newIdleGroups':len(g),'scope':'V7 complete full windows with identical nonlate fields, plus full V8 late recheck. Groups are sampled observations, not continuous defect interval proofs.'}
(p/'final-surface-summary.json').write_text(json.dumps(r,indent=2));(p/'idle-regression-queue.json').write_text(json.dumps({'summary':r,'groups':sorted(g,key=lambda x:x['firstObserved']),'rows':queue},indent=2));print(json.dumps(r,indent=2))
