import fs from 'node:fs';import {T,score,performer,fingers,wp,pose,contextAt} from './runtime.mjs';
const part=Number(process.argv[2]??0),parts=Number(process.argv[3]??4),fps=2000,deg=180/Math.PI,windows=JSON.parse(fs.readFileSync('fine-windows.json')).filter((w,i)=>i%parts===part),results=[];
const twist=(q,rest,axis)=>{const delta=rest.clone().invert().multiply(q);if(delta.w<0)delta.set(-delta.x,-delta.y,-delta.z,-delta.w);return 2*Math.atan2(delta.x*axis.x+delta.y*axis.y+delta.z*axis.z,delta.w);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
for(const [wi,w] of windows.entries()){
 const prev=new Map(),peaks=new Map();let maxContact=0;
 for(let frame=0;frame<=Math.ceil((w.end-w.start)*fps);frame++){
  const time=Math.min(w.start+frame/fps,w.end);pose(time);
  for(const g of fingers){const {h,f,key}=g,points=[...f.bones,f.tip].map(wp),tip=points[3],base=points[0],inv=h.wrist.getWorldQuaternion(new T.Quaternion()).invert(),localTip=tip.clone().sub(wp(h.wrist)).applyQuaternion(inv),dir=points[1].clone().sub(base).normalize().applyQuaternion(inv),a=points[1].clone().sub(base).normalize(),b=points[2].clone().sub(points[1]).normalize(),normal=a.clone().cross(b),bendSin=normal.length();normal.normalize().applyQuaternion(inv);const qs=f.bones.map(b=>b.quaternion.clone()),axis=f.bones[1].position.clone().normalize(),axial=twist(qs[0],f.rest[0],axis),old=prev.get(key);
   if(old&&time>old.time){const dt=time-old.time,speed=tip.distanceTo(old.tip)/dt,localSpeed=localTip.distanceTo(old.localTip)/dt,turns=qs.map((q,j)=>q.angleTo(old.qs[j])*deg/dt),turn=Math.max(...turns),joint=turns.indexOf(turn)+1,swing=dir.angleTo(old.dir)*deg/dt,roll=Math.abs(wrap(axial-old.axial))*deg/dt,plane=bendSin>.08&&old.bendSin>.08?normal.angleTo(old.normal)*deg/dt:null;
    let row=peaks.get(key);if(!row){row={key,tip:{value:0},joint:{value:0},roll:{value:0},plane:{value:0}};peaks.set(key,row);}
    const data={time,speed,localSpeed,turn,joint,swing,roll,plane,forward:dir.y,dorsal:Math.asin(T.MathUtils.clamp(-dir.z,-1,1))*deg,context:contextAt(g,time)};
    if(speed>row.tip.value)row.tip={value:speed,...data};if(turn>row.joint.value)row.joint={value:turn,...data};if(roll>row.roll.value)row.roll={value:roll,...data};if(plane!==null&&plane>row.plane.value)row.plane={value:plane,...data};
   }prev.set(key,{time,tip,localTip,dir,normal,bendSin,qs,axial});
  }for(const c of performer.contacts)maxContact=Math.max(maxContact,c.error);
 }
 results.push({...w,fps,maxContactMm:maxContact*1000,peaks:[...peaks.values()]});if((wi+1)%15===0)console.log(JSON.stringify({part,completed:wi+1,total:windows.length}));
}
fs.writeFileSync('refine-'+part+'.json',JSON.stringify(results,null,2));console.log(JSON.stringify({part,windows:results.length,seconds:results.reduce((s,w)=>s+w.end-w.start,0),maxTip:Math.max(...results.flatMap(w=>w.peaks.map(p=>p.tip.value))),maxJoint:Math.max(...results.flatMap(w=>w.peaks.map(p=>p.joint.value)))}));
