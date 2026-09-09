import fs from 'node:fs';import {T,performer,baseline,install,measure,update,keyX,keySurfaceY} from './harness.mjs';
const source=JSON.parse(fs.readFileSync('seed-score.json')),ids=['p00019','p00020','p00022','p00023','p00027'],rows=[];let best;
for(const dy of [-.004,0,.004,.008])for(const dz of [-.012,-.008,-.004,0])for(const contactZ of [.259,.263,.267]){
 const s=structuredClone(source),knots=s.wristMotion.hands.find(h=>h.side==='R').knots;for(let i=9;i<=18;i++){knots[i].position[1]+=dy;knots[i].position[2]+=dz;}
 for(const n of s.notes.filter(n=>n.hand==='R'&&n.time>=6.139898&&n.time<=10.816821)){if(n.finger!==1)n.contactZ=contactZ;}
 install(s);let core=0,ik=0,pad=0,palm=0,neighbor=0;const states=[];
 for(const id of ids){const n=s.notes.find(n=>n.id===id),m=measure(n.time+n.duration*.5,'R',{targetFinger:n.finger});const c=Math.max(0,...m.keyHits.filter(k=>k.owner===6+n.finger-1).map(k=>k.depth)),e=m.contacts.find(c=>c.midi===n.midi)?.error*1000,g=m.meshContacts.find(c=>c.id===id)?.minGap;core=Math.max(core,c);ik=Math.max(ik,e);pad=Math.max(pad,Math.abs(g??100));for(const p of m.crossings){if(p.a==='RPalm'||p.b==='RPalm')palm+=p.trianglePairs;else neighbor+=p.trianglePairs;}states.push({id,c,e,g,pairs:m.crossings.map(p=>[p.a,p.b,p.trianglePairs])});}
 const loss=Math.max(0,ik-.1)*10000+Math.max(0,pad-2.5)*1000+Math.max(0,core-3)*500+palm*100+neighbor+Math.abs(dy)*20+Math.abs(dz)*20;
 const r={dy,dz,contactZ,core,ik,pad,palm,neighbor,loss,states};rows.push(r);if(!best||loss<best.loss){best=r;fs.writeFileSync('fit-score.json',JSON.stringify(s));console.log(JSON.stringify(best));}
}
rows.sort((a,b)=>a.loss-b.loss);fs.writeFileSync('fit-report.json',JSON.stringify({best,rows},null,2));
