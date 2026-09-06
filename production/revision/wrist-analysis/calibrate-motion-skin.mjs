import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './pianist.mjs';
import {GrandPiano,keyX,isBlack,keySurfaceY} from './piano.mjs';
import {pedalPosition} from './math.mjs';
import {applyMotionPlan} from './motion-runtime.mjs';
const root='/workspace/scratch/2e8cc8e77f98/wrist-analysis';
const out=process.argv[2]??root+'/full-rig-audit.json';
const context=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-validation-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bytes=fs.readFileSync(root+'/input-pianist.glb');const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const score=JSON.parse(fs.readFileSync(root+'/planned-score.json'));const model=gltf.scene;model.updateMatrixWorld(true);let body;model.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});body.skeleton.update();
const names=['Thumb','Index','Middle','Ring','Pinky'],pads={};
for(const side of ['L','R'])for(let f=0;f<5;f++){
 const bi=body.skeleton.bones.findIndex(b=>b.name===(side==='L'?'Left':'Right')+'Hand'+names[f]+'3'),bone=body.skeleton.bones[bi],inv=bone.matrixWorld.clone().invert(),list=[];
 for(let i=0;i<body.geometry.attributes.position.count;i++){
 let weight=0;for(let j=0;j<4;j++)if(body.geometry.attributes.skinIndex.getComponent(i,j)===bi)weight+=body.geometry.attributes.skinWeight.getComponent(i,j);if(weight<.35)continue;
 const v=new T.Vector3();body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld).applyMatrix4(inv);list.push({i,y:v.y});
 }
 const max=Math.max(...list.map(v=>v.y));pads[side+(f+1)]=list.filter(v=>v.y>max-.011).map(v=>v.i);
}
const performer=new Pianist(),piano=new GrandPiano();await performer.load(score,model);applyMotionPlan(performer,JSON.parse(fs.readFileSync(root+'/motion-plan.json')));const v=new T.Vector3();
function pose(time){const section=score.sections.find(s=>time>=s.start&&time<s.end)??score.sections.at(-1),pedal=pedalPosition(time,score.pedals);piano.update(time,score.notes,pedal);performer.update(time,score,piano,pedal,section.energy);model.updateMatrixWorld(true);body.skeleton.update();}
const skin=[],missing=[];let contactSamples=0,maxContact=0;
for(const n of score.notes)for(const fraction of [.015,.25,.5,.8,.985]){
 const time=n.time+n.duration*fraction;pose(time);let gap=Infinity,count=0;const black=isBlack(n.midi),x=keyX(n.midi),half=black?.0145/2:.0227/2;
 for(const i of pads[n.hand+n.finger]){body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld);if(Math.abs(v.x-x)>half||v.z<(black?.133:.230)||v.z>(black?.221:.279))continue;count++;gap=Math.min(gap,v.y-keySurfaceY(n.midi,v.z));}
 const record={id:n.id,time,hand:n.hand,finger:n.finger,midi:n.midi,fraction,gapMm:gap*1000};if(!count)missing.push(record);else skin.push(record);
 for(const c of performer.contacts){contactSamples++;maxContact=Math.max(maxContact,c.error);}
}

const adjustments=[];
for(const n of score.notes){const ss=skin.filter(s=>s.id===n.id).map(s=>s.gapMm);if(!ss.length)continue;const min=Math.min(...ss),max=Math.max(...ss);if(min< -2.4||max>2.4){const old=n.contactLift??.002,delta=-(min+max)/2000;n.contactLift=Math.max(.0002,Math.min(.026,old+delta));adjustments.push({id:n.id,hand:n.hand,finger:n.finger,midi:n.midi,old,lift:n.contactLift,minMm:min,maxMm:max});}}
fs.writeFileSync(root+'/planned-score.json',JSON.stringify(score)+'\n');fs.writeFileSync(root+'/skin-calibration.json',JSON.stringify({adjustments:adjustments.length,missing:missing.length,details:adjustments},null,2));console.log(JSON.stringify({adjustments:adjustments.length,missing:missing.length,largest:adjustments.sort((a,b)=>Math.abs(b.lift-b.old)-Math.abs(a.lift-a.old)).slice(0,6)},null,2));
