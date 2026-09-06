import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GrandPiano } from './compiled/piano.mjs';
import { Pianist } from './compiled/pianist.mjs';
import { Stage } from './compiled/stage.mjs';
import { Direction } from './compiled/direction.mjs';
import { pedalPosition } from './compiled/math.mjs';
const qaRoot='/workspace/scratch/daybreak-offline';fs.mkdirSync(qaRoot,{recursive:true});
const ctx=new Proxy({canvas:null},{get:(t,k)=>k in t?t[k]:(...args)=>{}});
globalThis.document={createElement:(type)=>({width:512,height:512,getContext:()=>ctx})};globalThis.window={devicePixelRatio:1};globalThis.self=globalThis;
const data=fs.readFileSync('public/assets/pianist.glb');const jsonLength=data.readUInt32LE(12);const modelJson=JSON.parse(data.subarray(20,20+jsonLength).toString());const binOffset=20+jsonLength+8;const bin=data.subarray(binOffset);
const texPaths=[];for(let i=0;i<(modelJson.images??[]).length;i++){const im=modelJson.images[i];if(im.bufferView!==undefined){const bv=modelJson.bufferViews[im.bufferView];const p=path.join(qaRoot,`texture-${i}.${im.mimeType==='image/png'?'png':'jpg'}`);fs.writeFileSync(p,bin.subarray(bv.byteOffset??0,(bv.byteOffset??0)+bv.byteLength));texPaths.push(p);}else texPaths.push('');}
const loader=new GLTFLoader();loader.register(parser=>({name:'offline-texture-reference',loadTexture:(idx)=>{const tx=new THREE.Texture();tx.flipY=false;tx.userData.sourcePath=texPaths[parser.json.textures[idx].source];return Promise.resolve(tx);}}));
const gltf=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');const score=JSON.parse(fs.readFileSync('public/assets/score.json'));
const scene=new THREE.Scene();const piano=new GrandPiano();const stage=new Stage(scene,false);const pianist=new Pianist();scene.add(piano.group,pianist.group);await pianist.load(score,gltf.scene);const direction=new Direction(score);const aspect=Number(process.env.DAYBREAK_ASPECT??16/9);const camera=new THREE.PerspectiveCamera(40,aspect,.03,180);
const time=Number(process.argv[2]??.95);const shot=Number(process.argv[3]??-1);const dest=process.argv[4]??path.join(qaRoot,`frame-${time.toFixed(2)}.json`);const pedal=pedalPosition(time,score.pedals);const energy=score.sections.find(s=>time>=s.start&&time<s.end)?.energy??.4;
piano.update(time,score.notes,pedal);pianist.update(time,score,piano,pedal,energy);stage.update(time,energy,0);direction.override=shot;direction.update(camera,time,aspect);if(process.env.DAYBREAK_DETAIL==='pedal'){camera.position.set(.40,.27,.61);camera.lookAt(0,.15,.24);camera.fov=42;camera.updateProjectionMatrix();}scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
const out={time,shot:direction.name,camera:{matrix:camera.matrixWorld.toArray(),fov:camera.fov,aspect},meshes:[],lights:[],materials:[],contacts:pianist.contacts};const materials=new Map();
function matIndex(mat){if(materials.has(mat.uuid))return materials.get(mat.uuid);const i=out.materials.length;materials.set(mat.uuid,i);out.materials.push({name:mat.name,color:mat.color?.toArray()??[.3,.35,.4],roughness:mat.roughness??.5,metalness:mat.metalness??0,clearcoat:mat.clearcoat??0,alpha:mat.opacity??1,map:mat.map?.userData.sourcePath??null,normal:mat.normalMap?.userData.sourcePath??null,alphaTest:mat.alphaTest??0,emissive:mat.isMeshBasicMaterial?mat.color?.toArray()??[0,0,0]:mat.emissive?.toArray()??[0,0,0],doubleSided:mat.side===THREE.DoubleSide});return i;}
function writeMesh(mesh,matrix,suffix=''){
 const geom=mesh.geometry;if(!geom.attributes.position)return;const material=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(material.some(m=>m.isShaderMaterial||m.map?.isCanvasTexture&&m.transparent&&!m.map.userData.sourcePath))return;
 const pos=geom.attributes.position;const vertices=new Float32Array(pos.count*3);const v=new THREE.Vector3();for(let i=0;i<pos.count;i++){mesh.getVertexPosition(i,v);vertices.set(v.toArray(),i*3);}
 const indices=geom.index?Array.from(geom.index.array):Array.from({length:pos.count},(_,i)=>i);const uvs=geom.attributes.uv?Array.from(geom.attributes.uv.array):null;
 out.meshes.push({name:mesh.name+suffix,vertices:Array.from(vertices),indices,uvs,matrix:matrix.toArray(),materials:material.map(matIndex),groups:geom.groups,smooth:!material[0].flatShading});
}
scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();if(o.isLight&&!o.isHemisphereLight){out.lights.push({type:o.type,color:o.color.toArray(),intensity:o.intensity,position:o.getWorldPosition(new THREE.Vector3()).toArray(),target:o.target?.getWorldPosition(new THREE.Vector3()).toArray()??null,angle:o.angle,penumbra:o.penumbra});}if(o.isMesh){if(o.isInstancedMesh){const m=new THREE.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);writeMesh(o,o.matrixWorld.clone().multiply(m),'-'+i);}}else writeMesh(o,o.matrixWorld);}});
out.hands=pianist.hands.map(h=>({side:h.side,wrist:h.wrist.getWorldPosition(new THREE.Vector3()).toArray(),shoulder:h.upper.getWorldPosition(new THREE.Vector3()).toArray(),elbow:h.lower.getWorldPosition(new THREE.Vector3()).toArray(),fingers:h.fingers.map(f=>({base:f.bones[0].getWorldPosition(new THREE.Vector3()).toArray(),tip:f.tip.getWorldPosition(new THREE.Vector3()).toArray(),lengths:f.lengths})),cached:[...pianist.poseCache.entries()].filter(([k])=>k.startsWith(h.side)).map(([k,p])=>({key:k,position:p.position.toArray(),q:p.q.toArray()}))}));
fs.writeFileSync(dest,JSON.stringify(out));console.log(JSON.stringify({path:dest,time,meshes:out.meshes.length,materials:out.materials.length,contacts:out.contacts}));
