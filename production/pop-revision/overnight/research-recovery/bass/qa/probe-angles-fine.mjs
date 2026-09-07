import {runtime} from './runtime.mjs';import {surfaceSampler} from './surface-sampler.mjs';
const r=await runtime(new URL('../envelope/',import.meta.url).pathname),sample=surfaceSampler(r),n=r.score.notes.find(n=>n.id==='db00407'),t=Number(process.argv[2]),a=sample(t),map=new Map(a.surfaceHits.map(h=>[h.a+':'+h.b,h.trianglePairs]));
for(const lift of [0,1,2,3,5])for(const sweep of [0,-1,-2,-3,-4,-5]){
 n.releasePose={duration:.14,liftDegrees:lift,sweepDegrees:sweep,liftEnvelope:{riseStart:0,riseEnd:.001,fallStart:.999},sweepEnvelope:{riseStart:0,riseEnd:.001,fallStart:.999}};const b=sample(t),keys=b.keyHits.filter(h=>h.maxDepthMm>3),pairs=b.surfaceHits.filter(h=>(h.a==='LRing'&&h.b==='LPinky')||h.trianglePairs>(map.get(h.a+':'+h.b)??0));console.log(JSON.stringify({lift,sweep,keys:keys.map(h=>[h.patch,h.key,h.maxDepthMm]),pairs:pairs.map(h=>[h.a,h.b,h.trianglePairs])}));
}
