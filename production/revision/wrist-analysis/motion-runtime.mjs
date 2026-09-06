import * as THREE from 'three';
import {lowerBound} from './math.mjs';

export function applyMotionPlan(performer,data){
 const byHand=new Map(data.map(h=>[h.side,h.plan.map(k=>({...k,pose:{position:new THREE.Vector3().fromArray(k.pose.position),q:new THREE.Quaternion().fromArray(k.pose.q)}}))]));
 performer.plannedPose=(hand,time)=>{
  const plan=byHand.get(hand.side),index=lowerBound(plan,time,k=>k.time),a=plan[Math.max(0,index-1)],b=plan[Math.min(index,plan.length-1)];
  if(a===b)return {position:a.pose.position.clone(),q:a.pose.q.clone()};
  const t=Math.max(0,Math.min(1,(time-b.moveStart)/Math.max(.000001,b.moveEnd-b.moveStart))),u=t*t*t*(10+t*(-15+6*t));
  return {position:a.pose.position.clone().lerp(b.pose.position,u),q:a.pose.q.clone().slerp(b.pose.q,u)};
 };
}
