import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './compiled/pianist.mjs';
import {GrandPiano} from './compiled/piano.mjs';
import {pedalPosition,mix,smooth} from './compiled/math.mjs';

// Arm IK can change its elbow branch while a separately constrained hand
// still reaches the correct key. Inspect the actual arm bones independently.
const context=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};
globalThis.self=globalThis;
const loader=new GLTFLoader();
loader.register(()=>({name:'offline-validation-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const modelBytes=fs.readFileSync('public/assets/pianist.glb');
const gltf=await loader.parseAsync(modelBytes.buffer.slice(modelBytes.byteOffset,modelBytes.byteOffset+modelBytes.byteLength),'');
const scoreBytes=fs.readFileSync(process.env.DAYBREAK_SCORE_PATH??'public/assets/score.json');
const score=JSON.parse(scoreBytes),performer=new Pianist(),piano=new GrandPiano();
await performer.load(score,gltf.scene);
const fps=120,frames=Math.ceil(score.duration*fps),last=new Map(),peaks=[],lengths={};
let maxWristTargetError=0,nonfinite=0;
const point=b=>b.getWorldPosition(new T.Vector3());
for(let frame=0;frame<=frames;frame++){
 const time=Math.min(frame/fps,score.duration);
 let i=score.sections.findIndex(s=>time>=s.start&&time<s.end);if(i<0)i=score.sections.length-1;
 const section=score.sections[i],previous=score.sections[Math.max(0,i-1)];
 const energy=mix(previous.energy,section.energy,smooth((time-section.start)/1.8)),pedal=pedalPosition(time,score.pedals);
 piano.update(time,score.notes,pedal);performer.update(time,score,piano,pedal,energy);
 for(const hand of performer.hands){
  const points=[hand.upper,hand.lower,hand.wrist].map(point),q=[hand.upper,hand.lower,hand.wrist].map(b=>b.getWorldQuaternion(new T.Quaternion()));
  const target=performer.plannedPose(hand,time).position;
  maxWristTargetError=Math.max(maxWristTargetError,target.distanceTo(points[2]));
  const lengthsNow=[points[0].distanceTo(points[1]),points[1].distanceTo(points[2])];
  if(!lengths[hand.side])lengths[hand.side]=lengthsNow.map(n=>({min:n,max:n}));
  lengthsNow.forEach((n,j)=>{lengths[hand.side][j].min=Math.min(lengths[hand.side][j].min,n);lengths[hand.side][j].max=Math.max(lengths[hand.side][j].max,n);});
  const before=last.get(hand.side);
  if(before&&time>before.time){
   const dt=time-before.time,elbowSpeed=points[1].distanceTo(before.points[1])/dt;
   const maxArmRotation=Math.max(q[0].angleTo(before.q[0]),q[1].angleTo(before.q[1]))/dt;
   peaks.push({time,hand:hand.side,elbowSpeedMps:elbowSpeed,armAngularSpeedRadps:maxArmRotation});
  }
  if(!points.flatMap(v=>v.toArray()).concat(q.flatMap(v=>v.toArray())).every(Number.isFinite))nonfinite++;
  last.set(hand.side,{time,points,q});
 }
}
const maxLengthVariationMm=Math.max(...Object.values(lengths).flat().map(n=>(n.max-n.min)*1000));
const maxElbowSpeedMps=Math.max(...peaks.map(p=>p.elbowSpeedMps));
const maxArmAngularSpeedRadps=Math.max(...peaks.map(p=>p.armAngularSpeedRadps));
const report={scoreSha256:crypto.createHash('sha256').update(scoreBytes).digest('hex'),rigSha256:crypto.createHash('sha256').update(fs.readFileSync('app/performance/pianist.ts')).digest('hex'),frameRate:fps,frames:frames+1,maxWristTargetErrorMm:maxWristTargetError*1000,maxLengthVariationMm,maxElbowSpeedMps,maxArmAngularSpeedRadps,nonfinite,lengths,fastestElbows:[...peaks].sort((a,b)=>b.elbowSpeedMps-a.elbowSpeedMps).slice(0,12),fastestArmRotations:[...peaks].sort((a,b)=>b.armAngularSpeedRadps-a.armAngularSpeedRadps).slice(0,12)};
report.reviewLimits={elbowSpeedMps:3,armAngularSpeedRadps:20,wristTargetErrorMm:1,lengthVariationMm:.001,description:'Discontinuity and reach review thresholds for this rig; not biological limits or visual approval.'};
report.passed=nonfinite===0&&maxElbowSpeedMps<3&&maxArmAngularSpeedRadps<20&&maxWristTargetError*1000<1&&maxLengthVariationMm<.001;
report.scope='Actual upper-arm, elbow and wrist transforms throughout a 120 Hz score replay. Mesh collision, appearance and live playback remain separate reviews.';
const out=process.argv[2]??'production/revision/arm-motion-audit.json';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,fastestElbows:report.fastestElbows.slice(0,3),fastestArmRotations:report.fastestArmRotations.slice(0,3)},null,2));
if(!report.passed)process.exitCode=1;
