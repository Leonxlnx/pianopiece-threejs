import json,hashlib,pathlib
p=pathlib.Path('.');read=lambda f:json.loads((p/f).read_text());base=read('baseline-score.json');diag=read('diagnostic-candidate.json');audit=read('diagnostic-candidate-audit-240.json');baseline=read('baseline-score-audit-240.json');delta=read('diagnostic-delta.json')
held=[];residual=[]
for scope in ['p514','p905']:
 rows=[r for r in audit['rows'] if r['scope']==scope];ids=next(s['notes'] for s in read('ownership.json')['scopes'] if s['name']==scope)
 for nid in ids:
  rr=[r for r in rows if any(c['id']==nid for c in r['contacts'])];cc=[c for r in rr for c in r['contacts'] if c['id']==nid];bad=[r for r in rr if r['keyCore']>3 or r['crossingPairs'] or r['pointContactMm']>.2 or any(c['padGap'] is None or abs(c['padGap'])>2.5 for c in r['contacts'])]
  held.append(dict(scope=scope,id=nid,samples=len(rr),badSamples=len(bad),maxKeyMm=max(r['keyCore'] for r in rr),maxCrossingPairs=max(r['crossingPairs'] for r in rr),maxPointMm=max(r['pointContactMm'] for r in rr),minPadMm=min(c['padGap'] for c in cc),maxPadMm=max(c['padGap'] for c in cc),minLateralDeg=min(r['lateralPalmFrameDegrees'] for r in rr),maxLateralDeg=max(r['lateralPalmFrameDegrees'] for r in rr)))
 bad=[r for r in rows if r['keyCore']>3 or r['crossingPairs'] or r['pointContactMm']>.2 or any(c['padGap'] is None or abs(c['padGap'])>2.5 for c in r['contacts'])];spans=[]
 for r in bad:
  if not spans or r['time']-spans[-1][-1]['time']>.00418:spans.append([r])
  else:spans[-1].append(r)
 for rr in spans:
  worst=max(rr,key=lambda r:r['keyCore']+r['crossingPairs']*.1);residual.append(dict(scope=scope,start=rr[0]['time'],end=rr[-1]['time'],samples=len(rr),heldIds=sorted({c['id']for r in rr for c in r['contacts']}),maxKeyMm=max(r['keyCore'] for r in rr),maxCrossingPairs=max(r['crossingPairs']for r in rr),maxPointMm=max(r['pointContactMm']for r in rr),keyPatches=sorted({h['patch']for r in rr for h in r['keyHits']}),pairs=sorted({c['a']+'/'+c['b']for r in rr for c in r['crossings']}),worstTime=worst['time']))
(p/'held-summary.json').write_text(json.dumps(held,indent=2)+'\n');(p/'residual-intervals.json').write_text(json.dumps(residual,indent=2)+'\n')
second={**delta,'status':'HELD_ONLY_CANDIDATE_FULL_PASSAGE_REJECTED_PENDING_IDLE_FIX','notes':[x for x in delta['notes'] if x['id'] in ['p00903','p00905','p00907','p00909']],'knots':[x for x in delta['knots'] if x['index']>=442]}
second['noteGuards']={n['id']:{k:n[k]for k in ['id','time','duration','midi','velocity','hand','finger']}for n in base['notes'] if n['id'] in ['p00899','p00903','p00905','p00907','p00909']}
(p/'second-held-delta.json').write_text(json.dumps(second,indent=2)+'\n')
secondscore=json.loads((p/'baseline-score.json').read_text());byid={n['id']:n for n in secondscore['notes']}
for c in second['notes']:byid[c['id']][c['field']]=c['after']
knots=next(h['knots']for h in secondscore['wristMotion']['hands']if h['side']=='L')
for c in second['knots']:knots[c['index']]=c['after']
(p/'second-held-candidate.json').write_text(json.dumps(secondscore,indent=2)+'\n')
manifest=[]
for name,rid in [('baseline','dab1d83cea442d8d'),('diagnostic','5bed035f078f7324')]:
 d=pathlib.Path('/workspace/scratch/2e8cc8e77f98/render-recovery/reviews')/rid
 for f in sorted(d.glob('current-1280-*.png')):manifest.append(dict(variant=name,path=str(f),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),report=str(d/'report-1280.json'),inspected=True))
(p/'render-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Second held',[(x['id'],x['samples'],x['badSamples'],x['maxLateralDeg'])for x in held if x['scope']=='p905']);print('Second residuals', [x for x in residual if x['scope']=='p905'])
