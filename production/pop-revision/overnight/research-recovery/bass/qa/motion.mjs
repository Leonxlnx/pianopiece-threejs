import fs from 'node:fs';
import {runtime,T} from './runtime.mjs';
import {createDorsalPalmSampler,dorsalElevationDegrees} from './hand-shape.mjs';
import {assertFiniteMotionRow,assertFiniteMotionSummary} from './motion-validity.mjs';
const variant=process.argv[2],windows=JSON.parse(fs.readFileSync(process.argv[3])),output=process.argv[4],fps=Number(process.argv[5]??240);
if(!Number.isFinite(fps)||!Number.isInteger(fps)||fps<1||fps>1920)throw Error('Invalid bounded motion sample rate');
if(!Array.isArray(windows)||!windows.length||windows.some(w=>!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.end<=w.start))throw Error('Invalid motion windows');
const r=await runtime(variant),dorsal=createDorsalPalmSampler(r.body,r.performer.hands),rows=[];
for(const win of windows){
 const begin=win.start-.025,finish=win.end+.025;let previous,previousVelocity=[];
 const dense=Array.from({length:Math.ceil((finish-begin)*fps)+1},(_,i)=>Math.min(begin+i/fps,finish));
 const boundaries=[win.start,win.end,begin,finish],times=[...dense.filter(t=>!boundaries.some(b=>Math.abs(t-b)<1e-10)),...boundaries].sort((a,b)=>a-b);
 for(const time of times){r.pose(time);const snapshot=[];
  for(const [hi,h]of r.performer.hands.entries()){
   const normal=dorsal.normal(h.side),bones=h.fingers.map(f=>[...f.bones,f.tip].map(b=>b.getWorldPosition(new T.Vector3()))),wrist=h.wrist.getWorldPosition(new T.Vector3()),tips=bones.map(x=>x[3]),prev=previous?.[hi],step=prev?time-prev.time:null,wv=prev?wrist.clone().sub(prev.wrist).divideScalar(step):null;
   const row={id:win.id,time,hand:h.side,tipSpeeds:prev?tips.map((p,j)=>p.distanceTo(prev.tips[j])/step):[],wristSpeed:wv?.length()??0,wristAccel:previousVelocity[hi]?wv.distanceTo(previousVelocity[hi])/((step+prev.step)*.5):0,
    fingers:bones.slice(1).map((p,fi)=>({finger:fi+2,dorsal:dorsalElevationDegrees(p[1].clone().sub(p[0]).normalize(),normal),backwardMm:Math.max(0,p[1].z-p[0].z)*1000,pip:p[1].clone().sub(p[0]).angleTo(p[2].clone().sub(p[1]))*180/Math.PI})),
    bones:bones.map(ps=>ps.map(p=>p.toArray())),quaternions:h.fingers.map(f=>f.bones.map(b=>b.quaternion.toArray()))};
   assertFiniteMotionRow(row);rows.push(row);
   snapshot[hi]={time,tips,wrist,step};previousVelocity[hi]=wv;
  }
  previous=snapshot;
 }
}
const failures=rows.filter(row=>row.tipSpeeds.some(x=>x>5)||row.wristSpeed>1.5||row.wristAccel>25||row.fingers.some(f=>f.dorsal>60||f.backwardMm>3));
const report={variant,frameRate:fps,samples:rows.length/2,maxTipSpeed:Math.max(...rows.flatMap(x=>x.tipSpeeds)),maxWristSpeed:Math.max(...rows.map(x=>x.wristSpeed)),maxWristAcceleration:Math.max(...rows.map(x=>x.wristAccel)),maxDorsal:Math.max(...rows.flatMap(x=>x.fingers.map(f=>f.dorsal))),maxBackwardMm:Math.max(...rows.flatMap(x=>x.fingers.map(f=>f.backwardMm))),failures,rows};
assertFiniteMotionSummary(report);
fs.writeFileSync(output,JSON.stringify({...report,rows:undefined},null,2));console.log(JSON.stringify({...report,rows:undefined,failures:failures.map(r=>({...r,bones:undefined,quaternions:undefined}))},null,2));
