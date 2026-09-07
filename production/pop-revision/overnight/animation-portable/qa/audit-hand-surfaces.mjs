/** Finite actual-surface screen. All writes are directed to --out. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
const {values:a}=parseArgs({options:{project:{type:'string'},rig:{type:'string'},piano:{type:'string'},score:{type:'string'},model:{type:'string'},out:{type:'string'},times:{type:'string'},count:{type:'string',default:'48'},'all-midpoints':{type:'boolean',default:false}}});
const here=path.dirname(fileURLToPath(import.meta.url));
const project=path.resolve(a.project??path.join(here,'../..'));
const files={rig:path.resolve(a.rig??path.join(project,'production/qa/compiled/pianist.mjs')),piano:path.resolve(a.piano??path.join(project,'production/qa/compiled/piano.mjs')),score:path.resolve(a.score??path.join(project,'public/assets/score.json')),model:path.resolve(a.model??path.join(project,'public/assets/pianist.glb'))};
const output=path.resolve(a.out??path.join(here,'finite-audit.json'));
const req=createRequire(path.join(project,'package.json')),T=await import(req.resolve('three')),{GLTFLoader}=await import(req.resolve('three/addons/loaders/GLTFLoader.js'));
const {Pianist}=await import(pathToFileURL(files.rig)),{GrandPiano}=await import(pathToFileURL(files.piano));
const bytes=Object.fromEntries(Object.entries(files).map(([k,f])=>[k,fs.readFileSync(f)])),score=JSON.parse(bytes.score);
const loader=new GLTFLoader();loader.register(()=>({name:'real-geometry-texture-placeholder',loadTexture:()=>Promise.resolve(new T.Texture())}));
const context=new Proxy({},{get:(x,k)=>k in x?x[k]:()=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.self=globalThis;
const gltf=await loader.parseAsync(bytes.model.buffer.slice(bytes.model.byteOffset,bytes.model.byteOffset+bytes.model.byteLength),'');
const performer=new Pianist(),piano=new GrandPiano();await performer.load(score,gltf.scene);
let body;gltf.scene.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});if(!body)throw Error('Missing actual Human skin');
const geo=body.geometry,si=geo.attributes.skinIndex,sw=geo.attributes.skinWeight,indices=geo.index.array;
const names=['Thumb','Index','Middle','Ring','Pinky','Palm'],label=i=>(i<6?'L':'R')+names[i%6];
const ownership=new Int8Array(si.count).fill(-1),wholeHand=new Int8Array(si.count).fill(-1),owned=Array.from({length:12},()=>[]),triangles=Array.from({length:12},()=>[]),mixed=[];
for(let id=0;id<si.count;id++){
 const sums=new Float64Array(12);for(let j=0;j<4;j++){const m=body.skeleton.bones[si.getComponent(id,j)].name.match(/^(Left|Right)Hand(?:(Thumb|Index|Middle|Ring|Pinky)[123])?$/);if(m)sums[(m[1]==='Left'?0:6)+(m[2]?names.indexOf(m[2]):5)]+=sw.getComponent(id,j);}
 const max=Math.max(...sums),side=[sums.slice(0,6).reduce((x,y)=>x+y,0),sums.slice(6).reduce((x,y)=>x+y,0)];
 if(max>.65){ownership[id]=sums.indexOf(max);owned[ownership[id]].push(id);}
 if(Math.max(...side)>.50){wholeHand[id]=side[0]>side[1]?0:1;if(max<=.65)mixed.push(id);}
}
for(let i=0;i<indices.length;i+=3){const ids=[indices[i],indices[i+1],indices[i+2]],o=ownership[ids[0]];if(o>=0&&ids.every(id=>ownership[id]===o))triangles[o].push(ids);}
const included=[...new Set([...owned.flat(),...mixed])],patchVertices=triangles.map(ts=>[...new Set(ts.flat())]);
const pairs=[];for(let s=0;s<2;s++){for(let f=0;f<5;f++)pairs.push([s*6+f,s*6+5,'own-palm']);for(let f=0;f<5;f++)for(let g=f+1;g<5;g++)pairs.push([s*6+f,s*6+g,'neighbor']);}for(let l=0;l<6;l++)for(let r=0;r<6;r++)pairs.push([l,r+6,'opposing']);
function sampleTimes(){
 if(a.times){if(fs.existsSync(a.times)){const j=JSON.parse(fs.readFileSync(a.times));return (Array.isArray(j)?j:j.rows).map(v=>typeof v==='number'?v:v.time);}return a.times.split(',').map(Number);}
 const sorted=score.notes.map(n=>({t:n.time+n.duration*.5,n})).sort((x,y)=>x.t-y.t);
 if(a['all-midpoints'])return [0,score.duration,...sorted.map(x=>x.t)];
 const count=Math.max(4,Number(a.count)),times=[0,score.duration];
 // Evenly distributed by note index separately for each hand, then actual
 // opening/ending and section-center holds. This is not a suspected-only list.
 for(const side of ['L','R']){const ns=sorted.filter(x=>x.n.hand===side);for(let i=0;i<Math.ceil(count/2);i++)if(ns.length)times.push(ns[Math.round(i*(ns.length-1)/(Math.ceil(count/2)-1))].t);}
 for(const s of score.sections??[]){const t=(s.start+s.end)/2;const near=sorted.reduce((best,x)=>Math.abs(x.t-t)<Math.abs(best.t-t)?x:best,sorted[0]);if(near)times.push(near.t);}
 return times;
}
const times=[...new Set(sampleTimes().filter(Number.isFinite).map(t=>Math.max(0,Math.min(t,score.duration))))].sort((x,y)=>x-y);
function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
function pedalAt(t){let i=score.pedals.findIndex(p=>p.time>t);if(i<0)i=score.pedals.length;const prev=score.pedals[Math.max(0,i-1)];return prev?.value??0;}
function energyAt(t){let i=score.sections.findIndex(s=>t>=s.start&&t<s.end);if(i<0)i=score.sections.length-1;const s=score.sections[i],p=score.sections[Math.max(0,i-1)];return p.energy+(s.energy-p.energy)*smooth((t-s.start)/1.8);}
// Use the actual production smooth pedal helper if compiled alongside the rig.
let productionMath;try{productionMath=await import(pathToFileURL(path.join(path.dirname(files.rig),'math.mjs')));}catch{}
function edgeHit(a,b,tri){const d=b.clone().sub(a),l=d.length();if(l<1e-8)return null;const p=new T.Ray(a,d.divideScalar(l)).intersectTriangle(...tri,false,new T.Vector3());if(!p)return null;const n=p.distanceTo(a);return n>1e-7&&n<l-1e-7?p:null;}
function tree(ts){const box=new T.Box3();for(const t of ts)box.union(t.box);if(ts.length<=12)return{box,list:ts};const s=box.getSize(new T.Vector3()),axis=s.x>=s.y&&s.x>=s.z?'x':s.y>=s.z?'y':'z';ts.sort((a,b)=>a.center[axis]-b.center[axis]);const m=ts.length>>1;return{box,left:tree(ts.slice(0,m)),right:tree(ts.slice(m))};}
function intersect(a,b,h){if(!a.box.intersectsBox(b.box))return;if(a.list&&b.list){for(const x of a.list)for(const y of b.list){if(!x.box.intersectsBox(y.box))continue;let p;for(let e=0;e<3&&!p;e++)p=edgeHit(x.p[e],x.p[(e+1)%3],y.p)??edgeHit(y.p[e],y.p[(e+1)%3],x.p);if(p){h.count++;if(h.points.length<5)h.points.push({a:x.ids,b:y.ids,world:p.toArray()});}}}else if(a.list){intersect(a,b.left,h);intersect(a,b.right,h);}else if(b.list){intersect(a.left,b,h);intersect(a.right,b,h);}else{intersect(a.left,b.left,h);intersect(a.left,b.right,h);intersect(a.right,b.left,h);intersect(a.right,b.right,h);}}
const rows=[];let nonfinite=0,knownPositiveRows=0;
for(const [sample,t]of times.entries()){
 const pedal=productionMath?.pedalPosition?.(t,score.pedals)??pedalAt(t),energy=productionMath?.scoreEnergy?.(t,score.sections)??energyAt(t);
 piano.update(t,score.notes,pedal);performer.update(t,score,piano,pedal,energy);gltf.scene.updateMatrixWorld(true);body.skeleton.update();piano.group.updateMatrixWorld(true);
 const active=score.notes.filter(n=>n.time<=t&&n.time+n.duration>t),world=new Map();
 for(const id of included){const p=body.getVertexPosition(id,new T.Vector3()).applyMatrix4(body.matrixWorld);world.set(id,p);if(!p.toArray().every(Number.isFinite))nonfinite++;}
 const keys=[...piano.keys].map(([midi,k])=>{if(!k.mesh.geometry.boundingBox)k.mesh.geometry.computeBoundingBox();const box=k.mesh.geometry.boundingBox,inside=box.clone().expandByScalar(k.black?-.002:-.0014);return{midi,box,inside,world:inside.clone().applyMatrix4(k.mesh.matrixWorld),inverse:k.mesh.matrixWorld.clone().invert()};});
 const keyHits=new Map();for(const id of included){const p=world.get(id),o=ownership[id],side=wholeHand[id];const patch=o>=0?label(o):(side===0?'LMixedWeb':'RMixedWeb');for(const k of keys){if(!k.world.containsPoint(p))continue;const l=p.clone().applyMatrix4(k.inverse);if(!k.inside.containsPoint(l))continue;const depth=1000*Math.min(l.x-k.box.min.x,k.box.max.x-l.x,l.y-k.box.min.y,k.box.max.y-l.y,l.z-k.box.min.z,k.box.max.z-l.z);const key=patch+':'+k.midi;let hit=keyHits.get(key);if(!hit){hit={patch,key:k.midi,active:o>=0&&o%6<5&&active.some(n=>n.hand===(o<6?'L':'R')&&n.finger===o%6+1),vertices:0,deepVertices:0,maxDepthMm:0,deepest:null};keyHits.set(key,hit);}hit.vertices++;if(depth>3)hit.deepVertices++;if(depth>hit.maxDepthMm){hit.maxDepthMm=depth;hit.deepest={vertex:id,world:p.toArray(),local:l.toArray(),weights:Array.from({length:4},(_,j)=>({bone:body.skeleton.bones[si.getComponent(id,j)].name,weight:sw.getComponent(id,j)}))};}}}
 const bounds=patchVertices.map(ids=>new T.Box3().setFromPoints(ids.map(id=>world.get(id)))),trees=new Map(),surfaceHits=[];
 function getTree(i){if(!trees.has(i))trees.set(i,tree(triangles[i].map(ids=>{const p=ids.map(id=>world.get(id)),box=new T.Box3().setFromPoints(p);return{ids,p,box,center:box.getCenter(new T.Vector3())};})));return trees.get(i);}
 for(const [a,b,kind]of pairs){if(!bounds[a].intersectsBox(bounds[b]))continue;const h={count:0,points:[]};intersect(getTree(a),getTree(b),h);if(h.count)surfaceHits.push({a:label(a),b:label(b),kind,trianglePairs:h.count,points:h.points});}
 const skinKeys=[...keyHits.values()],row={time:t,active:active.map(n=>({id:n.id,hand:n.hand,finger:n.finger,midi:n.midi})),keyHits:skinKeys,surfaceHits,markerMaxErrorMm:Math.max(0,...performer.contacts.map(c=>c.error*1000))};rows.push(row);
 if(skinKeys.some(k=>k.maxDepthMm>3)||surfaceHits.length)knownPositiveRows++;
 if(sample%12===0)console.log(JSON.stringify({sample,total:times.length,flaggedRows:knownPositiveRows}));
}
const summary={samples:rows.length,keyCoreRowsOver3mm:rows.filter(r=>r.keyHits.some(h=>h.maxDepthMm>3)).length,activeKeyCoreHitsOver3mm:rows.flatMap(r=>r.keyHits).filter(h=>h.active&&h.maxDepthMm>3).length,inactiveKeyCoreHitsOver3mm:rows.flatMap(r=>r.keyHits).filter(h=>!h.active&&h.maxDepthMm>3).length,maxKeyCoreDepthMm:Math.max(0,...rows.flatMap(r=>r.keyHits).map(h=>h.maxDepthMm)),ownPalmRows:rows.filter(r=>r.surfaceHits.some(h=>h.kind==='own-palm')).length,neighborRows:rows.filter(r=>r.surfaceHits.some(h=>h.kind==='neighbor')).length,opposingRows:rows.filter(r=>r.surfaceHits.some(h=>h.kind==='opposing')).length,markerMaxErrorMm:Math.max(...rows.map(r=>r.markerMaxErrorMm)),nonfinite};
const report={inputs:Object.fromEntries(Object.entries(files).map(([k,f])=>[k,{path:f,sha256:crypto.createHash('sha256').update(bytes[k]).digest('hex')}])),selection:a.times?'explicit':a['all-midpoints']?'every note midpoint plus opening and ending':'evenly spaced per-hand note midpoints, section-center note midpoints, opening and ending',summary,ownership:{ownedVertices:owned.map((v,i)=>({patch:label(i),count:v.length,triangles:triangles[i].length})),mixedWebVertices:mixed.length},scope:'Exact production deformed Human vertices against all 88 actual animated rounded-key inner boxes; original-box nearest-face depth. Whole hand-owned and mixed web vertices included for key cores. Exact noncoplanar edge/triangle intersections for >65%-owned digit/palm patches; mixed web, coplanar and completely enclosed surfaces excluded from pair tests. Counts are not penetration depth or visual approval. Finite sampling cannot establish continuous clearance.',rows};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,summary},null,2));if(nonfinite)process.exitCode=1;
