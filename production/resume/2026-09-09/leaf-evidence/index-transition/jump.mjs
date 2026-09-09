import {baseline,install,performer,update,T} from './harness.mjs';
const h=performer.hands[1],f=h.fingers[1];
const poses=[];for(const t of [106.82,106.895774-1e-6,106.9083,106.923274,107.241383-1e-6,107.269683]){update(t);poses.push({t,wrist:h.wrist.getWorldPosition(new T.Vector3()).toArray(),q:f.bones.map(b=>b.quaternion.toArray()),points:[...f.bones,f.tip].map(b=>b.getWorldPosition(new T.Vector3()).toArray())});}
console.log(JSON.stringify({poses,delta:poses[1].q.map((q,j)=>new T.Quaternion(...q).angleTo(new T.Quaternion(...poses[3].q[j])))},null,2));
console.log(JSON.stringify(baseline.wristMotion.hands[1].knots.filter(k=>k.time>106&&k.time<108),null,2));
