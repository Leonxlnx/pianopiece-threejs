import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './pianist.mjs';
import {keyX,isBlack,keySurfaceY} from './piano.mjs';
import {lowerBound,smooth} from './math.mjs';
const root='/workspace/scratch/2e8cc8e77f98/wrist-analysis';
const ctx=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bytes=fs.readFileSync('/workspace/sites/daybreak-piano-film/public/assets/pianist.glb');
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const score=JSON.parse(fs.readFileSync(process.argv[2]??'/workspace/sites/daybreak-piano-film/public/assets/score.json'));
const p=new Pianist();await p.load(score,gltf.scene);
fs.writeFileSync(root+(process.argv[2]?'/plans-refingered.json':'/plans.json'),JSON.stringify(p.hands.map(h=>({side:h.side,plan:h.plan.map(k=>({...k,pose:{position:k.pose.position.toArray(),q:k.pose.q.toArray()}})),fingers:h.fingers.map(f=>({offset:f.bones[0].position.toArray(),lengths:f.lengths}))})),null,2));
function reachError(h,pose,time){let max=0;for(const n of h.notes){if(n.time>time||n.time+n.duration<=time)continue;const f=h.fingers[n.finger-1],base=f.bones[0].position.clone().applyQuaternion(pose.q).add(pose.position),z=p.contactDepth(base.z,isBlack(n.midi),n.finger-1),target=new T.Vector3(keyX(n.midi),keySurfaceY(n.midi,z)+(n.contactLift??.002),z),shape=p.fingerPoints(base,target,f,n.finger-1);max=Math.max(max,shape.tip.distanceTo(target));}return max;}
const reports={};
for(const mode of ['original','onset','widened']){
 let worstV={speed:0},maxError=0,errorFrames=0;const fps=120;
 for(const h of p.hands){let prev;
  for(let i=0;i<=Math.ceil(score.duration*fps);i++){
   const time=Math.min(score.duration,i/fps),index=lowerBound(h.plan,time,k=>k.time),a=h.plan[Math.max(0,index-1)],b=h.plan[Math.min(index,h.plan.length-1)];
   let pose;
   if(mode==='original')pose=p.plannedPose(h,time);
   else {const begin=mode==='onset'?a.time:Math.max(a.time,b.time-.25),u=a===b?0:smooth((time-begin)/Math.max(.001,b.time-begin));pose={position:a.pose.position.clone().lerp(b.pose.position,u),q:a.pose.q.clone().slerp(b.pose.q,u)};}
   if(prev){const speed=pose.position.distanceTo(prev)*fps;if(speed>worstV.speed)worstV={time,hand:h.side,speed};}prev=pose.position;
   const error=reachError(h,pose,time);maxError=Math.max(maxError,error);if(error>.001)errorFrames++;
  }
 }
 reports[mode]={worstV,maxErrorMm:maxError*1000,errorFrames};
}
fs.writeFileSync(root+(process.argv[2]?'/experiment-refingered.json':'/experiment.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
