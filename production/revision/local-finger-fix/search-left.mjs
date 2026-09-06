import fs from 'node:fs';
import * as T from '/workspace/sites/daybreak-piano-film/node_modules/three/build/three.module.js';
import {GLTFLoader} from '/workspace/sites/daybreak-piano-film/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {Pianist} from './pianist.mjs';
import {keyX,isBlack,keySurfaceY} from '../wrist-analysis/piano.mjs';
import {applyMotionPlan} from '../wrist-analysis/motion-runtime.mjs';
const root='/workspace/scratch/2e8cc8e77f98/local-finger-fix',score=JSON.parse(fs.readFileSync(root+'/baseline-score.json'));
const ctx=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));const bytes=fs.readFileSync('/workspace/scratch/2e8cc8e77f98/wrist-analysis/input-pianist.glb');const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const performer=new Pianist();await performer.load(score,gltf.scene);applyMotionPlan(performer,JSON.parse(fs.readFileSync('/workspace/scratch/2e8cc8e77f98/wrist-analysis/motion-plan.json')));const hand=performer.hands.find(h=>h.side==='L');
const n0=score.notes.find(n=>n.id==='p00513');
const lifts=Array.from({length:5},(_,i)=>{const a=score.notes.filter(n=>n.hand==='L'&&n.finger===i+1&&!isBlack(n.midi)).map(n=>n.contactLift??.002).sort((a,b)=>a-b);return a[Math.floor(a.length/2)]});
const report=[];
for(let finger=1;finger<=5;finger++) {
 const n={...n0,finger,contactLift:lifts[finger-1]},f=hand.fingers[finger-1];let worst=0,normalSpeed=0,tipSpeed=0,maxPipBeyond=-Infinity,minForward=Infinity,previous=null,maxTime=0;
 for(let t=n.time+.0001;t<n.time+n.duration;t+=.0005){
  const pose=performer.plannedPose(hand,t),base=f.bones[0].position.clone().applyQuaternion(pose.q).add(pose.position),z=performer.contactDepth(base.z,isBlack(n.midi),finger-1),target=new T.Vector3(keyX(n.midi),keySurfaceY(n.midi,z)+n.contactLift,z),shape=performer.fingerPoints(base,target,f,finger-1,pose.q);
  worst=Math.max(worst,shape.tip.distanceTo(target));maxPipBeyond=Math.max(maxPipBeyond,shape.pip.z-base.z);minForward=Math.min(minForward,base.z-target.z);
  if(previous){const speed=shape.normal.angleTo(previous.normal)/.0005;if(speed>normalSpeed){normalSpeed=speed;maxTime=t;}tipSpeed=Math.max(tipSpeed,shape.tip.distanceTo(previous.tip)/.0005);}
  previous=shape;
 }
 const ns=score.notes.filter(x=>x.hand==='L'&&x.finger===finger&&x.id!==n.id),prev=ns.filter(x=>x.time<n.time).at(-1),next=ns.find(x=>x.time>n.time);
 report.push({finger,lift:n.contactLift,worstMm:worst*1000,normalSpeedDegrees:normalSpeed*180/Math.PI,maxTime,tipSpeed,maxPipBeyondMm:maxPipBeyond*1000,minForwardMm:minForward*1000,previous:prev&&{id:prev.id,midi:prev.midi,gap:n.time-prev.time-prev.duration},next:next&&{id:next.id,midi:next.midi,gap:next.time-n.time-n.duration}});
}
fs.writeFileSync(root+'/search-left-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
