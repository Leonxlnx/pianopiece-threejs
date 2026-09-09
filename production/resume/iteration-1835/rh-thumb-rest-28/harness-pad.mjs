import {T,body,piano,isBlack,measure as originalMeasure} from './harness.mjs';
export * from './harness.mjs';
const names=['Thumb','Index','Middle','Ring','Pinky'],a=body.geometry.attributes;
const pads=Object.fromEntries(['L','R'].map(side=>[side,names.map(name=>{
 const ids=[];for(let i=0;i<a.position.count;i++){let w=0;for(let j=0;j<4;j++)if(body.skeleton.bones[a.skinIndex.getComponent(i,j)].name===(side==='L'?'Left':'Right')+'Hand'+name+'3')w+=a.skinWeight.getComponent(i,j);if(w>.65)ids.push(i);}return ids;
})]));
export function measure(time,side,options){
 const r=originalMeasure(time,side,options);r.padContacts=r.active.map(n=>{
  const k=piano.keys.get(n.midi),box=k.mesh.geometry.boundingBox,inverse=k.mesh.matrixWorld.clone().invert(),bevel=isBlack(n.midi)?.002:.0014;let gap=Infinity,count=0,vertex=null,point=null;
  for(const id of pads[side][n.finger-1]){const world=body.getVertexPosition(id,new T.Vector3()).applyMatrix4(body.matrixWorld),p=world.clone().applyMatrix4(inverse);if(p.x<box.min.x+bevel||p.x>box.max.x-bevel||p.z<box.min.z+bevel||p.z>box.max.z-bevel)continue;count++;const g=(p.y-box.max.y)*1000;if(g<gap){gap=g;vertex=id;point=world.toArray();}}
  return {id:n.id,finger:n.finger,gap:Number.isFinite(gap)?gap:null,count,vertex,point};
 });return r;
}
