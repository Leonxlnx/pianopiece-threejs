import fs from 'node:fs';
import {baseline,install} from './harness.mjs';
import {evaluate,loss} from './metrics.mjs';
const id='p00299',old=baseline.notes.find(n=>n.id===id),times=[old.time+.012,old.time+old.duration*.5,old.time+old.duration-.012],rows=[];
for(const finger of [2,3,4,5])for(const contactZ of [.239,.252,.265,.278])for(const contactLift of [.002,.004,.006]){
 const score=structuredClone(baseline);Object.assign(score.notes.find(n=>n.id===id),{finger,contactZ,contactLift});install(score);
 const metrics=times.map(t=>evaluate(t,'R'));rows.push({finger,contactZ,contactLift,...loss(metrics),maxAllCore:Math.max(...metrics.map(r=>r.allCore)),maxPairs:Math.max(...metrics.map(r=>r.allPairs)),metrics});
}
rows.sort((a,b)=>a.loss-b.loss);fs.writeFileSync('p299-fits.json',JSON.stringify(rows));console.log(JSON.stringify(rows.slice(0,6).map(({metrics,...rest})=>rest)));
