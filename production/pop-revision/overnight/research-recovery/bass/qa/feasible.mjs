import fs from 'node:fs';
import {runtime} from './runtime.mjs';
import {surfaceSampler} from './surface-sampler.mjs';
const dir=new URL('../',import.meta.url).pathname,r=await runtime(dir+'envelope'),sample=surfaceSampler(r),n=r.score.notes.find(n=>n.id==='db00407'),start=n.time+n.duration,times=Array.from({length:13},(_,i)=>start+.01*(i+1)),base=times.map(t=>sample(t)),results=[];
for(let j=0;j<times.length;j++){
 const time=times[j],a=base[j],ap=new Map(a.surfaceHits.map(h=>[h.a+':'+h.b,h.trianglePairs])),ak=new Map(a.keyHits.map(h=>[h.patch+':'+h.key,h.maxDepthMm])),candidates=[];
 for(let lift=0;lift<=60;lift+=5)for(let sweep=-40;sweep<=25;sweep+=5){
  n.releasePose={duration:.14,liftDegrees:lift,sweepDegrees:sweep,liftEnvelope:{riseStart:0,riseEnd:.001,fallStart:.999},sweepEnvelope:{riseStart:0,riseEnd:.001,fallStart:.999}};
  const b=sample(time);let target=0,otherRegress=0,keyRegress=0,pairs=0;
  for(const h of b.surfaceHits){pairs+=h.trianglePairs;if(h.a==='LRing'&&h.b==='LPinky')target+=h.trianglePairs;else otherRegress+=Math.max(0,h.trianglePairs-(ap.get(h.a+':'+h.b)??0));}
  for(const h of b.keyHits)if(h.maxDepthMm>3)keyRegress+=Math.max(0,h.maxDepthMm-(ak.get(h.patch+':'+h.key)??0));
  candidates.push({lift,sweep,target,otherRegress,keyRegress,pairs,cost:target+otherRegress*3+keyRegress*1000});
 }
 const feasible=candidates.filter(c=>c.cost===0);candidates.sort((a,b)=>a.cost-b.cost||Math.abs(a.sweep)-Math.abs(b.sweep)||a.lift-b.lift);
 results.push({time,phase:time-start,feasible,best:candidates.slice(0,10)});console.log(JSON.stringify({time,feasible:feasible.length,best:candidates[0]}));
}
delete n.releasePose;
fs.writeFileSync(process.argv[2],JSON.stringify(results,null,2)+'\n');
