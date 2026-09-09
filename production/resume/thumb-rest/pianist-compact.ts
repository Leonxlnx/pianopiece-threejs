import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, smooth, mix, v3, lowerBound } from './math';
import { GrandPiano, keyX, isBlack, KEY_TOP, keySurfaceY } from './piano';
import type { Note, Score, Hand, Telemetry } from './types';
import { wristMotionSampler } from './wrist-motion';
import { ponytailMotion } from './ponytail-motion';

const FINGERS=['Thumb','Index','Middle','Ring','Pinky'];
const TIP_LENGTH=[.027,.0243,.023,.0244,.0188];
const PALM_Q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(v3(-1,0,0),v3(0,0,-1),v3(0,-1,0)));
interface FingerRig { bones:THREE.Bone[]; lengths:number[]; tip:THREE.Object3D; rest:THREE.Quaternion[]; frameOffsets:THREE.Quaternion[]; palmNormal:THREE.Vector3; }
interface HandPose { position:THREE.Vector3; q:THREE.Quaternion; }
interface HandKnot { time:number; end:number; notes:Note[]; pose:HandPose; }
interface HandRig { side:Hand; wrist:THREE.Bone; upper:THREE.Bone; lower:THREE.Bone; fingers:FingerRig[]; notes:Note[]; fingerNotes:Note[][]; plan:HandKnot[]; }
function wp(b:THREE.Object3D){return b.getWorldPosition(new THREE.Vector3());}
function setWorldQ(b:THREE.Object3D,q:THREE.Quaternion){const parent=b.parent!.getWorldQuaternion(new THREE.Quaternion());b.quaternion.copy(parent.invert().multiply(q));b.updateWorldMatrix(false,true);}
function aim(b:THREE.Bone,child:THREE.Object3D,target:THREE.Vector3){const origin=wp(b),dir=wp(child).sub(origin).normalize();const desired=target.clone().sub(origin).normalize();const q=b.getWorldQuaternion(new THREE.Quaternion());setWorldQ(b,new THREE.Quaternion().setFromUnitVectors(dir,desired).multiply(q));}
function joint(a:THREE.Vector3,b:THREE.Vector3,l1:number,l2:number,pole:THREE.Vector3){
 const ab=b.clone().sub(a),d=clamp(ab.length(),.0001,l1+l2-.00001);ab.normalize();const along=(l1*l1-l2*l2+d*d)/(2*d);const h=Math.sqrt(Math.max(.0000001,l1*l1-along*along));const normal=pole.clone().sub(a);normal.addScaledVector(ab,-normal.dot(ab)).normalize();return a.clone().addScaledVector(ab,along).addScaledVector(normal,h);
}
function concertShoe(upperMaterial:THREE.Material){
 // A shaped toe box, vamp, instep and heel counter above a curved welt sole.
 // The local negative z axis points toward the pedal; the heel stays planted.
 const sections=[[-.145,.002,.005],[-.138,.023,.022],[-.119,.040,.034],[-.080,.047,.043],[-.030,.044,.054],[.016,.039,.075],[.058,.035,.100],[.100,.033,.096],[.126,.029,.077],[.137,.010,.039],[.139,.001,.005]];
 const radial=24,vertices:number[]=[],indices:number[]=[];
 for(let i=0;i<sections.length;i++)for(let j=0;j<=radial;j++){
 const [z,w,h]=sections[i],a=j/radial*Math.PI;
 vertices.push(Math.cos(a)*w,-.029+Math.pow(Math.sin(a),.72)*h,z);
 if(i&&j){const k=i*(radial+1)+j;indices.push(k,k-1,k-radial-1,k-1,k-radial-2,k-radial-1);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
 const shoe=new THREE.Mesh(geo,upperMaterial);shoe.castShadow=true;shoe.receiveShadow=true;
 const contour=[...sections.map(([z,w])=>new THREE.Vector2(w+.002,z)),...sections.slice().reverse().map(([z,w])=>new THREE.Vector2(-w-.002,z))];
 const shape=new THREE.Shape();shape.moveTo(contour[0].x,contour[0].y);shape.splineThru(contour.slice(1));shape.closePath();
 const soleGeo=new THREE.ExtrudeGeometry(shape,{depth:.007,steps:1,bevelEnabled:true,bevelSize:.001,bevelThickness:.001,bevelSegments:2,curveSegments:4});soleGeo.rotateX(Math.PI/2);soleGeo.translate(0,-.029,0);
 const soleMaterial=new THREE.MeshStandardMaterial({color:0x171719,roughness:.73});const sole=new THREE.Mesh(soleGeo,soleMaterial);sole.castShadow=true;shoe.add(sole);
 const weltPath=new THREE.CatmullRomCurve3(contour.map(p=>v3(p.x,-.027,p.y)),true,'centripetal');
 const welt=new THREE.Mesh(new THREE.TubeGeometry(weltPath,100,.00105,5,true),new THREE.MeshStandardMaterial({color:0x302b26,roughness:.65}));shoe.add(welt);
 const seamPoints=Array.from({length:18},(_,i)=>{const a=.14+(Math.PI-.28)*i/17;return v3(Math.cos(a)*.0425,-.028+Math.pow(Math.sin(a),.72)*.058,-.018);});
 const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seamPoints),30,.00075,5,false),soleMaterial);shoe.add(seam);
 return shoe;
}
export class Pianist {
 score?:Score;
 wristMotion?:ReturnType<typeof wristMotionSampler>;
 hairMotion?:ReturnType<typeof ponytailMotion>;
 group=new THREE.Group(); model?:THREE.Group; bones=new Map<string,THREE.Bone>();rest=new Map<string,THREE.Quaternion>(); hands:HandRig[]=[]; contacts:Telemetry['contacts']=[]; head=v3(0,1.28,.64); ready=false; poseCache=new Map<string,{position:THREE.Vector3,q:THREE.Quaternion}>(); blinkMeshes:THREE.SkinnedMesh[]=[]; shoes=new Map<string,THREE.Mesh>();
 async load(score:Score,preparedModel?:THREE.Group){
 this.score=score;
 this.model=preparedModel??(await new GLTFLoader().loadAsync('/assets/pianist.glb')).scene;this.group.add(this.model);this.model.rotation.y=Math.PI;this.model.position.set(0,-.344,.65);
 this.model.traverse(o=>{
 if((o as THREE.Bone).isBone){const b=o as THREE.Bone;this.bones.set(b.name,b);this.rest.set(b.name,b.quaternion.clone());}
 if((o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;
 // Footwear replaces the covered foot surface, as in a clothed character asset.
 if(m.name==='Human'&&m.geometry.index){m.geometry=m.geometry.clone();const pos=m.geometry.attributes.position,old=m.geometry.index.array,kept:number[]=[];for(let i=0;i<old.length;i+=3){if(Math.max(pos.getY(old[i]),pos.getY(old[i+1]),pos.getY(old[i+2]))<.145)continue;kept.push(old[i],old[i+1],old[i+2]);}m.geometry.setIndex(kept);}
 m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;const mats=Array.isArray(m.material)?m.material:[m.material];for(const mat of mats){const p=mat as THREE.MeshStandardMaterial;if(p.map)p.map.anisotropy=4;if(p.normalMap)p.normalMap.anisotropy=4;}
 if((m as THREE.SkinnedMesh).morphTargetDictionary)this.blinkMeshes.push(m as THREE.SkinnedMesh);
 }
 });
 this.model.updateMatrixWorld(true);
 for(const side of ['L','R'] as const){const word=side==='L'?'Left':'Right';const fingers:FingerRig[]=[];for(let i=0;i<5;i++){
 const bones=[1,2,3].map(n=>this.bones.get(word+'Hand'+FINGERS[i]+n)!);if(bones.some(b=>!b))throw new Error('The performer finger rig is incomplete.');
 const tip=new THREE.Object3D();tip.name=word+FINGERS[i]+'Contact';tip.position.set(0,TIP_LENGTH[i],0);bones[2].add(tip);
 fingers.push({bones,tip,lengths:[bones[1].position.length(),bones[2].position.length(),TIP_LENGTH[i]],rest:bones.map(b=>b.quaternion.clone()),frameOffsets:[],palmNormal:v3(-1,0,0)});
 }
 // Calibrate each phalanx roll against a complete flexion frame. Keeping a
 // full frame avoids the axial spin of repeated shortest-arc aim rotations.
 const wristBone=this.bones.get(word+'Hand')!,oldWristQ=wristBone.getWorldQuaternion(new THREE.Quaternion());setWorldQ(wristBone,PALM_Q);
 for(const [fi,finger] of fingers.entries()){
 if(fi===0){const a=wp(finger.bones[1]).sub(wp(finger.bones[0])).normalize(),b=wp(finger.bones[2]).sub(wp(finger.bones[1])).normalize();finger.palmNormal.copy(b.cross(a).normalize().applyQuaternion(PALM_Q.clone().invert()));}
 const reference=finger.palmNormal.clone().applyQuaternion(PALM_Q);
 finger.frameOffsets=finger.bones.map((bone,j)=>{
 const child=j<2?finger.bones[j+1]:finger.tip,dir=wp(child).sub(wp(bone)).normalize(),normal=fi===0?reference.clone().addScaledVector(dir,-reference.dot(dir)).normalize():dir.clone().cross(v3(0,1,0)).normalize();
 const frame=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize()));return frame.invert().multiply(bone.getWorldQuaternion(new THREE.Quaternion())).normalize();
 });}setWorldQ(wristBone,oldWristQ);
 const notes=score.notes.filter(n=>n.hand===side);this.hands.push({side,wrist:this.bones.get(word+'Hand')!,upper:this.bones.get(word+'Arm')!,lower:this.bones.get(word+'ForeArm')!,fingers,notes,fingerNotes:Array.from({length:5},(_,i)=>notes.filter(n=>n.finger===i+1)),plan:[]});
 }
 // Understated concert shoes follow the anatomical heel and toe pose.
 const shoeMat=new THREE.MeshPhysicalMaterial({color:0x171719,roughness:.45,metalness:0,clearcoat:.18,clearcoatRoughness:.32});
 for(const side of ['Left','Right']){const shoe=concertShoe(shoeMat);shoe.name=side+' concert shoe';this.group.add(shoe);this.shoes.set(side,shoe);}
 this.hairMotion=ponytailMotion(this.bones,this.rest);
 this.posture(0,.5,0);
 if(score.wristMotion)this.wristMotion=wristMotionSampler(score.wristMotion);
 else for(const hand of this.hands)this.planHand(hand);
 this.ready=true;
 }
 resetBone(name:string){const b=this.bones.get(name);if(b){b.quaternion.copy(this.rest.get(name)!);b.updateWorldMatrix(false,true);}return b;}
 posture(time:number,energy:number,pedal:number){
 if(!this.model)return;
 const bars=this.score?.harmony??[];
 const barIndex=Math.max(0,lowerBound(bars,time,b=>b.time)-1),bar=bars[barIndex];
 const barPosition=bar?clamp((time-bar.time)/bar.duration):(time*(this.score?.bpm??90)/240)%1;
 const phrase=((barIndex%4)+barPosition)/4;
 // Musical pulses are reconstructed from score time, so seeking and paused
 // poses are identical to continuous playback. Seat contact stays anchored.
 const beat=barPosition*4,beatPhase=(beat%1)*Math.PI*2;
 const breath=Math.sin(phrase*Math.PI*2-.45),release=.5-.5*Math.cos(phrase*Math.PI*2);
 let reach=0,weight=0,melodyX=0,melodyWeight=0,strike=0;
 for(const n of this.score?.notes??[]){
 const age=time-n.time;
 if(age<-.55||age>1.0)continue;
 // Fade influence to zero at both edges. Abruptly adding a distant note
 // to a weighted centroid made the hips and head jump before quiet phrases.
 const w=Math.exp(-Math.pow((age+.12)/.38,2))*n.velocity*smooth((age+.55)/.18)*(1-smooth((age-.55)/.45));
 reach+=keyX(n.midi)*w;weight+=w;
 if(n.role==='melody'||n.hand==='R'){melodyX+=keyX(n.midi)*w;melodyWeight+=w;}
 if(age>-.09&&age<.6)strike+=n.velocity*(n.role==='bass'?1.35:n.role==='melody'?.8:.28)*Math.exp(-Math.pow((age-.07)/.16,2))*smooth((age+.09)/.07)*(1-smooth((age-.42)/.18));
 }
 // A small neutral weight lets long rests settle continuously at centre.
 reach/=weight+.22;melodyX/=melodyWeight+.16;
 const impulse=1-Math.exp(-strike*.38),ending=this.score?1-smooth((time-this.score.duration+6)/4):1;
 this.model.position.set(clamp(reach*.048,-.020,.020),-.344,.65);
 for(const n of ['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','RightShoulder','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot','LeftToeBase','RightToeBase'])this.resetBone(n);
 const spine=this.bones.get('Spine')!,spine1=this.bones.get('Spine1')!,head=this.bones.get('Head')!;
 spine.rotateX(.13+(.043*breath+.020*impulse)*energy*ending);
 spine.rotateZ(clamp(-reach*.12,-.055,.055)+.019*breath*energy);
 spine1.rotateX(.064+.008*Math.sin(beatPhase-.55)*energy*ending);
 spine1.rotateY(clamp(-melodyX*.055,-.022,.022));
 const upperChest=this.bones.get('Spine2');upperChest?.rotateZ(.009*Math.sin(beatPhase-.25)*energy*ending);
 head.rotateX(.105+.025*release*energy+.018*Math.sin(phrase*Math.PI*2-.7)*energy*ending+.012*Math.sin(beatPhase-.82)*energy*ending);
 head.rotateY(clamp(-melodyX*.34,-.13,.13));head.rotateZ(-breath*.012*energy);
 this.bones.get('LeftShoulder')?.rotateZ(.009*impulse*energy);
 this.bones.get('RightShoulder')?.rotateZ(-.009*impulse*energy);
 this.model.updateMatrixWorld(true);
 for(const side of ['Left','Right']){
 const sign=side==='Left'?-1:1;const up=this.bones.get(side+'UpLeg')!,lower=this.bones.get(side+'Leg')!,foot=this.bones.get(side+'Foot')!,toe=this.bones.get(side+'ToeBase')!;
 const heel=v3(sign*.095,.038,side==='Right'?.35:.38),toeCenter=v3(sign*.095,side==='Right'?.107-pedal*.016:.038,side==='Right'?.11:.14),forward=toeCenter.clone().sub(heel).normalize(),back=forward.clone().negate(),shoeUp=back.clone().cross(v3(1,0,0)).normalize();
 const shoe=this.shoes.get(side);if(shoe){shoe.position.copy(heel).lerp(toeCenter,.5);shoe.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(v3(1,0,0),shoeUp,back));}
 const hip=wp(up),ankle=heel.clone().addScaledVector(forward,.032).addScaledVector(shoeUp,.055);const pole=v3(sign*.17,.58,.18);const knee=joint(hip,ankle,lower.position.length(),foot.position.length(),pole);
 aim(up,lower,knee);aim(lower,foot,ankle);
 // Foot long axis follows the pedal, toe stays planted while ankle rolls slightly.
 const toeTarget=ankle.clone().addScaledVector(forward,.12);aim(foot,toe,toeTarget);toe.quaternion.copy(this.rest.get(side+'ToeBase')!);
 }
 this.head.copy(wp(head));
 const blinkPhase=(time+2.3)%4.9;const blink=blinkPhase<.14?Math.sin(blinkPhase/.14*Math.PI):0;
 for(const mesh of this.blinkMeshes){
 const dict=mesh.morphTargetDictionary!,values=mesh.morphTargetInfluences;if(!values)continue;
 const set=(name:string,value:number)=>{const i=dict[name];if(i!==undefined)values[i]=value;};
 for(const name of ['eyeBlinkLeft','eyeBlinkRight','eyes_closed','blink'])set(name,blink);
 const softness=.023+.023*energy*release;
 set('mouthSmileLeft',softness);set('mouthSmileRight',softness*.94);
 set('browInnerUp',.014+.012*release*energy);
 // The authored down-look morph also carries the matching eyelid motion.
 const gaze=.55+.08*release;
 set('eyeLookDownLeft',gaze);set('eyeLookDownRight',gaze);
 set('eyeSquintLeft',.020*energy);set('eyeSquintRight',.020*energy);
 }
 this.hairMotion?.(time);
 }
 contactDepth(baseZ:number,black:boolean,fi:number){
 // Longer fingers reach forward from a supported knuckle. The previous 24mm
 // offset forced 75–85mm chains to fold into a claw even with exact contact.
 const forward=fi===0?.051:fi===4?.039:fi===1?.055:.065;
 return clamp(baseZ-forward,black?.166:.239,black?.211:.269);
 }
 // Three linked phalanges share one continuous flexion plane. Coupled bends
 // prevent the mathematically reachable but unnatural folded-back IK solution.
 fingerPoints(base:THREE.Vector3,target:THREE.Vector3,f:FingerRig,fi:number,palmQ?:THREE.Quaternion,opposition=0){
 const [a,b,c]=f.lengths,ratio=fi===0?.35:.48,maxBend=fi===0?1.56:1.52;
 const reach=(bend:number)=>Math.hypot(a+b*Math.cos(bend)+c*Math.cos((1+ratio)*bend),b*Math.sin(bend)+c*Math.sin((1+ratio)*bend));
 const delta=target.clone().sub(base),d=clamp(delta.length(),reach(maxBend),a+b+c-.00003);
 const e=delta.lengthSq()>.00000001?delta.normalize():v3(0,0,-1);
 let low=0,high=maxBend;for(let i=0;i<17;i++){const mid=(low+high)/2;if(reach(mid)>d)low=mid;else high=mid;}
 const bend=(low+high)/2,angle=-Math.atan2(-b*Math.sin(bend)-c*Math.sin((1+ratio)*bend),a+b*Math.cos(bend)+c*Math.cos((1+ratio)*bend));
 // Near a vertical touch, world-up no longer defines a stable flexion plane.
 // Blend toward a palm lateral reference before that projection degenerates.
 let normal:THREE.Vector3;
 if(fi===0){
 const q=palmQ??f.bones[0].parent!.getWorldQuaternion(new THREE.Quaternion());
 const reference=f.palmNormal.clone().applyQuaternion(q);normal=reference.addScaledVector(e,-reference.dot(e));
 if(normal.lengthSq()<1e-8)normal.copy(v3(0,1,0).applyQuaternion(q)).cross(e);
 normal.normalize();
 }else{
 const natural=e.clone().cross(v3(0,1,0)).normalize(),stable=v3(1,0,0).addScaledVector(e,-e.x).normalize();
 const horizontal=Math.hypot(target.x-base.x,target.z-base.z);normal=stable.lerp(natural,smooth((horizontal-.004)/.024)).normalize();
 }
 if(fi===0&&opposition!==0)normal.applyAxisAngle(e,opposition);
 const up=normal.clone().cross(e).normalize();
 const segment=(theta:number,length:number)=>e.clone().multiplyScalar(Math.cos(theta)*length).addScaledVector(up,Math.sin(theta)*length);
 const pip=base.clone().add(segment(angle,a)),dip=pip.clone().add(segment(angle-bend,b)),tip=dip.clone().add(segment(angle-(1+ratio)*bend,c));return {pip,dip,tip,normal,min:reach(maxBend)};
 }
 planHand(hand:HandRig){
 const groups:{time:number;end:number;notes:Note[]}[]=[];
 for(const note of hand.notes){const last=groups.at(-1);if(last&&note.time-last.time<.045){last.notes.push(note);last.end=Math.max(last.end,note.time+note.duration);}else groups.push({time:note.time,end:note.time+note.duration,notes:[note]});}
 const offsets=hand.side==='L'?[.07,.032,.008,-.022,-.055]:[-.07,-.032,-.008,.022,.055];
 hand.plan=groups.map((g,groupIndex)=>{
 const support=hand.notes.filter(n=>n.time<g.time&&n.time+n.duration>g.time+.025&&!g.notes.some(m=>m.finger===n.finger));
 const notes=[...g.notes,...support];
 // Prepare a whole musical figure when the neighboring fingers can share
 // one hand position. Solving every isolated note independently made the
 // wrist chase the fingertips, particularly during thumb substitutions.
 const neighbors=[groups[groupIndex+1],groups[groupIndex-1]].filter(k=>k&&Math.abs(k.time-g.time)<.56);
 for(const neighbor of neighbors)for(const note of neighbor.notes){
 if(notes.some(n=>n.finger===note.finger||n.midi===note.midi))continue;
 const candidate=[...notes,note].sort((a,b)=>a.midi-b.midi);
 if(candidate.at(-1)!.midi-candidate[0].midi>12)continue;
 if(candidate.some((n,i)=>i>0&&(hand.side==='L'?n.finger>=candidate[i-1].finger:n.finger<=candidate[i-1].finger)))continue;
 notes.push(note);
 }
 const x=notes.reduce((a,n)=>a+keyX(n.midi)-offsets[n.finger-1],0)/notes.length;
 return {...g,pose:this.handPose(hand,notes,x,notes.some(n=>isBlack(n.midi)))};
 });
 }
 plannedPose(hand:HandRig,time:number):HandPose{
 if(this.wristMotion)return this.wristMotion(hand.side,time);
 const index=lowerBound(hand.plan,time,k=>k.time),prev=hand.plan[Math.max(0,index-1)],next=hand.plan[Math.min(index,hand.plan.length-1)];
 if(prev===next)return {position:prev.pose.position.clone(),q:prev.pose.q.clone()};
 const gap=next.time-prev.end;
 const begin=gap>0?Math.max(prev.end,next.time-.46):Math.max(prev.time,next.time-Math.min(.18,(next.time-prev.time)*.66));
 const end=next.time-.004,u=smooth((time-begin)/Math.max(.001,end-begin));
 const position=prev.pose.position.clone().lerp(next.pose.position,u);if(gap>.09)position.y+=Math.sin(u*Math.PI)*.007;
 return {position,q:prev.pose.q.clone().slerp(next.pose.q,u)};
 }
 handPose(hand:HandRig,notes:Note[],initialX:number,black:boolean){
 const cacheKey=hand.side+notes.map(n=>`${n.midi}/${n.finger}/${(n.contactLift??.002).toFixed(4)}/${n.contactZ??""}/${n.thumbOpposition??0}`).sort().join(',');const cached=this.poseCache.get(cacheKey);if(cached)return cached;
 const sign=hand.side==='L'?1:-1;
 const params=[initialX,black?.772:.757,black?.379:.412,sign*.055,.035,0];
 const bounds=[[-.61,.61],[.738,.797],[.295,.447],[-.19,.19],[-.09,.15],[-.15,.15]];
 const initial=[...params];const shoulder=wp(hand.upper);
 const quaternion=(p:number[])=>new THREE.Quaternion().setFromEuler(new THREE.Euler(p[4],p[5],p[3],'YXZ')).multiply(PALM_Q);
 const cost=(p:number[])=>{
 const q=quaternion(p),w=v3(p[0],p[1],p[2]);let cost=0;
 for(const n of notes){const fi=n.finger-1,f=hand.fingers[fi];const base=f.bones[0].position.clone().applyQuaternion(q).add(w);const black=isBlack(n.midi);const z=n.contactZ??this.contactDepth(base.z,black,fi),target=v3(keyX(n.midi),keySurfaceY(n.midi,z)+(n.contactLift??.002),z);const length=f.lengths.reduce((a,b)=>a+b,0);const d=target.distanceTo(base);const shape=this.fingerPoints(base,target,f,fi,q,n.thumbOpposition??0);
 if(fi>0)cost+=Math.pow(Math.max(0,shape.pip.z-base.z+.003),2)*400+Math.pow(Math.max(0,shape.pip.y-base.y-.025),2)*60;
 cost+=Math.pow(Math.max(0,d-length*.985),2)*15000+Math.pow(Math.max(0,shape.min+.001-d),2)*15000;
 cost+=Math.pow(d-length*.88,2)*18+Math.pow(Math.max(0,target.y+.013-base.y),2)*250;
 }
 cost+=Math.pow(Math.max(0,w.distanceTo(shoulder)-.490),2)*18000;
 cost+=Math.pow(p[0]-initial[0],2)*.14+Math.pow(p[1]-initial[1],2)*.18+Math.pow(p[2]-initial[2],2)*.06;
 cost+=Math.pow(p[3]-sign*.055,2)*.007+Math.pow(p[4]-.035,2)*.006+Math.pow(p[5],2)*.014;
 return cost;
 };
 let best=cost(params);
 for(const scale of [1,.5,.25,.1,.035])for(let pass=0;pass<4;pass++){let changed=false;for(let axis=0;axis<6;axis++){const step=[.028,.012,.03,.16,.16,.16][axis]*scale;for(const direction of [-1,1]){const old=params[axis];params[axis]=clamp(old+step*direction,...bounds[axis] as [number,number]);const value=cost(params);if(value<best){best=value;changed=true;}else params[axis]=old;}}if(!changed)break;}
 const pose={position:v3(params[0],params[1],params[2]),q:quaternion(params)};this.poseCache.set(cacheKey,pose);return pose;
 }

 update(time:number,score:Score,piano:GrandPiano,pedal:number,energy:number){
 if(!this.ready)return;this.contacts=[];this.posture(time,energy,pedal);
 for(const hand of this.hands){
 const current=hand.notes.filter(n=>n.time<=time&&n.time+n.duration>time);
 const pose=this.plannedPose(hand,time),x=pose.position.x;
 const wrist=pose.position.clone();
 // Small arm weight follows articulation; the fingertips themselves remain contact constrained.
 const word=hand.side==='L'?'Left':'Right';for(const name of [word+'Arm',word+'ForeArm',word+'Hand'])this.resetBone(name);
 let pressure=0;for(const note of hand.notes){const age=time-note.time;if(age<-.065||age>.40)continue;pressure+=note.velocity*(age<0?smooth((age+.065)/.065):Math.exp(-age*16));}
 const shoulder=wp(hand.upper);const pole=v3((hand.side==='L'?-1:1)*(.30+Math.abs(x)*.15),.83-(1-Math.exp(-pressure*.7))*.014,.58);
 const elbow=joint(shoulder,wrist,hand.lower.position.length(),hand.wrist.position.length(),pole);
 aim(hand.upper,hand.lower,elbow);aim(hand.lower,hand.wrist,wrist);setWorldQ(hand.wrist,pose.q);
 for(let fi=0;fi<5;fi++){
 const finger=hand.fingers[fi];finger.bones.forEach((b,j)=>{b.quaternion.copy(finger.rest[j]);b.updateWorldMatrix(false,true);});
 const fnotes=hand.fingerNotes[fi];const ni=lowerBound(fnotes,time,n=>n.time);const prev=fnotes[Math.max(0,ni-1)],nxt=fnotes[Math.min(ni,fnotes.length-1)];
 let n=current.find(n=>n.finger===fi+1);let target:THREE.Vector3;
 const base=wp(finger.bones[0]),reach=finger.lengths.reduce((a,b)=>a+b,0);
 const idle=base.clone().add(v3(fi===0?(hand.side==='L'?1:-1)*reach*.35:0,-reach*.19,-reach*(fi===0?.81:.90)));idle.y=Math.max(idle.y,KEY_TOP+(fi===0?mix(.027,.011,smooth((idle.z-.230)/.030)):mix(.027,.011,smooth((idle.z-.237)/.026))));
 const keyTarget=(note:Note)=>{const v=piano.contact(note.midi,note.contactZ??this.contactDepth(base.z,isBlack(note.midi),fi));v.y+=note.contactLift??.002;return v;};
 if(n)target=keyTarget(n);
 else {
 const previous=prev&&prev.time+prev.duration<=time?prev:undefined,next=nxt&&nxt.time>=time?nxt:undefined;
 const end=previous?previous.time+previous.duration:-10,start=next?.time??1e6,gap=start-end;
 if(previous&&next&&gap<.50){const u=clamp((time-end)/Math.max(.001,gap)),s=smooth(u);target=keyTarget(previous).lerp(keyTarget(next),s);target.y+=fi===0?Math.sin(u*Math.PI)*Math.min(.043,.014+gap*.10):Math.pow(Math.sin(u*Math.PI),2)*Math.min(.018,gap*.065);}
 else {target=idle.clone();if(previous){const weight=1-smooth((time-end)/.19);target.lerp(keyTarget(previous),weight);}if(next){const weight=smooth(1-(start-time)/.27);target.lerp(keyTarget(next),weight);}}
 }
 if(!n){const delta=target.clone().sub(base),total=reach,minimum=this.fingerPoints(base,idle,finger,fi).min+.008;
 const tooClose=1-smooth((delta.length()-minimum)/.014),behind=smooth((delta.z+total*.22)/(.035)),tooSide=smooth((Math.abs(delta.x)-total*.62)/(.025));
 const since=prev?time-prev.time-prev.duration:100,before=nxt?nxt.time-time:100;target.lerp(idle,Math.max(tooClose,behind,tooSide)*smooth(Math.min(since,before)/.07));}
 // The thumb travels with the palm while released. World-space targets
 // can pass through the thumb base during wrist travel and invert its plane.
 // Interpolate complete local joint poses between exact held-note endpoints;
 // a soft neutral pose keeps long rests open without a key-space detour.
 if(!n&&fi===0){
 const localPose=(wristPosition:THREE.Vector3,wristQ:THREE.Quaternion,touch:THREE.Vector3,opposition=0)=>{
 const origin=finger.bones[0].position.clone().applyQuaternion(wristQ).add(wristPosition),chain=this.fingerPoints(origin,touch,finger,fi,wristQ,opposition),p=[origin,chain.pip,chain.dip,chain.tip];
 const world=finger.bones.map((bone,j)=>{const dir=p[j+1].clone().sub(p[j]).normalize(),normal=chain.normal;return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(finger.frameOffsets[j]);});
 return world.map((q,j)=>(j===0?wristQ:world[j-1]).clone().invert().multiply(q));
 };
 // A stable compact thumb posture preserves the mesh's authored joint rolls.
 // Calibrated in wrist coordinates: lifting a world-space target can fold
 // the first web and rotate the distal chain through its own palm.
 const idlePose=finger.rest.map(q=>q.clone());
 idlePose[0].premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-.85,hand.side==='L'?-.30:.30,hand.side==='L'?.30:-.30,'XYZ')));
 const contactPose=(note:Note,at:number)=>{const anchor=this.plannedPose(hand,at),origin=finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??this.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),keySurfaceY(note.midi,z,1)+(note.contactLift??.002),z);return localPose(anchor.position,anchor.q,touch,note.thumbOpposition??0);};
 const previous=prev&&prev.time+prev.duration<=time?prev:undefined,next=nxt&&nxt.time>=time?nxt:undefined;
 const end=previous?previous.time+previous.duration:-10,start=next?.time??1e6,gap=start-end;
 let rotations=idlePose.map(q=>q.clone());
 if(previous&&next&&gap<.50){const u=clamp((time-end)/Math.max(.001,gap)),s=smooth(u),a=contactPose(previous,end),b=contactPose(next,start),restWeight=Math.pow(Math.sin(u*Math.PI),2)*smooth(gap/.22)*.35;rotations=a.map((q,j)=>q.slerp(b[j],s).slerp(idlePose[j],restWeight));}
 else {if(previous){const a=contactPose(previous,end),weight=1-smooth((time-end)/.22);rotations.forEach((q,j)=>q.slerp(a[j],weight));}if(next){const b=contactPose(next,start),weight=smooth(1-(start-time)/.30);rotations.forEach((q,j)=>q.slerp(b[j],weight));}}
 finger.bones.forEach((bone,j)=>{bone.quaternion.copy(rotations[j]);bone.updateWorldMatrix(false,true);});
 continue;
 }
 const desired=target.clone();
 const shape=this.fingerPoints(base,target,finger,fi,undefined,n?.thumbOpposition??0);
 const points=[base,shape.pip,shape.dip,shape.tip];
 if(!n&&fi>0){
 const localPose=(wristPosition:THREE.Vector3,wristQ:THREE.Quaternion,touch:THREE.Vector3,opposition=0)=>{
 const origin=finger.bones[0].position.clone().applyQuaternion(wristQ).add(wristPosition),chain=this.fingerPoints(origin,touch,finger,fi,wristQ,opposition),p=[origin,chain.pip,chain.dip,chain.tip];
 const world=finger.bones.map((bone,j)=>{const dir=p[j+1].clone().sub(p[j]).normalize(),normal=chain.normal;return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(finger.frameOffsets[j]);});
 return world.map((q,j)=>(j===0?wristQ:world[j-1]).clone().invert().multiply(q));
 };
 const idlePose=localPose(wp(hand.wrist),pose.q,idle);
 const contactPose=(note:Note,at:number)=>{const anchor=this.plannedPose(hand,at),origin=finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??this.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),keySurfaceY(note.midi,z,1)+(note.contactLift??.002),z);return localPose(anchor.position,anchor.q,touch,note.thumbOpposition??0);};
 const previous=prev&&prev.time+prev.duration<=time?prev:undefined,next=nxt&&nxt.time>=time?nxt:undefined;
 const end=previous?previous.time+previous.duration:-10,start=next?.time??1e6,gap=start-end;
 let rotations=idlePose.map(q=>q.clone());
 if(previous&&next&&gap<.50){const u=clamp((time-end)/Math.max(.001,gap)),s=smooth(u),a=contactPose(previous,end),b=contactPose(next,start),restWeight=Math.pow(Math.sin(u*Math.PI),2)*smooth(gap/.16)*.55;rotations=a.map((q,j)=>q.slerp(b[j],s).slerp(idlePose[j],restWeight));}
 else {if(previous){const a=contactPose(previous,end),weight=1-smooth((time-end)/.19);rotations.forEach((q,j)=>q.slerp(a[j],weight));}if(next){const b=contactPose(next,start),weight=smooth(1-(start-time)/.27);rotations.forEach((q,j)=>q.slerp(b[j],weight));}}
 // Restrict the alternate path to a forward envelope. Contact poses outside
 // it keep the existing IK path, so an invalid contact cannot pull the
 // resting path through a larger MCP rotation.
 const envelope=(qs:THREE.Quaternion[])=>{const dir=finger.bones[1].position.clone().applyQuaternion(qs[0]).normalize(),turn=finger.rest[0].angleTo(qs[0]);return Math.min(smooth((1.40-turn)/.25),smooth((dir.y-.25)/.20),smooth((.65+dir.z)/.20),smooth((.85-Math.abs(dir.x))/.20));};
 let weight=Math.min(envelope(idlePose),envelope(rotations));
 if(previous)weight=Math.min(weight,envelope(contactPose(previous,end)));
 if(next)weight=Math.min(weight,envelope(contactPose(next,start)));
 const fallback=localPose(wp(hand.wrist),pose.q,target);
 finger.bones.forEach((bone,j)=>{bone.quaternion.copy(fallback[j].slerp(rotations[j],weight));bone.updateWorldMatrix(false,true);});
 continue;
 }

 for(let j=0;j<3;j++){
 const dir=points[j+1].clone().sub(points[j]).normalize(),normal=shape.normal;let q:THREE.Quaternion;
 q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(finger.frameOffsets[j]);
 setWorldQ(finger.bones[j],q);
 }
 if(n&&time>=n.time&&time<n.time+n.duration)this.contacts.push({hand:hand.side,finger:fi+1,midi:n.midi,error:wp(finger.tip).distanceTo(desired)});
 }
 }
 }
}
