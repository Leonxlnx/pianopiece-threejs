import fs from 'node:fs';
import {T,setup,pose,point,score,sha} from './shared.mjs';
const state=await setup('candidate-final'),eps=1e-6;
const names=['Hips','Head','LeftShoulder','RightShoulder','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand','LeftFoot','RightFoot'];
const times=[...new Set(score.notes.flatMap(n=>[-.55,-.09,0,n.duration,.6,1].map(offset=>n.time+offset)).concat(score.harmony.map(b=>b.time),score.sections.map(s=>s.start),[0,score.duration]))].filter(t=>t>eps&&t<score.duration-eps).sort((a,b)=>a-b);
const snapshot=t=>{pose(state,t);return names.map(name=>({name,p:point(state.performer.bones.get(name)),q:state.performer.bones.get(name).getWorldQuaternion(new T.Quaternion()).normalize()}));};
let maximumMm=0,maximumRotationDegrees=0,maxDeterminismPosition=0,maxDeterminismRotation=0,worst=null;
for(const [j,time]of times.entries()){
 const a=snapshot(time-eps),b=snapshot(time+eps);for(let i=0;i<names.length;i++){const d=a[i].p.distanceTo(b[i].p)*1000,q=a[i].q.angleTo(b[i].q)*180/Math.PI;if(d>maximumMm){maximumMm=d;worst={time,bone:names[i],distanceMm:d};}maximumRotationDegrees=Math.max(maximumRotationDegrees,q);}
 if(j%17===0){const first=snapshot(time);snapshot(score.duration*.7541);snapshot(.013);const second=snapshot(time);for(let i=0;i<names.length;i++){maxDeterminismPosition=Math.max(maxDeterminismPosition,first[i].p.distanceTo(second[i].p));maxDeterminismRotation=Math.max(maxDeterminismRotation,first[i].q.angleTo(second[i].q));}}
 if(j%1000===0)console.log(JSON.stringify({done:j,total:times.length,maximumMm,maximumRotationDegrees}));
}
const report={sourceSha256:sha(fs.readFileSync('candidate-final/pianist.ts')),epsilonSeconds:eps,boundaries:times.length,boundaryEvaluations:times.length*2,determinismSamples:Math.ceil(times.length/17),maximumMm,maximumRotationDegrees,maxDeterminismPositionMm:maxDeterminismPosition*1000,maxDeterminismRotationRad:maxDeterminismRotation,worst};
report.passed=maximumMm<.02&&maximumRotationDegrees<.01&&maxDeterminismPosition<1e-8&&maxDeterminismRotation<1e-6;fs.writeFileSync('final-continuity-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
