import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './pianist.mjs';
import {GrandPiano,keyX,isBlack,keySurfaceY} from './piano.mjs';
import {pedalPosition,mix,smooth} from './math.mjs';

const root='/workspace/scratch/2e8cc8e77f98/local-finger-fix';
const out=process.argv[2]??root+'/full-rig-audit.json';
const context=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-validation-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bytes=fs.readFileSync('/workspace/scratch/2e8cc8e77f98/wrist-analysis/input-pianist.glb');const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const score=JSON.parse(fs.readFileSync(root+'/candidate-score.json'));const model=gltf.scene;model.updateMatrixWorld(true);let body;model.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});body.skeleton.update();
const names=['Thumb','Index','Middle','Ring','Pinky'],pads={};
for(const side of ['L','R'])for(let f=0;f<5;f++){
 const bi=body.skeleton.bones.findIndex(b=>b.name===(side==='L'?'Left':'Right')+'Hand'+names[f]+'3'),bone=body.skeleton.bones[bi],inv=bone.matrixWorld.clone().invert(),list=[];
 for(let i=0;i<body.geometry.attributes.position.count;i++){
 let weight=0;for(let j=0;j<4;j++)if(body.geometry.attributes.skinIndex.getComponent(i,j)===bi)weight+=body.geometry.attributes.skinWeight.getComponent(i,j);if(weight<.35)continue;
 const v=new T.Vector3();body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld).applyMatrix4(inv);list.push({i,y:v.y});
 }
 const max=Math.max(...list.map(v=>v.y));pads[side+(f+1)]=list.filter(v=>v.y>max-.011).map(v=>v.i);
}
const performer=new Pianist(),piano=new GrandPiano();await performer.load(score,model);const v=new T.Vector3();
function pose(time){let index=score.sections.findIndex(s=>time>=s.start&&time<s.end);if(index<0)index=score.sections.length-1;const section=score.sections[index],previous=score.sections[Math.max(0,index-1)],energy=mix(previous.energy,section.energy,smooth((time-section.start)/1.8)),pedal=pedalPosition(time,score.pedals);piano.update(time,score.notes,pedal);performer.update(time,score,piano,pedal,energy);model.updateMatrixWorld(true);body.skeleton.update();}
const ids=['p00396','p00513','p00874'];
function inspect(n){const samples=[];for(let i=0;i<=100;i++){
 const fraction=.005+.99*i/100,time=n.time+n.duration*fraction;pose(time);let gap=Infinity,count=0;const black=isBlack(n.midi),x=keyX(n.midi),half=black?.0145/2:.0227/2;
 for(const i of pads[n.hand+n.finger]){body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld);if(Math.abs(v.x-x)>half||v.z<(black?.133:.230)||v.z>(black?.221:.279))continue;count++;gap=Math.min(gap,v.y-keySurfaceY(n.midi,v.z));}
 samples.push({time,gapMm:gap*1000,count,ikMm:Math.max(...performer.contacts.map(c=>c.error))*1000});
}return {id:n.id,finger:n.finger,lift:n.contactLift,min:Math.min(...samples.map(x=>x.gapMm)),max:Math.max(...samples.map(x=>x.gapMm)),missing:samples.filter(x=>!x.count).length,maxIK:Math.max(...samples.map(x=>x.ikMm)),samples};}
const rounds=[];for(let round=0;round<3;round++){const reports=ids.map(id=>inspect(score.notes.find(n=>n.id===id)));rounds.push(reports);let changes=0;for(const r of reports){if(r.missing||r.min>=-2.4&&r.max<=2.4)continue;const n=score.notes.find(n=>n.id===r.id);n.contactLift-=(r.min+r.max)/2000;changes++;}if(!changes)break;}
fs.writeFileSync(root+'/skin-report.json',JSON.stringify(rounds,null,2));fs.writeFileSync(root+'/candidate-score.json',JSON.stringify(score));console.log(JSON.stringify(rounds.map(x=>x.map(({samples,...rest})=>rest)),null,2));
