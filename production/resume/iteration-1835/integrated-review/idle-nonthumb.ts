import * as THREE from 'three';
import { KEY_TOP } from './piano';
import { idleNonthumbData } from './idle-nonthumb-data';

type Anchor={id:string;time:number;duration:number};
type Gap={hi:number;fi:number;previous?:string;previousEnd:number;next?:string;nextTime:number};
type Curve=Gap&{mode?:string;knots:number[][];firstTangent?:number[];lastTangent?:number[];neutralQuaternions?:number[][]};
const smooth=(x:number)=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
function matches(c:Gap,hi:number,fi:number,previous:Anchor|undefined,next:Anchor|undefined){
 return c.hi===hi&&c.fi===fi&&c.previous===previous?.id&&c.next===next?.id&&
  Math.abs(c.previousEnd-(previous?previous.time+previous.duration:0))<1e-7&&
  (!next||Math.abs(c.nextTime-next.time)<1e-7);
}
function rotate(bone:THREE.Bone,axis:THREE.Vector3,degrees:number){
 if(!degrees)return;
 const parent=bone.parent!.getWorldQuaternion(new THREE.Quaternion());
 const world=new THREE.Quaternion().setFromAxisAngle(axis,degrees*Math.PI/180);
 bone.quaternion.premultiply(parent.clone().invert().multiply(world).multiply(parent));
 bone.updateWorldMatrix(false,true);
}
// Call only from the inactive nonthumb branch, after its existing chain pose.
// Exact endpoint IDs/times bind each calibration to its measured idle interval.
export function applyIdleNonthumb(time:number,side:'L'|'R',fi:number,bones:THREE.Bone[],wrist:THREE.Bone,base:THREE.Vector3,previous:Anchor|undefined,next:Anchor|undefined){
 const hi=side==='L'?0:1;
 if(fi===1){
  const c=idleNonthumbData.supportedIndexGaps.find(c=>matches(c,hi,fi,previous,next));
  if(c){const amount=smooth((base.y-KEY_TOP-.005)/.004)*smooth((base.z-.244)/.008)*smooth((time-c.previousEnd)/.25)*smooth((c.nextTime-time)/.32);rotate(bones[0],new THREE.Vector3(1,0,0),5*amount);}
 }
 for(const c of idleNonthumbData.curves as Curve[]){
  if(!matches(c,hi,fi,previous,next)||time<=c.knots[0][0]||time>=c.knots[c.knots.length-1][0])continue;
  let index=1;while(c.knots[index][0]<time)index++;
  const a=c.knots[index-1],b=c.knots[index],dt=b[0]-a[0],u=(time-a[0])/dt,weight=smooth(u);
  if(c.mode==='blend-neutral'){
   const amount=a[1]+(b[1]-a[1])*weight;
   if(!c.neutralQuaternions||c.neutralQuaternions.length!==3)throw new Error('Missing bound neutral joint triple');
   bones.forEach((bone,j)=>{bone.quaternion.slerp(new THREE.Quaternion().fromArray(c.neutralQuaternions![j]),amount);bone.updateWorldMatrix(false,true);});
   continue;
  }
  const before=c.knots[Math.max(0,index-2)],after=c.knots[Math.min(c.knots.length-1,index+1)];
  const v=a.slice(1).map((x,j)=>{
   if(c.mode!=='hermite-controls')return x+(b[j+1]-x)*weight;
   const m0=index===1?(c.firstTangent?.[j]??0):(b[j+1]-before[j+1])/(b[0]-before[0]);
   const m1=index===c.knots.length-1?(c.lastTangent?.[j]??0):(after[j+1]-a[j+1])/(after[0]-a[0]);
   return (2*u**3-3*u*u+1)*x+(u**3-2*u*u+u)*dt*m0+(-2*u**3+3*u*u)*b[j+1]+(u**3-u*u)*dt*m1;
  }),q=wrist.getWorldQuaternion(new THREE.Quaternion());
  const lift=new THREE.Vector3(-1,0,0).applyQuaternion(q),spread=new THREE.Vector3(0,0,-1).applyQuaternion(q);
  rotate(bones[0],lift,v[0]);rotate(bones[0],spread,v[1]);rotate(bones[1],lift,v[2]);rotate(bones[2],lift,v[3]);
 }
}
