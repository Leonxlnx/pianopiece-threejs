import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {keyPadContact} from './key-pad-contact.mjs';
const dir=process.argv[2],base=process.argv[3],windows=JSON.parse(fs.readFileSync(`${dir}/windows.json`)),score=JSON.parse(fs.readFileSync(`${dir}/score.json`));
const files=[`${dir}/score.json`,`${base}/score.json`,`${dir}/windows.json`,'dense-held.mjs','key-pad-contact.mjs','../pianopiece-threejs/public/assets/pianist.glb',...['pianist','piano','math','wrist-motion'].flatMap(n=>[`${dir}/compiled/${n}.mjs`,`${base}/compiled/${n}.mjs`])];
const hashes=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),before=hashes();
const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...args)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
async function make(variant){
 const {Pianist}=await import(pathToFileURL(path.resolve(variant,'compiled/pianist.mjs'))),{GrandPiano}=await import(pathToFileURL(path.resolve(variant,'compiled/piano.mjs'))),{pedalPosition,mix,smooth}=await import(pathToFileURL(path.resolve(variant,'compiled/math.mjs')));
 const score=JSON.parse(fs.readFileSync(`${variant}/score.json`)),loader=new GLTFLoader();loader.register(()=>({name:'offline-validation-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
 const bytes=fs.readFileSync('../pianopiece-threejs/public/assets/pianist.glb'),gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const model=gltf.scene;model.updateMatrixWorld(true);let body;model.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});body.skeleton.update();
 const names=['Thumb','Index','Middle','Ring','Pinky'],pads={};
 for(const side of ['L','R'])for(let f=0;f<5;f++){
  const bi=body.skeleton.bones.findIndex(b=>b.name===(side==='L'?'Left':'Right')+'Hand'+names[f]+'3'),bone=body.skeleton.bones[bi],inv=bone.matrixWorld.clone().invert(),list=[];
  for(let i=0;i<body.geometry.attributes.position.count;i++){
   let weight=0;for(let j=0;j<4;j++)if(body.geometry.attributes.skinIndex.getComponent(i,j)===bi)weight+=body.geometry.attributes.skinWeight.getComponent(i,j);if(weight<.35)continue;
   const v=new T.Vector3();body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld).applyMatrix4(inv);list.push({i,y:v.y});
  }
  const max=Math.max(...list.map(v=>v.y));pads[side+(f+1)]=list.filter(v=>v.y>max-.011).map(v=>v.i);assert.ok(pads[side+(f+1)].length>0);
 }
 const performer=new Pianist(),piano=new GrandPiano();await performer.load(score,model);
 function pose(time){let index=score.sections.findIndex(s=>time>=s.start&&time<s.end);if(index<0)index=score.sections.length-1;const section=score.sections[index],previous=score.sections[Math.max(0,index-1)],energy=mix(previous.energy,section.energy,smooth((time-section.start)/1.8)),pedal=pedalPosition(time,score.pedals);piano.update(time,score.notes,pedal);performer.update(time,score,piano,pedal,energy);model.updateMatrixWorld(true);body.skeleton.update();piano.group.updateMatrixWorld(true);}
 return{pose,body,piano,pads};
}
const a=await make(base),b=await make(dir),selected=new Set(windows.map(w=>w.id)),times=[];
for(const n of score.notes.filter(n=>selected.has(n.id))){const start=n.time+1e-6,end=n.time+n.duration-1e-6;for(let i=0;i<=Math.ceil((end-start)*240);i++)times.push(Math.min(start+i/240,end));}
for(const w of windows){const start=w.start-.025,end=w.end+.025;for(let i=0;i<=Math.ceil((end-start)*240);i++)times.push(Math.min(start+i/240,end));}
const ordered=[...new Set(times)].sort((a,b)=>a-b);let samples=0,maxDifferenceMm=0,minGapMm=Infinity,maxGapMm=-Infinity;const bad=[];
for(const time of ordered){a.pose(time);b.pose(time);for(const n of score.notes.filter(n=>time>=n.time+1e-7&&time<n.time+n.duration-1e-7)){
 const old=keyPadContact(a.body,a.pads[n.hand+n.finger],a.piano.keys.get(n.midi).mesh),now=keyPadContact(b.body,b.pads[n.hand+n.finger],b.piano.keys.get(n.midi).mesh);
 assert.ok(old.count>0&&now.count>0&&Number.isFinite(old.gap)&&Number.isFinite(now.gap),'Missing/nonfinite actual assigned pad');
 const gapMm=now.gap*1000,differenceMm=Math.abs(now.gap-old.gap)*1000;maxDifferenceMm=Math.max(maxDifferenceMm,differenceMm);minGapMm=Math.min(minGapMm,gapMm);maxGapMm=Math.max(maxGapMm,gapMm);samples++;if(Math.abs(gapMm)>3)bad.push({id:n.id,time,gapMm});
}}
const report={passed:bad.length===0&&maxDifferenceMm<1e-9,samples,times:ordered.length,minGapMm,maxGapMm,maxDifferenceMm,bad,scope:'Actual assigned-key distal pads at 240Hz throughout twelve selected note holds and every simultaneous held note during their guarded release intervals; held boundaries offset only one microsecond to remain held.',inputHashes:before,inputsUnchanged:JSON.stringify(before)===JSON.stringify(hashes())};report.passed&&=report.inputsUnchanged;
fs.writeFileSync(`${dir}/dense-held.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));assert.ok(report.passed);console.log('DENSE_HELD_PASS');
