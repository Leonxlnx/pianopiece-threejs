import json,hashlib
from pathlib import Path
p=Path('.');base=json.loads((p/'baseline-score.json').read_text());s=json.loads((p/'baseline-score.json').read_text());a=json.loads((p/'candidate-first.json').read_text());b=json.loads((p/'candidate-second-held.json').read_text());ids1=['p00511','p00513','p00514','p00516','p00518'];ids2=['p00899','p00903','p00905','p00907','p00909'];bn={n['id']:n for n in base['notes']};notes=[];kn=[]
for source,ids,indices in [(a,ids1,[262,263,264,265]),(b,ids2,[442,443,444,445,446])]:
 sn={n['id']:n for n in source['notes']}
 for i,n in enumerate(s['notes']):
  if n['id'] in ids:s['notes'][i]=sn[n['id']]
 sk=next(h['knots'] for h in s['wristMotion']['hands'] if h['side']=='L');src=next(h['knots'] for h in source['wristMotion']['hands'] if h['side']=='L')
 for i in indices:sk[i]=src[i]
for n in s['notes']:
 old=bn[n['id']]
 for f in sorted(set(n)|set(old)):
  if old.get(f)!=n.get(f):notes.append(dict(id=n['id'],field=f,before=old.get(f),after=n.get(f)))
bk=next(h['knots'] for h in base['wristMotion']['hands'] if h['side']=='L');sk=next(h['knots'] for h in s['wristMotion']['hands'] if h['side']=='L')
for i,(old,new) in enumerate(zip(bk,sk)):
 if old!=new:kn.append(dict(side='L',index=i,before=old,after=new))
(p/'diagnostic-candidate.json').write_text(json.dumps(s,indent=2)+'\n');(p/'diagnostic-delta.json').write_text(json.dumps(dict(status='DIAGNOSTIC_ONLY_NOT_ACCEPTED',baseSha256=hashlib.sha256((p/'baseline-score.json').read_bytes()).hexdigest(),notes=notes,knots=kn),indent=2)+'\n')
print('delta',len(notes),'fields',len(kn),'knots')
