import fs from 'node:fs';import zlib from 'node:zlib';import {score,measure,performer} from './harness.mjs';
const gaps=[];
for(const side of ['L','R'])for(let finger=1;finger<=5;finger++){const ns=score.notes.filter(n=>n.hand===side&&n.finger===finger);for(let i=1;i<ns.length;i++){const end=ns[i-1].time+ns[i-1].duration,start=ns[i].time;if(start-end>=.5&&end<160.5&&start>158.5)gaps.push({side,finger,previous:ns[i-1].id,next:ns[i].id,end,start});}}
const min=Math.min(...gaps.map(g=>g.end)),max=Math.max(...gaps.map(g=>g.start));
const times=new Set([158.6,159.3,160.1,min-.001,max+.001]);
for(let t=min;t<=max;t+=1/60)times.add(+t.toFixed(9));
for(const g of gaps)for(const t of [g.end,g.end+.22,g.start-.30,g.start])for(const dt of [-.001,0,.001])times.add(+(t+dt).toFixed(9));
for(const n of score.notes)if(n.time>min&&n.time<max)for(const t of [n.time,n.time+n.duration])for(const dt of [-.001,.001])times.add(+(t+dt).toFixed(9));
const sorted=[...times].sort((a,b)=>a-b),rows=[];
for(const [i,time] of sorted.entries()){
 for(const side of ['L','R']){const r=measure(time,side,{opposing:true});r.pose=performer.hands.find(h=>h.side===side).fingers.map(f=>f.bones.map(b=>b.quaternion.toArray()));rows.push(r);}
 if(i%200===0)console.log(i,sorted.length,time);
}
const result={gaps,min,max,times:sorted,rows};fs.writeFileSync(process.argv[2],zlib.gzipSync(JSON.stringify(result)));console.log('DONE',sorted.length,'times',rows.length,'hand states');
