import fs from 'node:fs';import {runtime} from './runtime.mjs';import {surfaceSampler} from './surface-sampler.mjs';
const r=await runtime(new URL('../joint-roll/',import.meta.url).pathname),sample=surfaceSampler(r),n=r.score.notes.find(n=>n.id==='db00407'),times=[90.40695833333332,90.40799999999999],a=times.map(t=>sample(t)),profile=JSON.parse(fs.readFileSync(new URL('../joint-path-selected-3.json',import.meta.url)));
for(const roll of [-20,-15,-10,-5,5,10,15,20]){
 Object.assign(n,structuredClone(profile));for(const knot of n.releasePose.jointPath)knot.roll=knot.at===0||knot.at===1?0:roll;
 console.log('ROLL',roll);for(let i=0;i<times.length;i++){const b=sample(times[i]),map=new Map(a[i].surfaceHits.map(h=>[h.a+':'+h.b,h.trianglePairs]));console.log(JSON.stringify({time:times[i],keys:b.keyHits.filter(h=>h.maxDepthMm>3).map(h=>[h.patch,h.key,h.maxDepthMm]),pairs:b.surfaceHits.filter(h=>(h.a==='LRing'&&h.b==='LPinky')||h.trianglePairs>(map.get(h.a+':'+h.b)??0)).map(h=>[h.a,h.b,h.trianglePairs])}));}
}
