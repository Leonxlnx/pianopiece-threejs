import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {runtime,T} from './runtime.mjs';
import {expectedShortGapWindows,assertCoverage} from './coverage.mjs';
const windows=JSON.parse(fs.readFileSync('short-gap/windows.json')),oldScore=JSON.parse(fs.readFileSync('release-seven/score.json')),newScore=JSON.parse(fs.readFileSync('short-gap/score.json')),stripped=structuredClone(newScore),releaseIds=windows.map(w=>w.releaseId);
for(const note of stripped.notes)if(releaseIds.includes(note.id)){assert.deepEqual(note.releasePose,{liftDegrees:15});delete note.releasePose;}
assert.deepEqual(stripped,oldScore,'Anything besides the two explicit release arches changed');
const coverage=assertCoverage(expectedShortGapWindows(oldScore,[['db00493','db00494'],['db00757','db00760']]),windows,JSON.parse(fs.readFileSync('short-gap/times.json')));
for(const [variant,prefix]of [['release-seven','baseline-'],['short-gap','']]){
 execFileSync(process.execPath,['audit-hand-surfaces.mjs','--project',process.env.DAYBREAK_PROJECT,'--rig',`${variant}/compiled/pianist.mjs`,'--piano',`${variant}/compiled/piano.mjs`,'--score',`${variant}/score.json`,'--out',`short-gap/${prefix}surfaces.json`,'--times','short-gap/times.json'],{stdio:'pipe'});
 execFileSync(process.execPath,['motion-batch.mjs',variant,'short-gap/windows.json',`short-gap/${prefix}motion.json`],{stdio:'pipe'});
}
execFileSync(process.execPath,['motion-batch.mjs','short-gap','short-gap/windows.json','short-gap/motion-960.json','960'],{stdio:'pipe'});
const old=JSON.parse(fs.readFileSync('short-gap/baseline-surfaces.json')),now=JSON.parse(fs.readFileSync('short-gap/surfaces.json')),oldMotion=JSON.parse(fs.readFileSync('short-gap/baseline-motion.json')),motion=JSON.parse(fs.readFileSync('short-gap/motion.json')),dense=JSON.parse(fs.readFileSync('short-gap/motion-960.json'));
assert.ok(oldMotion.maxTipSpeed>5,'Lost the positive control of inherited speed failure');assert.equal(motion.failures.length,0);assert.equal(dense.failures.length,0);assert.equal(now.summary.nonfinite,0);
assert.equal(old.rows.length,now.rows.length);let reducedPairIncidences=0;
for(let i=0;i<old.rows.length;i++){
 const a=old.rows[i],b=now.rows[i];assert.equal(a.time,b.time);const keys=new Map(a.keyHits.map(h=>[`${h.patch}:${h.key}`,h.maxDepthMm]));
 for(const h of b.keyHits)assert.ok(h.maxDepthMm<=(keys.get(`${h.patch}:${h.key}`)??0)+1e-8,'New/increased key contact at any measured depth');
 assert.deepEqual(a.keyHits.filter(h=>h.patch!=='RIndex'),b.keyHits.filter(h=>h.patch!=='RIndex'),'Unrelated key contact changed');
 const pairKey=h=>`${h.a}:${h.b}:${h.kind}`,pairs=new Map(a.surfaceHits.map(h=>[pairKey(h),h.trianglePairs]));for(const h of b.surfaceHits)assert.ok(h.trianglePairs<=(pairs.get(pairKey(h))??0),'New/increased actual skin pair');
 reducedPairIncidences+=a.surfaceHits.reduce((s,h)=>s+h.trianglePairs,0)-b.surfaceHits.reduce((s,h)=>s+h.trianglePairs,0);
}
const a=await runtime('release-seven'),b=await runtime('short-gap');let quaternionError=0,endpointSkinError=0,heldSkinError=0;
const skinError=()=>{let max=0;for(let i=0;i<a.body.geometry.attributes.position.count;i++){const p=a.body.getVertexPosition(i,new T.Vector3()).applyMatrix4(a.body.matrixWorld),q=b.body.getVertexPosition(i,new T.Vector3()).applyMatrix4(b.body.matrixWorld);max=Math.max(max,p.distanceTo(q));}return max;};
for(const row of old.rows){a.pose(row.time);b.pose(row.time);for(let i=0;i<a.body.skeleton.bones.length;i++){const old=a.body.skeleton.bones[i],cur=b.body.skeleton.bones[i];assert.equal(old.name,cur.name);if(!/^RightHandIndex[123]$/.test(old.name))for(let j=0;j<4;j++)quaternionError=Math.max(quaternionError,Math.abs(old.quaternion.toArray()[j]-cur.quaternion.toArray()[j]));}}
for(const w of windows){for(const t of [w.start-.00001,(w.start+w.end)*.5,w.end,w.end+.00001]){a.pose(t);b.pose(t);endpointSkinError=Math.max(endpointSkinError,skinError());}for(const id of [w.releaseId,w.approachId]){const n=oldScore.notes.find(n=>n.id===id);for(const f of [.015,.25,.5,.8,.985]){const t=n.time+n.duration*f;a.pose(t);b.pose(t);heldSkinError=Math.max(heldSkinError,skinError());}}}
assert.ok(quaternionError<1e-14);assert.ok(endpointSkinError<1e-12);assert.ok(heldSkinError<1e-12);
const inputs=['candidate/app/performance/pianist.ts','candidate/compiled/pianist.mjs','release-seven/score.json','short-gap/score.json',process.env.DAYBREAK_PROJECT+'/public/assets/pianist.glb','audit-hand-surfaces.mjs','runtime.mjs','hand-shape.mjs','motion-validity.mjs','coverage.mjs','motion-batch.mjs','verify-short-gap.mjs','short-gap/windows.json','short-gap/times.json'];
const report={passed:true,coverage,scope:'Both entire64ms gaps, exact held boundaries,64 actual-skin samples, uniform240Hz local motion plus960Hz motion check. Other inherited full-song collisions are outside this repair.',invariants:{quaternionError,endpointSkinErrorMm:endpointSkinError*1000,heldSkinErrorMm:heldSkinError*1000},baselinePeakTipSpeedMps:oldMotion.maxTipSpeed,candidatePeakTipSpeedMps:motion.maxTipSpeed,densePeakTipSpeedMps:dense.maxTipSpeed,actualSkinBefore:old.summary,actualSkinAfter:now.summary,reducedPairIncidences,motion:{...motion,rows:undefined},denseMotion:{...dense,rows:undefined},hashes:Object.fromEntries(inputs.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))};
fs.writeFileSync('short-gap/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log('SHORT_GAP_PASS');
