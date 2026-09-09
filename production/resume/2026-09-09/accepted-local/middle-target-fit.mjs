import fs from 'node:fs';
import {T,performer,measure,update} from './harness.mjs';
let target=null;
const original=performer.update.bind(performer);
performer.update=(...args)=>{original(...args);if(!target)return;const h=performer.hands[1],f=h.fingers[2],base=f.bones[0].getWorldPosition(new T.Vector3()),q=h.wrist.getWorldQuaternion(new T.Quaternion()),shape=performer.fingerPoints(base,new T.Vector3(...target),f,2,q),points=[base,shape.pip,shape.dip,shape.tip];for(let j=0;j<3;j++){const dir=points[j+1].clone().sub(points[j]).normalize(),normal=shape.normal,w=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]),parent=f.bones[j].parent.getWorldQuaternion(new T.Quaternion());f.bones[j].quaternion.copy(parent.invert().multiply(w));f.bones[j].updateWorldMatrix(false,true);}};
const rows=[];
for(const x of [.095,.103,.111,.119,.127,.135])for(const y of [.758,.764,.770,.776,.782])for(const z of [.207,.219,.231,.243,.255]){
 target=[x,y,z];const r=measure(12.53,'R',{targetFinger:3,opposing:true}),cross=r.crossings.filter(c=>c.a==='RMiddle'||c.b==='RMiddle'),pairs=cross.reduce((n,c)=>n+c.trianglePairs,0),core=Math.max(0,...r.keyHits.filter(h=>h.patch==='RMiddle').map(h=>h.depth)),f=performer.hands[1].fingers[2],points=[...f.bones,f.tip].map(b=>b.getWorldPosition(new T.Vector3()).toArray());
 const peak=Math.max(...points.map(p=>p[1]))-points[0][1],score=pairs*100+Math.max(0,core-2.8)*1000+Math.max(0,peak-.030)*10000+Math.abs(y-.768)*20;
 rows.push({target:[...target],pairs,core,peak,score,cross:cross.map(c=>({a:c.a,b:c.b,n:c.trianglePairs})),points,q:f.bones.map(b=>b.quaternion.toArray())});
}
rows.sort((a,b)=>a.score-b.score);fs.writeFileSync('middle-target-fits.json',JSON.stringify(rows));console.log(JSON.stringify({clear:rows.filter(r=>r.pairs===0&&r.core<=3).length,best:rows.slice(0,8)},null,2));
