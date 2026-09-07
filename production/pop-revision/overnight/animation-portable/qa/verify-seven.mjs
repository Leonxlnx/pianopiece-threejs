import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {runtime,T} from './runtime.mjs';
import {expectedReleaseWindows,assertCoverage} from './coverage.mjs';
const names=['Thumb','Index','Middle','Ring','Pinky'],windows=JSON.parse(fs.readFileSync('release-seven/windows.json')),oldScore=JSON.parse(fs.readFileSync('candidate/score.json')),newScore=JSON.parse(fs.readFileSync('release-seven/score.json')),stripped=structuredClone(newScore),ids=['db00404','db00094','db00399','db00734','db00915','db00994','db00986'];
for(const note of stripped.notes)if(ids.includes(note.id)){assert.equal(note.releaseWaypoint?.enabled,true);const profile=note.releaseTravel;assert.deepEqual(note.releaseWaypoint,{enabled:true,height:profile.height,x:profile.x??0,z:profile.z??0,liftEnd:profile.liftEnd??1/3,landStart:profile.landStart??2/3,roll:profile.roll??0,duration:profile.duration??.160});delete note.releaseWaypoint;}
assert.deepEqual(stripped,oldScore,'Changed non-waypoint score fields');
const times=JSON.parse(fs.readFileSync('release-seven/times.json'));
const coverage=assertCoverage(expectedReleaseWindows(oldScore,ids),windows,times);
for(const [variant,prefix]of [['candidate','baseline-'],['release-seven','']]){
 execFileSync(process.execPath,['audit-hand-surfaces.mjs','--project',process.env.DAYBREAK_PROJECT,'--rig',`${variant}/compiled/pianist.mjs`,'--piano',`${variant}/compiled/piano.mjs`,'--score',`${variant}/score.json`,'--out',`release-seven/${prefix}surfaces.json`,'--times','release-seven/times.json'],{stdio:'pipe'});
 execFileSync(process.execPath,['motion-batch.mjs',variant,'release-seven/windows.json',`release-seven/${prefix}motion.json`],{stdio:'pipe'});
}
const old=JSON.parse(fs.readFileSync('release-seven/baseline-surfaces.json')),now=JSON.parse(fs.readFileSync('release-seven/surfaces.json')),motion=JSON.parse(fs.readFileSync('release-seven/motion.json'));
assert.equal(motion.failures.length,0,'Motion/shape failures');assert.equal(now.summary.nonfinite,0);assert.equal(old.rows.length,times.length);assert.equal(now.rows.length,times.length);
const statistics=Object.fromEntries(windows.map(w=>[w.id,{id:w.id,baselineTargetPairIncidences:0,candidateTargetPairIncidences:0,clearedSevereKeys:0,shallowIncreases:[]}]));
for(let i=0;i<times.length;i++){
 const a=old.rows[i],b=now.rows[i];assert.equal(a.time,b.time);const win=windows.find(w=>a.time>=w.start-.025001&&a.time<=w.end+.025001);assert.ok(win);const patch=win.hand+names[win.finger-1],stat=statistics[win.id];
 const key=h=>`${h.patch}:${h.key}`,ak=new Map(a.keyHits.map(h=>[key(h),h])),bk=new Map(b.keyHits.map(h=>[key(h),h]));
 for(const h of a.keyHits)if(h.maxDepthMm>3&&(bk.get(key(h))?.maxDepthMm??0)<=3)stat.clearedSevereKeys++;
 for(const h of b.keyHits){const before=ak.get(key(h))?.maxDepthMm??0;if(h.maxDepthMm>3)assert.ok(h.maxDepthMm<=before+1e-8,'Introduced/worsened severe key');if(h.maxDepthMm>before+1e-8)stat.shallowIncreases.push({time:b.time,key:h.key,patch:h.patch,beforeMm:before,afterMm:h.maxDepthMm});}
 assert.deepEqual(a.keyHits.filter(h=>h.patch!==patch),b.keyHits.filter(h=>h.patch!==patch),'Unrelated key-hit geometry changed');
 const keyPair=h=>`${h.a}:${h.b}:${h.kind}`,ap=new Map(a.surfaceHits.map(h=>[keyPair(h),h.trianglePairs]));
 for(const h of b.surfaceHits)assert.ok(h.trianglePairs<=(ap.get(keyPair(h))??0),'Introduced/increased patch-pair incidences');
 stat.baselineTargetPairIncidences+=a.surfaceHits.filter(h=>[h.a,h.b].includes(patch)).reduce((sum,h)=>sum+h.trianglePairs,0);
 stat.candidateTargetPairIncidences+=b.surfaceHits.filter(h=>[h.a,h.b].includes(patch)).reduce((sum,h)=>sum+h.trianglePairs,0);
}
for(const stat of Object.values(statistics)){assert.ok(stat.baselineTargetPairIncidences>0,'Baseline positive control absent');assert.equal(stat.candidateTargetPairIncidences,0,'Target pair remains');}
const a=await runtime('candidate'),b=await runtime('release-seven');let quaternionError=0,endpointSkinError=0,heldSkinError=0;
const skinError=()=>{let max=0;for(let i=0;i<a.body.geometry.attributes.position.count;i++){const p=a.body.getVertexPosition(i,new T.Vector3()).applyMatrix4(a.body.matrixWorld),q=b.body.getVertexPosition(i,new T.Vector3()).applyMatrix4(b.body.matrixWorld);max=Math.max(max,p.distanceTo(q));}return max;};
for(const time of times){const win=windows.find(w=>time>=w.start-.025001&&time<=w.end+.025001),allowed=new Set([1,2,3].map(j=>(win.hand==='L'?'Left':'Right')+'Hand'+names[win.finger-1]+j));a.pose(time);b.pose(time);for(let i=0;i<a.body.skeleton.bones.length;i++){const old=a.body.skeleton.bones[i],now=b.body.skeleton.bones[i];assert.equal(old.name,now.name);if(!allowed.has(old.name))for(let j=0;j<4;j++)quaternionError=Math.max(quaternionError,Math.abs(old.quaternion.toArray()[j]-now.quaternion.toArray()[j]));}}
for(const win of windows){for(const t of [win.start-.00001,win.end,win.end+.00001]){a.pose(t);b.pose(t);endpointSkinError=Math.max(endpointSkinError,skinError());}const note=oldScore.notes.find(n=>n.id===win.id);for(const f of [.015,.25,.5,.8,.985]){const t=note.time+note.duration*f;a.pose(t);b.pose(t);heldSkinError=Math.max(heldSkinError,skinError());}}
assert.ok(quaternionError<1e-14);assert.ok(endpointSkinError<1e-12);assert.ok(heldSkinError<1e-12);
const inputs=['candidate/app/performance/pianist.ts','candidate/compiled/pianist.mjs','candidate/score.json','release-seven/score.json',process.env.DAYBREAK_PROJECT+'/public/assets/pianist.glb','audit-hand-surfaces.mjs','runtime.mjs','hand-shape.mjs','motion-validity.mjs','coverage.mjs','motion-batch.mjs','verify-seven.mjs','release-seven/windows.json','release-seven/times.json'];
const report={passed:true,scope:'Seven guarded finite release intervals,385 actual-skin samples and364240Hz motion samples; selected targets improve with inherited unrelated failures retained.',coverage,statistics:Object.values(statistics),invariants:{quaternionError,endpointSkinErrorMm:endpointSkinError*1000,heldSkinErrorMm:heldSkinError*1000},before:old.summary,after:now.summary,motion:{...motion,rows:undefined},hashes:Object.fromEntries(inputs.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))};
fs.writeFileSync('release-seven/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log('SEVEN_RELEASES_PASS');
