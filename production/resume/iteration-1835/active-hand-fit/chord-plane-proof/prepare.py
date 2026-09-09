import json,hashlib
from pathlib import Path
s=json.load(open('r79-frozen-v2.json'));before=json.loads(json.dumps(s));d=json.load(open('../held-r81-r76-fit/guarded-delta.json'));applied=[]
for change in d['noteChanges']:
 if change['id']not in ['p00971','p00974','p00986']:continue
 n=next(n for n in s['notes']if n['id']==change['id']);k=change['field'];assert (k in n)==change['beforeExists'];assert n.get(k)==change['before'];n[k]=change['after'];applied.append(change)
for change in d['knotChanges']:
 if change['side']!='R' or change['index']not in [420,421,426]:continue
 n=next(h for h in s['wristMotion']['hands']if h['side']=='R')['knots'][change['index']];k=change['field'];assert (k in n)==change['beforeExists'];assert n.get(k)==change['before'];n[k]=change['after'];applied.append(change)
p=Path('chord-plane-proof/base.json');p.write_text(json.dumps(s,separators=(',',':')))
json.dump({'inputSha256':hashlib.sha256(Path('r79-frozen-v2.json').read_bytes()).hexdigest(),'baseSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'rendererInput':'../held-r81-r76-fit/candidate-v8.json','acceptedLateChanges':applied},open('chord-plane-proof/base-provenance.json','w'),indent=2)
json.dump({'mutableNotes':['p00978','p00981','p00982'],'mutableWrists':[423,424],'guardNotes':['p00971','p00974','p00976','p00984','p00986','p00988'],'guardWrists':[420,421,422,425,426,427],'normalRampIn':[198.348852,198.670185],'normalFull':[198.670185,199.66868],'normalRampOut':[199.66868,200.026507],'musicalChangesAllowed':False},open('chord-plane-proof/reservation.json','w'),indent=2)
