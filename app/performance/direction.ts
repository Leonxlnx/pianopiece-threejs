import * as THREE from 'three';
import { v3, smooth, mix, clamp } from './math';
import type { Score } from './types';
export interface Shot { start:number;end:number;name:string;from:THREE.Vector3;to:THREE.Vector3;look:THREE.Vector3;lookTo:THREE.Vector3;fov:number;fovTo:number; }
const vec=(a:number[])=>v3(...a as [number,number,number]);
export class Direction {
 shots:Shot[]=[]; name='First light'; override=-1; reduce=false;
 constructor(score:Score){
 // Cuts land on phrase boundaries. Each shot has one simple motivated movement.
 const atBar=(bar:number)=>score.harmony?.find(h=>h.bar===bar)?.time??((bar-1)*240/score.bpm);
 const plan:[number,string,number[],number[],number[],number,number][]=[
 [atBar(1),'First light',[3.35,1.91,3.4],[2.75,1.62,2.9],[0,.76,-.58],38,39],
 [atBar(5),'A window opens',[1.84,1.32,.93],[1.65,1.24,.70],[0,.91,.28],40,43],
 [atBar(9),'Hands · the theme',[.55,1.34,.43],[.39,1.29,.46],[.07,.753,.16],43,41],
 [atBar(13),'The answering phrase',[-1.93,1.27,1.49],[-1.64,1.35,1.34],[0,.95,.27],42,42],
 [atBar(17),'Room to breathe',[2.442,1.074,1.268],[3.136,1.555,2.097],[0,.76,-.3],45,43],
 [atBar(21),'Across the strings',[1.48,2.75,-.54],[1.75,2.34,.30],[0,.77,-.53],43,41],
 [atBar(25),'A little farther',[3.48,1.27,2.37],[2.65,1.68,2.92],[0,.8,-.45],43,40],
 [atBar(29),'Daybreak · touch',[.46,1.27,.61],[.8,1.20,.39],[.10,.765,.145],39,40],
 [atBar(33),'Daybreak',[-2.16,1.74,1.51],[-2.82,1.59,1.6],[0,.86,-.12],43,43],
 [atBar(37),'The inner voice',[.73,1.31,-.34],[.89,1.35,-.24],[0,1.15,.65],40,40],
 [atBar(41),'What the night kept',[1.79,1.20,.85],[1.68,1.16,1.12],[0,.88,.29],43,42],
 [atBar(45),'Left hand · response',[-.78,1.05,.53],[-.47,1.13,.68],[-.20,.744,.15],40,40],
 [atBar(49),'A quieter answer',[-1.85,1.12,1.04],[-2.31,1.38,1.91],[0,.83,.06],44,42],
 [atBar(53),'The light returns',[2.88,1.57,2.73],[3.22,1.85,2.03],[0,.78,-.48],41,41],
 [atBar(57),'Everything opens · hands',[.76,1.30,.49],[.50,1.31,.46],[.05,.756,.16],41,43],
 [atBar(61),'A new breath',[.90,1.30,-.14],[.72,1.35,-.22],[0,1.15,.64],43,41],
 [atBar(63),'The unfolding phrase',[-1.42,1.21,.80],[-1.58,1.31,.92],[0,.92,.34],44,44],
 [atBar(65),'Everything opens',[3.4,1.28,2.78],[3.12,2.08,2.22],[0,.76,-.53],43,40],
 [atBar(67),'The highest note',[1.02,1.35,.56],[.74,1.25,.69],[.15,.765,.16],41,40],
 [atBar(69),'Full light',[-2.98,1.51,1.93],[-2.57,1.80,2.36],[0,.88,-.29],43,41],
 [atBar(71),'Coming home',[2.38,1.15,.87],[2.85,1.41,1.59],[0,.87,.10],44,42],
 [atBar(73),'Home in the light',[.48,1.34,.44],[.28,1.27,.50],[0,.756,.16],43,42],
 [atBar(77),'The last phrase',[1.67,1.36,1.02],[2.09,1.56,1.41],[0,.89,.16],42,42],
 [atBar(80),'Daybreak · ending',[2.73,1.82,2.77],[3.61,2.10,3.72],[0,.81,-.42],40,38],
 ];
 this.shots=plan.map((p,i)=>({start:p[0],end:plan[i+1]?.[0]??score.duration,name:p[1],from:vec(p[2]),to:vec(p[3]),look:vec(p[4]),lookTo:vec(p[4]),fov:p[5],fovTo:p[6]}));
 }
 update(camera:THREE.PerspectiveCamera,time:number,aspect:number){
 const s=(this.override>=0?this.shots[this.override]:this.shots.find(s=>time<s.end))??this.shots.at(-1)!;
 const t=this.override>=0?.5:smooth((time-s.start)/(s.end-s.start));
 this.name=s.name;camera.position.copy(s.from).lerp(s.to,this.reduce?.35:t);const look=s.look.clone().lerp(s.lookTo,t);
 let fov=mix(s.fov,s.fovTo,t);
 if(aspect<1){
 const hands=/hands|touch|left hand|highest note|home in the light/i.test(s.name);
 if(s.name==='Across the strings'){
 // Align the piano's long axis with a portrait frame, keeping the seated
 // performer and keyboard beneath the interior detail.
 camera.position.set(mix(.95,1.10,t),mix(3.45,3.20,t),mix(3.05,2.85,t));
 look.set(0,.80,-.37);fov=48;
 }else if(hands){
 // Portrait has its own keyboard composition. Moving the widescreen camera
 // backward exposed an arbitrary cropped face beside the intended hand detail.
 const left=/left hand/i.test(s.name);camera.position.set(look.x+(left?-1:1)*mix(.94,.86,t),2.00,.075);
 look.set(look.x,.754,.21);fov=45;
 }else{
 const desiredFit=clamp(1/aspect,1,1.9),offset=camera.position.clone().sub(look);let fit=desiredFit;
 // Keep portrait dollies inside the built room. If a wall limits travel,
 // widen the lens to retain the intended subject size instead of crossing it.
 for(const [axis,min,max] of [['x',-6.85,6.85],['y',.3,4.30],['z',-6.55,4.95]] as const){
 if(offset[axis]>0)fit=Math.min(fit,(max-look[axis])/offset[axis]);
 else if(offset[axis]<0)fit=Math.min(fit,(min-look[axis])/offset[axis]);
 }
 camera.position.copy(offset).multiplyScalar(fit).add(look);
 fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad((fov+5)/2))*desiredFit/fit));look.y+=.035;
 }
 }
 camera.fov=fov;camera.lookAt(look);camera.updateProjectionMatrix();
 }
}
