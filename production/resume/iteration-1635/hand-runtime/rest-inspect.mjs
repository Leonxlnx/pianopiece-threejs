import {T,performer,pose,wp,modelUpdate,collisions} from './runtime.mjs';
pose(232);
for(const [hi,h] of performer.hands.entries()){const f=h.fingers[0];f.bones.forEach((b,j)=>{b.quaternion.copy(f.rest[j]);b.updateWorldMatrix(false,true);});modelUpdate();const q=h.wrist.getWorldQuaternion(new T.Quaternion()),inv=q.clone().invert(),w=wp(h.wrist);console.log(JSON.stringify({side:h.side,pts:[...f.bones,f.tip].map(b=>wp(b).sub(w).applyQuaternion(inv).toArray()),ownPalm:collisions(hi*6,hi*6+5).count,neighbors:[1,2,3,4].map(k=>collisions(hi*6,hi*6+k).count),cmc:f.bones[0].quaternion.toArray()}));}
