from pathlib import Path
import json,hashlib,copy
r=Path(__file__).resolve().parent.parent;o=r/'integrated-review'
s=json.loads((o/'score-v10.json').read_text());v7=json.loads((r/'combined-review/candidate-v7.json').read_text());delta=json.loads((r/'lh-remaining/guarded-delta.json').read_text());res=json.loads((r/'lh-remaining/reservation.json').read_text())
groups=[g for g in res['groups'] if g['name'] in ['L63-refrain','L61-refrain']];ids={n['id'] for g in groups for n in g['notes']};indices={i for g in groups for i in g['knots']}; reverted=[]
for c in delta['noteChanges']:
 if c['id'] not in ids:continue
 n=next(n for n in s['notes'] if n['id']==c['id']);b=next(n for n in v7['notes'] if n['id']==c['id']);k=c['field'];assert n.get(k)==c['after'];
 if k in b:n[k]=b[k]
 else:n.pop(k,None)
 reverted.append(c)
for c in delta['knotChanges']:
 if c['side']!='L' or c['index'] not in indices:continue
 n=next(h for h in s['wristMotion']['hands'] if h['side']=='L')['knots'][c['index']];b=next(h for h in v7['wristMotion']['hands'] if h['side']=='L')['knots'][c['index']];k=c['field'];assert n.get(k)==c['after'];
 if k in b:n[k]=b[k]
 else:n.pop(k,None)
 reverted.append(c)
visual={'finger','contactLift','contactZ','thumbOpposition'}
for n,b in zip(s['notes'],json.loads((o/'score-v10.json').read_text())['notes'],strict=True):assert {k:v for k,v in n.items() if k not in visual}=={k:v for k,v in b.items() if k not in visual}
p=o/'score-v11.json';p.write_text(json.dumps(s,separators=(',',':')))
(o/'v11-decision.json').write_text(json.dumps({'status':'Review only, retains old L63/L61 support until complete shared-grip solution qualifies','reason':'Reject newly introduced 7.1 and 4.3 m/s inactive index/middle transitions','scoreSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'revertedFields':reverted,'audioUnchanged':True},indent=2))
print(len(reverted),'reverted',hashlib.sha256(p.read_bytes()).hexdigest())
