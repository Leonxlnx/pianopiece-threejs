from pathlib import Path
import json,hashlib,re
r=Path(__file__).resolve().parent.parent;o=r/'integrated-review'
s=(o/'pianist-combined-thumb28.ts').read_text()
probe=(r/'rh-thumb-rest-extension/pianist-probe.ts').read_text(); a=probe.index(' // Exact released-thumb gap diagnostic');b=probe.index(' finger.bones.forEach((bone,j)=>{bone.quaternion.copy(rotations[j])',a);block=probe[a:b]
cfg=json.loads((r/'rh-thumb-rest-extension/g95-selected.json').read_text())
block=block.replace(' // Exact released-thumb gap diagnostic; complete authored-frame local poses.',' // Relax the thumb in this measured pause; preserve both contact anchors.')
block=block.replace('((globalThis as any).__thumbRestCandidates??[])',json.dumps(cfg,separators=(',',':')))
anchor=' finger.bones.forEach((bone,j)=>{bone.quaternion.copy(rotations[j]);bone.updateWorldMatrix(false,true);});';assert s.count(anchor)==1;s=s.replace(anchor,block+anchor)
(o/'pianist-combined-thumbs.ts').write_text(s)
data=json.loads((r/'idle-combined/candidate-data.json').read_text());opening=json.loads((r/'idle-nonthumb/combined-opening-eight-delivery/opening-eight-v10.json').read_text());assert len(opening['curves'])==8
assert all(c not in data['curves'] for c in opening['curves']);data['curves']+=opening['curves'];assert data['sourceScoreSha256']==hashlib.sha256((o/'score-v11.json').read_bytes()).hexdigest()
(o/'idle-nonthumb-data.ts').write_text('export const idleNonthumbData = '+json.dumps(data,separators=(',',':'))+';\n');(o/'idle-nonthumb-data.json').write_text(json.dumps(data,indent=2))
helper=(r/'idle-nonthumb/combined-opening-eight-delivery/idle-nonthumb-with-blend.ts').read_text();(o/'idle-nonthumb.ts').write_text(helper)
anchor=' finger.bones.forEach((bone,j)=>{bone.quaternion.copy(fallback[j].slerp(rotations[j],weight));bone.updateWorldMatrix(false,true);});';assert s.count(anchor)==1
s=s.replace(anchor,anchor+'\n applyIdleNonthumb(time,hand.side,fi,finger.bones,hand.wrist,base,previous,next);');mod="import { applyIdleNonthumb } from './idle-nonthumb';\n"+s;(o/'pianist-candidate.ts').write_text(mod)
# The baked audit source has identical logic; only module boundaries are removed.
inline='\n'.join(l for l in helper.splitlines() if not l.startswith('import '));inline=inline.replace('const smooth=','const idleSmooth=').replace('smooth(', 'idleSmooth(').replace('export function applyIdleNonthumb','function applyIdleNonthumb')
baked=s+'\nconst idleNonthumbData = '+json.dumps(data,separators=(',',':'))+';\n'+inline+'\n';(o/'pianist-candidate-baked.ts').write_text(baked)
files=['pianist-candidate.ts','pianist-candidate-baked.ts','idle-nonthumb.ts','idle-nonthumb-data.ts','score-v11.json']
(o/'v11-runtime-manifest.json').write_text(json.dumps({'status':'Combined review; not yet promoted','files':{f:hashlib.sha256((o/f).read_bytes()).hexdigest() for f in files},'idleEntries':len(data['curves'])+len(data['supportedIndexGaps']),'thumbScopes':[[27.794411,34.166094],[95.039182,95.94507]],'rejectedTrials':'L63/L61 new fast transitions removed; other extension thumbs excluded'},indent=2))
print('Merged',len(data['supportedIndexGaps']),len(data['curves']))
