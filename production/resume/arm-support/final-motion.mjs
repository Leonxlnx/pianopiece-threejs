import fs from 'node:fs';
import {T,setup,pose,point,score,scoreBytes,modelBytes,sha} from './shared.mjs';
const base=await setup('baseline'),candidate=await setup('candidate-final'),fps=120,frames=Math.ceil(score.duration*fps),bends={L:{baseline:[],candidate:[]},R:{baseline:[],candidate:[]}},last=new Map();
let maxWristShift=0,maxFingerShift=0,maxContactDelta=0,maxFootShift=0,maxReachDeficit=0,maxWristError=0,maxElbowSpeed=0,maxArmRate=0,maxLengthVariation=0,nonfinite=0,extremes={};
for(let frame=0;frame<=frames;frame++){
 const time=Math.min(frame/fps,score.duration);pose(base,time);pose(candidate,time);
 for(const [j,h]of candidate.performer.hands.entries()){
  const bh=base.performer.hands[j],p=[h.upper,h.lower,h.wrist].map(point),bp=[bh.upper,bh.lower,bh.wrist].map(point),q=[h.upper,h.lower,h.wrist].map(b=>b.getWorldQuaternion(new T.Quaternion())),planned=candidate.performer.plannedPose(h,time),desired=planned.position;
  maxReachDeficit=Math.max(maxReachDeficit,p[0].distanceTo(desired)-h.lower.position.length()-h.wrist.position.length());maxWristError=Math.max(maxWristError,p[2].distanceTo(desired));maxWristShift=Math.max(maxWristShift,p[2].distanceTo(bp[2]));
  for(let f=0;f<5;f++)maxFingerShift=Math.max(maxFingerShift,point(h.fingers[f].tip).distanceTo(point(bh.fingers[f].tip)));
  for(const [version,hand,pts]of [['baseline',bh,bp],['candidate',h,p]])bends[h.side][version].push(pts[2].clone().sub(pts[1]).angleTo(new T.Vector3(0,1,0).applyQuaternion(hand.wrist.getWorldQuaternion(new T.Quaternion())))*180/Math.PI);
  for(let i=0;i<2;i++)maxLengthVariation=Math.max(maxLengthVariation,Math.abs(p[i].distanceTo(p[i+1])-(i===0?h.lower.position.length():h.wrist.position.length())));
  if(!p.flatMap(v=>v.toArray()).concat(q.flatMap(v=>v.toArray())).every(Number.isFinite))nonfinite++;
  const prev=last.get(h.side);if(prev&&time>prev.time){maxElbowSpeed=Math.max(maxElbowSpeed,p[1].distanceTo(prev.p[1])/(time-prev.time));maxArmRate=Math.max(maxArmRate,q[0].angleTo(prev.q[0])/(time-prev.time),q[1].angleTo(prev.q[1])/(time-prev.time));}
  last.set(h.side,{p,q,time});for(const sign of [-1,1]){const k=h.side+(sign<0?'min':'max');if(!extremes[k]||sign*p[2].x>sign*extremes[k].x)extremes[k]={x:p[2].x,time};}
 }
 for(const [j,c]of candidate.performer.contacts.entries())maxContactDelta=Math.max(maxContactDelta,Math.abs(c.error-base.performer.contacts[j].error));
 for(const word of ['Left','Right'])for(const n of ['Foot','ToeBase'])maxFootShift=Math.max(maxFootShift,point(candidate.performer.bones.get(word+n)).distanceTo(point(base.performer.bones.get(word+n))));
 if(frame%3000===0)console.log(JSON.stringify({frame,total:frames+1,maxReachDeficit,maxWristShift,maxFingerShift,maxElbowSpeed,maxArmRate}));
}
const summaries={};for(const side of ['L','R']){summaries[side]={};for(const version of ['baseline','candidate']){const values=bends[side][version].sort((a,b)=>a-b);summaries[side][version]={median:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],maximum:values.at(-1)};}}
const report={sourceSha256:sha(fs.readFileSync('candidate-final/pianist.ts')),scoreSha256:sha(scoreBytes),modelSha256:sha(modelBytes),fps,frames:frames+1,maxWristShiftMm:maxWristShift*1000,maxFingerMarkerShiftMm:maxFingerShift*1000,maxContactErrorDeltaMm:maxContactDelta*1000,maxFootMarkerShiftMm:maxFootShift*1000,maxReachDeficitMm:maxReachDeficit*1000,maxWristTargetErrorMm:maxWristError*1000,maxLengthVariationMm:maxLengthVariation*1000,maxElbowSpeedMps:maxElbowSpeed,maxArmAngularSpeedRadps:maxArmRate,nonfinite,bends:summaries,extremes};
report.passed=nonfinite===0&&maxReachDeficit<1e-6&&maxWristShift<1e-6&&maxFingerShift<.00001&&maxContactDelta<1e-6&&maxFootShift<1e-6&&maxElbowSpeed<3&&maxArmRate<20;
fs.writeFileSync('final-motion-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
