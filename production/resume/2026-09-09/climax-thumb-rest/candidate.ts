import { applyIdleNonthumb } from './idle-nonthumb';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, smooth, mix, v3, lowerBound } from './math';
import { GrandPiano, keyX, isBlack, KEY_TOP, keySurfaceY } from './piano';
import type { Note, Score, Hand, Telemetry } from './types';
import { wristMotionSampler } from './wrist-motion';
import { ponytailMotion } from './ponytail-motion';

type ThumbRestControl={name?:string;previous:string;next:string;end:number;start:number;target:[number,number,number];release?:number;arrival?:number;ramp?:number;arrivalRamp?:number;releaseLift?:number;arrivalLift?:number;opposition?:number};

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
class OriginalPianist {
 torsoEnvelopeZ=0;
 openingPalmFrame=0;
 chordPalmFrame=0;
 score?:Score;
 wristMotion?:ReturnType<typeof wristMotionSampler>;
 hairMotion?:ReturnType<typeof ponytailMotion>;
 group=new THREE.Group(); model?:THREE.Group; bones=new Map<string,THREE.Bone>();rest=new Map<string,THREE.Quaternion>(); hands:HandRig[]=[]; contacts:Telemetry['contacts']=[]; head=v3(0,1.28,.64); ready=false; poseCache=new Map<string,{position:THREE.Vector3,q:THREE.Quaternion}>(); blinkMeshes:THREE.SkinnedMesh[]=[]; shoes=new Map<string,THREE.Mesh>();
 async load(score:Score,preparedModel?:THREE.Group){
 this.score=score;
 this.model=preparedModel??(await new GLTFLoader().loadAsync('/assets/pianist.glb')).scene;this.group.add(this.model);this.model.rotation.y=Math.PI;this.model.position.set(0,-.344,.75);
 this.model.traverse(o=>{
 if((o as THREE.Bone).isBone){const b=o as THREE.Bone;this.bones.set(b.name,b);this.rest.set(b.name,b.quaternion.clone());}
 if((o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;
 // Footwear replaces the covered foot surface, as in a clothed character asset.
 if(m.name==='Human'&&m.geometry.index){const old=m.geometry.index.array;m.geometry=m.geometry.clone();const pos=m.geometry.attributes.position,kept:number[]=[];for(let i=0;i<old.length;i+=3){if(Math.max(pos.getY(old[i]),pos.getY(old[i+1]),pos.getY(old[i+2]))<.145)continue;kept.push(old[i],old[i+1],old[i+2]);}m.geometry.setIndex(kept);}
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
 this.model.position.set(clamp(reach*.048,-.020,.020),-.344,.75);
 for(const n of ['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','RightShoulder','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot','LeftToeBase','RightToeBase'])this.resetBone(n);
 const spine=this.bones.get('Spine')!,spine1=this.bones.get('Spine1')!,head=this.bones.get('Head')!;
 spine.rotateX(.17+(.043*breath+.020*impulse)*energy*ending);
 spine.rotateZ(clamp(-reach*.12,-.055,.055)+.019*breath*energy);
 spine1.rotateX(.064+.008*Math.sin(beatPhase-.55)*energy*ending);
 spine1.rotateY(clamp(-melodyX*.055,-.022,.022));
 const upperChest=this.bones.get('Spine2');upperChest?.rotateZ(.009*Math.sin(beatPhase-.25)*energy*ending);
 head.rotateX(.105+.025*release*energy+.018*Math.sin(phrase*Math.PI*2-.7)*energy*ending+.012*Math.sin(beatPhase-.82)*energy*ending);
 head.rotateY(clamp(-melodyX*.34,-.13,.13));head.rotateZ(-breath*.012*energy);
 this.bones.get('LeftShoulder')?.rotateZ(.009*impulse*energy);
 this.bones.get('RightShoulder')?.rotateZ(-.009*impulse*energy);
 this.model.updateMatrixWorld(true);
 // A small seated lean and clavicle protraction let the upper arms reach
 // around the blouse while preserving clavicle and limb lengths.
 this.torsoEnvelopeZ=(wp(this.bones.get('LeftArm')!).z+wp(this.bones.get('RightArm')!).z)/2;
 for(const side of ['Left','Right']){
  const shoulder=this.bones.get(side+'Shoulder')!;
  setWorldQ(shoulder,new THREE.Quaternion().setFromAxisAngle(v3(0,1,0),(side==='Left'?-.32:.43)).multiply(shoulder.getWorldQuaternion(new THREE.Quaternion())));
 }
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
 if(this.openingPalmFrame>0){const q=palmQ??f.bones[0].parent!.getWorldQuaternion(new THREE.Quaternion()),reference=v3(-1,0,0).applyQuaternion(q),hinge=reference.addScaledVector(e,-reference.dot(e));if(hinge.lengthSq()>1e-6)normal.lerp(hinge.normalize(),this.openingPalmFrame).normalize();}
 if(this.chordPalmFrame>0){const q=palmQ??f.bones[0].parent!.getWorldQuaternion(new THREE.Quaternion()),reference=v3(-1,0,0).applyQuaternion(q),hinge=reference.addScaledVector(e,-reference.dot(e));if(hinge.lengthSq()>1e-8)normal.lerp(hinge.normalize(),this.chordPalmFrame).normalize();}
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
 this.openingPalmFrame=hand.side==='R'?smooth((time-6.0390358363389325)/.10)*(1-smooth((time-11.70)/.25)):0;
 this.chordPalmFrame=hand.side==='R'?smooth((time-198.348852)/(198.670185-198.348852))*(1-smooth((time-199.66868)/(200.026507-199.66868))):0;
 const current=hand.notes.filter(n=>n.time<=time&&n.time+n.duration>time);
 const pose=this.plannedPose(hand,time);
 const wrist=pose.position.clone();
 // Keep authored world hand targets while the elbow approaches the palm's
 // forward axis on the fixed-length shoulder/wrist circle. The expanded
 // torso envelope includes sleeve and forearm thickness.
 const word=hand.side==='L'?'Left':'Right';for(const name of [word+'Arm',word+'ForeArm',word+'Hand'])this.resetBone(name);
 const shoulder=wp(hand.upper),l1=hand.lower.position.length(),l2=hand.wrist.position.length();
 const axis=wrist.clone().sub(shoulder),d=clamp(axis.length(),.0001,l1+l2-.00001);axis.normalize();
 const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(.0000001,l1*l1-along*along));
 const centre=shoulder.clone().addScaledVector(axis,along),side=hand.side==='L'?-1:1;
 const desired=wrist.clone().addScaledVector(hand.fingers[2].bones[0].position.clone().normalize().applyQuaternion(pose.q),-l2).sub(centre);
 desired.addScaledVector(axis,-desired.dot(axis)).normalize();
 const outside=v3(side,0,0);outside.addScaledVector(axis,-outside.dot(axis)).normalize();
 const angle=Math.atan2(axis.dot(desired.clone().cross(outside)),desired.dot(outside));
 const at=(u:number)=>centre.clone().addScaledVector(desired.clone().applyAxisAngle(axis,angle*u),height);
 const clear=(elbow:THREE.Vector3)=>{
  for(let i=-4;i<=8;i++){
   const p=i<0?shoulder.clone().lerp(elbow,1+i*(hand.side==='L'?.1265:.115)):elbow.clone().lerp(wrist,i/8),torsoZ=this.torsoEnvelopeZ-.009+(1.05-p.y)*.16;
   if(Math.pow((p.x-this.model!.position.x)/.230,2)+Math.pow((p.z-torsoZ)/.195,2)<1)return false;
  }
  return true;
 };
 let low=0,high=1;if(clear(at(0)))high=0;
 else for(let i=0;i<24;i++){const middle=(low+high)/2;if(clear(at(middle)))high=middle;else low=middle;}
 const elbow=at(high);
 aim(hand.upper,hand.lower,elbow);aim(hand.lower,hand.wrist,wrist);setWorldQ(hand.wrist,pose.q);
 for(let fi=0;fi<5;fi++){
 const finger=hand.fingers[fi];finger.bones.forEach((b,j)=>{b.quaternion.copy(finger.rest[j]);b.updateWorldMatrix(false,true);});
 const solveFinger=(fnotes:Note[])=>{const ni=lowerBound(fnotes,time,n=>n.time);const prev=fnotes[Math.max(0,ni-1)],nxt=fnotes[Math.min(ni,fnotes.length-1)];
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
 if(hand.side==='R'&&time>=6.0390358363389325&&time<=12.392821){const weight=smooth((time-6.0390358363389325)/.10)*(1-smooth((time-11.36)/.24)),neutral=localPose(wp(hand.wrist),pose.q,v3(keyX(62)+.01525*smooth((time-10.95)/.18)*(1-smooth((time-11.43)/.24)),.757,.267));idlePose.forEach((q,j)=>q.slerp(neutral[j],weight));}
 const contactPose=(note:Note,at:number)=>{const anchor=climaxContextAnchor(note,at,this.plannedPose(hand,at)),origin=finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??this.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),(hand.side==='R'&&time>=6.0390358363389325&&time<=12.392821?piano.contact(note.midi,z).y:keySurfaceY(note.midi,z,1))+(note.contactLift??.002),z);return localPose(anchor.position,anchor.q,touch,note.thumbOpposition??0);};
 const previous=prev&&prev.time+prev.duration<=time?prev:undefined,next=nxt&&nxt.time>=time?nxt:undefined;
 const end=previous?previous.time+previous.duration:-10,start=next?.time??1e6,gap=start-end;
 let rotations=idlePose.map(q=>q.clone());
 if(previous&&next&&gap<.50){const u=clamp((time-end)/Math.max(.001,gap)),s=smooth(u),a=contactPose(previous,end),b=contactPose(next,start),restWeight=Math.pow(Math.sin(u*Math.PI),2)*smooth(gap/.22)*.35;rotations=a.map((q,j)=>q.slerp(b[j],s).slerp(idlePose[j],restWeight));}
 else {if(previous){const a=contactPose(previous,end),weight=1-smooth((time-end)/.22);rotations.forEach((q,j)=>q.slerp(a[j],weight));}if(next){const b=contactPose(next,start),weight=smooth(1-(start-time)/.30);rotations.forEach((q,j)=>q.slerp(b[j],weight));}}
 const wave=(u:number)=>Math.pow(Math.sin(clamp(u)*Math.PI),2);
 const arch=previous&&next&&gap<.50?wave((time-end)/gap)*smooth(gap/.22):Math.max(previous?wave((time-end)/.22):0,next?wave((start-time)/.30):0);
 rotations[0].premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,(hand.side==='L'?1:-1)*0.5*arch,'XYZ')));
 // This released RH thumb rests in a curved wrist-local pose between these
 // two fixed score anchors. Contact lifts clear the moving keys at each end.
 // localPose retains the authored joint rolls; all held poses remain unchanged.
 if(hand.side==='R'&&previous?.id==='p00112'&&next?.id==='p00142'
   &&Math.abs(end-27.794411)<1e-7&&Math.abs(start-34.166094)<1e-7
   &&time>end&&time<start){
 const anchor=wp(hand.wrist),origin=finger.bones[0].position.clone().applyQuaternion(pose.q).add(anchor);
 const neutralTouch=origin.clone().add(v3(.2,.45,.2).multiplyScalar(reach).applyQuaternion(pose.q));
 const relaxed=localPose(anchor,pose.q,neutralTouch);
 const liftedContact=(note:Note,at:number)=>{const anchor=climaxContextAnchor(note,at,this.plannedPose(hand,at)),origin=finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??this.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),keySurfaceY(note.midi,z,1)+(note.contactLift??.002)+.015,z);return localPose(anchor.position,anchor.q,touch,note.thumbOpposition??0);};
 const a=contactPose(previous,end),b=contactPose(next,start),aLift=liftedContact(previous,end),bLift=liftedContact(next,start);
 const since=time-end,before=start-time,release=smooth((since-.10)/.4),arrival=smooth(1-(before-.04)/.4);
 rotations=a.map((q,j)=>q.slerp(aLift[j],smooth(since/.10)).slerp(relaxed[j],release).slerp(bLift[j],arrival).slerp(b[j],smooth(1-before/.04)));
 }
 // Relax the thumb in this measured pause; preserve both contact anchors.
 const controls=([{"name":"g95","previous":"p00451","next":"p00459","end":95.039182,"start":95.94507,"target":[0.2,0.45,-0.1],"release":0.22,"arrival":0.22,"ramp":0.1,"arrivalRamp":0.04,"releaseLift":0.03,"arrivalLift":0.03}] as ThumbRestControl[]).find((c:any)=>c.previous===previous?.id&&c.next===next?.id&&Math.abs(end-c.end)<1e-7&&Math.abs(start-c.start)<1e-7);
 if(controls&&previous&&next&&hand.side==='R'&&time>end&&time<start){
 const anchor=wp(hand.wrist),origin=finger.bones[0].position.clone().applyQuaternion(pose.q).add(anchor);
 const neutralTouch=origin.clone().add(v3(...controls.target as [number,number,number]).multiplyScalar(reach).applyQuaternion(pose.q));
 const relaxed=localPose(anchor,pose.q,neutralTouch,controls.opposition??0);
 const liftedContact=(note:Note,at:number,lift:number)=>{const anchor=climaxContextAnchor(note,at,this.plannedPose(hand,at)),origin=finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??this.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),keySurfaceY(note.midi,z,1)+(note.contactLift??.002)+lift,z);return localPose(anchor.position,anchor.q,touch,note.thumbOpposition??0);};
 const a=contactPose(previous,end),b=contactPose(next,start),aLift=liftedContact(previous,end,controls.releaseLift??.015),bLift=liftedContact(next,start,controls.arrivalLift??.015);
 const since=time-end,before=start-time,ramp=controls.ramp??.10,arrivalRamp=controls.arrivalRamp??ramp,release=smooth((since-ramp)/(controls.release??.4)),arrival=smooth(1-(before-arrivalRamp)/(controls.arrival??.4));
 rotations=a.map((q,j)=>q.slerp(aLift[j],smooth(since/ramp)).slerp(relaxed[j],release).slerp(bLift[j],arrival).slerp(b[j],smooth(1-before/arrivalRamp)));
 
 }
 finger.bones.forEach((bone,j)=>{bone.quaternion.copy(rotations[j]);bone.updateWorldMatrix(false,true);});
 return;
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
 const openingRest=hand.side==='R'?smooth((time-6.0390358363389325)/.10)*(1-smooth((time-11.36)/.24)):0;
 if(openingRest>0){const midi=[62,64,67,69,71][fi],touch=v3(keyX(midi),KEY_TOP+.016,[.267,.245,.224,.235,.257][fi]),reference=localPose(wp(hand.wrist),pose.q,touch);idlePose.forEach((q,j)=>q.slerp(reference[j],openingRest));}
 const contactPose=(note:Note,at:number)=>{const anchor=climaxContextAnchor(note,at,this.plannedPose(hand,at)),origin=finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??this.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),(mix(keySurfaceY(note.midi,z,1),piano.contact(note.midi,z).y,hand.side==='R'?smooth((time-6.0390358363389325)/.10)*(1-smooth((time-12.50)/.25)):0))+(note.contactLift??.002),z);return localPose(anchor.position,anchor.q,touch,note.thumbOpposition??0);};
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
 // This measured bass touch keeps its original idle-envelope influence until its contact phase.
 const bassOriginalContacts:Record<string,{time:number;duration:number;contactZ:number|null;contactLift:number}> = {"p00322":{"time":71.178428,"duration":0.269968,"contactZ":null,"contactLift":0.0062824555694730895}};
 const boundEnvelope=(note:Note,at:number,amount:number)=>{
  const value=envelope(contactPose(note,at)),old=hand.side==='L'&&fi===1&&note.contactZ===.280&&note.contactLift===.002?bassOriginalContacts[note.id]:undefined;
  if(!old||note.time!==old.time||note.duration!==old.duration)return value;
  const reference={...note,contactLift:old.contactLift};
  if(old.contactZ===null)delete reference.contactZ;else reference.contactZ=old.contactZ;
  return mix(envelope(contactPose(reference,at)),value,amount);
 };
 if(previous)weight=Math.min(weight,boundEnvelope(previous,end,previous&&next&&gap<.50?1-smooth((time-end)/Math.max(.001,gap)):1-smooth((time-end)/.19)));
 if(next){let nextEnvelope=boundEnvelope(next,start,previous&&next&&gap<.50?smooth((time-end)/Math.max(.001,gap)):smooth(1-(start-time)/.27));
  if(hand.side==='R'&&fi===1&&previous?.id==='p00285'&&next.id==='p00302'&&Math.abs(end-64.184354)<1e-7&&Math.abs(start-67.016236)<1e-7)nextEnvelope=mix(.14897594070608658,nextEnvelope,smooth((time-65.7)/.2));
  weight=Math.min(weight,nextEnvelope);
 }
 weight=mix(weight,1,openingRest);
 const fallback=localPose(wp(hand.wrist),pose.q,target);
 finger.bones.forEach((bone,j)=>{bone.quaternion.copy(fallback[j].slerp(rotations[j],weight));bone.updateWorldMatrix(false,true);});
 applyIdleNonthumb(time,hand.side,fi,finger.bones,hand.wrist,base,previous,next);
 return;
 }

 for(let j=0;j<3;j++){
 const dir=points[j+1].clone().sub(points[j]).normalize(),normal=shape.normal;let q:THREE.Quaternion;
 q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(finger.frameOffsets[j]);
 setWorldQ(finger.bones[j],q);
 }
 if(n&&time>=n.time&&time<n.time+n.duration)this.contacts.push({hand:hand.side,finger:fi+1,midi:n.midi,error:wp(finger.tip).distanceTo(desired)});
 };
 solveFinger(hand.fingerNotes[fi]);
 // Refingering must not replace long-gap lookahead outside its local posture.
 const context=climaxIdleContext(hand,fi,time);
 if(context&&!current.some(n=>n.finger===fi+1)){
  const actual=finger.bones.map(b=>b.quaternion.clone());solveFinger(context.notes);
  finger.bones.forEach((b,j)=>{b.quaternion.slerp(actual[j],1-context.weight);b.updateWorldMatrix(false,true);});
 }
 }
 }
 }
}

function releaseRepair(player:OriginalPianist,time:number,piano:GrandPiano){
 const envelope=smooth((time-106.65)/.13)*(1-smooth((time-107.35)/.20));if(envelope===0)return;
 const hand=player.hands[1];
 for(let fi=1;fi<5;fi++){
  if(hand.notes.some(n=>n.finger===fi+1&&n.time<=time&&n.time+n.duration>time))continue;
  const f=hand.fingers[fi],ns=hand.fingerNotes[fi];let previous:Note|undefined,next:Note|undefined;for(const n of ns){if(n.time+n.duration<=time)previous=n;else if(n.time>=time){next=n;break;}}
  const contact=(note:Note,at:number)=>{const anchor=player.plannedPose(hand,at),origin=f.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??player.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),piano.contact(note.midi,z).y+(note.contactLift??.002),z),chain=player.fingerPoints(origin,touch,f,fi,anchor.q),points=[origin,chain.pip,chain.dip,chain.tip],world=f.bones.map((b,j)=>{const dir=points[j+1].clone().sub(points[j]).normalize(),normal=chain.normal;return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]);});return world.map((q,j)=>(j===0?anchor.q:world[j-1]).clone().invert().multiply(q));};
  let rotations=f.rest.map(q=>q.clone());
  if(fi===1&&previous&&next&&['p00519','p00524'].includes(previous.id)){
   const end=previous.time+previous.duration,gap=next.time-end,u=(time-end)/gap,a=contact(previous,end),b=contact(next,next.time);rotations=a.map((q,j)=>q.slerp(b[j],smooth(u)));rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(-1,0,0),Math.sin(u*Math.PI)**2*(0)*Math.PI/180));
   rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(0,0,-1),Math.sin(u*Math.PI)**2*(0)*Math.PI/180));
  }else{
   const since=previous?time-previous.time-previous.duration:100,before=next?next.time-time:100;
   const w=smooth(since/.19)*smooth(before/.27);const neutral=f.rest.map(q=>q.clone()),wristQ=hand.wrist.getWorldQuaternion(new THREE.Quaternion()),axis=v3(-1,0,0).applyQuaternion(wristQ);let parentQ=wristQ.clone();for(let j=0;j<3;j++){const angle=[30,-(35),-(20)][j],localAxis=axis.clone().applyQuaternion(parentQ.clone().invert());neutral[j].premultiply(new THREE.Quaternion().setFromAxisAngle(localAxis,angle*Math.PI/180));parentQ.multiply(neutral[j]);}rotations.forEach((q,j)=>q.copy(f.bones[j].quaternion).slerp(neutral[j],w));
  }
  f.bones.forEach((b,j)=>{b.quaternion.slerp(rotations[j],envelope);b.updateWorldMatrix(false,true);});
 }
}
const p299Ease=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
function p299Idle(player:OriginalPianist,time:number){
 if(time<=65.9||time>=67.016236)return;
 const hand=player.hands[1];
 for(const fi of [1,3]){
  if(hand.notes.some(n=>n.finger===fi+1&&n.time<=time&&n.time+n.duration>time))continue;
  let previous:Note|undefined,next:Note|undefined;for(const n of hand.fingerNotes[fi]){if(n.time+n.duration<=time)previous=n;else if(n.time>=time){next=n;break;}}
  if(!previous||!next)continue;
  let amount=0;
  if(fi===1&&previous.id==='p00285'&&next.id==='p00302')amount=10*p299Ease((time-65.9)/.13)*p299Ease((next.time-time)/.27);
  if(fi===3&&previous.id==='p00296'&&next.id==='p00301')amount=15*p299Ease((time-previous.time-previous.duration)/0.1)*p299Ease((next.time-time)/0.1);
  if(!amount)continue;
  const bone=hand.fingers[fi].bones[0],wristQ=hand.wrist.getWorldQuaternion(new THREE.Quaternion()),axis=v3(-1,0,0).applyQuaternion(wristQ),parentQ=bone.parent!.getWorldQuaternion(new THREE.Quaternion()),worldQ=new THREE.Quaternion().setFromAxisAngle(axis,amount*Math.PI/180);
  bone.quaternion.premultiply(parentQ.clone().invert().multiply(worldQ).multiply(parentQ));bone.updateWorldMatrix(false,true);
 }
}


function virtualChordRest(player:OriginalPianist,time:number,piano:GrandPiano){
 const scopes=[{hi:0,begin:159.007812,arrival:159.153206,end:159.374607,finish:159.501539,lanes:[[1,50],[2,47],[3,45]]},{hi:1,begin:158.981206,arrival:159.09974459071665,end:159.65,finish:159.90,lanes:[[0,67],[1,69],[2,71],[3,72],[4,74]]}];
 for(const scope of scopes){
  const amount=smooth((time-scope.begin)/(scope.arrival-scope.begin))*(1-smooth((time-scope.end)/(scope.finish-scope.end)));if(!amount)continue;
  const hand=player.hands[scope.hi],q=hand.wrist.getWorldQuaternion(new THREE.Quaternion());
  for(const [fi,midi] of scope.lanes){
   const notes=hand.fingerNotes[fi];if(notes.some(n=>n.time<=time&&n.time+n.duration>time))continue;
   const previous=notes.filter(n=>n.time+n.duration<=time).at(-1),next=notes.find(n=>n.time>=time),since=previous?time-previous.time-previous.duration:100,before=next?next.time-time:100;
   const weight=amount*smooth(since/.09)*smooth(before/.12),f=hand.fingers[fi],base=wp(f.bones[0]),reach=f.lengths.reduce((a,b)=>a+b,0),z=base.z-reach*.75,touch=piano.contact(midi,z);touch.y+=.024;if(scope.hi===1){if(time>159.188206)touch.x+=wp(hand.wrist).x-.0796966666666667;if(fi===1)touch.x-=.006;}else if(time>159.159706)touch.x+=wp(hand.wrist).x+.218;
   const chain=player.fingerPoints(base,touch,f,fi,q,fi===0?1.1:0),points=[base,chain.pip,chain.dip,chain.tip],world=f.bones.map((bone,j)=>{const dir=points[j+1].clone().sub(points[j]).normalize(),normal=chain.normal;return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]);});
   const local=world.map((rotation,j)=>(j===0?q:world[j-1]).clone().invert().multiply(rotation));f.bones.forEach((bone,j)=>{bone.quaternion.slerp(local[j],weight);bone.updateWorldMatrix(false,true);});
  }
 }
}

function liveChordTransitions(player:OriginalPianist,time:number,piano:GrandPiano){
 if(time<158.95||time>159.85)return;
 const touched=new Set(['p00719','p00720','p00721','p00722','p00723']),arrivals=new Set([...touched,'p00724','p00725']);
 for(const hand of player.hands){const q=hand.wrist.getWorldQuaternion(new THREE.Quaternion());
  for(let fi=0;fi<5;fi++){
   const notes=hand.fingerNotes[fi];if(notes.some(n=>n.time<=time&&n.time+n.duration>time))continue;
   const previous=notes.filter(n=>n.time+n.duration<=time).at(-1),next=notes.find(n=>n.time>=time),since=previous?time-previous.time-previous.duration:100,before=next?next.time-time:100;
   const incoming=next&&arrivals.has(next.id)&&before<.20,outgoing=previous&&touched.has(previous.id)&&since<.18;if(!incoming&&!outgoing)continue;
   const f=hand.fingers[fi],base=wp(f.bones[0]),reach=f.lengths.reduce((a,b)=>a+b,0),touchOf=(n:Note)=>{const z=n.contactZ??player.contactDepth(base.z,isBlack(n.midi),fi),p=piano.contact(n.midi,z);p.y+=n.contactLift??.002;return p;};
   let touch:THREE.Vector3,amount:number,opposition=0;
   if(incoming&&previous&&next!.time-previous.time-previous.duration<.50){
    const gap=next!.time-previous!.time-previous!.duration,u=clamp(since/gap);touch=touchOf(previous!).lerp(touchOf(next!),smooth(u));touch.y+=.030*Math.sin(u*Math.PI)**2;amount=1;opposition=mix(previous!.thumbOpposition??0,next!.thumbOpposition??0,smooth(u));
   }else if(incoming){touch=touchOf(next!);touch.y+=.020*smooth(before/.12);amount=smooth((.20-before)/.08);opposition=next!.thumbOpposition??0;}
   else {
    const lanes=hand.side==='L'?[55,50,47,45,43]:[67,69,71,72,74],z=base.z-reach*.75,neutral=piano.contact(lanes[fi],z);neutral.y+=.024;neutral.x+=wp(hand.wrist).x-(hand.side==='L'?-.218:.0796966666666667);if(hand.side==='R'&&fi===1)neutral.x-=.006;
    const u=clamp(since/.09);touch=touchOf(previous!).lerp(neutral,smooth(u));touch.y+=.006*Math.sin(u*Math.PI)**2;amount=(1-smooth((since-.11)/.07))*smooth(before/.07);opposition=previous!.thumbOpposition??0;
   }
   const chain=player.fingerPoints(base,touch,f,fi,q,opposition),points=[base,chain.pip,chain.dip,chain.tip],world=f.bones.map((b,j)=>{const dir=points[j+1].clone().sub(points[j]).normalize(),normal=chain.normal;return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]);}),local=world.map((rotation,j)=>(j===0?q:world[j-1]).clone().invert().multiply(rotation));
   f.bones.forEach((bone,j)=>{bone.quaternion.slerp(local[j],amount);bone.updateWorldMatrix(false,true);});
  }
 }
}


const climaxOriginalIdleNotes=[{"id":"p00720","time":159.159706,"duration":0.264901,"midi":55,"velocity":0.683,"hand":"L","finger":2,"role":"bass","bar":57,"beat":0,"contactLift":0.0017201214246451856,"writtenDuration":0.313833,"contactZ":0.2414034716186579,"idleAnchors":[{"at":159.159706,"position":[-0.19510754537537695,0.7588795809836498,0.34487155656591056],"quaternion":[0.17296534487421944,-0.7110521538193679,0.6623988981720683,-0.16036060526765847]},{"at":159.424607,"position":[-0.19510754537537695,0.7588795809836498,0.34487155656591056],"quaternion":[0.17296534487421944,-0.7110521538193679,0.6623988981720683,-0.16036060526765847]}]},{"id":"p00721","time":159.181206,"duration":0.252444,"midi":67,"velocity":0.6307,"hand":"R","finger":2,"role":"harmony","bar":57,"beat":0,"contactLift":0.003008,"writtenDuration":0.306866,"idleAnchors":[{"at":159.181206,"position":[0.09721,0.7397400000000001,0.382],"quaternion":[-0.0589776940544944,-0.7484566234347281,0.6579472775970895,0.05864890743465325]},{"at":159.43365,"position":[0.10730768570061214,0.7408699222769795,0.3837008513148194],"quaternion":[-0.05183493996380477,-0.7428683384703474,0.6654196489056265,0.05173452954813588]}]},{"id":"p00722","time":159.184706,"duration":0.243389,"midi":71,"velocity":0.6307,"hand":"R","finger":4,"role":"harmony","bar":57,"beat":0,"contactLift":0.002391,"writtenDuration":0.303366,"idleAnchors":[{"at":159.184706,"position":[0.09721,0.7397400000000001,0.382],"quaternion":[-0.0589776940544944,-0.7484566234347281,0.6579472775970895,0.05864890743465325]},{"at":159.428095,"position":[0.10436887638637647,0.7405410720621478,0.38320583910763434],"quaternion":[-0.05391480524781695,-0.744509034631941,0.6632576058339886,0.05374792488897258]}]}] as (Note&{idleAnchors:{at:number;position:number[];quaternion:number[]}[]})[];
function climaxContextAnchor(note:Note,at:number,fallback:HandPose):HandPose {
 const anchor=(note as any).idleAnchors?.find((a:any)=>Math.abs(a.at-at)<1e-7);
 return anchor?{position:v3(...anchor.position as [number,number,number]),q:new THREE.Quaternion(...anchor.quaternion as [number,number,number,number])}:fallback;
}
function climaxIdleContext(hand:HandRig,fi:number,time:number){
 if(fi===0)return null;
 const limits=hand.side==='L'?{1:[159.50,160.501539]}:{1:[153.760383,160.514539],2:[159.50,160.856873],3:[159.50,161.181206]};const span=(limits as any)[fi];if(!span||time<=span[0]||time>=span[1])return null;
 // The original neutral reference fades out before chord support and returns
 // after the clean departure anchor. Only inactive joint curves are blended.
 const weight=1-smooth((time-158.90)/.10)*(1-smooth((time-159.50)/.15));
 if(weight===0)return null;
 const notes=hand.fingerNotes[fi].filter(n=>!['p00720','p00721','p00722'].includes(n.id));
 notes.push(...climaxOriginalIdleNotes.filter(n=>n.hand===hand.side&&n.finger===fi+1));notes.sort((a,b)=>a.time-b.time);
 return {notes,weight};
}


// Carry the complete supported non-thumb posture through the octave approach.
// All three local joint rotations share one monotone phase; no moving-target
// inverse bend is evaluated inside this authored transition.
const climaxNonthumbArrival=[[[[-0.40613338630231355,0.4113140131804842,-0.27687052021717007,-0.7676061281160192],[0.1254311655985068,-0.3921618546555416,-0.017886395379045544,-0.9111291193392078],[-0.03514591727872629,0.38360495494492125,-0.027215067278424765,0.9224268461102552]],[[-0.2906210851990639,-0.10480000460865235,0.126151449968551,0.9426781823838808],[0.3233492956033822,0.13684209250449186,-0.07606353817330648,0.933238347322026],[0.1617389982798334,0.0536138962705241,-0.005029968809412114,0.9853632558482714]],[[-0.2283862451867844,0.004500699331975562,0.08125296562965906,0.9701636059404573],[0.35334545698389686,0.10854521263601344,-0.013060826186461077,0.9290825257542901],[0.1682869492465458,0.14207505600314357,0.0383559554141534,0.9746912341143024]],[[-0.23408671678453347,0.15493270621663774,0.044919801061728985,0.9587395251276551],[0.33824304569833746,0.11282420377904973,0.09665379304757857,0.9292579756815929],[0.16020236034801977,-0.03079839570338569,0.061746211675091756,0.9846695221772612]],[[0.06642902098985004,0.20474065054358198,-0.36445592418849226,0.9060023897178726],[0.02479879847762828,-0.00198983679085699,0.0059003202687395945,0.9996730697404719],[0.011576852448071545,0.09737967617296545,0.003954395439951771,0.9951721147181268]]],[[[0.7001514348659952,-0.23526500381163287,0.21139717588868553,0.6401168489134532],[-0.5341323694917186,0.33286812551864586,0.07616764637156118,0.7733691954823918],[-0.15666274942597538,0.37637129810142117,-0.12131252218541042,0.9050329833043433]],[[-0.5001616041549686,0.0494390338561648,0.0188502465430991,0.864314069524565],[0.5134193863460182,0.12325957084012798,-0.12077548164429294,0.8406074559233787],[0.26339955293392,0.05240945082069659,-0.008191382822971056,0.9632272972805185]],[[-0.35985941695241364,0.1643649846354873,-0.20689033294345616,0.8948082101228975],[0.4397500869743118,0.10420188024123092,-0.016255027742749922,0.8919067233928439],[0.2115476319516354,0.14080369362908515,0.04821621391975027,0.9659695212538058]],[[-0.2885492497480288,0.3009397387278099,-0.30040324283149755,0.8578650748998704],[0.36889204405232046,0.1113046849536565,0.10541174062132139,0.9167433075193141],[0.17530533278563162,-0.03070593566173744,0.06756743666886354,0.9817127010047569]],[[-0.05886786937654078,0.24108508579678886,-0.6676017079591636,0.7019405351533912],[-0.39055220023384346,0.00182341484957177,-0.09293356651484176,-0.9158760867418813],[0.18641564860485965,0.09547865364739382,0.06367746201405719,0.975744953091923]]]];
const climaxNonthumbLiftAxes=[[-0.9483243939951909,0.18243419888476753,0.25961239031716216],[-0.9015569994607036,0.3509972413050483,0.25297410923752794],[-0.8832877274761183,0.3968122657803761,0.24968540802767045]];
function climaxNonthumbContinuity(player:OriginalPianist,time:number){
 if(time<=158.99||time>=159.153206)return;
 const hand=player.hands[0],u=smooth((time-158.99)/(159.153206-158.99));
 for(const fi of [1,2,3]){if(hand.fingerNotes[fi].some(n=>n.time<=time&&n.time+n.duration>time))continue;
  hand.fingers[fi].bones.forEach((b,j)=>{b.quaternion.fromArray(climaxNonthumbArrival[0][fi][j]).slerp(new THREE.Quaternion().fromArray(climaxNonthumbArrival[1][fi][j]),u);if(j===0)b.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(v3(...climaxNonthumbLiftAxes[fi-1] as [number,number,number]),.10*Math.sin(Math.PI*(time-158.99)/(159.153206-158.99))**2));b.updateWorldMatrix(false,true);});
 }
}


// Keep the already reviewed curved release posture during this long thumb rest.
// The wrist carries the hand while all three local joints retain their relation.
const climaxRightThumbRest=[[0.4131036044501331,0.65746541850643,-0.35640774368231043,0.5196711996077494],[-0.48850149643925833,-0.3438646331371362,-0.06966535475332468,0.7989181061918433],[-0.14203256974801562,-0.3777384330960695,0.10997893281324457,0.908319910400604]];
function relaxedClimaxThumb(player:OriginalPianist,time:number){
 if(time<=159.5||time>=163.525895)return;
 const hand=player.hands[1],ns=hand.fingerNotes[0];
 const previous=ns.filter(n=>n.time+n.duration<=time).at(-1),next=ns.find(n=>n.time>=time);
 if(previous?.id!=='p00721'||next?.id!=='p00750'||Math.abs(previous.time+previous.duration-159.38365)>1e-7||Math.abs(next.time-163.825895)>1e-7)return;
 const w=smooth((time-159.5)/.16)*(1-smooth((time-163.225895)/.30));
 hand.fingers[0].bones.forEach((b,j)=>{b.quaternion.slerp(new THREE.Quaternion().fromArray(climaxRightThumbRest[j]),w);b.updateWorldMatrix(false,true);});
}

export class Pianist extends OriginalPianist {
 plannedPose(hand:HandRig,time:number):HandPose{const pose=super.plannedPose(hand,time);if(hand.side==='L'&&time>159.374607&&time<159.498539){pose.position.y+=.005*Math.sin(Math.PI*(time-159.374607)/(159.498539-159.374607))**2;}if(hand.side==='R'){const w=p299Ease((time-66.18)/(66.30195-66.18))*(1-p299Ease((time-66.54)/(66.668093-66.54)));pose.position.x-=.035*w;for(const [end,start,dy,dz]of[[106.81,106.919774,.020,.024],[107.18,107.269683,.024,0]]){if(time<=end||time>=start)continue;const u=(time-end)/(start-end),w=Math.sin(u*Math.PI)**2;pose.position.y+=dy*w;pose.position.z+=dz*w;}}return pose;}
 update(time:number,score:Score,piano:GrandPiano,pedal:number,energy:number){super.update(time,score,piano,pedal,energy);releaseRepair(this,time,piano);p299Idle(this,time);virtualChordRest(this,time,piano);liveChordTransitions(this,time,piano);climaxNonthumbContinuity(this,time);relaxedClimaxThumb(this,time);}
}
