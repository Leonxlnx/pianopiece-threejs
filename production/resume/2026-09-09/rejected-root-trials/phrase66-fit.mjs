import fs from 'node:fs';
import {baseline,install} from './harness.mjs';
import {evaluate,loss} from './metrics.mjs';
const ids=['p00295','p00296','p00299','p00301'];const rows=[];
for(const pattern of [[1,5,4,3],[2,5,4,3],[3,5,4,3]])for(const z of [.252,.265,.278])for(const lift of [.002,.004]){
 const score=structuredClone(baseline);for(let i=0;i<ids.length;i++){const n=score.notes.find(n=>n.id===ids[i]);Object.assign(n,{finger:pattern[i],contactZ:z,contactLift:pattern[i]===1?.009:lift});}
 install(score);const metrics=ids.flatMap(id=>{const n=score.notes.find(n=>n.id===id);return [.08,.5,.92].map(f=>evaluate(n.time+n.duration*f,'R'));});rows.push({pattern,z,lift,...loss(metrics),maxAllCore:Math.max(...metrics.map(r=>r.allCore)),maxPairs:Math.max(...metrics.map(r=>r.allPairs)),metrics});
}
rows.sort((a,b)=>a.loss-b.loss);fs.writeFileSync('phrase66-fits.json',JSON.stringify(rows));console.log(JSON.stringify(rows.slice(0,5).map(({metrics,...r})=>r)));
