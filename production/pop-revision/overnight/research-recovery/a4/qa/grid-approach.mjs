import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {runtime,T} from './runtime-immutable.mjs';
import {surfaceSampler} from './surface-sampler.mjs';
import {createDorsalPalmSampler,dorsalElevationDegrees} from './hand-shape.mjs';
const r=await runtime('approach-research/baseline'),sample=surfaceSampler(r),n=r.score.notes.find(n=>n.id==='db00522'),times=JSON.parse(fs.readFileSync('approach-research/baseline/times.json'));
const original=structuredClone(n),base=times.map(t=>sample(t)),existing=JSON.parse(fs.readFileSync('approach-research/baseline/surfaces.json'));
assert.deepEqual(base.filter(r=>r.keyHits.length||r.surfaceHits.length),existing.rows,'Independent baseline CLI differs');
const dorsal=createDorsalPalmSampler(r.body,r.performer.hands),rh=r.performer.hands.find(h=>h.side==='R'),results=[],controls=JSON.parse(fs.readFileSync(process.argv[2]));
const inputFiles=[process.argv[2],'grid-approach.mjs','surface-sampler.mjs','runtime-immutable.mjs','hand-shape.mjs','approach-research/baseline/score.json','approach-research/baseline/times.json','/dev/shm/daybreak-a4-882c1c2d8c18/original-pianist.glb',...fs.readdirSync('inventory/integrated/compiled').filter(f=>f.endsWith('.mjs')).map(f=>'inventory/integrated/compiled/'+f)],hashes=()=>Object.fromEntries(inputFiles.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),before=hashes();
for(const [i,profile]of controls.entries()){
 n.approachPose=profile;let severe=0,pairRows=0,pairIncidences=0,keyRegressions=0,pairRegressions=0,maxTargetDepth=0,maxDorsal=-90,maxTipSpeed=0,previous;
 for(let j=0;j<times.length;j++){
  const row=sample(times[j]),a=base[j],keys=new Map(a.keyHits.map(h=>[h.patch+':'+h.key,h.maxDepthMm])),pairs=new Map(a.surfaceHits.map(h=>[h.a+':'+h.b+':'+h.kind,h.trianglePairs]));
  for(const h of row.keyHits){if(h.patch==='RMiddle'){maxTargetDepth=Math.max(maxTargetDepth,h.maxDepthMm);if(h.maxDepthMm>3)severe++;}if(h.maxDepthMm>3&&h.maxDepthMm>(keys.get(h.patch+':'+h.key)??0)+1e-8)keyRegressions++;}
  for(const h of row.surfaceHits){if([h.a,h.b].includes('RMiddle')){pairRows++;pairIncidences+=h.trianglePairs;}if(h.trianglePairs>(pairs.get(h.a+':'+h.b+':'+h.kind)??0))pairRegressions++;}
  const normal=dorsal.normal('R'),f=rh.fingers[2],p=f.bones.map(b=>b.getWorldPosition(new T.Vector3())),tip=f.tip.getWorldPosition(new T.Vector3());maxDorsal=Math.max(maxDorsal,dorsalElevationDegrees(p[1].clone().sub(p[0]).normalize(),normal));if(!previous)previous={time:times[j],tip};else if(times[j]-previous.time>=1/960){maxTipSpeed=Math.max(maxTipSpeed,tip.distanceTo(previous.tip)/(times[j]-previous.time));previous={time:times[j],tip};}
 }
 const record={i,profile,severe,pairRows,pairIncidences,keyRegressions,pairRegressions,maxTargetDepth,maxDorsal,maxTipSpeed,motionScope:'Quick tip check skips sub-1/960s exact-boundary neighbors; independent uniform240/960Hz gate remains required.'};assert.ok([severe,pairRows,pairIncidences,keyRegressions,pairRegressions,maxTargetDepth,maxDorsal,maxTipSpeed].every(Number.isFinite));results.push(record);
 if(i%6===0||(!keyRegressions&&!pairRegressions))console.log(JSON.stringify(record));
 fs.writeFileSync(process.argv[3],JSON.stringify({status:'RESEARCH_GRID_RUNNING; no final gate',inputHashes:before,results},null,2)+'\n');
}
delete n.approachPose;assert.deepEqual(n,original);assert.deepEqual(times.map(t=>sample(t)),base,'A-B-A state leakage');assert.deepEqual(hashes(),before,'Inputs changed during screen');results.sort((a,b)=>(a.keyRegressions+a.pairRegressions)-(b.keyRegressions+b.pairRegressions)||a.severe-b.severe||a.pairIncidences-b.pairIncidences);
fs.writeFileSync(process.argv[3],JSON.stringify({status:'RESEARCH_GRID_COMPLETE; final independent CLI and motion/held/visual gates still required',samplerIndependentMatch:true,abaExact:true,inputsUnchanged:true,inputHashes:before,results},null,2)+'\n');console.log(JSON.stringify(results.slice(0,12),null,2));
