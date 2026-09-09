import {update,performer,T} from './harness.mjs';
update(159.3);
for(const h of performer.hands)for(const fi of [0,2,3]){const f=h.fingers[fi],q=h.wrist.getWorldQuaternion(new T.Quaternion());f.bones.forEach((b,j)=>{b.quaternion.copy(f.rest[j]);b.updateWorldMatrix(false,true);});const base=f.bones[0].getWorldPosition(new T.Vector3());console.log(h.side,fi+1,[...f.bones,f.tip].map(b=>b.getWorldPosition(new T.Vector3()).sub(base).applyQuaternion(q.clone().invert()).toArray().map(v=>+(v*1000).toFixed(2))), 'normal',f.palmNormal.toArray());}
