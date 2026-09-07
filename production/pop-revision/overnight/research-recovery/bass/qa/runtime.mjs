import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export {T};
const modelFile=path.resolve(process.env.DAYBREAK_MODEL_PATH??'../pianopiece-threejs/public/assets/pianist.glb');
export async function runtime(variant){
 const {Pianist}=await import(pathToFileURL(path.resolve(variant,'compiled/pianist.mjs')));
 const {GrandPiano}=await import(pathToFileURL(path.resolve(variant,'compiled/piano.mjs')));
 const {pedalPosition,mix,smooth}=await import(pathToFileURL(path.resolve(variant,'compiled/math.mjs')));
 const score=JSON.parse(fs.readFileSync(path.join(variant,'score.json')));
 const context=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.self=globalThis;
 const loader=new GLTFLoader();loader.register(()=>({name:'offline-validation-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
 const bytes=fs.readFileSync(modelFile),gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const model=gltf.scene;model.updateMatrixWorld(true);let body;model.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});body.skeleton.update();
 const performer=new Pianist(),piano=new GrandPiano();await performer.load(score,model);
 function pose(time){let index=score.sections.findIndex(s=>time>=s.start&&time<s.end);if(index<0)index=score.sections.length-1;const section=score.sections[index],previous=score.sections[Math.max(0,index-1)],energy=mix(previous.energy,section.energy,smooth((time-section.start)/1.8)),pedal=pedalPosition(time,score.pedals);piano.update(time,score.notes,pedal);performer.update(time,score,piano,pedal,energy);model.updateMatrixWorld(true);body.skeleton.update();piano.group.updateMatrixWorld(true);return energy;}
 pose(0);return {variant,score,model,body,performer,piano,pose};
}
