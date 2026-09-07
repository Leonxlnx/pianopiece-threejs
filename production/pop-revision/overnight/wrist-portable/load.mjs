import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export const project=[process.env.DAYBREAK_PROJECT,path.resolve(here,'../pianopiece-threejs'),path.resolve(here,'../../..'),process.cwd()].filter(Boolean).find(p=>fs.existsSync(path.join(p,'app/performance/pianist.ts'))&&fs.existsSync(path.join(p,'package.json')));
if(!project)throw Error('Set DAYBREAK_PROJECT to the piano repository root.');
const req=createRequire(project+'/package.json');
export const T=await import(req.resolve('three'));
const {GLTFLoader}=await import(req.resolve('three/addons/loaders/GLTFLoader.js'));
export const rigPath=path.resolve(here,'baseline/pianist.mjs');
export const baselineSource=path.resolve(here,'baseline/pianist.ts');
const {Pianist}=await import(pathToFileURL(rigPath));
const {GrandPiano}=await import(pathToFileURL(path.resolve(here,'baseline/piano.mjs')));
const math=await import(pathToFileURL(path.resolve(here,'baseline/math.mjs')));
export async function setup(){
const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
const score=JSON.parse(fs.readFileSync(process.env.DAYBREAK_SCORE??project+'/public/assets/score.json')),data=fs.readFileSync(process.env.DAYBREAK_MODEL??project+'/public/assets/pianist.glb');
const loader=new GLTFLoader();loader.register(()=>({name:'research-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const gltf=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
const pianist=new Pianist(),piano=new GrandPiano();await pianist.load(score,gltf.scene);
if(pianist.skinVolume)throw Error('Portable baseline already applies wrist correction; aborting double application.');
let body;gltf.scene.traverse(o=>{if(o.name==='Human'&&o.isSkinnedMesh)body=o;});
function pose(t){const pedal=math.pedalPosition(t,score.pedals),energy=math.scoreEnergy(t,score.sections);piano.update(t,score.notes,pedal);pianist.update(t,score,piano,pedal,energy);gltf.scene.updateMatrixWorld(true);body.skeleton.update();piano.group.updateMatrixWorld(true);}
return{score,gltf,pianist,piano,body,pose};
}
