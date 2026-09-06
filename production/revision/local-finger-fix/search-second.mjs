import fs from 'node:fs';
import * as T from '/workspace/sites/daybreak-piano-film/node_modules/three/build/three.module.js';
import {GLTFLoader} from '/workspace/sites/daybreak-piano-film/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {Pianist} from '../wrist-analysis/pianist.mjs';
import {keyX,isBlack,keySurfaceY} from '../wrist-analysis/piano.mjs';
import {applyMotionPlan} from '../wrist-analysis/motion-runtime.mjs';
const root='/workspace/scratch/2e8cc8e77f98/local-finger-fix',score=JSON.parse(fs.readFileSync(root+'/baseline-score.json'));
const ctx=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));const bytes=fs.readFileSync('/workspace/scratch/2e8cc8e77f98/wrist-analysis/input-pianist.glb');const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const performer=new Pianist();await performer.load(score,gltf.scene);applyMotionPlan(performer,JSON.parse(fs.readFileSync('/workspace/scratch/2e8cc8e77f98/wrist-analysis/motion-plan.json')));const hand=performer.hands.find(h=>h.side==='R');
const region=score.notes.filter(n=>n.hand==='R'&&n.time<86.8&&n.time+n.duration>82.8),ids=['p00391','p00395','p00396'];
const lifts=Array.from({length:5},(_,i)=>[false,true].map(black=>{const vs=score.notes.filter(n=>n.hand==='R'&&n.finger===i+1&&isBlack(n.midi)===black).map(n=>n.contactLift??.002).sort((a,b)=>a-b);return vs[Math.floor(vs.length/2)]??.002;}));
function target(n,t){const pose=performer.plannedPose(hand,t),f=hand.fingers[n.finger-1],base=f.bones[0].position.clone().applyQuaternion(pose.q).add(pose.position),z=performer.contactDepth(base.z,isBlack(n.midi),n.finger-1);return {base,target:new T.Vector3(keyX(n.midi),keySurfaceY(n.midi,z)+(n.contactLift??.002),z),f};}
function error(n){let worst=0,badPip=0;for(const fraction of [.015,.1,.25,.5,.75,.9,.985]){const {base,target:tp,f}=target(n,n.time+n.duration*fraction),shape=performer.fingerPoints(base,tp,f,n.finger-1);worst=Math.max(worst,shape.tip.distanceTo(tp));if(n.finger>1)badPip=Math.max(badPip,shape.pip.z-base.z+.003);}return {worst,badPip};}
function check(ns){let worst=0,peakMean=0,peakCubic=0,problems=[];for(let i=0;i<ns.length;i++){const a=ns[i];for(const b of ns.slice(i+1)){if(a.time+a.duration>b.time+.000001&&b.time+b.duration>a.time+.000001){if(a.finger===b.finger||(a.midi-b.midi)*(a.finger-b.finger)<0)return null;}}const e=error(a);worst=Math.max(worst,e.worst);if(e.badPip>.005)return null;}
 for(let fi=1;fi<=5;fi++){const fn=ns.filter(n=>n.finger===fi);for(let i=1;i<fn.length;i++){const a=fn[i-1],b=fn[i],gap=b.time-a.time-a.duration;if(gap>.4||a.midi===b.midi)continue;const d=target(a,a.time+a.duration-.00001).target.distanceTo(target(b,b.time+.00001).target);peakMean=Math.max(peakMean,d/gap);peakCubic=Math.max(peakCubic,1.5*d/gap);if(d/gap>1.5)problems.push({from:a.id,to:b.id,gap,d,mean:d/gap});}}
 return {worst,peakMean,peakCubic,problems};}
const baseline=check(region),candidates=[];
for(let a=1;a<=5;a++)for(let b=1;b<=4;b++)for(let c=b+1;c<=5;c++){
 const assignment=[a,b,c],ns=region.map(n=>{const i=ids.indexOf(n.id);if(i<0)return {...n};const finger=assignment[i];return {...n,finger,contactLift:finger===n.finger?n.contactLift:lifts[finger-1][isBlack(n.midi)?1:0]};});
 const result=check(ns);if(!result||result.worst>.001)continue;const changes=ns.filter(n=>{const original=region.find(x=>x.id===n.id);return n.finger!==original.finger;}).map(n=>({id:n.id,finger:n.finger,contactLift:n.contactLift}));candidates.push({assignment,changes,...result});
}
candidates.sort((a,b)=>a.peakMean-b.peakMean||a.changes.length-b.changes.length);const report={baseline,candidates:candidates.slice(0,20)};fs.writeFileSync(root+'/search-second-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
