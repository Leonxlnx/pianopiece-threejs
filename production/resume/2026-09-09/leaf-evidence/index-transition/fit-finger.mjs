import fs from 'node:fs';
import {baseline,install} from './harness.mjs';
import {evaluate} from './metrics.mjs';
const times=[106.84,106.88,106.895773,106.9083,106.923275,107.05,107.15,107.241382,107.255,107.269684,107.35,107.44,107.52];
const rows=[];for(const finger of [3,4,5])for(const z of [.216,.228,.239,.250,.261,.272])for(const lift of [.002,.004,.006]){const s=structuredClone(baseline);Object.assign(s.notes.find(n=>n.id==='p00524'),{finger,contactZ:z,contactLift:lift});install(s);const samples=times.map(t=>evaluate(t,'R'));const cost=samples.reduce((a,r)=>a+r.allPairs*3+Math.max(0,r.allCore-2.8)*40+Math.max(0,r.point-.65)*1000+r.contacts.reduce((a,c)=>a+(c.gap===null?2000:Math.max(0,Math.abs(c.gap)-2.3)*200),0),0);rows.push({finger,z,lift,cost,maxPoint:Math.max(...samples.map(r=>r.point)),maxCore:Math.max(...samples.map(r=>r.allCore)),pairs:samples.reduce((a,r)=>a+r.allPairs,0),samples:samples.map(r=>({t:r.time,c:r.crossings,gap:r.contacts,core:r.keyHits}))});}
rows.sort((a,b)=>a.cost-b.cost);fs.writeFileSync('fit-finger.json',JSON.stringify(rows));console.log(JSON.stringify(rows.slice(0,10).map(({samples,...r})=>r)));console.log(JSON.stringify(rows[0].samples));
