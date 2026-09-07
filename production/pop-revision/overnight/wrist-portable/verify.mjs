import fs from 'node:fs';
import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {T,setup,project,rigPath,baselineSource} from './load.mjs';
import {createWristVolumeCorrector} from './wrist-volume.mjs';
const {body,pose,score,pianist,piano}=await setup();
const initialPosition=body.geometry.attributes.position.array.slice(),initialNormal=body.geometry.attributes.normal.array.slice();
const options=process.argv.includes('--roll')?{rollForearm:true,smoothWeights:8}:{};
const c=createWristVolumeCorrector(T,body,options),ids=new Set(c.entries.map(e=>e.id));
const initialWeights=body.geometry.attributes.skinWeight.array.slice(),initialIndices=body.geometry.attributes.skinIndex.array.slice(),initialBind=body.bindMatrix.clone();
const pos=body.geometry.attributes.position,norm=body.geometry.attributes.normal,si=body.geometry.attributes.skinIndex,sw=body.geometry.attributes.skinWeight;
const out={inputs:Object.fromEntries(['app/performance/pianist.ts','production/qa/compiled/pianist.mjs','public/assets/pianist.glb','public/assets/score.json'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f==='production/qa/compiled/pianist.mjs'?rigPath:f==='app/performance/pianist.ts'?baselineSource:f==='public/assets/pianist.glb'?(process.env.DAYBREAK_MODEL??project+'/'+f):f==='public/assets/score.json'?(process.env.DAYBREAK_SCORE??project+'/'+f):project+'/'+f)).digest('hex')])),candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('wrist-volume.mjs',import.meta.url))).digest('hex'),changedVertices:c.entries.length,frames:0,protectedAttributeChanges:0,maxProtectedWorldError:0,maxBoneMatrixChange:0,maxDirectRepeatError:0,maxCpuGpuError:0,maxNormalGpuError:0,maxCorrection:0,minBlendDeterminant:1,fallBackFrames:0,newKeyCoreVertices:0,wristRadius:[],negativeControls:{},timings:[]};
function require(ok,message){if(!ok)throw Error(message);}
function world(id){return body.getVertexPosition(id,new T.Vector3()).applyMatrix4(body.matrixWorld);}
function gpu(id){
 const p=new T.Vector3().fromBufferAttribute(pos,id);const ma=body.geometry.morphAttributes.position;const mi=body.morphTargetInfluences;
 if(ma)for(let j=0;j<ma.length;j++)if(mi[j]){const v=new T.Vector3().fromBufferAttribute(ma[j],id);if(!body.geometry.morphTargetsRelative)v.sub(new T.Vector3().fromBufferAttribute(pos,id));p.addScaledVector(v,mi[j]);}
 const input=new T.Vector4(p.x,p.y,p.z,1).applyMatrix4(body.bindMatrix),output=new T.Vector4(0,0,0,0);
 for(let j=0;j<4;j++){const b=si.getComponent(id,j),w=sw.getComponent(id,j);if(!w)continue;const m=new T.Matrix4().fromArray(body.skeleton.boneMatrices,b*16);output.add(input.clone().applyMatrix4(m).multiplyScalar(w));}
 output.applyMatrix4(body.bindMatrixInverse);return new T.Vector3(output.x,output.y,output.z).applyMatrix4(body.matrixWorld);
}
function keyDepth(id){const point=world(id);let depth=0;for(const [midi,k]of piano.keys){k.mesh.geometry.computeBoundingBox();const b=k.mesh.geometry.boundingBox,l=k.mesh.worldToLocal(point.clone());if(b.containsPoint(l))depth=Math.max(depth,Math.min(l.x-b.min.x,b.max.x-l.x,l.y-b.min.y,b.max.y-l.y,l.z-b.min.z,b.max.z-l.z));}return depth;}
function normalAgreement(e){
 const blend=new T.Matrix4();blend.elements.fill(0);const gpuBlend=new T.Matrix4();gpuBlend.elements.fill(0);const qs=[];
 for(const {bone,weight}of e.influences){const m=body.bindMatrixInverse.clone().multiply(body.skeleton.bones[bone].matrixWorld).multiply(body.skeleton.boneInverses[bone]).multiply(body.bindMatrix),gm=body.bindMatrixInverse.clone().multiply(new T.Matrix4().fromArray(body.skeleton.boneMatrices,bone*16)).multiply(body.bindMatrix);for(let k=0;k<16;k++){blend.elements[k]+=m.elements[k]*weight;gpuBlend.elements[k]+=gm.elements[k]*weight;}}
 for(const {bone,weight}of e.targetInfluences??e.influences){if(bone!==e.forearmIndex&&bone!==e.handIndex)continue;const m=body.bindMatrixInverse.clone().multiply(body.skeleton.bones[bone].matrixWorld).multiply(body.skeleton.boneInverses[bone]).multiply(body.bindMatrix),q=new T.Quaternion();m.decompose(new T.Vector3(),q,new T.Vector3());q.normalize();
  if(options.rollForearm&&bone===e.forearmIndex){
   const lower=body.skeleton.bones[bone],hand=body.skeleton.bones[e.handIndex],l=lower.getWorldQuaternion(new T.Quaternion()),h=hand.getWorldQuaternion(new T.Quaternion()),lr=new T.Quaternion(),hr=new T.Quaternion();body.skeleton.boneInverses[bone].clone().invert().decompose(new T.Vector3(),lr,new T.Vector3());body.skeleton.boneInverses[e.handIndex].clone().invert().decompose(new T.Vector3(),hr,new T.Vector3());
   const relative=l.clone().invert().multiply(h).multiply(hr.invert()).multiply(lr),axis=hand.position.clone().normalize(),amount=new T.Vector3(relative.x,relative.y,relative.z).dot(axis),twist=new T.Quaternion(axis.x*amount,axis.y*amount,axis.z*amount,relative.w).normalize();if(twist.w<0)twist.set(-twist.x,-twist.y,-twist.z,-twist.w);
   const meshQ=body.getWorldQuaternion(new T.Quaternion()),space=meshQ.clone().invert().multiply(l),extra=space.clone().multiply(new T.Quaternion().slerp(twist,e.roll)).multiply(space.invert());q.premultiply(extra).normalize();
  }
  qs.push({q,weight});
 }
 const weights=qs.map(({q,weight})=>q.dot(qs[0].q)<0?-weight:weight),q=new T.Quaternion(...['x','y','z','w'].map(k=>qs.reduce((s,v,i)=>s+v.q[k]*weights[i],0))).normalize();
 const base=new T.Vector3().fromArray(initialNormal,e.id*3),current=new T.Vector3().fromBufferAttribute(norm,e.id),mn=body.geometry.morphAttributes.normal;
 if(mn)for(let j=0;j<mn.length;j++){const w=body.morphTargetInfluences[j]??0;if(!w)continue;const v=new T.Vector3().fromBufferAttribute(mn[j],e.id);if(body.geometry.morphTargetsRelative){base.addScaledVector(v,w);current.addScaledVector(v,w);}else{base.addScaledVector(v.clone().sub(new T.Vector3().fromArray(initialNormal,e.id*3)),w);current.addScaledVector(v.clone().sub(new T.Vector3().fromBufferAttribute(norm,e.id)),w);}}
 const target=base.clone().applyQuaternion(q).multiplyScalar(qs.reduce((s,v)=>s+v.weight,0));for(const {bone,weight}of e.targetInfluences??e.influences)if(bone!==e.forearmIndex&&bone!==e.handIndex){const m=body.bindMatrixInverse.clone().multiply(body.skeleton.bones[bone].matrixWorld).multiply(body.skeleton.boneInverses[bone]).multiply(body.bindMatrix);target.addScaledVector(base.clone().applyMatrix3(new T.Matrix3().setFromMatrix4(m)),weight);}target.normalize().lerp(base.clone().applyMatrix3(new T.Matrix3().setFromMatrix4(blend)).normalize(),1-e.amount).normalize();const actual=current.applyMatrix3(new T.Matrix3().setFromMatrix4(gpuBlend)).normalize();
 return target.distanceTo(actual);
}
const sampleTimes=[0,6,26.05,64,96,130,170,210,score.duration];
const denseTimes=Array.from({length:Math.ceil(score.duration/.5)+1},(_,i)=>Math.min(score.duration,i*.5));
for(const time of [...new Set([...sampleTimes,...denseTimes])].sort((a,b)=>a-b)){
 c.restore();pose(time);
 const beforeBones=body.skeleton.bones.map(b=>b.matrixWorld.toArray()),beforeContacts=JSON.stringify(pianist.contacts);
 const selected=c.entries.map(e=>world(e.id)),depths=sampleTimes.includes(time)?c.entries.map(e=>keyDepth(e.id)):[];
 const protectedVertices=sampleTimes.includes(time)?Array.from({length:pos.count},(_,i)=>i).filter(i=>!ids.has(i)).map(id=>({id,p:world(id)})):[];
 const beforeRadius=c.entries.filter(e=>e.influences.length===2&&e.influences.every(v=>sw.getComponent(e.id,0)>.2&&sw.getComponent(e.id,0)<.8));
 const radius=beforeRadius.map(e=>{const hand=body.skeleton.bones.findIndex(b=>b.name===e.side+'Hand'),restWrist=new T.Vector3().setFromMatrixPosition(body.skeleton.boneInverses[hand].clone().invert()),bind=new T.Vector3().fromArray(initialPosition,e.id*3),wrist=body.skeleton.bones[hand].getWorldPosition(new T.Vector3());return {id:e.id,rest:bind.distanceTo(restWrist),before:world(e.id).distanceTo(wrist),wrist};});
 const began=performance.now(),metrics={...c.update()};out.timings.push(performance.now()-began);
 out.frames++;out.maxCorrection=Math.max(out.maxCorrection,metrics.maxCorrection);out.minBlendDeterminant=Math.min(out.minBlendDeterminant,metrics.minBlendDeterminant);if(metrics.fallbacks)out.fallBackFrames++;
 if(sampleTimes.includes(time)){
  const radii=radius.map(r=>({before:r.before/r.rest,after:world(r.id).distanceTo(r.wrist)/r.rest}));
  out.wristRadius.push({time,vertices:radii.length,beforeMin:Math.min(...radii.map(r=>r.before)),beforeMean:radii.reduce((s,r)=>s+r.before,0)/radii.length,afterMin:Math.min(...radii.map(r=>r.after)),afterMean:radii.reduce((s,r)=>s+r.after,0)/radii.length});
  for(const {id,p}of protectedVertices)out.maxProtectedWorldError=Math.max(out.maxProtectedWorldError,p.distanceTo(world(id)));
  for(const [i,e]of c.entries.entries()){if(keyDepth(e.id)>.003&&depths[i]<=.003)out.newKeyCoreVertices++;out.maxCpuGpuError=Math.max(out.maxCpuGpuError,world(e.id).distanceTo(gpu(e.id)));out.maxNormalGpuError=Math.max(out.maxNormalGpuError,normalAgreement(e));}
 }
 for(let i=0;i<body.skeleton.bones.length;i++)for(let j=0;j<16;j++)out.maxBoneMatrixChange=Math.max(out.maxBoneMatrixChange,Math.abs(beforeBones[i][j]-body.skeleton.bones[i].matrixWorld.elements[j]));
 require(beforeContacts===JSON.stringify(pianist.contacts),'contact data mutation');
 const saved=c.entries.map(e=>world(e.id));c.update();for(let j=0;j<saved.length;j++)out.maxDirectRepeatError=Math.max(out.maxDirectRepeatError,saved[j].distanceTo(world(c.entries[j].id)));
}
for(let i=0;i<pos.count;i++)if(!ids.has(i))for(let j=0;j<3;j++)if(pos.array[i*3+j]!==initialPosition[i*3+j]||norm.array[i*3+j]!==initialNormal[i*3+j])out.protectedAttributeChanges++;
require(initialWeights.every((v,i)=>v===sw.array[i])&&initialIndices.every((v,i)=>v===si.array[i]),'weights/bones mutated');require(initialBind.equals(body.bindMatrix),'bind matrix mutation');
// Deterministic direct seek in both orders, with nonzero facial morphs active.
pose(170);c.update();const seek=c.entries.map(e=>world(e.id));pose(64);c.update();pose(170);c.update();out.seekMaxError=Math.max(...seek.map((p,i)=>p.distanceTo(world(c.entries[i].id))));
// Explicit negative controls: non-rigid transform and absolute morph cancellation
// must restore rather than explode, and synthetic LBS twisted ring must collapse.
const bone=body.skeleton.bones[c.entries[0].influences[0].bone],oldScale=bone.scale.clone();bone.scale.multiplyScalar(1.1);bone.updateWorldMatrix(true,true);c.update();out.negativeControls.nonrigidFallbacks=c.metrics.fallbacks;bone.scale.copy(oldScale);pose(170);
const oldRelative=body.geometry.morphTargetsRelative,oldMorphs=body.morphTargetInfluences.slice();body.geometry.morphTargetsRelative=false;body.morphTargetInfluences.fill(0);body.morphTargetInfluences[0]=1;c.update();out.negativeControls.absoluteMorphCancellationFallbacks=c.metrics.fallbacks;body.geometry.morphTargetsRelative=oldRelative;body.morphTargetInfluences.splice(0,body.morphTargetInfluences.length,...oldMorphs);pose(170);c.update();
out.negativeControls.lbsTwistRadius=Math.cos(Math.PI/3);out.negativeControls.radiusOracleDetectsCollapse=out.wristRadius.some(r=>r.beforeMin<.8)&&out.wristRadius.every(r=>r.afterMin>.99);
const sorted=out.timings.slice().sort((a,b)=>a-b);out.performanceMs={median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)};delete out.timings;
require(out.protectedAttributeChanges===0&&out.maxProtectedWorldError===0&&out.maxBoneMatrixChange===0,'protected geometry regression');
require(out.maxDirectRepeatError<1e-8&&out.seekMaxError<1e-8,'seek drift');require(out.maxCpuGpuError<.000001&&out.maxNormalGpuError<.00001,'CPU GPU mismatch');
require(out.newKeyCoreVertices===0,'new wrist/key core collision');require(out.fallBackFrames===0,'fallback in normal score');
require(out.negativeControls.nonrigidFallbacks>0&&out.negativeControls.absoluteMorphCancellationFallbacks===c.entries.length,'negative fallback failed');require(out.negativeControls.radiusOracleDetectsCollapse,'radius correction not measured');
out.options=options;fs.writeFileSync(new URL(options.rollForearm?'verification-roll.json':'verification.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));console.log('WRIST_CORRECTION_NUMERICAL_PASS');
