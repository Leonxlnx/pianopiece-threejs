from pathlib import Path
import json,hashlib,subprocess
root=Path(__file__).resolve().parent.parent;out=Path(__file__).resolve().parent
base=json.loads((root/'combined-review/candidate-v4.json').read_text());opening=json.loads((root/'opening-revision/candidate-v3.json').read_text())
delta={'noteChanges':[],'knotChanges':[]}
for a,b in zip(base['notes'],opening['notes'],strict=True):
 assert a['id']==b['id']
 for k in sorted(set(a)|set(b)):
  if a.get(k)==b.get(k) and (k in a)==(k in b):continue
  assert k in {'finger','contactZ','contactLift','thumbOpposition'},(a['id'],k)
  delta['noteChanges'].append({'id':a['id'],'field':k,'before':a.get(k),'beforeExists':k in a,'after':b.get(k),'afterExists':k in b})
for ha,hb in zip(base['wristMotion']['hands'],opening['wristMotion']['hands'],strict=True):
 assert ha['side']==hb['side']
 for i,(a,b) in enumerate(zip(ha['knots'],hb['knots'],strict=True)):
  assert a['time']==b['time']
  for k in sorted(set(a)|set(b)):
   if a.get(k)==b.get(k) and (k in a)==(k in b):continue
   delta['knotChanges'].append({'side':ha['side'],'index':i,'time':a['time'],'field':k,'before':a.get(k),'beforeExists':k in a,'after':b.get(k),'afterExists':k in b})
(out/'opening-guarded-delta.json').write_text(json.dumps(delta,indent=2))
subprocess.run(['python',str(root/'combined-review/apply-field-delta.py'),str(root/'combined-review/candidate-v9.json'),str(out/'opening-guarded-delta.json'),str(out/'score-v10.json')],check=True)
# Keep the independently measured scopes verbatim and disjoint.
s=(root/'hand-runtime/pianist-arms-compact21.ts').read_text()
assert s.count(' openingPalmFrame=0;')==1
s=s.replace(' openingPalmFrame=0;',' openingPalmFrame=0;\n chordPalmFrame=0;')
proof=(root/'active-hand-fit/chord-plane-proof/pianist-scoped-plane.ts').read_text()
normal=next(line for line in proof.splitlines() if 'if(this.chordPalmFrame>0)' in line)
anchor=next(line for line in s.splitlines() if 'if(this.openingPalmFrame>0)' in line)
s=s.replace(anchor,anchor+'\n'+normal)
update=next(line for line in proof.splitlines() if "this.chordPalmFrame=hand.side" in line)
anchor=next(line for line in s.splitlines() if "this.openingPalmFrame=hand.side" in line)
s=s.replace(anchor,anchor+'\n'+update)
(out/'pianist-combined-base.ts').write_text(s)
inputs=['hand-runtime/pianist-arms-compact21.ts','active-hand-fit/chord-plane-proof/pianist-scoped-plane.ts','combined-review/candidate-v9.json','opening-revision/candidate-v3.json']
manifest={'status':'Review base, not integrated or globally accepted','inputs':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in inputs},'outputs':{n:hashlib.sha256((out/n).read_bytes()).hexdigest() for n in ['score-v10.json','pianist-combined-base.ts','opening-guarded-delta.json']}}
(out/'input-manifest.json').write_text(json.dumps(manifest,indent=2));print(json.dumps(manifest))
