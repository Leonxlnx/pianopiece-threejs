import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),project='/workspace/sites/daybreak-piano-film';
const req=createRequire(path.join(project,'package.json')),ts=req('typescript');
const THREE=await import(pathToFileURL(req.resolve('three')));
for(const name of ['hair-motion-data','ponytail-motion']){
 let code=ts.transpileModule(fs.readFileSync(path.join(root,name+'.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 code=code.replace(/from (['"])([^'"]+)\1/g,(_,quote,specifier)=>`from ${JSON.stringify(specifier==='three'?pathToFileURL(req.resolve('three')).href:pathToFileURL(path.join(root,'compiled',specifier+'.mjs')).href)}`);
 fs.writeFileSync(path.join(root,'compiled',name+'.mjs'),code);
}
const {ponytailMotion}=await import(pathToFileURL(path.join(root,'compiled/ponytail-motion.mjs')));
const bones=new Map(['PonytailRoot','Ponytail1','Ponytail2','Head','LeftHand'].map(name=>[name,new THREE.Bone()]));
const rest=new Map([...bones].map(([name,bone])=>[name,bone.quaternion.clone()]));
const sample=ponytailMotion(bones,rest),pose=()=>[...bones].map(([name,bone])=>[name,bone.quaternion.toArray()]);
const baseline=new Map();for(const time of [0,2.3,84.3,179.6,186,233.144228]){sample(time);baseline.set(time,pose());}
for(const time of [186,0,233.144228,84.3,2.3,179.6,186,186]){sample(time);assert.deepEqual(pose(),baseline.get(time));}
for(const name of ['PonytailRoot','Head','LeftHand'])assert.ok(bones.get(name).quaternion.equals(rest.get(name)));
const report=JSON.parse(fs.readFileSync(path.join(root,'candidate-report.json'),'utf8'));
for(const pair of report.pairs){sample(pair.time);for(let i=0;i<2;i++){const expected=new THREE.Quaternion().setFromEuler(new THREE.Euler(pair.anglesDegrees[i*2]*Math.PI/180,0,pair.anglesDegrees[i*2+1]*Math.PI/180));assert.ok(bones.get('Ponytail'+(i+1)).quaternion.angleTo(expected)<1e-6);}}
const result={status:'pass',checks:['arbitrary seeking equals sequential lookup','repeated frozen time does not accumulate rotations','root/head/hand untouched','runtime helper matches rendered candidate angles'],moduleBytes:fs.statSync(path.join(root,'ponytail-motion.ts')).size,dataBytes:fs.statSync(path.join(root,'hair-motion-data.ts')).size};
fs.writeFileSync(path.join(root,'runtime-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
