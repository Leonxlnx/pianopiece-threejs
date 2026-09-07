import * as THREE from 'three';
import { HAIR_RATE, HAIR_QUANTUM, HAIR_DURATION, HAIR_SAMPLES } from './hair-motion-data';

// Stateless score-time lookup: pauses and arbitrary seeks reproduce the pose.
// Dedicated hair bones only; PonytailRoot remains in its authored rest pose.
export function ponytailMotion(bones:Map<string,THREE.Bone>,rest:Map<string,THREE.Quaternion>){
 const chain=['Ponytail1','Ponytail2'].map(name=>({bone:bones.get(name),rest:rest.get(name)}));
 const delta=new THREE.Quaternion(),euler=new THREE.Euler(0,0,0,'XYZ');
 return (time:number)=>{
  const t=Math.max(0,Math.min(HAIR_DURATION,time))*HAIR_RATE;
  const a=Math.min(HAIR_SAMPLES.length/4-1,Math.floor(t)),b=Math.min(HAIR_SAMPLES.length/4-1,a+1),u=t-a;
  for(let i=0;i<chain.length;i++){
   const {bone,rest:neutral}=chain[i];if(!bone||!neutral)continue;
   const k=i*2;
   const x=(HAIR_SAMPLES[a*4+k]*(1-u)+HAIR_SAMPLES[b*4+k]*u)*HAIR_QUANTUM;
   const z=(HAIR_SAMPLES[a*4+k+1]*(1-u)+HAIR_SAMPLES[b*4+k+1]*u)*HAIR_QUANTUM;
   delta.setFromEuler(euler.set(x,0,z));bone.quaternion.copy(neutral).multiply(delta);
  }
 };
}
