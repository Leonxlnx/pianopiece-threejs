import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './pianist.mjs';
import {keyX,isBlack,keySurfaceY} from './piano.mjs';
import {lowerBound} from './math.mjs';
const root='/workspace/scratch/2e8cc8e77f98/wrist-analysis';
const ctx=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));const bytes=fs.readFileSync(root+'/input-pianist.glb');const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const score=JSON.parse(fs.readFileSync(root+'/planned-score.json')),plans=JSON.parse(fs.readFileSync(root+'/motion-plan.json'));
const p=new Pianist();await p.load(score,gltf.scene);
for(const h of p.hands)h.plan=plans.find(x=>x.side===h.side).plan.map(k=>({...k,pose:{position:new T.Vector3().fromArray(k.pose.position),q:new T.Quaternion().fromArray(k.pose.q)}}));
const quintic=x=>{const t=Math.max(0,Math.min(1,x));return t*t*t*(10+t*(-15+6*t));};
function pose(h,time){const i=lowerBound(h.plan,time,k=>k.time),a=h.plan[Math.max(0,i-1)],b=h.plan[Math.min(i,h.plan.length-1)];if(a===b)return {position:a.pose.position.clone(),q:a.pose.q.clone()};const u=quintic((time-b.moveStart)/(b.moveEnd-b.moveStart));return {position:a.pose.position.clone().lerp(b.pose.position,u),q:a.pose.q.clone().slerp(b.pose.q,u)};}
function corridor(h,pp,ns){let lo=-.61,hi=.61,invalid=0;
 for(const n of ns){const fi=n.finger-1,f=h.fingers[fi],offset=f.bones[0].position.clone().applyQuaternion(pp.q),base=offset.clone().add(pp.position),z=p.contactDepth(base.z,isBlack(n.midi),fi),y=keySurfaceY(n.midi,z)+(n.contactLift??.002),yz=(y-base.y)**2+(z-base.z)**2,total=f.lengths.reduce((a,b)=>a+b,0)-.00005,radial=total*total-yz,center=keyX(n.midi)-offset.x;
  if(radial<0){invalid++;continue;}const dx=Math.sqrt(radial);lo=Math.max(lo,center-dx);hi=Math.min(hi,center+dx);
  const min=p.fingerPoints(base,new T.Vector3(keyX(n.midi),y,z),f,fi).min+.00004;
  if(yz<min*min){const excluded=Math.sqrt(min*min-yz);if(pp.position.x<center)hi=Math.min(hi,center-excluded);else lo=Math.max(lo,center+excluded);}
 }
 return {lo,hi,invalid};
}
function maxError(h,pp,ns){let max=0;for(const n of ns){const fi=n.finger-1,f=h.fingers[fi],base=f.bones[0].position.clone().applyQuaternion(pp.q).add(pp.position),z=p.contactDepth(base.z,isBlack(n.midi),fi),target=new T.Vector3(keyX(n.midi),keySurfaceY(n.midi,z)+(n.contactLift??.002),z);max=Math.max(max,p.fingerPoints(base,target,f,fi).tip.distanceTo(target));}return max;}
const fps=120,dt=1/fps,N=Math.ceil(score.duration*fps)+1,report=[];
for(const h of p.hands){
 const frames=[];let invalid=0,empty=0;
 for(let i=0;i<N;i++){const time=Math.min(score.duration,i*dt),pp=pose(h,time),ns=h.notes.filter(n=>n.time<=time&&n.time+n.duration>time),c=corridor(h,pp,ns);invalid+=c.invalid;if(c.lo>c.hi)empty++;frames.push({time,pp,ns,...c,x:Math.max(c.lo,Math.min(c.hi,pp.position.x))});}
 // Repair only the longitudinal/vertical obstruction, with a broad, smooth
 // correction envelope. No key duration is changed by this corridor pass.
 const bad=frames.map((f,i)=>f.invalid?i:-1).filter(i=>i>=0),regions=[];
 for(const i of bad){const last=regions.at(-1);if(last&&i-last.at(-1)<12)last.push(i);else regions.push([i]);}
 const corrections=[];
 for(const region of regions){let best=null;for(let yi=-10;yi<=10;yi++)for(let zi=-10;zi<=10;zi++){
  const dy=yi*.002,dz=zi*.003;let ok=true;for(const i of region){const f=frames[i],pp={position:f.pp.position.clone().add(new T.Vector3(0,dy,dz)),q:f.pp.q};const c=corridor(h,pp,f.ns);if(c.invalid||c.lo>c.hi){ok=false;break;}}
  if(ok&&(!best||dy*dy+dz*dz<best.cost))best={dy,dz,cost:dy*dy+dz*dz};
 }if(best)corrections.push({start:frames[region[0]].time,end:frames[region.at(-1)].time,...best});}
 for(const f of frames){for(const c of corrections){const distance=Math.max(c.start-f.time,0,f.time-c.end),w=1-quintic(distance/.16);f.pp.position.y+=c.dy*w;f.pp.position.z+=c.dz*w;}const c=corridor(h,f.pp,f.ns);Object.assign(f,c);f.x=Math.max(c.lo,Math.min(c.hi,f.pp.position.x));}
 invalid=frames.reduce((s,f)=>s+f.invalid,0);empty=frames.filter(f=>f.lo>f.hi).length;
 // Forward/backward reachable intervals, exact for scalar velocity bounds.
 let feasibilityFailures=0;const vmax=1.6;
 for(let pass=0;pass<3;pass++){
  for(let i=1;i<N;i++){const a=frames[i-1],b=frames[i];b.lo=Math.max(b.lo,a.lo-vmax*dt);b.hi=Math.min(b.hi,a.hi+vmax*dt);if(b.lo>b.hi){feasibilityFailures++;b.lo=b.hi=(b.lo+b.hi)/2;}}
  for(let i=N-2;i>=0;i--){const a=frames[i+1],b=frames[i];b.lo=Math.max(b.lo,a.lo-vmax*dt);b.hi=Math.min(b.hi,a.hi+vmax*dt);if(b.lo>b.hi){feasibilityFailures++;b.lo=b.hi=(b.lo+b.hi)/2;}}
 }
 for(const f of frames)f.x=Math.max(f.lo,Math.min(f.hi,f.pp.position.x));
 // Elastic smoothing inside the hard contact corridor. The final velocity
 // passes guarantee scalar movement bounds where the corridor was feasible.
 for(let pass=0;pass<100;pass++)for(let i=1;i<N-1;i++){const f=frames[i],avg=(frames[i-1].x+frames[i+1].x)/2;f.x=Math.max(f.lo,Math.min(f.hi,f.x*.25+avg*.75));}
 for(let pass=0;pass<4;pass++){
  for(let i=1;i<N;i++){const f=frames[i],x=frames[i-1].x;f.x=Math.max(f.lo,x-vmax*dt,Math.min(f.hi,x+vmax*dt,f.x));}
  for(let i=N-2;i>=0;i--){const f=frames[i],x=frames[i+1].x;f.x=Math.max(f.lo,x-vmax*dt,Math.min(f.hi,x+vmax*dt,f.x));}
 }
 let maxE=0,maxV=0,maxA=0,last,lastV,worst={};
 for(const f of frames){f.pp.position.x=f.x;const e=maxError(h,f.pp,f.ns);if(e>maxE){maxE=e;worst={time:f.time,errorMm:e*1000,notes:f.ns.map(n=>n.id)};}if(last){const v=f.pp.position.clone().sub(last).multiplyScalar(fps);maxV=Math.max(maxV,v.length());if(lastV)maxA=Math.max(maxA,v.distanceTo(lastV)*fps);lastV=v;}last=f.pp.position;}
 report.push({hand:h.side,invalidYZ:invalid,emptyIntervals:empty,feasibilityFailures,corrections,maxErrorMm:maxE*1000,maxSpeed:maxV,maxAcceleration:maxA,worst});
 fs.writeFileSync(root+`/corridor-${h.side}.json`,JSON.stringify(frames.map(f=>[f.time,...f.pp.position.toArray(),...f.pp.q.toArray()])));
}
fs.writeFileSync(root+'/corridor-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
