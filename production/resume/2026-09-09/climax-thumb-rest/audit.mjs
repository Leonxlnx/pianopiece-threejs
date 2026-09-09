import fs from 'node:fs';
import {performer,measure,update,score,T} from '../climax-nonthumb-continuity/harness.mjs';
const times=new Set([159.38365,159.5,159.66,159.795833333,163.225895,163.525895,163.825895]);
for(let i=0;i<=534;i++)times.add(159.38+i/120);
for(const n of score.notes)for(const t of[n.time,n.time+n.duration])if(t>159.38&&t<163.83)for(const d of[-1e-6,0,1e-6])times.add(t+d);
const rows=[];for(const t of [...times].sort((a,b)=>a-b)){const r=measure(t,'R',{opposing:true});r.q=performer.hands[1].fingers[0].bones.map(b=>b.quaternion.toArray());rows.push(r);}
fs.writeFileSync(process.argv[2],JSON.stringify({rows}));console.log(JSON.stringify({states:rows.length,out:process.argv[2]}));
