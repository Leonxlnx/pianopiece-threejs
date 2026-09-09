import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {pedalPosition,mix,smooth} from './baseline/math.mjs';
export {T};
export const root='/workspace/sites/daybreak-piano-film';
export const scoreBytes=fs.readFileSync(root+'/public/assets/score.json'),score=JSON.parse(scoreBytes),modelBytes=fs.readFileSync(root+'/public/assets/pianist.glb');
export const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const context=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.self=globalThis;
export async function setup(version){
 const {Pianist}=await import('./'+version+'/pianist.mjs'),{GrandPiano}=await import('./'+version+'/piano.mjs');
 const loader=new GLTFLoader();loader.register(()=>({name:'offline-validation-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
 const gltf=await loader.parseAsync(modelBytes.buffer.slice(modelBytes.byteOffset,modelBytes.byteOffset+modelBytes.byteLength),'');
 const performer=new Pianist(),piano=new GrandPiano();await performer.load(score,gltf.scene);
 return {performer,piano,gltf};
}
export function pose(state,time){
 let i=score.sections.findIndex(s=>time>=s.start&&time<s.end);if(i<0)i=score.sections.length-1;
 const section=score.sections[i],previous=score.sections[Math.max(0,i-1)],energy=mix(previous.energy,section.energy,smooth((time-section.start)/1.8)),pedal=pedalPosition(time,score.pedals);
 state.piano.update(time,score.notes,pedal);state.performer.update(time,score,state.piano,pedal,energy);state.performer.group.updateMatrixWorld(true);state.gltf.scene.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.update();});
}
export const point=b=>b.getWorldPosition(new T.Vector3());
