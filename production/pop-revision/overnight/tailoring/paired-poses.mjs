// Compact actual Three.js skin snapshots for garment/body intersection review.
// Imports are frozen in this research folder; no Site checkout is written.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { gzipSync } from 'node:zlib';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Pianist } from './compiled/pianist.mjs';
import { GrandPiano } from './compiled/piano.mjs';
import { scoreEnergy, pedalPosition } from './compiled/math.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=process.argv[2]??'../pianopiece-threejs/public/assets/pianist.glb';
const candidate=process.argv[3]??'pianist-tailored.glb';
const scoreBytes=fs.readFileSync('score.json'),score=JSON.parse(scoreBytes);
const sourceHashes=Object.fromEntries(fs.readdirSync('compiled').filter(n=>n.endsWith('.mjs')).sort().map(n=>[n,sha(fs.readFileSync('compiled/'+n))]));
globalThis.self=globalThis;
const context=new Proxy({canvas:null},{get:(t,k)=>k in t?t[k]:()=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.window={devicePixelRatio:1};
const loader=new GLTFLoader();loader.register(()=>({name:'geometry-only-inspection',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
async function make(asset){
 const bytes=fs.readFileSync(asset);const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const scene=new THREE.Scene(),piano=new GrandPiano(),pianist=new Pianist();scene.add(piano.group,pianist.group);await pianist.load(score,gltf.scene);
 const meshes={};gltf.scene.traverse(m=>{if(m.isSkinnedMesh&&gltf.parser.associations.has(m)){const a=gltf.parser.associations.get(m);meshes[`${a.meshes}:${a.primitives??0}`]=m;}});
 return {scene,piano,pianist,meshes,assetSHA256:sha(bytes)};
}
const before=await make(source),after=await make(candidate),times=[0,53,95.44,108.72,170,186,226.5],report=[];
function pose(state,time){
 const pedal=pedalPosition(time,score.pedals),energy=scoreEnergy(time,score.sections);
 state.piano.update(time,score.notes,pedal);state.pianist.update(time,score,state.piano,pedal,energy);state.scene.updateMatrixWorld(true);
 const result={};
 for(const [key,mesh] of Object.entries(state.meshes)){
  mesh.skeleton.update();const positions=new Float32Array(mesh.geometry.attributes.position.count*3),v=new THREE.Vector3();
  for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);v.toArray(positions,i*3);}
  result[key]=positions;
 }
 return result;
}
for(const time of times){
 const a=pose(before,time),b=pose(after,time),protectedHashes={};
 for(const key of Object.keys(a)){
  if(key.startsWith('1:')&&!['1:1','1:3'].includes(key))continue;
  const ah=sha(Buffer.from(a[key].buffer)),bh=sha(Buffer.from(b[key].buffer));
  if(ah!==bh)throw Error(`Non-garment or trousers moved at ${time}, ${key}`);
  protectedHashes[key]=ah;
 }
 const payload={time,body:Array.from(a['0:0']),beforeBlouse:Array.from(a['1:0']),afterBlouse:Array.from(b['1:0']),
  beforeBinding:Array.from(a['1:2']),afterBinding:Array.from(b['1:2'])};
 const name=`pose-${time}.json.gz`;fs.writeFileSync(name,gzipSync(JSON.stringify(payload)));
 report.push({time,protectedHashes,snapshot:name,snapshotSHA256:sha(fs.readFileSync(name))});console.log('Compared actual pose',time);
}
const manifest={beforeAssetSHA256:before.assetSHA256,afterAssetSHA256:after.assetSHA256,scoreSHA256:sha(scoreBytes),sourceHashes,poses:report};
fs.writeFileSync('paired-poses.json',JSON.stringify(manifest,null,2)+'\n');
