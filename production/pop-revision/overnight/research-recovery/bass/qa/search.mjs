import fs from 'node:fs';
import assert from 'node:assert/strict';
import {runtime} from './runtime.mjs';
import {surfaceSampler} from './surface-sampler.mjs';
const dir=new URL('../',import.meta.url).pathname,r=await runtime(process.argv[4]??(dir+'baseline')),sample=surfaceSampler(r),n=r.score.notes.find(n=>n.id==='db00407'),times=JSON.parse(fs.readFileSync(dir+'waypoint-quick-times.json'));
const base=times.map(t=>sample(t));
const existing=JSON.parse(fs.readFileSync('/dev/shm/daybreak-bass-882c1c2d8c18/baseline-waypoint-quick.json'));
assert.deepEqual(base.filter(r=>r.keyHits.length||r.surfaceHits.length),existing.rows,'Reused runtime sampler differs from independently launched production scanner');
const candidates=JSON.parse(fs.readFileSync(process.argv[2])),results=[];
for(const [i,profile]of candidates.entries()){
 delete n.releasePose;delete n.releaseWaypoint;Object.assign(n,profile);let target=0,others=0,pairRegress=0,keyRegress=0;
 for(let j=0;j<times.length;j++){
  const row=sample(times[j]),a=base[j],ap=new Map(a.surfaceHits.map(h=>[h.a+':'+h.b,h.trianglePairs])),ak=new Map(a.keyHits.map(h=>[h.patch+':'+h.key,h.maxDepthMm]));
  for(const h of row.surfaceHits){if(h.a==='LRing'&&h.b==='LPinky')target+=h.trianglePairs;else others+=h.trianglePairs;if(h.trianglePairs>(ap.get(h.a+':'+h.b)??0))pairRegress++;}
  for(const h of row.keyHits)if(h.maxDepthMm>3&&h.maxDepthMm>(ak.get(h.patch+':'+h.key)??0)+1e-8)keyRegress++;
 }
 const row={i,profile,target,others,pairRegress,keyRegress};results.push(row);if(i%10===0||(!pairRegress&&!keyRegress))console.log(JSON.stringify(row));
}
delete n.releasePose;delete n.releaseWaypoint;assert.deepEqual(times.map(t=>sample(t)),base,'A-B-A repeat failed');
results.sort((a,b)=>(a.pairRegress+a.keyRegress)-(b.pairRegress+b.keyRegress)||a.target-b.target||a.others-b.others);
fs.writeFileSync(process.argv[3],JSON.stringify({samplerIndependentMatch:true,abaExact:true,results},null,2)+'\n');console.log(JSON.stringify(results.slice(0,12),null,2));
