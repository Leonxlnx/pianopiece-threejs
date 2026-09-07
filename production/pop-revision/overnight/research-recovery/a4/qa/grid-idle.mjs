import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {runtime,T} from './runtime-immutable.mjs';
import {surfaceSampler} from './surface-sampler.mjs';
import {createDorsalPalmSampler,dorsalElevationDegrees} from './hand-shape.mjs';
const r=await runtime('approach-idle/candidate'),sample=surfaceSampler(r),index=r.score.notes.find(n=>n.id==='db00518'),middle=r.score.notes.find(n=>n.id==='db00522'),arrival=structuredClone(middle.approachWaypoint),times=JSON.parse(fs.readFileSync('paired-approach/quick-times.json')),controls=JSON.parse(fs.readFileSync('approach-idle/grid-controls.json'));
delete middle.approachWaypoint;const base=times.map(t=>sample(t)),existing=JSON.parse(fs.readFileSync('paired-approach/baseline-quick.json'));assert.deepEqual(base.filter(r=>r.keyHits.length||r.surfaceHits.length),existing.rows,'New opt-in rig with flags absent differs from independent frozen baseline');
const dorsal=createDorsalPalmSampler(r.body,r.performer.hands),rh=r.performer.hands.find(h=>h.side==='R'),results=[];
const files=['grid-idle.mjs','surface-sampler.mjs','runtime-immutable.mjs','approach-idle/grid-controls.json','paired-approach/quick-times.json','approach-idle/candidate/score.json','approach-idle/candidate/compiled/pianist.mjs','/dev/shm/daybreak-a4-882c1c2d8c18/original-pianist.glb'],hash=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),before=hash();
for(const [i,profile]of controls.entries()){
 middle.approachWaypoint=structuredClone(arrival);index.idlePose=profile;let keyRegressions=0,pairRegressions=0,targetSevere=0,maxTargetDepth=0,pairIncidences=0,maxTipSpeed=0,maxDorsal=-90,previous;
 for(let j=0;j<times.length;j++){
  const row=sample(times[j]),a=base[j],keys=new Map(a.keyHits.map(h=>[h.patch+':'+h.key,h.maxDepthMm])),pairs=new Map(a.surfaceHits.map(h=>[h.a+':'+h.b+':'+h.kind,h.trianglePairs]));
  for(const h of row.keyHits){if(['RIndex','RMiddle'].includes(h.patch)){maxTargetDepth=Math.max(maxTargetDepth,h.maxDepthMm);if(h.maxDepthMm>3)targetSevere++;}if(h.maxDepthMm>3&&h.maxDepthMm>(keys.get(h.patch+':'+h.key)??0)+1e-8)keyRegressions++;}
  for(const h of row.surfaceHits){pairIncidences+=h.trianglePairs;if(h.trianglePairs>(pairs.get(h.a+':'+h.b+':'+h.kind)??0))pairRegressions++;}
  const normal=dorsal.normal('R'),tips=[];for(const fi of [1,2]){const f=rh.fingers[fi],p=f.bones.map(b=>b.getWorldPosition(new T.Vector3()));tips.push(f.tip.getWorldPosition(new T.Vector3()));maxDorsal=Math.max(maxDorsal,dorsalElevationDegrees(p[1].clone().sub(p[0]).normalize(),normal));}
  if(!previous)previous={time:times[j],tips};else if(times[j]-previous.time>=1/960){maxTipSpeed=Math.max(maxTipSpeed,...tips.map((p,k)=>p.distanceTo(previous.tips[k])/(times[j]-previous.time)));previous={time:times[j],tips};}
 }
 const result={i,profile,targetSevere,maxTargetDepth,pairIncidences,keyRegressions,pairRegressions,maxTipSpeed,maxDorsal};assert.ok([targetSevere,maxTargetDepth,pairIncidences,keyRegressions,pairRegressions,maxTipSpeed,maxDorsal].every(Number.isFinite));results.push(result);console.log(JSON.stringify(result));fs.writeFileSync('approach-idle/grid-results.json',JSON.stringify({status:'120Hz discovery only; full240Hz surfaces/960Hz motion and held/invariant checks required',inputHashes:before,results},null,2)+'\n');
}
delete index.idlePose;delete middle.approachWaypoint;assert.deepEqual(times.map(t=>sample(t)),base,'A-B-A leak');assert.deepEqual(hash(),before);results.sort((a,b)=>(a.keyRegressions+a.pairRegressions)-(b.keyRegressions+b.pairRegressions)||a.targetSevere-b.targetSevere||a.pairIncidences-b.pairIncidences);fs.writeFileSync('approach-idle/grid-results.json',JSON.stringify({status:'120Hz discovery completed; independent gates pending',independentBaselineExact:true,abaExact:true,inputsUnchanged:true,inputHashes:before,results},null,2)+'\n');
