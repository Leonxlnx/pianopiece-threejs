import fs from 'node:fs';
import {T,setup,pose,point,score,sha} from './shared.mjs';
const fps=Number(process.argv[2]??30),base=await setup('baseline'),candidate=await setup('candidate-final'),rows=[];
for(let f=0;f<=Math.ceil(score.duration*fps);f++){
 const time=Math.min(f/fps,score.duration);pose(base,time);pose(candidate,time);
 for(let j=0;j<2;j++){const row={time,side:base.performer.hands[j].side};
  for(const [version,state]of [['baseline',base],['candidate',candidate]]){
   const hand=state.performer.hands[j],wrist=point(hand.wrist),elbow=point(hand.lower),index=point(hand.fingers[1].bones[0]),middle=point(hand.fingers[2].bones[0]),pinky=point(hand.fingers[4].bones[0]);
   const forward=middle.sub(wrist).normalize(),transverse=index.sub(pinky).normalize();transverse.addScaledVector(forward,-transverse.dot(forward)).normalize();
   const normal=transverse.clone().cross(forward).normalize(),forearm=wrist.sub(elbow).normalize();
   row[version]={angleDegrees:forearm.angleTo(forward)*180/Math.PI,sidewaysDegrees:Math.atan2(Math.abs(forearm.dot(transverse)),forearm.dot(forward))*180/Math.PI,normalDegrees:Math.atan2(Math.abs(forearm.dot(normal)),forearm.dot(forward))*180/Math.PI};
  }rows.push(row);
 }
}
const summaries={};for(const side of ['L','R']){summaries[side]={};for(const version of ['baseline','candidate']){summaries[side][version]={};for(const metric of ['angleDegrees','sidewaysDegrees','normalDegrees']){const values=rows.filter(r=>r.side===side).sort((a,b)=>a[version][metric]-b[version][metric]);summaries[side][version][metric]={median:values[Math.floor(values.length*.5)][version][metric],p95:values[Math.floor(values.length*.95)][version][metric],maximum:values.at(-1)[version][metric],maximumTime:values.at(-1).time};}}}
const report={sourceSha256:sha(fs.readFileSync('candidate-final/pianist.ts')),fps,frames:Math.ceil(score.duration*fps)+1,definition:'Forearm is elbow-to-wrist. Palm forward is wrist-to-MiddleMCP. Transverse is PinkyMCP-to-IndexMCP orthogonalized to palm forward; normal is transverse cross forward. Total angle is 3D; sideways/normal are projected deviations. Rig geometric values, not biological limits.',summaries,ending:rows.slice(-2),largestRegressions:rows.sort((a,b)=>(b.candidate.angleDegrees-b.baseline.angleDegrees)-(a.candidate.angleDegrees-a.baseline.angleDegrees)).slice(0,20)};
fs.writeFileSync('final-alignment-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
