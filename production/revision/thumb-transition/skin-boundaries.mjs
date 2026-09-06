import fs from 'node:fs';import {T,score,performer,piano,model,wp,pose,fingers} from './runtime.mjs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {Pianist as Baseline} from './compiled/pianist-baseline.mjs';
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bytes=fs.readFileSync('/workspace/sites/daybreak-piano-film/public/assets/pianist.glb'),baseModel=(await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
const baseline=new Baseline();await baseline.load(score,baseModel);
let body,baseBody;model.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});baseModel.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')baseBody=o;});
const si=body.geometry.attributes.skinIndex,sw=body.geometry.attributes.skinWeight,thumbVerts={L:[],R:[]};
for(let i=0;i<si.count;i++)for(const side of ['L','R']){let weight=0;for(let j=0;j<4;j++)if(body.skeleton.bones[si.getComponent(i,j)].name.startsWith((side==='L'?'Left':'Right')+'HandThumb'))weight+=sw.getComponent(i,j);if(weight>.00001)thumbVerts[side].push(i);}
function both(time){const energy=pose(time);baseline.update(time,score,piano,piano.pedals[2].rotation.x/.16,energy);baseModel.updateMatrixWorld(true);body.skeleton.update();baseBody.skeleton.update();}
let maxSkinParity=0,maxActiveQuaternion=0,maxActiveTip=0,vertexComparisons=0;const v=new T.Vector3(),b=new T.Vector3();
for(const n of score.notes.filter(n=>n.finger===1))for(const fraction of [0,.001,.25,.5,.8,.999]){
 both(n.time+n.duration*fraction);const hi=n.hand==='L'?0:1,a=performer.hands[hi].fingers[0],bf=baseline.hands[hi].fingers[0];
 for(let j=0;j<3;j++)maxActiveQuaternion=Math.max(maxActiveQuaternion,a.bones[j].quaternion.clone().normalize().angleTo(bf.bones[j].quaternion.clone().normalize()));
 maxActiveTip=Math.max(maxActiveTip,wp(a.tip).distanceTo(wp(bf.tip)));
 for(const i of thumbVerts[n.hand]){body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld);baseBody.getVertexPosition(i,b).applyMatrix4(baseBody.matrixWorld);maxSkinParity=Math.max(maxSkinParity,v.distanceTo(b));vertexComparisons++;}
}
const boundaries=[];const epsilon=1e-7;
for(const g of fingers.filter(g=>g.fi===0))for(const n of g.notes)for(const boundary of ['attack','release']){
 const time=boundary==='attack'?n.time:n.time+n.duration;pose(time-epsilon);const old=g.f.bones.map(b=>b.quaternion.clone()),oldTip=wp(g.f.tip);pose(time+epsilon);
 const tipJumpMm=wp(g.f.tip).distanceTo(oldTip)*1000,rotationDegrees=Math.max(...g.f.bones.map((b,j)=>b.quaternion.clone().normalize().angleTo(old[j].clone().normalize())))*180/Math.PI;
 boundaries.push({id:n.id,hand:g.h.side,boundary,time,tipJumpMm,rotationDegrees});
}
const events=JSON.parse(fs.readFileSync('../highrate-analysis/collection.json')).events.filter(e=>e.key.endsWith('1'));
const times=[...new Set(events.flatMap(e=>[e.start,e.end,e.tip.time,e.joint.time]).filter(Number.isFinite))];
const skin=[];const determinants=(mesh,side)=>{const matrices=mesh.skeleton.bones.map((b,i)=>new T.Matrix4().multiplyMatrices(b.matrixWorld,mesh.skeleton.boneInverses[i]));return thumbVerts[side].map(i=>{const e=new Array(9).fill(0);for(let j=0;j<4;j++){const weight=sw.getComponent(i,j);if(!weight)continue;const m=matrices[si.getComponent(i,j)].elements;for(let c=0;c<3;c++)for(let r=0;r<3;r++)e[c*3+r]+=weight*m[c*4+r];}return {vertex:i,det:new T.Matrix3().fromArray(e).determinant()};});};
for(const time of times){both(time);for(const side of ['L','R']){const a=determinants(body,side),b=determinants(baseBody,side);for(let i=0;i<a.length;i++)skin.push({time,side,vertex:a[i].vertex,candidate:a[i].det,baseline:b[i].det});}}
const report={scope:'Active thumb vertices only; all thumb attack/release boundaries; thumb skin volume proxy at prior whole-score high-rate defect times. Proxy is not a collision test.',thumbNotes:score.notes.filter(n=>n.finger===1).length,thumbVertices:thumbVerts,active:{vertexComparisons,maxSkinParityMm:maxSkinParity*1000,maxActiveTipMm:maxActiveTip*1000,maxActiveQuaternionDegrees:maxActiveQuaternion*180/Math.PI},boundaries:{count:boundaries.length,epsilon,worstTip:[...boundaries].sort((a,b)=>b.tipJumpMm-a.tipJumpMm).slice(0,10),worstRotation:[...boundaries].sort((a,b)=>b.rotationDegrees-a.rotationDegrees).slice(0,10)},skin:{timeSamples:times.length,vertexSamples:skin.length,candidateMin:skin.reduce((m,s)=>Math.min(m,s.candidate),Infinity),baselineMin:skin.reduce((m,s)=>Math.min(m,s.baseline),Infinity),candidateBelowPoint5:skin.filter(s=>s.candidate<.5).length,baselineBelowPoint5:skin.filter(s=>s.baseline<.5).length,worst:skin.sort((a,b)=>a.candidate-b.candidate).slice(0,20)}};
fs.writeFileSync('skin-boundaries.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,thumbVertices:Object.fromEntries(Object.entries(thumbVerts).map(([k,v])=>[k,v.length]))},null,2));
