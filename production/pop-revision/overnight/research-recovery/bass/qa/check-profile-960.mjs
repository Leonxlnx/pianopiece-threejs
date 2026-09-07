import fs from 'node:fs';
import {runtime} from './runtime.mjs';
import {surfaceSampler} from './surface-sampler.mjs';
const r=await runtime(process.argv[2]),sample=surfaceSampler(r),n=r.score.notes.find(n=>n.id==='db00407'),profile=JSON.parse(fs.readFileSync(process.argv[3])),start=n.time+n.duration,duration=profile.releasePose?.duration??profile.releaseWaypoint.duration,end=start+Math.max(.08,duration),times=[];
for(let i=0;i<=Math.ceil((end-start+.05)*960);i++)times.push(Math.min(start-.025+i/960,end+.025));times.push(start,end,start-1e-5,end+1e-5);
const ordered=[...new Set(times)].sort((a,b)=>a-b),base=ordered.map(t=>sample(t));Object.assign(n,profile);
const regressions=[];let target=0,others=0;
for(let i=0;i<ordered.length;i++){
 const time=ordered[i],a=base[i],b=sample(time),ap=new Map(a.surfaceHits.map(h=>[h.a+':'+h.b,h.trianglePairs])),ak=new Map(a.keyHits.map(h=>[h.patch+':'+h.key,h.maxDepthMm]));
 for(const h of b.surfaceHits){if(h.a==='LRing'&&h.b==='LPinky')target+=h.trianglePairs;else others+=h.trianglePairs;if(h.trianglePairs>(ap.get(h.a+':'+h.b)??0))regressions.push({time,type:'pair',a:h.a,b:h.b,before:ap.get(h.a+':'+h.b)??0,after:h.trianglePairs});}
 for(const h of b.keyHits)if(h.maxDepthMm>3&&h.maxDepthMm>(ak.get(h.patch+':'+h.key)??0)+1e-8)regressions.push({time,type:'key',patch:h.patch,key:h.key,before:ak.get(h.patch+':'+h.key)??0,after:h.maxDepthMm});
}
console.log(JSON.stringify({profile,samples:ordered.length,target,others,regressions},null,2));
