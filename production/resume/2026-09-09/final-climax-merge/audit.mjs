import fs from 'node:fs';import zlib from 'node:zlib';import{measure,performer}from'./harness.mjs';
const times=JSON.parse(fs.readFileSync(new URL('times.json',import.meta.url)));const rows=[];
for(const time of times){for(const side of['L','R']){const r=measure(time,side,{opposing:true});r.pose=performer.hands.find(h=>h.side===side).fingers.map(f=>f.bones.map(b=>b.quaternion.toArray()));rows.push(r);}}
fs.writeFileSync(process.argv[2],zlib.gzipSync(JSON.stringify({times,min:times[0],max:times.at(-1),rows})));console.log(JSON.stringify({times:times.length,states:rows.length,output:process.argv[2]}));
