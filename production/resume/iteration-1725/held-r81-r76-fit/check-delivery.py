from pathlib import Path
import json,hashlib
p=Path(__file__).parent
b=json.loads((p/'baseline-score.json').read_text());s=json.loads((p/'candidate-v8.json').read_text());note_fields={'finger','contactZ','contactLift','thumbOpposition'}
allowed_ids={'p00409','p00440','p00574','p00986','p00971','p00974','p00490','p00491','p00493','p00495','p00497','p00499','p00501','p00503','p00505'}
allowed_knots=set(range(212,221))|{420,421,426};delta={'baseSha256':hashlib.sha256((p/'baseline-score.json').read_bytes()).hexdigest(),'candidateSha256':hashlib.sha256((p/'candidate-v8.json').read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(Path('../local-idle-diagnostic/pianist-baseline.ts').read_bytes()).hexdigest(),'noteChanges':[],'knotChanges':[]}
assert len(b['notes'])==len(s['notes'])
for a,c in zip(b['notes'],s['notes']):
 assert a['id']==c['id']
 for f in a.keys()|c.keys():
  if a.get(f)!=c.get(f) or (f in a)!=(f in c):
   assert a['id'] in allowed_ids and f in note_fields,(a['id'],f)
   delta['noteChanges'].append({'id':a['id'],'field':f,'before':a.get(f),'beforeExists':f in a,'after':c.get(f),'afterExists':f in c})
 assert {k:v for k,v in a.items() if k not in note_fields}=={k:v for k,v in c.items() if k not in note_fields}
for ah,ch in zip(b['wristMotion']['hands'],s['wristMotion']['hands']):
 assert ah['side']==ch['side'] and len(ah['knots'])==len(ch['knots'])
 for i,(a,c) in enumerate(zip(ah['knots'],ch['knots'])):
  for f in a.keys()|c.keys():
   if a.get(f)!=c.get(f) or (f in a)!=(f in c):
    assert ah['side']=='R' and i in allowed_knots and f in {'position','quaternion','moveStart'},(ah['side'],i,f)
    delta['knotChanges'].append({'side':'R','index':i,'time':a['time'],'field':f,'before':a.get(f),'beforeExists':f in a,'after':c.get(f),'afterExists':f in c})
for key in b.keys()|s.keys():
 if key not in {'notes','wristMotion'}:assert b[key]==s[key],key
locked={'p00417','p00418','p00420','p00421','p00423','p00425','p00428','p00429'}
assert [n for n in b['notes'] if n['id'] in locked]==[n for n in s['notes'] if n['id'] in locked]
br=next(h['knots'] for h in b['wristMotion']['hands'] if h['side']=='R');sr=next(h['knots'] for h in s['wristMotion']['hands'] if h['side']=='R');assert br[183:189]==sr[183:189]
def overlaps(score):
 out=set();ns=score['notes']
 for i,a in enumerate(ns):
  for c in ns[i+1:]:
   if a['hand']==c['hand'] and a['finger']==c['finger'] and max(a['time'],c['time'])<min(a['time']+a['duration'],c['time']+c['duration'])-1e-7:out.add(tuple(sorted([a['id'],c['id']])))
 return out
assert not overlaps(s)-overlaps(b),'New same-finger held overlap'
delta['invariants']={'notes':len(s['notes']),'musicalEventsExact':True,'pedalsExact':True,'scoreMetadataExact':True,'outsideReservedFieldsExact':True,'RH89Exact':True,'heldSopranoTimesExact':True,'newSameFingerHeldOverlaps':0}
(p/'guarded-delta.json').write_text(json.dumps(delta,indent=2));print(json.dumps({'notes':sorted(set(r['id'] for r in delta['noteChanges'])),'knots':sorted(set(r['index'] for r in delta['knotChanges'])),**delta['invariants']},indent=2))
