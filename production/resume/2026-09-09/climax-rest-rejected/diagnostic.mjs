import fs from 'node:fs';import {measure,performer,T} from './harness.mjs';
const results=[];
for(const time of [158.6,159.3,160.1])for(const side of ['L','R']){const r=measure(time,side);r.pose=performer.hands.find(h=>h.side===side).fingers.map(f=>f.bones.map(b=>b.quaternion.toArray()));results.push(r);console.log(time,side,'keys',r.keyHits.map(k=>[k.patch,k.midi,k.depth]),'pairs',r.crossings.map(x=>[x.a,x.b,x.trianglePairs]));}
fs.writeFileSync(process.argv[2],JSON.stringify(results,null,2));
