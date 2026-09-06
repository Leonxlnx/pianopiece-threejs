import fs from 'node:fs';import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './compiled/pianist.mjs';import {GrandPiano} from './compiled/piano.mjs';import {pedalPosition,mix,smooth} from './compiled/math.mjs';
export {T};
export const score=JSON.parse(fs.readFileSync('score.json')),plan=JSON.parse(fs.readFileSync('motion-plan.json'));
// Exactly the external wrist plan being integrated in production; avoid
// recomputing unrelated optimization knots when loading a test partition.
score.wristMotion??={version:1,hands:plan.map(h=>({side:h.side,knots:h.plan.map(k=>({time:k.time,moveStart:k.moveStart,moveEnd:k.moveEnd,position:k.pose.position,quaternion:k.pose.q}))}))};
const context=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bytes=fs.readFileSync('/workspace/sites/daybreak-piano-film/public/assets/pianist.glb');const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
export const performer=new Pianist(),piano=new GrandPiano(),model=gltf.scene;
await performer.load(score,model);
export const fingers=performer.hands.flatMap(h=>h.fingers.map((f,fi)=>({h,f,fi,key:h.side+(fi+1),notes:h.fingerNotes[fi]})));
export const wp=b=>b.getWorldPosition(new T.Vector3());
export function pose(time){let index=score.sections.findIndex(s=>time>=s.start&&time<s.end);if(index<0)index=score.sections.length-1;const section=score.sections[index],previous=score.sections[Math.max(0,index-1)],energy=mix(previous.energy,section.energy,smooth((time-section.start)/1.8)),pedal=pedalPosition(time,score.pedals);piano.update(time,score.notes,pedal);performer.update(time,score,piano,pedal,energy);model.updateMatrixWorld(true);return energy;}
export function contextAt(g,time){const active=g.notes.find(n=>time>=n.time&&time<n.time+n.duration),prev=g.notes.filter(n=>n.time+n.duration<=time).at(-1),next=g.notes.find(n=>n.time>=time);return {active:active?.id??null,activeMidi:active?.midi??null,prev:prev?.id??null,prevEnd:prev?prev.time+prev.duration:null,next:next?.id??null,nextTime:next?.time??null,gap:prev&&next?next.time-prev.time-prev.duration:null};}
