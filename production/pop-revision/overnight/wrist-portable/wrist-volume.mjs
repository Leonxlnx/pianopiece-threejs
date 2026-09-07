/**
 * Reversible, local DQ correction evaluated from immutable rest attributes.
 * No skeleton changes, no shader override, no fingertip- or finger-owned edits.
 * Calling update after the final pose gives both Three's ordinary GPU skinning
 * and getVertexPosition the same corrected surface. DQ equations follow Kavan
 * et al. 2008; non-rigid transforms fall back to the unchanged LBS surface.
 */
export function createWristVolumeCorrector(T,mesh,{strength=1,smoothWeights=0,rollForearm=false}={}){
 const geometry=mesh.geometry.clone();mesh.geometry=geometry;
 const pos=geometry.attributes.position,norm=geometry.attributes.normal;
 const basePos=pos.array.slice(),baseNorm=norm?.array.slice();
 const si=geometry.attributes.skinIndex,sw=geometry.attributes.skinWeight;
 const names=mesh.skeleton.bones.map(b=>b.name),entries=[],used=new Set();
 const smooth=(v)=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
 for(let id=0;id<pos.count;id++){
  const influences=[];let side='',forearm=0,hand=0,digits=0,other=0;
  for(let j=0;j<4;j++){
   const weight=sw.getComponent(id,j);if(weight===0)continue;
   const bone=si.getComponent(id,j),name=names[bone],m=name.match(/^(Left|Right)(ForeArm|Hand)(.*)$/);
   if(!m||side&&side!==m[1]){other+=weight;continue;}side=m[1];
   if(m[2]==='ForeArm'&&!m[3])forearm+=weight;
   else if(!m[3])hand+=weight;
   else digits+=weight;
   influences.push({bone,weight});
  }
  // This mask ends smoothly at the wrist/thumb boundary. In particular every
  // >35%-finger-weighted vertex and all purely finger-weighted vertices stay exact.
  const amount=strength*smooth(forearm/.055)*(rollForearm?1:smooth(hand/.055))*smooth((.35-digits)/.30);
  if(other>0||forearm===0||(!rollForearm&&hand===0)||amount===0)continue;
  const forearmIndex=names.indexOf(side+'ForeArm'),handIndex=names.indexOf(side+'Hand'),restElbow=new T.Vector3().setFromMatrixPosition(mesh.skeleton.boneInverses[forearmIndex].clone().invert()),restWrist=new T.Vector3().setFromMatrixPosition(mesh.skeleton.boneInverses[handIndex].clone().invert()),axis=restWrist.clone().sub(restElbow),u=new T.Vector3().fromBufferAttribute(pos,id).sub(restElbow).dot(axis)/axis.lengthSq();
  const roll=smooth((u-.15)/.7);if(rollForearm&&roll===0&&hand===0)continue;
  entries.push({id,side,influences,amount,roll,forearmIndex,handIndex});for(const v of influences)used.add(v.bone);
 }
 if(smoothWeights>0){
  const canonical=new Map(),weld=[],neighbors=new Map(),forearms=new Map(),sides=new Map();
  for(let id=0;id<pos.count;id++){const key=[pos.getX(id),pos.getY(id),pos.getZ(id)].join(',');if(!canonical.has(key))canonical.set(key,id);weld[id]=canonical.get(key);neighbors.set(weld[id],new Set());let w=0,side='';for(let j=0;j<4;j++){const name=names[si.getComponent(id,j)];if(/ForeArm$/.test(name)){w+=sw.getComponent(id,j);side=name.startsWith('Left')?'Left':'Right';}if(/Hand$/.test(name))side=name.startsWith('Left')?'Left':'Right';}forearms.set(weld[id],w);sides.set(weld[id],side);}
  const ix=geometry.index.array;for(let i=0;i<ix.length;i+=3)for(let j=0;j<3;j++){const a=weld[ix[i+j]],b=weld[ix[i+(j+1)%3]];if(a!==b&&sides.get(a)===sides.get(b)){neighbors.get(a).add(b);neighbors.get(b).add(a);}}
  const active=new Set(entries.map(e=>weld[e.id]));
  for(let iteration=0;iteration<smoothWeights;iteration++){const next=new Map(forearms);for(const id of active){const adjacent=[...neighbors.get(id)];if(adjacent.length)next.set(id,.5*forearms.get(id)+.5*adjacent.reduce((s,n)=>s+forearms.get(n),0)/adjacent.length);}forearms.clear();for(const [id,w]of next)forearms.set(id,w);}
  for(const e of entries){const arm=e.influences.find(v=>names[v.bone]===e.side+'ForeArm'),hand=e.influences.find(v=>names[v.bone]===e.side+'Hand');if(!hand||!arm)continue;const total=arm.weight+hand.weight,w=Math.max(0,Math.min(total,forearms.get(weld[e.id])));e.targetInfluences=e.influences.map(v=>({...v,weight:v===arm?w:v===hand?total-w:v.weight}));}
 }
 const states=new Map([...used].map(id=>[id,{matrix:new T.Matrix4(),real:new T.Quaternion(),dual:new T.Quaternion(),rigid:true}]));
 const p=new T.Vector3(),n=new T.Vector3(),morph=new T.Vector3(),morphN=new T.Vector3(),target=new T.Vector3(),targetN=new T.Vector3();
 const t=new T.Vector3(),scale=new T.Vector3(),q=new T.Quaternion(),d=new T.Quaternion(),conjugate=new T.Quaternion(),translation=new T.Quaternion();
 const blend=new T.Matrix4(),inverse=new T.Matrix4(),linear=new T.Matrix3(),inverseLinear=new T.Matrix3();
 const origN=new T.Vector3(),dqN=new T.Vector3(),lbsN=new T.Vector3();
 const ranges=['Left','Right'].map(side=>entries.filter(e=>e.side===side).map(e=>e.id)).filter(v=>v.length).map(v=>({start:Math.min(...v)*3,count:(Math.max(...v)-Math.min(...v)+1)*3}));
 pos.setUsage(T.DynamicDrawUsage);if(norm)norm.setUsage(T.DynamicDrawUsage);
 function dirty(){for(const attr of [pos,norm])if(attr){attr.clearUpdateRanges();for(const range of ranges)attr.addUpdateRange(range.start,range.count);attr.needsUpdate=true;}}
 const rolls=new Map(),virtual={rigid:true,matrix:new T.Matrix4(),real:new T.Quaternion(),dual:new T.Quaternion()},rollMatrix=new T.Matrix4(),rollQ=new T.Quaternion(),identityQ=new T.Quaternion();
 if(rollForearm)for(const side of ['Left','Right']){const lower=names.indexOf(side+'ForeArm'),hand=names.indexOf(side+'Hand'),lRest=new T.Quaternion(),hRest=new T.Quaternion();mesh.skeleton.boneInverses[lower].clone().invert().decompose(new T.Vector3(),lRest,new T.Vector3());mesh.skeleton.boneInverses[hand].clone().invert().decompose(new T.Vector3(),hRest,new T.Vector3());rolls.set(lower,{lower,hand,restLocal:hRest.invert().multiply(lRest),q:new T.Quaternion(),lowerMeshQ:new T.Quaternion(),lowerMeshInverseQ:new T.Quaternion(),pivot:new T.Vector3()});}
 const metrics={vertices:entries.length,fallbacks:0,maxCorrection:0,minBlendDeterminant:1,maxRigidityError:0};
 function originalMorphed(id,kind,base,out,delta){
  out.fromArray(base,id*3);delta.set(0,0,0);const attrs=geometry.morphAttributes[kind],weights=mesh.morphTargetInfluences;let factor=1;
  if(attrs&&weights)for(let j=0;j<attrs.length;j++){
   const w=weights[j]??0;if(!w)continue;
   t.fromBufferAttribute(attrs[j],id);delta.addScaledVector(t,w);
   if(!geometry.morphTargetsRelative)factor-=w;
  }
  if(!geometry.morphTargetsRelative)out.multiplyScalar(factor);
  out.add(delta);return factor;
 }
 function restore(){for(const {id} of entries){pos.setXYZ(id,basePos[id*3],basePos[id*3+1],basePos[id*3+2]);if(norm&&baseNorm)norm.setXYZ(id,baseNorm[id*3],baseNorm[id*3+1],baseNorm[id*3+2]);}dirty();}
 function update(){
  metrics.fallbacks=0;metrics.maxCorrection=0;metrics.minBlendDeterminant=1;metrics.maxRigidityError=0;
  // Caller has completed skeletal transforms; update the attached bind inverse
  // here so a direct seek and normal playback use exactly the same coordinate frame.
  mesh.updateWorldMatrix(true,false);if(mesh.bindMode===T.AttachedBindMode)mesh.bindMatrixInverse.copy(mesh.matrixWorld).invert();
  for(const [id,state]of states){
   state.matrix.copy(mesh.bindMatrixInverse).multiply(mesh.skeleton.bones[id].matrixWorld).multiply(mesh.skeleton.boneInverses[id]).multiply(mesh.bindMatrix);
   state.matrix.decompose(t,state.real,scale);state.real.normalize();
   linear.setFromMatrix4(state.matrix);const e=linear.elements;
   const rigidity=Math.max(Math.abs(scale.x-1),Math.abs(scale.y-1),Math.abs(scale.z-1),Math.abs(e[0]*e[3]+e[1]*e[4]+e[2]*e[5]),Math.abs(e[0]*e[6]+e[1]*e[7]+e[2]*e[8]),Math.abs(e[3]*e[6]+e[4]*e[7]+e[5]*e[8]));
   metrics.maxRigidityError=Math.max(metrics.maxRigidityError,rigidity);state.rigid=rigidity<.00001&&state.matrix.determinant()>0;
   state.dual.set(t.x,t.y,t.z,0).multiply(state.real);state.dual.set(state.dual.x*.5,state.dual.y*.5,state.dual.z*.5,state.dual.w*.5);
  }
  for(const [lower,roll]of rolls){
   const lowerBone=mesh.skeleton.bones[lower],handBone=mesh.skeleton.bones[roll.hand],lowerWorld=lowerBone.getWorldQuaternion(new T.Quaternion()),handWorld=handBone.getWorldQuaternion(new T.Quaternion()),delta=lowerWorld.clone().invert().multiply(handWorld).multiply(roll.restLocal),axis=handBone.position.clone().normalize(),dot=axis.x*delta.x+axis.y*delta.y+axis.z*delta.z;
   roll.q.set(axis.x*dot,axis.y*dot,axis.z*dot,delta.w).normalize();if(roll.q.w<0)roll.q.set(-roll.q.x,-roll.q.y,-roll.q.z,-roll.q.w);
   roll.lowerMeshQ.copy(mesh.getWorldQuaternion(new T.Quaternion()).invert()).multiply(lowerWorld);roll.lowerMeshInverseQ.copy(roll.lowerMeshQ).invert();roll.pivot.copy(lowerBone.getWorldPosition(new T.Vector3())).applyMatrix4(mesh.matrixWorld.clone().invert());
  }
  for(const entry of entries){
   const {id,influences,amount}=entry;
   // Always reset from the immutable original, even on a fallback frame.
   pos.setXYZ(id,basePos[id*3],basePos[id*3+1],basePos[id*3+2]);if(norm&&baseNorm)norm.setXYZ(id,baseNorm[id*3],baseNorm[id*3+1],baseNorm[id*3+2]);
   const factor=originalMorphed(id,'position',basePos,p,morph);
   if(Math.abs(factor)<.001||influences.some(v=>!states.get(v.bone).rigid)){metrics.fallbacks++;continue;}
   blend.elements.fill(0);q.set(0,0,0,0);d.set(0,0,0,0);const reference=states.get(influences[0].bone).real;
   for(const {bone,weight}of influences){const state=states.get(bone);
    for(let k=0;k<16;k++)blend.elements[k]+=state.matrix.elements[k]*weight;
   }
   const targetInfluences=entry.targetInfluences??influences;let wristWeight=0;
   for(const {bone,weight}of targetInfluences){if(bone!==entry.forearmIndex&&bone!==entry.handIndex)continue;wristWeight+=weight;let state=states.get(bone);
    if(rollForearm&&bone===entry.forearmIndex){const roll=rolls.get(bone);rollQ.copy(identityQ).slerp(roll.q,entry.roll).premultiply(roll.lowerMeshQ).multiply(roll.lowerMeshInverseQ);rollMatrix.makeRotationFromQuaternion(rollQ);t.copy(roll.pivot).applyQuaternion(rollQ).negate().add(roll.pivot);rollMatrix.setPosition(t);virtual.matrix.copy(rollMatrix).multiply(state.matrix);virtual.matrix.decompose(t,virtual.real,scale);virtual.real.normalize();virtual.dual.set(t.x,t.y,t.z,0).multiply(virtual.real);virtual.dual.set(virtual.dual.x*.5,virtual.dual.y*.5,virtual.dual.z*.5,virtual.dual.w*.5);state=virtual;}
    const sign=reference.dot(state.real)<0?-1:1;
    q.set(q.x+state.real.x*weight*sign,q.y+state.real.y*weight*sign,q.z+state.real.z*weight*sign,q.w+state.real.w*weight*sign);
    d.set(d.x+state.dual.x*weight*sign,d.y+state.dual.y*weight*sign,d.z+state.dual.z*weight*sign,d.w+state.dual.w*weight*sign);
   }
   // Three's skinning uses weighted xyz rather than homogeneous normalization.
   blend.elements[3]=0;blend.elements[7]=0;blend.elements[11]=0;blend.elements[15]=1;
   const det=blend.determinant();metrics.minBlendDeterminant=Math.min(metrics.minBlendDeterminant,det);
   if(det<.02||q.lengthSq()<1e-8){metrics.fallbacks++;continue;}
   const len=q.length();q.set(q.x/len,q.y/len,q.z/len,q.w/len);d.set(d.x/len,d.y/len,d.z/len,d.w/len);
   // Remove the dual component parallel to the real part (unit dual norm).
   const dot=q.dot(d);d.set(d.x-dot*q.x,d.y-dot*q.y,d.z-dot*q.z,d.w-dot*q.w);
   conjugate.copy(q).conjugate();translation.copy(d).multiply(conjugate);
   target.copy(p).applyQuaternion(q).add(t.set(translation.x*2,translation.y*2,translation.z*2));
   target.multiplyScalar(wristWeight);for(const {bone,weight}of targetInfluences)if(bone!==entry.forearmIndex&&bone!==entry.handIndex)target.addScaledVector(n.copy(p).applyMatrix4(states.get(bone).matrix),weight);
   n.copy(p).applyMatrix4(blend);target.lerp(n,1-amount);metrics.maxCorrection=Math.max(metrics.maxCorrection,target.distanceTo(n));
   inverse.copy(blend).invert();target.applyMatrix4(inverse).sub(morph).multiplyScalar(1/factor);pos.setXYZ(id,target.x,target.y,target.z);
   if(norm&&baseNorm){
    const nf=originalMorphed(id,'normal',baseNorm,origN,morphN);
    if(Math.abs(nf)>=.001){
     linear.setFromMatrix4(blend);lbsN.copy(origN).applyMatrix3(linear).normalize();dqN.copy(origN).applyQuaternion(q).multiplyScalar(wristWeight);for(const {bone,weight}of targetInfluences)if(bone!==entry.forearmIndex&&bone!==entry.handIndex)dqN.addScaledVector(n.copy(origN).applyMatrix3(inverseLinear.setFromMatrix4(states.get(bone).matrix)),weight);dqN.normalize();targetN.copy(dqN).lerp(lbsN,1-amount).normalize();
     inverseLinear.copy(linear).invert();targetN.applyMatrix3(inverseLinear).sub(morphN).multiplyScalar(1/nf);norm.setXYZ(id,targetN.x,targetN.y,targetN.z);
    }
   }
  }
  dirty();return metrics;
 }
 return{update,restore,entries,metrics,basePos,baseNorm};
}
