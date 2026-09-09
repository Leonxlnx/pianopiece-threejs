from pathlib import Path
import json,hashlib,copy
root=Path('chord-plane-proof');read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();base=read(root/'final-base.json');score=read(root/'proof-candidate.json');m=read(root/'guarded-delta.json');assert sha(root/'proof-candidate.json')==m['candidateSha256'];assert sha(root/'final-base.json')==m['baselineSha256'];assert len(m['operations'])==19;assert m['physicalReleaseChanges']==[]
replay=copy.deepcopy(base)
for op in m['operations']:
 obj=next(n for n in replay['notes']if n['id']==op['id'])if op['kind']=='note'else next(h for h in replay['wristMotion']['hands']if h['side']==op['hand'])['knots'][op['index']]
 assert (op['key']in obj)==op['beforeExists'];assert obj.get(op['key'])==op.get('before')
 if op['afterExists']:obj[op['key']]=op['after']
 else:obj.pop(op['key'],None)
assert replay==score
for a,b in zip(base['notes'],score['notes']):
 for k in ['id','time','duration','midi','velocity','hand','role']:assert a[k]==b[k]
assert [n for n in base['notes']if n['hand']=='L']==[n for n in score['notes']if n['hand']=='L']
assert next(h for h in base['wristMotion']['hands']if h['side']=='L')==next(h for h in score['wristMotion']['hands']if h['side']=='L')
for i in [420,421,422,423,426,427]:assert next(h for h in base['wristMotion']['hands']if h['side']=='R')['knots'][i]==next(h for h in score['wristMotion']['hands']if h['side']=='R')['knots'][i]
for id in ['p00971','p00974','p00976','p00986']:assert next(n for n in base['notes']if n['id']==id)==next(n for n in score['notes']if n['id']==id)
rows=read(root/'proof-full-candidate-rows.json');assert len(rows)==847;names=['Thumb','Index','Middle','Ring','Pinky'];held=0
for r in rows:
 active={r['side']+names[n['finger']-1]for n in r['active']}
 if not active:continue
 held+=1;assert all(h['depth']<=3 for h in r['keyHits']if h['active']or h['patch'].endswith('Palm'));assert all(c['error']<=.0003 for c in r['contacts']);assert all(c['minGap']is not None and c['minGap']<=3 for c in r['meshContacts'])
 for c in r['crossings']:
  if c['a']in active or c['b']in active:assert not c['a'].endswith('Palm')and not c['b'].endswith('Palm');assert not(c['a']in active and c['b']in active)
assert held==822
geo=read(root/'proof-full-hold-validation.json');assert geo['summary']['newSevereHeldFrames']==geo['summary']['newContactFailures']==geo['summary']['newMeshContactFailures']==0
assert len(read(root/'proof-idle-gap-queue.json'))==8;assert read(root/'proof-motion-gate.json')['candidate']['seek']==0
images=0
for label in ['baseline','candidate']:
 for f in read(root/'renders'/label/'image-index.json'):
  assert sha(Path(f['image']))==f['imageSha256'];assert f['glError']=='GL_NO_ERROR';assert f['sourceSha256']['public/assets/score.json']==sha(root/('final-base.json'if label=='baseline'else'proof-candidate.json'));images+=1
assert images==16
out={'passed':True,'scope':'Active-grip feasibility only; whole phrase remains unaccepted with eight idle gaps','samples':847,'heldFrames':held,'guardedOperations':19,'noteDurationChanges':0,'imagesDirectlyReviewed':images,'scoreSha256':sha(root/'proof-candidate.json')};(root/'gate-check.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
