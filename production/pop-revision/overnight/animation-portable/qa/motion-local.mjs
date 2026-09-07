import fs from 'node:fs';
import {runtime,T} from './runtime.mjs';
import {createDorsalPalmSampler,dorsalElevationDegrees} from './hand-shape.mjs';
import {assertFiniteMotionRow,assertFiniteMotionSummary} from './motion-validity.mjs';
const variants=process.argv.slice(2);if(!variants.length)variants.push('v7','candidate');
const results={};
for(const variant of variants){
 const r=await runtime(variant),dorsal=createDorsalPalmSampler(r.body,r.performer.hands),rows=[];
 for(const id of ['db00440','db00956']){
  const n=r.score.notes.find(n=>n.id===id),end=n.time+n.duration,begin=end-.025,finish=end+.185;
  let previous,velocity,previousStep;
  for(let i=0;i<=Math.ceil((finish-begin)*240);i++){
   const time=Math.min(begin+i/240,finish);r.pose(time);const h=r.performer.hands.find(h=>h.side==='R'),normal=dorsal.normal('R');
   const bones=h.fingers.map(f=>[...f.bones,f.tip].map(b=>b.getWorldPosition(new T.Vector3()))),wrist=h.wrist.getWorldPosition(new T.Vector3());
   const tips=bones.map(x=>x[3]),step=previous?time-previous.time:null;
   const wv=previous?wrist.clone().sub(previous.wrist).divideScalar(step):null;
   const row={id,time,tipSpeeds:previous?tips.map((p,j)=>p.distanceTo(previous.tips[j])/step):[],wristSpeed:wv?.length()??0,wristAccel:velocity?wv.distanceTo(velocity)/((step+previousStep)*.5):0,
    fingers:bones.slice(1).map((p,fi)=>({finger:fi+2,dorsal:dorsalElevationDegrees(p[1].clone().sub(p[0]).normalize(),normal),backwardMm:Math.max(0,p[1].z-p[0].z)*1000,pip:p[1].clone().sub(p[0]).angleTo(p[2].clone().sub(p[1]))*180/Math.PI})),
    bones:bones.map(ps=>ps.map(p=>p.toArray())),quaternions:h.fingers.map(f=>f.bones.map(b=>b.quaternion.toArray()))};
   assertFiniteMotionRow(row);rows.push(row);previous={time,tips,wrist};velocity=wv;previousStep=step;
  }
 }
 const report={variant,samples:rows.length,maxTipSpeed:Math.max(...rows.flatMap(x=>x.tipSpeeds)),maxWristSpeed:Math.max(...rows.map(x=>x.wristSpeed)),maxWristAcceleration:Math.max(...rows.map(x=>x.wristAccel)),maxDorsal:Math.max(...rows.flatMap(x=>x.fingers.map(f=>f.dorsal))),maxBackwardMm:Math.max(...rows.flatMap(x=>x.fingers.map(f=>f.backwardMm))),rows};
 assertFiniteMotionSummary(report);
 fs.writeFileSync(`${variant}/motion-local.json`,JSON.stringify(report,null,2));results[variant]={...report,rows:undefined};
}
console.log(JSON.stringify(results,null,2));
