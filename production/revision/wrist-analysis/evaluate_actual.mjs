import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './pianist.mjs';
import {keyX,isBlack,keySurfaceY} from './piano.mjs';
import {lowerBound} from './math.mjs';
const root='/workspace/scratch/2e8cc8e77f98/wrist-analysis';
const ctx=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));const bytes=fs.readFileSync(root+'/input-pianist.glb');const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const score=JSON.parse(fs.readFileSync(root+'/score-actual-refingered.json')),plans=JSON.parse(fs.readFileSync(root+'/plans-actual.json'));
const p=new Pianist();await p.load(score,gltf.scene);
for(const h of p.hands)h.plan=plans.find(x=>x.side===h.side).plan.map(k=>({...k,pose:{position:new T.Vector3().fromArray(k.pose.position),q:new T.Quaternion().fromArray(k.pose.q)}}));
const quintic=x=>{const t=Math.max(0,Math.min(1,x));return t*t*t*(10+t*(-15+6*t));};
function pose(h,time){const i=lowerBound(h.plan,time,k=>k.time),a=h.plan[Math.max(0,i-1)],b=h.plan[Math.min(i,h.plan.length-1)];if(a===b)return a.pose;const u=quintic((time-b.moveStart)/(b.moveEnd-b.moveStart));return {position:a.pose.position.clone().lerp(b.pose.position,u),q:a.pose.q.clone().slerp(b.pose.q,u)};}
function error(h,pose,n){const fi=n.finger-1,f=h.fingers[fi],base=f.bones[0].position.clone().applyQuaternion(pose.q).add(pose.position),z=p.contactDepth(base.z,isBlack(n.midi),fi),target=new T.Vector3(keyX(n.midi),keySurfaceY(n.midi,z)+(n.contactLift??.002),z),shape=p.fingerPoints(base,target,f,fi);return shape.tip.distanceTo(target);}
function continuousPedal(a,b){if(b-a<.000001)return true;let value=0;for(const e of score.pedals){if(e.time<=a)value=e.value;if(e.time>a&&e.time<b-.001&&e.value<.1)return false;}return value>.1;}
const changes=[],boundaryChanges=[],unresolved=[],protectedNotes=new Set();
for(const h of p.hands){
 for(let i=1;i<h.plan.length;i++){
  const a=h.plan[i-1],b=h.plan[i],d=a.pose.position.distanceTo(b.pose.position),angle=a.pose.q.angleTo(b.pose.q);
  const need=Math.max(.055,1.875*d/1.3,Math.sqrt(5.774*d/18),angle*1.875/5);
  b.moveEnd=b.time-.003;b.moveStart=Math.max(a.time,b.moveEnd-need);
 }
 for(let i=1;i<h.plan.length;i++){
  const a=h.plan[i-1],b=h.plan[i];
  for(const n of h.notes){
   const oldEnd=n.time+n.duration;if(n.time>=b.time||oldEnd<=b.moveStart)continue;
   let violation;
   const start=Math.max(b.moveStart,n.time+.006),end=Math.min(oldEnd-.00001,b.moveEnd);
   for(let t=start;t<=end;t+=1/360){if(error(h,pose(h,t),n)>.00075){violation=t;break;}}
   if(violation===undefined)continue;
   let release=violation-.008;
   const heldAcross=oldEnd>b.time+.020;
   if(heldAcross){protectedNotes.add(n.id);unresolved.push({id:n.id,hand:h.side,time:violation,reason:'retained-voice corridor',errorMm:error(h,pose(h,violation),n)*1000});continue;}
   let sustainEnd=oldEnd;
   if(!continuousPedal(release,oldEnd)){
    const clear=score.pedals.filter(e=>e.value<.1&&e.time<=oldEnd+.000001&&oldEnd-e.time<=.026).at(-1);
    if(clear){sustainEnd=clear.time;release=Math.min(release,sustainEnd);boundaryChanges.push({id:n.id,hand:h.side,bar:n.bar,midi:n.midi,oldEnd,newAudibleEnd:sustainEnd,advanceMs:1000*(oldEnd-sustainEnd)});n.boundaryReleaseTime=sustainEnd;}
   }
   if(release<n.time+.045||!continuousPedal(release,sustainEnd)){unresolved.push({id:n.id,hand:h.side,time:violation,reason:release<n.time+.045?'short attack':'pedal clearance',errorMm:error(h,pose(h,violation),n)*1000});continue;}
   const oldDuration=n.duration;n.writtenDuration??=oldDuration;n.duration=Number((release-n.time).toFixed(6));changes.push({id:n.id,oldDuration,duration:n.duration,release,advance:oldDuration-n.duration});
  }
 }
}
let maxV={speed:0},maxA=0,maxErr=0,maxErrorDetail={},errorFrames=0;const fps=120;
for(const h of p.hands){let last,lastV;for(let frame=0;frame<=Math.ceil(score.duration*fps);frame++){
 const time=Math.min(score.duration,frame/fps),pp=pose(h,time);
 if(last){const v=pp.position.clone().sub(last).multiplyScalar(fps);if(v.length()>maxV.speed)maxV={speed:v.length(),hand:h.side,time};if(lastV)maxA=Math.max(maxA,v.distanceTo(lastV)*fps);lastV=v;}last=pp.position;
 for(const n of h.notes){if(n.time>time||n.time+n.duration<=time)continue;const e=error(h,pp,n);if(e>maxErr){maxErr=e;maxErrorDetail={time,id:n.id,hand:n.hand,midi:n.midi,errorMm:e*1000};}if(e>.001)errorFrames++;}
}}
const serial=plans.map(old=>{const h=p.hands.find(h=>h.side===old.side);return {side:h.side,plan:h.plan.map(k=>({...k,pose:{position:k.pose.position.toArray(),q:k.pose.q.toArray()}}))};});
const report={maxWristSpeed:maxV,maxWristAcceleration:maxA,maxReachErrorMm:maxErr*1000,maxErrorDetail,errorFrames,releaseChanges:changes.length,boundaryChanges,unresolved:unresolved.length,protectedNotes:protectedNotes.size,releaseAdvanceMean:changes.reduce((v,c)=>v+c.advance,0)/changes.length,changes,unresolvedDetails:unresolved};
fs.writeFileSync(root+'/planned-score.json',JSON.stringify(score)+'\n');fs.writeFileSync(root+'/motion-plan.json',JSON.stringify(serial,null,2));fs.writeFileSync(root+'/actual-motion-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,changes:changes.slice(0,3),unresolvedDetails:unresolved.slice(0,10)},null,2));
