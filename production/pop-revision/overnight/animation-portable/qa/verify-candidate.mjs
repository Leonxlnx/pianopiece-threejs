import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runtime,T} from './runtime.mjs';
const req=createRequire(import.meta.url),ts=req('typescript');
const modules=['piano','pianist','stage','direction','math','render-settings','wrist-motion','ponytail-motion','hair-motion-data'];
for(const variant of ['v7','candidate'])for(const file of modules){
 let emitted=ts.transpileModule(fs.readFileSync(`${variant}/app/performance/${file}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const name of modules)emitted=emitted.replaceAll("'./"+name+"'","'./"+name+".mjs'");
 assert.equal(fs.readFileSync(`${variant}/compiled/${file}.mjs`,'utf8'),emitted,`Stale ${variant}/${file}.mjs`);
 if(file!=='pianist')assert.equal(fs.readFileSync(`v7/app/performance/${file}.ts`,'utf8'),fs.readFileSync(`candidate/app/performance/${file}.ts`,'utf8'),`Unrelated module ${file} changed`);
}
const targetIds=['db00440','db00956'],baseScore=JSON.parse(fs.readFileSync('v7/score.json')),candidateScore=JSON.parse(fs.readFileSync('candidate/score.json'));
const stripped=structuredClone(candidateScore);for(const note of stripped.notes){if(targetIds.includes(note.id)){assert.equal(note.releaseWaypoint?.enabled,true);delete note.releaseWaypoint;}else assert.equal(note.releaseWaypoint,undefined);}
assert.deepEqual(stripped,baseScore,'Audible or fitted fields changed');
const intervals=targetIds.map(id=>{const note=baseScore.notes.find(n=>n.id===id),start=note.time+note.duration;return{id,start,end:start+.160};});
let times=[];for(const win of intervals){const a=win.start-.025,b=win.end+.025;for(let i=0;i<=Math.ceil((b-a)*240);i++)times.push(Math.min(a+i/240,b));times.push(win.start,win.end,win.start-.00001,win.end+.00001);}
times=[...new Set(times)].sort((a,b)=>a-b);fs.writeFileSync('a4-times.json',JSON.stringify(times));
for(const variant of ['v7','candidate'])execFileSync(process.execPath,['audit-hand-surfaces.mjs','--project',process.env.DAYBREAK_PROJECT,'--rig',`${variant}/compiled/pianist.mjs`,'--piano',`${variant}/compiled/piano.mjs`,'--score',`${variant}/score.json`,'--out',`${variant}/surfaces.json`,'--times','a4-times.json'],{stdio:'pipe'});
execFileSync(process.execPath,['motion-local.mjs'],{stdio:'pipe'});
const old=JSON.parse(fs.readFileSync('v7/surfaces.json')),now=JSON.parse(fs.readFileSync('candidate/surfaces.json'));assert.equal(old.rows.length,now.rows.length);
let cleared=0,positiveControl=0;const shallowIncreases=[];
for(let i=0;i<old.rows.length;i++){
 const a=old.rows[i],b=now.rows[i];assert.equal(a.time,b.time);
 const key=(h)=>`${h.patch}:${h.key}`,before=new Map(a.keyHits.map(h=>[key(h),h]));
 for(const hit of a.keyHits)if(hit.patch==='RIndex'&&hit.maxDepthMm>3){positiveControl++;if(!b.keyHits.some(x=>key(x)===key(hit)&&x.maxDepthMm>3))cleared++;}
 for(const hit of b.keyHits){const previous=before.get(key(hit));if(hit.maxDepthMm>3)assert.ok(previous&&hit.maxDepthMm<=previous.maxDepthMm+1e-8,`New/worse severe key at${b.time}:${key(hit)}`);if(hit.maxDepthMm>(previous?.maxDepthMm??0)+1e-8)shallowIncreases.push({time:b.time,patch:hit.patch,key:hit.key,beforeMm:previous?.maxDepthMm??0,afterMm:hit.maxDepthMm});}
 assert.deepEqual(a.keyHits.filter(h=>h.patch!=='RIndex'),b.keyHits.filter(h=>h.patch!=='RIndex'),'Unrelated hand key geometry changed');
 const pairs=new Map(a.surfaceHits.map(h=>[`${h.a}:${h.b}:${h.kind}`,h.trianglePairs]));for(const h of b.surfaceHits)assert.ok(h.trianglePairs<=(pairs.get(`${h.a}:${h.b}:${h.kind}`)??0),'New/increased actual-skin pair');
}
assert.ok(positiveControl>0,'Collision oracle failed its inherited positive control');assert.equal(cleared,positiveControl,'Target severe collisions remain');
const motion=JSON.parse(fs.readFileSync('candidate/motion-local.json'));assert.ok(motion.maxTipSpeed<=5);assert.ok(motion.maxWristSpeed<=1.5);assert.ok(motion.maxWristAcceleration<=25);assert.ok(motion.maxDorsal<=60);assert.ok(motion.maxBackwardMm<=3);assert.equal(now.summary.nonfinite,0);
const a=await runtime('v7'),b=await runtime('candidate');let otherQuaternionError=0,heldSkinError=0,endpointSkinError=0;
const skinError=()=>{let max=0;for(let id=0;id<a.body.geometry.attributes.position.count;id++){const p=a.body.getVertexPosition(id,new T.Vector3()).applyMatrix4(a.body.matrixWorld),q=b.body.getVertexPosition(id,new T.Vector3()).applyMatrix4(b.body.matrixWorld);max=Math.max(max,p.distanceTo(q));}return max;};
for(const time of times){a.pose(time);b.pose(time);for(let i=0;i<a.body.skeleton.bones.length;i++){const old=a.body.skeleton.bones[i],cur=b.body.skeleton.bones[i];assert.equal(old.name,cur.name);if(!/^RightHandIndex[123]$/.test(old.name))for(let j=0;j<4;j++)otherQuaternionError=Math.max(otherQuaternionError,Math.abs(old.quaternion.toArray()[j]-cur.quaternion.toArray()[j]));}}
for(const win of intervals){for(const t of [win.start-.00001,win.end,win.end+.00001]){a.pose(t);b.pose(t);endpointSkinError=Math.max(endpointSkinError,skinError());}
 const note=baseScore.notes.find(n=>n.id===win.id);for(const f of [.015,.25,.5,.8,.985]){a.pose(note.time+note.duration*f);b.pose(note.time+note.duration*f);heldSkinError=Math.max(heldSkinError,skinError());}}
assert.ok(otherQuaternionError<1e-14,'Unrelated joint changed');assert.ok(heldSkinError<1e-12,'Held skin changed');assert.ok(endpointSkinError<1e-12,'Release endpoint skin changed');
const inputFiles=['candidate/app/performance/pianist.ts','candidate/app/performance/types.ts','candidate/score.json',...modules.map(x=>`candidate/compiled/${x}.mjs`),process.env.DAYBREAK_PROJECT+'/public/assets/pianist.glb','audit-hand-surfaces.mjs','runtime.mjs','hand-shape.mjs','motion-validity.mjs','motion-local.mjs','verify-candidate.mjs'];
const report={passed:true,scope:'Only the two explicitly enabled complete160ms A4 releases with guarded240Hz actual-skin sampling, exact boundaries and own-finger held samples; existing V7 full-song defects remain.',samples:times.length,positiveControl,cleared,remainingUnchangedSevereRows:now.summary.inactiveKeyCoreHitsOver3mm,shallowIncreases,motion:{...motion,rows:undefined},invariants:{otherQuaternionError,heldSkinErrorMm:heldSkinError*1000,endpointSkinErrorMm:endpointSkinError*1000},hashes:Object.fromEntries(inputFiles.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))};
fs.writeFileSync('candidate/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log('A4_CANDIDATE_PASS');
