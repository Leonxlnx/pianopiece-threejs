// Fit physical key releases and bake a C2 wrist trajectory for this exact score.
// Run export-scene.cjs first. The input is never overwritten implicitly.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from '../qa/compiled/pianist.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),project=path.resolve(here,'../..');
const input=process.argv[2],output=process.argv[3];
if(!input||!output)throw Error('Usage: node fit-performance.mjs input-score.json output-score.json');
const source=fs.readFileSync(input),score=JSON.parse(source);
delete score.wristMotion;
const context=new Proxy({},{get:(o,k)=>k in o?o[k]:()=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'geometry-only-fit',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bytes=fs.readFileSync(path.join(project,'public/assets/pianist.glb'));
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const performer=new Pianist();await performer.load(score,gltf.scene);
const changes=[],transitions=[],unresolved=[];
const accelerationLimit=25,speedLimit=1.5,rotationLimit=6;
const hands=performer.hands.map(hand=>{
 const knots=hand.plan.map((g,i)=>{
  const knot={time:g.time,position:g.pose.position.toArray(),quaternion:g.pose.q.toArray()};
  if(!i)return knot;
  const previous=hand.plan[i-1],distance=g.pose.position.distanceTo(previous.pose.position),angle=g.pose.q.angleTo(previous.pose.q);
  // Quintic smootherstep has max first derivative1.875 and second5.773503.
  const required=Math.max(.06,Math.sqrt(5.773503*distance/accelerationLimit),1.875*distance/speedLimit,1.875*angle/rotationLimit);
  const end=g.time-.004,available=end-previous.time-.075;
  const duration=Math.min(.46,Math.max(required,Math.min(.32,end-previous.end)));
  const begin=end-duration;
  if(duration>available+1e-6)unresolved.push({side:hand.side,time:g.time,required,duration,available,distance});
  for(const n of hand.notes){
   if(n.time>=g.time-.045||n.time+n.duration<=begin)continue;
   const fitted=begin-n.time;
   if(fitted<.075){unresolved.push({id:n.id,time:g.time,reason:'hold too short',fitted});continue;}
   const old=n.duration;n.duration=Number(fitted.toFixed(6));
   changes.push({id:n.id,hand:n.hand,midi:n.midi,time:n.time,from:old,to:n.duration,shortenedMs:1000*(old-n.duration)});
  }
  knot.moveStart=Number(begin.toFixed(6));knot.moveEnd=Number(end.toFixed(6));
  transitions.push({side:hand.side,time:g.time,distance,duration,predictedSpeed:1.875*distance/duration,predictedAcceleration:5.773503*distance/duration**2});
  return knot;
 });
 return {side:hand.side,knots};
});
if(unresolved.length){fs.writeFileSync(path.join(here,'release-fit-unresolved.json'),JSON.stringify(unresolved,null,2)+'\n');throw Error(`${unresolved.length} unresolved physical release constraints; no score written`);}
score.wristMotion={version:1,hands};
fs.writeFileSync(output,JSON.stringify(score)+'\n');
const report={inputSha256:crypto.createHash('sha256').update(source).digest('hex'),scoreSha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),rigSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(project,'app/performance/pianist.ts'))).digest('hex'),limits:{accelerationLimit,speedLimit,rotationLimit},changes,transitions,unresolved,scope:'Analytic wrist motion bounds and explicit physical release edits. Actual contact, arms and skin must be independently replayed on the fitted score.'};
fs.writeFileSync(path.join(here,'release-fit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({changes:changes.length,maximumShorteningMs:Math.max(0,...changes.map(c=>c.shortenedMs)),knots:transitions.length+2,unresolved:unresolved.length}));
