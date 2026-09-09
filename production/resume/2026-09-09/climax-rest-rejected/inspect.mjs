import fs from 'node:fs';
import {update,performer,T,measure,score} from './harness.mjs';
update(159.3);
const out=performer.hands.map(h=>({side:h.side,wrist:h.wrist.getWorldPosition(new T.Vector3()).toArray(),wristQ:h.wrist.getWorldQuaternion(new T.Quaternion()).toArray(),fingers:h.fingers.map((f,fi)=>{
 const wristQ=h.wrist.getWorldQuaternion(new T.Quaternion()),base=f.bones[0].getWorldPosition(new T.Vector3()),active=h.fingerNotes[fi].filter(n=>n.time<=159.3&&n.time+n.duration>159.3),previous=h.fingerNotes[fi].filter(n=>n.time+n.duration<=159.3).at(-1),next=h.fingerNotes[fi].find(n=>n.time>=159.3);
 return {finger:fi+1,active,previous,next,rest:f.rest.map(q=>q.toArray()),pose:f.bones.map(b=>b.quaternion.toArray()),local:[...f.bones,f.tip].map(b=>b.getWorldPosition(new T.Vector3()).sub(base).applyQuaternion(wristQ.clone().invert()).toArray()),world:[...f.bones,f.tip].map(b=>b.getWorldPosition(new T.Vector3()).toArray()),lengths:f.lengths,palmNormal:f.palmNormal.toArray()};
})}));
fs.writeFileSync(new URL('./inspection.json',import.meta.url),JSON.stringify(out,null,2));
for(const h of out)for(const f of h.fingers)console.log(h.side,f.finger,'active',f.active.map(n=>[n.id,n.midi]),'gap',f.previous?.time+f.previous?.duration,f.next?.time,'local',f.local.map(p=>p.map(v=>+(v*1000).toFixed(1))));
for(const side of ['L','R'])console.log(JSON.stringify(measure(159.3,side)));
