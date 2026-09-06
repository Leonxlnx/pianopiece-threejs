import fs from 'node:fs';import {T,score,performer,wp,pose} from './runtime.mjs';
const edits=[{id:'p00487',finger:4,contactLift:.003029},{id:'p00693',finger:2,contactLift:.003511}];
for(const e of edits)Object.assign(score.notes.find(n=>n.id===e.id),e);
for(const h of performer.hands)h.fingerNotes=Array.from({length:5},(_,i)=>h.notes.filter(n=>n.finger===i+1));
const windows=[{start:100.70,end:102.1},{start:152.95,end:154.1}],fps=2000,rows=[];
for(const w of windows){const prev=new Map(),maxima={};let maxContact=0;
for(let i=0;i<=Math.ceil((w.end-w.start)*fps);i++){const time=w.start+i/fps;pose(time);
for(const h of performer.hands)for(let fi=0;fi<5;fi++){const f=h.fingers[fi],key=h.side+(fi+1),tip=wp(f.tip),qs=f.bones.map(b=>b.quaternion.clone().normalize()),old=prev.get(key);if(old){const speed=tip.distanceTo(old.tip)*fps,turn=Math.max(...qs.map((q,j)=>q.angleTo(old.qs[j])))*fps*180/Math.PI;const m=maxima[key]??={speed:0,turn:0};if(speed>m.speed){m.speed=speed;m.speedAt=time;}if(turn>m.turn){m.turn=turn;m.turnAt=time;}}prev.set(key,{tip,qs});}
for(const c of performer.contacts)maxContact=Math.max(maxContact,c.error);
}rows.push({...w,fps,maxContactMm:maxContact*1000,maxima});}
fs.writeFileSync('gap-motion-check.json',JSON.stringify({edits,rows},null,2));console.log(JSON.stringify({edits,rows},null,2));
