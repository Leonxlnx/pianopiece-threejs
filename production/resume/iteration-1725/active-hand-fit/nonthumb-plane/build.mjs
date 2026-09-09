import fs from'node:fs';import ts from'typescript';import crypto from'node:crypto';import assert from'node:assert/strict';const source='../hand-runtime/pianist-arms-compact5.ts',original=fs.readFileSync(source,'utf8');const old=` const natural=e.clone().cross(v3(0,1,0)).normalize(),stable=v3(1,0,0).addScaledVector(e,-e.x).normalize();
 const horizontal=Math.hypot(target.x-base.x,target.z-base.z);normal=stable.lerp(natural,smooth((horizontal-.004)/.024)).normalize();`;
const replacement=` const q=palmQ??f.bones[0].parent!.getWorldQuaternion(new THREE.Quaternion());
 const reference=v3(-1,0,0).applyQuaternion(q);normal=reference.addScaledVector(e,-reference.dot(e));
 if(normal.lengthSq()<1e-8){
  const natural=e.clone().cross(v3(0,1,0)).normalize(),stable=v3(1,0,0).addScaledVector(e,-e.x).normalize();
  const horizontal=Math.hypot(target.x-base.x,target.z-base.z);normal=stable.lerp(natural,smooth((horizontal-.004)/.024));
 }
 normal.normalize();`;
assert.equal(original.split(old).length,2);const s=original.replace(old,replacement);fs.writeFileSync('nonthumb-plane/pianist-palm-plane.ts',s);let js=ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;for(const m of['math','piano','ponytail-motion'])js=js.replaceAll(`'./${m}'`,`'/workspace/sites/daybreak-piano-film/production/qa/compiled/${m}.mjs'`);js=js.replaceAll("'./wrist-motion'","'/workspace/scratch/2e8cc8e77f98/active-hand-fit/wrist-motion-arc.mjs'");fs.writeFileSync('nonthumb-plane/pianist-palm-plane.mjs',js);const sha=s=>crypto.createHash('sha256').update(s).digest('hex');fs.writeFileSync('nonthumb-plane/build-provenance.json',JSON.stringify({source,sourceSha256:sha(original),candidateTsSha256:sha(s),candidateMjsSha256:sha(js),onlyChangedRegion:'fingerPoints nonthumb normal',before:old,after:replacement},null,2));
