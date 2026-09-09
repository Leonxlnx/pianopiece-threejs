import fs from 'node:fs';
import {performer,update,T} from './harness.mjs';
import {evaluate} from './metrics.mjs';
const rows=[];for(let i=0;i<=100;i++){const r=evaluate(106.6+i*.010,'R');rows.push(r);}
const movement=[];let prev=null;for(let i=0;i<=1000;i++){const time=106.6+i*.001;update(time);const qs=performer.hands[1].fingers.map(f=>f.bones.map(b=>b.quaternion.clone()));if(prev)for(let fi=0;fi<5;fi++)for(let j=0;j<3;j++)movement.push({time,fi,j,v:qs[fi][j].angleTo(prev[fi][j])*1000});prev=qs;}
movement.sort((a,b)=>b.v-a.v);
const report={peak:movement.slice(0,12),activeCore:Math.max(...rows.map(r=>r.activeCore)),allCore:Math.max(...rows.map(r=>r.allCore)),palmCore:Math.max(...rows.map(r=>r.palmCore)),point:Math.max(...rows.map(r=>r.point)),contactGap:Math.max(...rows.flatMap(r=>r.contacts.map(c=>c.gap===null?999:Math.abs(c.gap)))),pairSum:rows.reduce((s,r)=>s+r.allPairs,0),crossings:rows.filter(r=>r.allPairs).map(r=>({t:r.time,c:r.crossings})),keyViolations:rows.filter(r=>r.allCore>3).map(r=>({t:r.time,core:r.keyHits})),rows};fs.writeFileSync(process.argv[2]??'candidate-report.json',JSON.stringify(report));console.log(JSON.stringify({...report,rows:undefined,crossings:report.crossings.slice(0,8),keyViolations:report.keyViolations.map(r=>({t:r.t,core:r.core.map(c=>[c.patch,c.depth])})).slice(0,8)},null,2));
