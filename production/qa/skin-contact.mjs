import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './compiled/pianist.mjs';
import {GrandPiano,keyX,isBlack,keySurfaceY} from './compiled/piano.mjs';
const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(parser=>({name:'skip-offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bin=fs.readFileSync('public/assets/pianist.glb'),gltf=await loader.parseAsync(bin.buffer.slice(bin.byteOffset,bin.byteOffset+bin.byteLength),'');
const model=gltf.scene;model.updateMatrixWorld(true);let body;model.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});body.skeleton.update();
const ids={};const names=['Thumb','Index','Middle','Ring','Pinky'];
for(const side of ['L','R'])for(let f=0;f<5;f++){
 const boneName=(side==='L'?'Left':'Right')+'Hand'+names[f]+'3',bi=body.skeleton.bones.findIndex(b=>b.name===boneName),b=body.skeleton.bones[bi],inv=b.matrixWorld.clone().invert(),list=[];
 for(let i=0;i<body.geometry.attributes.position.count;i++){
 const indices=body.geometry.attributes.skinIndex,weights=body.geometry.attributes.skinWeight;let weight=0;for(let j=0;j<4;j++)if(indices.getComponent(i,j)===bi)weight+=weights.getComponent(i,j);if(weight<.35)continue;
 const v=new T.Vector3();body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld).applyMatrix4(inv);list.push({i,y:v.y});
 }
 const max=Math.max(...list.map(x=>x.y));ids[side+(f+1)]=list.filter(x=>x.y>max-.011).map(x=>x.i);
}
const score=JSON.parse(fs.readFileSync('public/assets/score.json')),p=new Pianist(),piano=new GrandPiano();await p.load(score,model);
const records=[];
for(const n of score.notes){
 const time=n.time+Math.min(.045,n.duration*.45),pedal=score.pedals.filter(x=>x.time<=time).at(-1)?.value??0,energy=score.sections.find(s=>time>=s.start&&time<s.end)?.energy??.5;
 piano.update(time,score.notes,pedal);p.update(time,score,piano,pedal,energy);model.updateMatrixWorld(true);body.skeleton.update();
 let min=Infinity,count=0;const black=isBlack(n.midi),x=keyX(n.midi),half=black?.0145/2:.0227/2;
 for(const i of ids[n.hand+n.finger]){const v=new T.Vector3();body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld);if(Math.abs(v.x-x)>half||v.z<(black?.133:.230)||v.z>(black?.221:.275))continue;count++;min=Math.min(min,v.y-keySurfaceY(n.midi,v.z));}
 records.push({id:n.id,time,hand:n.hand,finger:n.finger,midi:n.midi,vertices:count,gapMm:Number.isFinite(min)?min*1000:null});
}
const good=records.filter(r=>r.gapMm!==null),sorted=good.map(x=>x.gapMm).sort((a,b)=>a-b),report={scope:'Actual skinned distal fingertip vertices within the assigned key footprint, once per physical note hold; signed mesh gap, negative means penetration.',samples:records.length,missing:records.filter(r=>!r.vertices),minMm:sorted[0],p05Mm:sorted[Math.floor(sorted.length*.05)],medianMm:sorted[Math.floor(sorted.length*.5)],p95Mm:sorted[Math.floor(sorted.length*.95)],maxMm:sorted.at(-1),belowMinus3:good.filter(r=>r.gapMm< -3).length,above3:good.filter(r=>r.gapMm>3).length,worstLow:[...good].sort((a,b)=>a.gapMm-b.gapMm).slice(0,20),worstHigh:[...good].sort((a,b)=>b.gapMm-a.gapMm).slice(0,20)};
const dest=process.argv[2]??'/workspace/scratch/daybreak-assets/skin-contact-round6.json';fs.writeFileSync(dest,JSON.stringify({report,records},null,2));console.log(JSON.stringify(report,null,2));
