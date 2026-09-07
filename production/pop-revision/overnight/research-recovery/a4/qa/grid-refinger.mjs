import fs from 'node:fs';
import assert from 'node:assert/strict';
import {runtime,T} from './runtime-immutable.mjs';
import {surfaceSampler} from './surface-sampler.mjs';
import {createDorsalPalmSampler,dorsalElevationDegrees} from './hand-shape.mjs';
const phase=process.argv[2]??'approach',r=await runtime('fingering-research/same'),sample=surfaceSampler(r),n=r.score.notes.find(n=>n.id==='db00522'),field=phase==='approach'?'approachPose':'releasePose',at=phase==='approach'?n.time:n.time+n.duration;
const all=JSON.parse(fs.readFileSync('fingering-research/same/times.json')),times=all.filter(t=>phase==='approach'?t>=at-.225&&t<=at+.025:t>=at-.025&&t<=116.30);
const base=times.map(t=>sample(t)),same=JSON.parse(fs.readFileSync('fingering-research/same/surfaces.json')),original=JSON.parse(fs.readFileSync('fingering-research/baseline/surfaces.json')),chosen=new Set(times),oldRows=new Map(original.rows.map(r=>[r.time,r]));assert.deepEqual(base.filter(r=>r.keyHits.length||r.surfaceHits.length),same.rows.filter(r=>chosen.has(r.time)));
const dorsal=createDorsalPalmSampler(r.body,r.performer.hands),rh=r.performer.hands.find(h=>h.side==='R'),profiles=JSON.parse(fs.readFileSync(process.argv[3])),results=[];
for(const [i,profile]of profiles.entries()){
 n[field]=profile;let keyRegressions=0,pairRegressions=0,targetSevere=0,maxTargetDepth=0,pairs=0,maxDorsal=-90,maxTipSpeed=0,previous;
 for(const time of times){const row=sample(time),old=oldRows.get(time),keys=new Map((old?.keyHits??[]).map(h=>[h.patch+':'+h.key,h.maxDepthMm])),oldPairs=new Map((old?.surfaceHits??[]).map(h=>[h.a+':'+h.b+':'+h.kind,h.trianglePairs]));for(const h of row.keyHits){if(h.patch==='RIndex'){maxTargetDepth=Math.max(maxTargetDepth,h.maxDepthMm);if(h.maxDepthMm>3)targetSevere++;}if(h.maxDepthMm>3&&h.maxDepthMm>(keys.get(h.patch+':'+h.key)??0)+1e-8)keyRegressions++;}for(const h of row.surfaceHits){pairs+=h.trianglePairs;if(h.trianglePairs>(oldPairs.get(h.a+':'+h.b+':'+h.kind)??0))pairRegressions++;}
  const f=rh.fingers[1],points=f.bones.map(b=>b.getWorldPosition(new T.Vector3())),tip=f.tip.getWorldPosition(new T.Vector3());maxDorsal=Math.max(maxDorsal,dorsalElevationDegrees(points[1].clone().sub(points[0]).normalize(),dorsal.normal('R')));if(!previous)previous={time,tip};else if(time-previous.time>=1/960){maxTipSpeed=Math.max(maxTipSpeed,tip.distanceTo(previous.tip)/(time-previous.time));previous={time,tip};}
 }
 const result={i,profile,targetSevere,maxTargetDepth,pairs,keyRegressions,pairRegressions,maxDorsal,maxTipSpeed};assert.ok([targetSevere,maxTargetDepth,pairs,keyRegressions,pairRegressions,maxDorsal,maxTipSpeed].every(Number.isFinite));results.push(result);if(i%6===0||(!keyRegressions&&!pairRegressions))console.log(JSON.stringify(result));fs.writeFileSync(process.argv[4],JSON.stringify({status:'RESEARCH_GRID_RUNNING',phase,times:times.length,results},null,2)+'\n');
}
delete n[field];assert.deepEqual(times.map(t=>sample(t)),base);results.sort((a,b)=>(a.keyRegressions+a.pairRegressions)-(b.keyRegressions+b.pairRegressions)||a.targetSevere-b.targetSevere||a.pairs-b.pairs);fs.writeFileSync(process.argv[4],JSON.stringify({status:'Discovery grid only; full independent verification required',phase,times:times.length,independentBaselineExact:true,abaExact:true,results},null,2)+'\n');console.log(JSON.stringify(results.slice(0,12),null,2));
