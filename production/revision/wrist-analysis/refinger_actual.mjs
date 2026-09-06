import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './pianist.mjs';
import {keyX,isBlack,keySurfaceY} from './piano.mjs';
const root='/workspace/scratch/2e8cc8e77f98/wrist-analysis';
const ctx=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));const bytes=fs.readFileSync(root+'/input-pianist.glb');const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const score=JSON.parse(fs.readFileSync(root+'/input-score.json'));
delete score.wristMotion;
const p=new Pianist();await p.load(score,gltf.scene);
function choices(vals,n){if(n===0)return [[]];return vals.flatMap((v,i)=>choices(vals.slice(i+1),n-1).map(t=>[v,...t]));}
function reachError(h,pose,notes){let max=0;for(const n of notes){const f=h.fingers[n.finger-1],base=f.bones[0].position.clone().applyQuaternion(pose.q).add(pose.position),z=p.contactDepth(base.z,isBlack(n.midi),n.finger-1),target=new T.Vector3(keyX(n.midi),keySurfaceY(n.midi,z)+(n.contactLift??.002),z),shape=p.fingerPoints(base,target,f,n.finger-1);max=Math.max(max,shape.tip.distanceTo(target));}return max;}
const plans=[],details=[],summary=[];
for(const h of p.hands){
 const offsets=h.side==='L'?[.07,.032,.008,-.022,-.055]:[-.07,-.032,-.008,.022,.055],lifts=Array.from({length:5},(_,i)=>[false,true].map(black=>{const vs=h.notes.filter(n=>n.finger===i+1&&isBlack(n.midi)===black).map(n=>n.contactLift??.002).sort((a,b)=>a-b);return vs[Math.floor(vs.length/2)]??.002;}));
 const groups=[];for(const n of h.notes){const last=groups.at(-1);if(last&&n.time-last[0].time<.045)last.push(n);else groups.push([n]);}
 let beam=[{cost:0,held:[],pose:null,parent:null,g:null,time:0,end:0}];
 for(const [gi,g] of groups.entries()){
  const time=g[0].time,incoming=[...g].sort((a,b)=>a.midi-b.midi),candidates=new Map();
  for(const prev of beam){
   const held=prev.held.filter(n=>n.time+n.duration>time+.00001),used=new Set(held.map(n=>n.finger));
   for(let combo of choices([1,2,3,4,5].filter(f=>!used.has(f)),incoming.length)){
    if(h.side==='L')combo=combo.reverse();
    const assigned=incoming.map((n,i)=>({...n,finger:combo[i],contactLift:lifts[combo[i]-1][isBlack(n.midi)?1:0]})),all=[...held,...assigned].sort((a,b)=>a.midi-b.midi);
    if(all.some((n,i)=>i>0&&(h.side==='L'?n.finger>=all[i-1].finger:n.finger<=all[i-1].finger)))continue;
    const x=all.reduce((v,n)=>v+keyX(n.midi)-offsets[n.finger-1],0)/all.length;let pose=p.handPose(h,all,x,all.some(n=>isBlack(n.midi))),error=reachError(h,pose,all);const original=h.plan[gi]?.pose;if(original){const oe=reachError(h,original,all);if(oe<error){pose=original;error=oe;}}if(prev.pose){const pe=reachError(h,prev.pose,all);if(pe<.00065){pose=prev.pose;error=pe;}}
    if(error>.00065)continue;
    let cost=prev.cost+Math.pow(error*1000,2)*100;
    if(prev.pose){
     const d=pose.position.distanceTo(prev.pose.position),angle=pose.q.angleTo(prev.pose.q),gap=Math.max(held.length?.14:.045,Math.min(.45,time-prev.end)),v=d/gap;
     cost+=d*d*85+v*v*.7+Math.pow(Math.max(0,v-.85),4)*.25+angle*angle*.15;
     if(held.length){
      let max=0;for(const u of [.25,.5,.75])max=Math.max(max,reachError(h,{position:prev.pose.position.clone().lerp(pose.position,u),q:prev.pose.q.clone().slerp(pose.q,u)},held));
      cost+=Math.pow(max*1000,2)*40;
     }
    }
    const key=all.map(n=>`${n.id}:${n.finger}`).join('|')+'@'+pose.position.toArray().map(v=>Math.round(v/.008)).join(','),state={cost,held:all,pose,parent:prev,g:assigned,time,end:Math.max(...assigned.map(n=>n.time+n.duration))};
    if(!candidates.has(key)||cost<candidates.get(key).cost)candidates.set(key,state);
   }
  }
  if(!candidates.size)throw Error(`no feasible assignment ${h.side} ${gi} ${time}`);
  beam=[...candidates.values()].sort((a,b)=>a.cost-b.cost).slice(0,100);
 }
 let state=beam[0];const plan=[];
 while(state.parent){plan.push({time:state.time,end:state.end,notes:state.g,pose:state.pose});for(const n of state.g){const old=score.notes.find(x=>x.id===n.id);if(old.finger!==n.finger)details.push({id:n.id,old:old.finger,new:n.finger});old.finger=n.finger;old.contactLift=n.contactLift;}state=state.parent;}
 plan.reverse();let coalesced=0;
 for(let i=1;i<plan.length;i++){if(plan[i].time-plan[i-1].time>.21)continue;const union=h.notes.filter(n=>n.time<=plan[i].time+.044&&n.time+n.duration>plan[i-1].time);const x=union.reduce((s,n)=>s+keyX(n.midi)-offsets[n.finger-1],0)/union.length,common=p.handPose(h,union,x,union.some(n=>isBlack(n.midi)));if(reachError(h,common,union)<.00065){plan[i-1].pose=common;plan[i].pose=common;coalesced++;}}
 plans.push({side:h.side,plan:plan.map(k=>({...k,pose:{position:k.pose.position.toArray(),q:k.pose.q.toArray()}}))});summary.push({hand:h.side,groups:plan.length,cost:beam[0].cost,coalesced});
}
fs.writeFileSync(root+'/score-actual-refingered.json',JSON.stringify(score)+'\n');fs.writeFileSync(root+'/plans-actual.json',JSON.stringify(plans,null,2));fs.writeFileSync(root+'/actual-refinger-report.json',JSON.stringify({changes:details.length,summary,details},null,2));console.log(JSON.stringify({changes:details.length,summary,cache:p.poseCache.size},null,2));
