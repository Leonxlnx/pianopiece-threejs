import fs from 'node:fs';
import {T,performer,baseline,install,measure,update,keyX} from './harness.mjs';
const s=structuredClone(baseline),mapping={71:5,67:3,64:2,62:1,69:4};
const notes=s.notes.filter(n=>n.hand==='R'&&n.time>=6.139898&&n.time<=10.816821);
for(const n of notes){n.finger=mapping[n.midi];n.contactZ=.267;n.contactLift=[.0075,.0028,.0030,.0023,.0022][n.finger-1];delete n.thumbOpposition;}
const h=performer.hands.find(h=>h.side==='R');update(6.2);
const unique=[...new Map(notes.map(n=>[n.midi,n])).values()];
const pose=performer.handPose(h,unique,.03,false),knots=s.wristMotion.hands.find(h=>h.side==='R').knots;
console.log(JSON.stringify({pose:{position:pose.position.toArray(),q:pose.q.toArray()},keys:unique.map(n=>[n.midi,keyX(n.midi),n.finger])}));
for(let i=9;i<=18;i++){knots[i].position=pose.position.toArray();knots[i].quaternion=pose.q.toArray();}
install(s);const rows=[];for(const n of notes)for(const u of [.02,.5,.98]){const m=measure(n.time+n.duration*u,'R',{targetFinger:n.finger}),core=Math.max(0,...m.keyHits.filter(k=>k.owner===6+n.finger-1).map(k=>k.depth));rows.push({id:n.id,u,core,ik:m.contacts.find(c=>c.midi===n.midi)?.error*1000,pad:m.meshContacts.find(c=>c.id===n.id),pairs:m.crossings.map(c=>[c.a,c.b,c.trianglePairs])});}
fs.writeFileSync('seed-score.json',JSON.stringify(s));fs.writeFileSync('seed-report.json',JSON.stringify({rows},null,2));console.log(JSON.stringify(rows));
