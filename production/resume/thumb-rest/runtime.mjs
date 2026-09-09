import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GrandPiano} from '/workspace/sites/daybreak-piano-film/production/qa/compiled/piano.mjs';
import {pedalPosition,mix,smooth} from '/workspace/sites/daybreak-piano-film/production/qa/compiled/math.mjs';

// A fingertip/key test does not detect one hand passing through the other.
// Test opposing finger and palm surface patches, retaining exact hit triangles.
const rigPath=path.resolve(process.env.DAYBREAK_RIG_MODULE??'/workspace/sites/daybreak-piano-film/production/qa/compiled/pianist.mjs');
const {Pianist}=await import(pathToFileURL(rigPath).href);
const scorePath=process.env.DAYBREAK_SCORE_PATH??'/workspace/sites/daybreak-piano-film/public/assets/score.json';
const scoreBytes=fs.readFileSync(scorePath),score=JSON.parse(scoreBytes);
const context=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};
globalThis.self=globalThis;
const loader=new GLTFLoader();
loader.register(()=>({name:'offline-validation-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const modelBytes=fs.readFileSync('/workspace/sites/daybreak-piano-film/public/assets/pianist.glb');
const gltf=await loader.parseAsync(modelBytes.buffer.slice(modelBytes.byteOffset,modelBytes.byteOffset+modelBytes.byteLength),'');
const performer=new Pianist(),piano=new GrandPiano();await performer.load(score,gltf.scene);
let body;gltf.scene.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});
if(!body)throw new Error('Missing Human surface');
const geo=body.geometry,si=geo.attributes.skinIndex,sw=geo.attributes.skinWeight,indices=geo.index.array;
const names=['Thumb','Index','Middle','Ring','Pinky','Palm'];
const patchName=index=>(index<6?'L':'R')+names[index%6];
const mode=process.env.DAYBREAK_SURFACE_MODE??'opposing';
if(!['opposing','own-palm'].includes(mode))throw new Error('Unknown surface comparison mode');
const pairs=mode==='opposing'?Array.from({length:6},(_,a)=>Array.from({length:6},(_,b)=>[a,b+6])).flat():Array.from({length:2},(_,side)=>Array.from({length:5},(_,finger)=>[side*6+finger,side*6+5])).flat();
const ownership=new Int8Array(si.count).fill(-1),triangles=Array.from({length:12},()=>[]);
for(let i=0;i<si.count;i++){
 const sums=new Float64Array(12);
 for(let j=0;j<4;j++){
  const name=body.skeleton.bones[si.getComponent(i,j)].name;
  const match=name.match(/^(Left|Right)Hand(?:(Thumb|Index|Middle|Ring|Pinky)[123])?$/);
  if(match)sums[(match[1]==='Left'?0:6)+(match[2]?names.indexOf(match[2]):5)]+=sw.getComponent(i,j);
 }
 const maximum=Math.max(...sums);if(maximum>.65)ownership[i]=sums.indexOf(maximum);
}
for(let i=0;i<indices.length;i+=3){
 const ids=[indices[i],indices[i+1],indices[i+2]],owner=ownership[ids[0]];
 if(owner>=0&&ids.every(id=>ownership[id]===owner))triangles[owner].push(ids);
}
const vertices=Array.from({length:12},(_,i)=>[...new Set(triangles[i].flat())]);
const edgeHit=(a,b,tri)=>{
 const delta=b.clone().sub(a),length=delta.length();if(length<1e-8)return null;
 const hit=new T.Ray(a,delta.divideScalar(length)).intersectTriangle(...tri,false,new T.Vector3());
 if(!hit)return null;const d=hit.distanceTo(a);return d>1e-7&&d<length-1e-7?hit:null;
};
function tree(list){
 const box=new T.Box3();for(const triangle of list)box.union(triangle.box);
 if(list.length<=12)return {box,list};
 const size=box.getSize(new T.Vector3()),axis=size.x>=size.y&&size.x>=size.z?'x':size.y>=size.z?'y':'z';
 list.sort((a,b)=>a.center[axis]-b.center[axis]);const middle=list.length>>1;
 return {box,left:tree(list.slice(0,middle)),right:tree(list.slice(middle))};
}
function intersect(a,b,hits){
 if(!a.box.intersectsBox(b.box))return;
 if(a.list&&b.list){
  for(const ta of a.list)for(const tb of b.list){
   if(!ta.box.intersectsBox(tb.box))continue;let hit=null;
   for(let edge=0;edge<3&&!hit;edge++)hit=edgeHit(ta.p[edge],ta.p[(edge+1)%3],tb.p)??edgeHit(tb.p[edge],tb.p[(edge+1)%3],ta.p);
   if(hit){hits.count++;if(hits.points.length<8)hits.points.push({a:ta.ids,b:tb.ids,point:hit.toArray()});}
  }
 }else if(a.list){intersect(a,b.left,hits);intersect(a,b.right,hits);}
 else if(b.list){intersect(a.left,b,hits);intersect(a.right,b,hits);}
 else{intersect(a.left,b.left,hits);intersect(a.left,b.right,hits);intersect(a.right,b.left,hits);intersect(a.right,b.right,hits);}
}

function pose(time){let i=score.sections.findIndex(s=>time>=s.start&&time<s.end);if(i<0)i=score.sections.length-1;const s=score.sections[i],prev=score.sections[Math.max(0,i-1)],energy=mix(prev.energy,s.energy,smooth((time-s.start)/1.8)),pedal=pedalPosition(time,score.pedals);piano.update(time,score.notes,pedal);performer.update(time,score,piano,pedal,energy);modelUpdate();}
function modelUpdate(){gltf.scene.updateMatrixWorld(true);body.skeleton.update();}
const wp=b=>b.getWorldPosition(new T.Vector3());
function surface(index){return tree(triangles[index].map(ids=>{const p=ids.map(id=>body.getVertexPosition(id,new T.Vector3()).applyMatrix4(body.matrixWorld)),box=new T.Box3().setFromPoints(p);return {ids,p,box,center:box.getCenter(new T.Vector3())};}));}
function collisions(a,b){const hits={count:0,points:[]};intersect(surface(a),surface(b),hits);return hits;}
export {T,fs,path,score,performer,piano,body,gltf,vertices,triangles,ownership,pose,modelUpdate,wp,surface,collisions};
