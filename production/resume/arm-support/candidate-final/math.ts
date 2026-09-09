import * as THREE from 'three';
export const clamp = (x:number,a=0,b=1) => Math.max(a,Math.min(b,x));
export const smooth = (x:number) => {const t=clamp(x);return t*t*(3-2*t);};
export const mix = (a:number,b:number,t:number) => a+(b-a)*t;
export const v3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export const rand = (i:number) => {const x=Math.sin(i*127.1+311.7)*43758.5453123;return x-Math.floor(x);};
export function scoreEnergy(time:number,sections:{start:number;end:number;energy:number}[]){
 let index=sections.findIndex(s=>time>=s.start&&time<s.end);if(index<0)index=sections.length-1;
 const section=sections[index],previous=sections[Math.max(0,index-1)];
 return section?mix(previous.energy,section.energy,smooth((time-section.start)/1.8)):.5;
}
export function segment(parent:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,r:number,mat:THREE.Material,r2=r,segments=12){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r,a.distanceTo(b),segments),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(v3(0,1,0),b.clone().sub(a).normalize());m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function placeSegment(m:THREE.Mesh,a:THREE.Vector3,b:THREE.Vector3){m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(v3(0,1,0),b.clone().sub(a).normalize());}
export function lowerBound<T>(arr:T[],time:number,get:(v:T)=>number){let a=0,b=arr.length;while(a<b){const m=(a+b)>>>1;if(get(arr[m])<time)a=m+1;else b=m;}return a;}
// Reach each authored pedal position at its acoustic event, with a short
// preparatory ankle motion. The absolute-time curve also works after seeking.
export function pedalPosition(time:number,events:{time:number;value:number}[]){
 const i=lowerBound(events,time,e=>e.time),previous=events[i-1],next=events[i];
 if(!next)return previous?.value??0;
 const value=previous?.value??0;
 const travel=Math.min(next.value>value?.070:.090,Math.max(.001,(next.time-(previous?.time??0))*.78));
 return mix(value,next.value,smooth((time-next.time+travel)/travel));
}
