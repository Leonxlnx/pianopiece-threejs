import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {pathToFileURL} from 'node:url';
const {Pianist}=await import(process.env.DAYBREAK_RIG_MODULE?pathToFileURL(process.env.DAYBREAK_RIG_MODULE).href:'./pianist-candidate-baked.mjs');
import {GrandPiano,keyX,isBlack,keySurfaceY} from '/workspace/sites/daybreak-piano-film/production/qa/compiled/piano.mjs';
import {pedalPosition,scoreEnergy} from '/workspace/sites/daybreak-piano-film/production/qa/compiled/math.mjs';
const {wristMotionSampler}=await import(process.env.DAYBREAK_WRIST_MODULE?pathToFileURL(process.env.DAYBREAK_WRIST_MODULE).href:'/workspace/sites/daybreak-piano-film/production/qa/compiled/wrist-motion.mjs');
export {T,keyX,isBlack,keySurfaceY};
const ctx=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bytes=fs.readFileSync('/workspace/sites/daybreak-piano-film/public/assets/pianist.glb');
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
export const baseline=JSON.parse(fs.readFileSync(process.env.DAYBREAK_SCORE??'score-v11.json'));
export const performer=new Pianist(),piano=new GrandPiano(),model=gltf.scene;
await performer.load(baseline,model);
export let score=baseline;
export function install(s){score=s;performer.score=s;performer.wristMotion=wristMotionSampler(s.wristMotion);for(const h of performer.hands){h.notes=s.notes.filter(n=>n.hand===h.side);h.fingerNotes=Array.from({length:5},(_,i)=>h.notes.filter(n=>n.finger===i+1));}}
export let body;model.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});
const names=['Thumb','Index','Middle','Ring','Pinky','Palm'];
export const patchName=i=>(i<6?'L':'R')+names[i%6];
export const ownership=new Int8Array(body.geometry.attributes.position.count).fill(-1),triangles=Array.from({length:12},()=>[]),vertices=Array.from({length:12},()=>[]);
const si=body.geometry.attributes.skinIndex,sw=body.geometry.attributes.skinWeight,indices=body.geometry.index.array;
for(let i=0;i<si.count;i++){const sums=new Float64Array(12);for(let j=0;j<4;j++){const match=body.skeleton.bones[si.getComponent(i,j)].name.match(/^(Left|Right)Hand(?:(Thumb|Index|Middle|Ring|Pinky)[123])?$/);if(match)sums[(match[1]==='Left'?0:6)+(match[2]?names.indexOf(match[2]):5)]+=sw.getComponent(i,j);}const max=Math.max(...sums);if(max>.65){const o=sums.indexOf(max);ownership[i]=o;vertices[o].push(i);}}
for(let i=0;i<indices.length;i+=3){const ids=[indices[i],indices[i+1],indices[i+2]],o=ownership[ids[0]];if(o>=0&&ids.every(id=>ownership[id]===o))triangles[o].push(ids);}
const edgeHit=(a,b,tri)=>{const delta=b.clone().sub(a),length=delta.length();if(length<1e-8)return null;const hit=new T.Ray(a,delta.divideScalar(length)).intersectTriangle(...tri,false,new T.Vector3());if(!hit)return null;const d=hit.distanceTo(a);return d>1e-7&&d<length-1e-7?hit:null;};
function tree(list){const box=new T.Box3();for(const tri of list)box.union(tri.box);if(list.length<=12)return {box,list};const size=box.getSize(new T.Vector3()),axis=size.x>=size.y&&size.x>=size.z?'x':size.y>=size.z?'y':'z';list.sort((a,b)=>a.center[axis]-b.center[axis]);const middle=list.length>>1;return {box,left:tree(list.slice(0,middle)),right:tree(list.slice(middle))};}
function intersect(a,b,hits){if(!a.box.intersectsBox(b.box))return;if(a.list&&b.list){for(const ta of a.list)for(const tb of b.list){if(!ta.box.intersectsBox(tb.box))continue;let hit=null;for(let e=0;e<3&&!hit;e++)hit=edgeHit(ta.p[e],ta.p[(e+1)%3],tb.p)??edgeHit(tb.p[e],tb.p[(e+1)%3],ta.p);if(hit){hits.count++;if(hits.points.length<12)hits.points.push({a:ta.ids,b:tb.ids,point:hit.toArray()});}}}else if(a.list){intersect(a,b.left,hits);intersect(a,b.right,hits);}else if(b.list){intersect(a.left,b,hits);intersect(a.right,b,hits);}else {intersect(a.left,b.left,hits);intersect(a.left,b.right,hits);intersect(a.right,b.left,hits);intersect(a.right,b.right,hits);}}
export function update(time){const pedal=pedalPosition(time,score.pedals),energy=scoreEnergy(time,score.sections);piano.update(time,score.notes,pedal);performer.update(time,score,piano,pedal,energy);model.updateMatrixWorld(true);body.skeleton.update();piano.group.updateMatrixWorld(true);}
export function measure(time,side,{exact=true,allDigits=true,targetFinger=null,opposing=false}={}){
 update(time);const offset=side==='L'?0:6,owners=Array.from({length:6},(_,i)=>offset+i),active=score.notes.filter(n=>n.hand===side&&n.time<=time&&n.time+n.duration>time),activeIndices=active.map(n=>offset+n.finger-1);
 const world=new Map(),bounds=new Map();for(const o of (opposing?Array.from({length:12},(_,i)=>i):owners)){const box=new T.Box3();for(const id of vertices[o]){const p=body.getVertexPosition(id,new T.Vector3()).applyMatrix4(body.matrixWorld);world.set(id,p);box.expandByPoint(p);}bounds.set(o,box);}
 const keys=[...piano.keys.values()].map(k=>{if(!k.mesh.geometry.boundingBox)k.mesh.geometry.computeBoundingBox();const box=k.mesh.geometry.boundingBox,core=box.clone().expandByScalar(k.black?-.002:-.0014);return {midi:k.midi,box,core,world:core.clone().applyMatrix4(k.mesh.matrixWorld),inverse:k.mesh.matrixWorld.clone().invert()};});
 const keyHits=[];for(const o of owners){if(!allDigits&&!activeIndices.includes(o)&&o%6!==5)continue;const possibles=keys.filter(k=>k.world.intersectsBox(bounds.get(o))),collisions=new Map();for(const id of vertices[o]){const p=world.get(id);for(const k of possibles){if(!k.world.containsPoint(p))continue;const local=p.clone().applyMatrix4(k.inverse);if(!k.core.containsPoint(local))continue;const depth=1000*Math.min(local.x-k.box.min.x,k.box.max.x-local.x,local.y-k.box.min.y,k.box.max.y-local.y,local.z-k.box.min.z,k.box.max.z-local.z);let hit=collisions.get(k.midi);if(!hit){hit={patch:patchName(o),owner:o,active:activeIndices.includes(o),midi:k.midi,count:0,depth:0};collisions.set(k.midi,hit);}hit.count++;if(depth>hit.depth){hit.depth=depth;hit.vertex=id;hit.point=p.toArray();}}}keyHits.push(...collisions.values());}
 const crossings=[],trees=new Map();function getTree(o){if(!trees.has(o))trees.set(o,tree(triangles[o].map(ids=>{const p=ids.map(id=>world.get(id)),box=new T.Box3().setFromPoints(p);return {ids,p,box,center:box.getCenter(new T.Vector3())};})));return trees.get(o);}
 if(exact){const pairs=[];for(let a=0;a<6;a++)for(let b=a+1;b<6;b++){if(targetFinger!==null&&a!==targetFinger-1&&b!==targetFinger-1)continue;pairs.push([offset+a,offset+b]);}if(opposing)for(let a=0;a<6;a++)for(let b=0;b<6;b++)pairs.push([a,b+6]);for(const [a,b] of pairs){if(!bounds.get(a).intersectsBox(bounds.get(b)))continue;const hits={count:0,points:[]};intersect(getTree(a),getTree(b),hits);if(hits.count)crossings.push({a:patchName(a),b:patchName(b),trianglePairs:hits.count,points:hits.points});}}
 const meshContacts=active.map(n=>{const k=keys.find(k=>k.midi===n.midi),o=offset+n.finger-1,bevel=isBlack(n.midi)?.002:.0014;let minGap=Infinity,count=0;for(const id of vertices[o]){const p=world.get(id).clone().applyMatrix4(k.inverse);if(p.x>=k.box.min.x+bevel&&p.x<=k.box.max.x-bevel&&p.z>=k.box.min.z+bevel&&p.z<=k.box.max.z-bevel){minGap=Math.min(minGap,(p.y-k.box.max.y)*1000);count++;}}return {id:n.id,minGap:Number.isFinite(minGap)?minGap:null,count};});
 const hand=performer.hands.find(h=>h.side===side),chains=hand.fingers.map((f,i)=>({finger:i+1,points:[...f.bones,f.tip].map(b=>b.getWorldPosition(new T.Vector3()).toArray())}));
 return {time,side,meshContacts,active:active.map(n=>({id:n.id,midi:n.midi,finger:n.finger})),keyHits,crossings,chains,wrist:hand.wrist.getWorldPosition(new T.Vector3()).toArray(),contacts:performer.contacts.filter(c=>c.hand===side)};
}
