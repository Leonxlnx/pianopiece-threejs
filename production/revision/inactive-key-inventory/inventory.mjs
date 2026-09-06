import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const out=process.env.INVENTORY_OUTPUT??path.dirname(fileURLToPath(import.meta.url));
const tag=process.env.INVENTORY_TAG??'8d92';
const project='/workspace/sites/daybreak-piano-film';
const input=process.env.SCORE_PATH??'/workspace/scratch/2e8cc8e77f98/endpoint-fix/candidate-forward.json';
const require=createRequire(path.join(project,'package.json')),ts=require('typescript');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
fs.mkdirSync(path.join(out,'source'),{recursive:true});
fs.mkdirSync(path.join(out,'compiled'),{recursive:true});
const snapshot=path.join(out,`score-${tag}.json`);
if(!fs.existsSync(snapshot))fs.copyFileSync(input,snapshot);
const scoreBytes=fs.readFileSync(snapshot),score=JSON.parse(scoreBytes);
if(tag==='8d92'&&sha(scoreBytes)!=='8d92b2080768b6cfc8cc81a9e6ad1ff2d56577ca96078510281da5b0b090c4fb')throw Error('Expected frozen 8d92 score');
const sourceHashes={},queue=['math','piano','wrist-motion','pianist'],done=new Set();
while(queue.length){
 const name=queue.shift();if(done.has(name))continue;done.add(name);
 const file=path.join(out,'source',name+'.ts');if(!fs.existsSync(file))fs.copyFileSync(path.join(project,'app/performance',name+'.ts'),file);
 const source=fs.readFileSync(file,'utf8');sourceHashes[name]=sha(source);
 if(name==='pianist'&&sourceHashes[name]!=='fedec1a81e52ccfc87527b3522100d8a6facd2674b6ed2a7b145e50f48cdc184')throw Error('Expected frozen fedec rig');
 let code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 code=code.replace(/from (['"])([^'"]+)\1/g,(_,q,s)=>{if(s.startsWith('.'))queue.push(s.replace('./',''));return `from ${JSON.stringify(pathToFileURL(s.startsWith('.')?path.join(out,'compiled',s+'.mjs'):require.resolve(s)).href)}`;});
 fs.writeFileSync(path.join(out,'compiled',name+'.mjs'),code);
}
const T=await import(pathToFileURL(require.resolve('three')));
const {GLTFLoader}=await import(pathToFileURL(require.resolve('three/addons/loaders/GLTFLoader.js')));
let rigFile=path.join(out,'compiled/pianist.mjs');
if(process.env.RIG_MODULE){const frozen=path.join(out,'source','runtime-variant.mjs');if(!fs.existsSync(frozen))fs.copyFileSync(process.env.RIG_MODULE,frozen);const code=fs.readFileSync(frozen,'utf8');sourceHashes.runtimeVariant=sha(code);rigFile=path.join(out,'compiled/runtime-variant.mjs');fs.writeFileSync(rigFile,code.replace(/from (['"])([^'"]+)\1/g,(_,q,s)=>`from ${JSON.stringify(pathToFileURL(s.startsWith('.')?path.join(out,'compiled',s):require.resolve(s)).href)}`));}
const {Pianist}=await import(pathToFileURL(rigFile));
const {GrandPiano,keyX,isBlack}=await import(pathToFileURL(path.join(out,'compiled/piano.mjs')));
const {scoreEnergy,pedalPosition}=await import(pathToFileURL(path.join(out,'compiled/math.mjs')));
const context=new Proxy({},{get:(a,k)=>k in a?a[k]:()=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.self=globalThis;
const modelPath='/workspace/scratch/2e8cc8e77f98/thumb-key-screen/pianist.glb';
const bytes=fs.readFileSync(modelPath),loader=new GLTFLoader();
loader.register(()=>({name:'geometry-only-inspection',loadTexture:()=>Promise.resolve(new T.Texture())}));
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const performer=new Pianist(),piano=new GrandPiano(),model=gltf.scene;
await performer.load(score,model);
let body;model.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});
if(!body||piano.keys.size!==88)throw Error('Expected Human skinned mesh and 88 key records');
const names=['Thumb','Index','Middle','Ring','Pinky'];
const si=body.geometry.attributes.skinIndex,sw=body.geometry.attributes.skinWeight,owned=Object.fromEntries(['L','R'].flatMap(s=>names.map((_,i)=>[s+(i+1),[]])));
for(let i=0;i<si.count;i++){
 const sums=new Float64Array(10);
 for(let j=0;j<4;j++){const match=body.skeleton.bones[si.getComponent(i,j)].name.match(/^(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)[123]$/);if(match)sums[(match[1]==='Left'?0:5)+names.indexOf(match[2])]+=sw.getComponent(i,j);}
 const weight=Math.max(...sums);if(weight>=.65){const digit=sums.indexOf(weight);owned[(digit<5?'L':'R')+(digit%5+1)].push(i);}
}
const known=[{label:'known-idle-L-98',side:'L',start:98.497,end:99.129},{label:'known-idle-L-177',side:'L',start:177.706,end:178.330},{label:'known-idle-R-147',side:'R',start:147.388,end:148.819},{label:'known-coda-L',side:'L',start:224.403,end:229.112}];
const nonthumb={N125:['p00428','p00429'],N101:['p00312','p00318','p00331'],N057:['p00144'],N031:['p00066','p00120','p00251','p00624','p00651'],N017:['p00038','p00134','p00172','p00186','p00198','p00240','p00322','p00336','p00344'],N095:['p00299']};
const selected=new Map();for(const n of score.notes){const time=n.time+n.duration*.5,key=time.toFixed(9)+':'+n.hand;if(!selected.has(key))selected.set(key,{time,side:n.hand,triggerIds:[]});selected.get(key).triggerIds.push(n.id);}
const requests=[...selected.values()].sort((a,b)=>a.time-b.time||a.side.localeCompare(b.side));
const fingerNotes=Object.fromEntries(Object.keys(owned).map(d=>[d,score.notes.filter(n=>n.hand===d[0]&&n.finger===Number(d[1])).sort((a,b)=>a.time-b.time)]));
const v=new T.Vector3(),local=new T.Vector3(),samples=[],hits=[];
let lastTime=-1,keys,checkedDigits=0;
const rounded=(v,p=6)=>Number(v.toFixed(p));
function noteContext(n,time){return n?{id:n.id,midi:n.midi,finger:n.finger,time:n.time,end:n.time+n.duration,secondsFromEnd:rounded(time-n.time-n.duration),secondsToStart:rounded(n.time-time)}:null;}
for(const [requestIndex,request] of requests.entries()){
 const {time,side,triggerIds}=request;
 if(time!==lastTime){const pedal=pedalPosition(time,score.pedals),energy=scoreEnergy(time,score.sections);piano.update(time,score.notes,pedal);performer.update(time,score,piano,pedal,energy);model.updateMatrixWorld(true);body.skeleton.update();piano.group.updateMatrixWorld(true);
  keys=[...piano.keys].map(([midi,k])=>{if(!k.mesh.geometry.boundingBox)k.mesh.geometry.computeBoundingBox();const box=k.mesh.geometry.boundingBox,inside=box.clone().expandByScalar(k.black?-.002:-.0014);return {midi,black:k.black,box,inside,world:inside.clone().applyMatrix4(k.mesh.matrixWorld),inverse:k.mesh.matrixWorld.clone().invert()};});lastTime=time;
 }
 const active=score.notes.filter(n=>n.hand===side&&n.time<=time&&n.time+n.duration>time),activeDigits=new Set(active.map(n=>n.finger)),hand=performer.hands[side==='L'?0:1];
 const sample={time,side,triggerIds,active:active.map(n=>({id:n.id,midi:n.midi,finger:n.finger,contactLift:n.contactLift??.002})),inactiveDigits:[],hitIndices:[]};
 for(let fi=1;fi<=5;fi++){
  if(activeDigits.has(fi))continue;sample.inactiveDigits.push(fi);checkedDigits++;
  const digit=side+fi,ns=fingerNotes[digit],previous=ns.filter(n=>n.time+n.duration<=time).at(-1),next=ns.find(n=>n.time>=time),since=previous?time-previous.time-previous.duration:Infinity,before=next?next.time-time:Infinity,gap=previous&&next?next.time-previous.time-previous.duration:Infinity;
  const releaseLimit=fi===1?.22:.19,approachLimit=fi===1?.30:.27;
  const phase=previous&&next&&gap<.50?'short-gap':since<releaseLimit&&before<approachLimit?'release-and-approach':since<releaseLimit?'release':before<approachLimit?'approach':'rest';
  const collisions=new Map();
  for(const vertex of owned[digit]){
   body.getVertexPosition(vertex,v).applyMatrix4(body.matrixWorld);
   for(const k of keys){if(!k.world.containsPoint(v))continue;local.copy(v).applyMatrix4(k.inverse);if(!k.inside.containsPoint(local))continue;
    const depth=1000*Math.min(local.x-k.box.min.x,k.box.max.x-local.x,local.y-k.box.min.y,k.box.max.y-local.y,local.z-k.box.min.z,k.box.max.z-local.z);
    let row=collisions.get(k.midi);if(!row){row={midi:k.midi,black:k.black,vertexCount:0,deepVertexCount:0,maxClosestFaceMm:0,maxBelowTopMm:0,deepest:null};collisions.set(k.midi,row);}
    row.vertexCount++;if(depth>3)row.deepVertexCount++;row.maxBelowTopMm=Math.max(row.maxBelowTopMm,(k.box.max.y-local.y)*1000);
    if(depth>row.maxClosestFaceMm){row.maxClosestFaceMm=depth;row.deepest={vertex,world:v.toArray(),local:local.toArray()};}
   }
  }
  for(const collision of collisions.values()){
   const categories=known.filter(w=>w.side===side&&time>=w.start&&time<=w.end).map(w=>w.label);
   const families=Object.entries(nonthumb).filter(([,ids])=>active.some(n=>ids.includes(n.id))||triggerIds.some(id=>ids.includes(id))).map(([family])=>family);
   if(families.length)categories.push('promoted-nonthumb-held-overlap');if(!categories.length)categories.push('additional-idle-context');
   const anchor=active.reduce((a,b)=>a.midi<b.midi?a:b),f=hand.fingers[fi-1],wrist=hand.wrist.getWorldPosition(new T.Vector3()),q=hand.wrist.getWorldQuaternion(new T.Quaternion()).normalize();if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w);
   const grip=active.map(n=>({finger:n.finger,dxMm:rounded((keyX(n.midi)-keyX(anchor.midi))*1000,2),black:isBlack(n.midi),liftMm:rounded((n.contactLift??.002)*1000,2)})).sort((a,b)=>a.finger-b.finger);
   const influence=n=>n?{dxMm:rounded((keyX(n.midi)-keyX(anchor.midi))*1000,2),black:isBlack(n.midi),liftMm:rounded((n.contactLift??.002)*1000,2)}:null;
   const signature={side,idleFinger:fi,phase,grip,key:{dxMm:rounded((keyX(collision.midi)-keyX(anchor.midi))*1000,2),black:collision.black},previous:phase==='rest'||phase==='approach'?null:influence(previous),next:phase==='rest'||phase==='release'?null:influence(next)};
   const row={sampleIndex:samples.length,time,side,triggerIds,digit,phase,active:sample.active,previous:noteContext(previous,time),next:noteContext(next,time),gap:Number.isFinite(gap)?rounded(gap):null,categories,promotedFamilies:families,wrist:{p:wrist.toArray(),q:q.toArray()},chain:[...f.bones,f.tip].map(b=>b.getWorldPosition(new T.Vector3()).toArray()),signature,...collision,severe:collision.maxClosestFaceMm>3};
   sample.hitIndices.push(hits.length);hits.push(row);
  }
 }
 samples.push(sample);if(requestIndex%100===0)console.log('progress',requestIndex+'/'+requests.length,'core hits',hits.length,'severe',hits.filter(h=>h.severe).length);
}
const grouped=new Map();for(const [index,h] of hits.entries())if(h.severe){const key=JSON.stringify(h.signature);let g=grouped.get(key);if(!g){g={signature:h.signature,hitIndices:[],categories:new Set(),promotedFamilies:new Set(),maxClosestFaceMm:0,representative:null};grouped.set(key,g);}g.hitIndices.push(index);h.categories.forEach(x=>g.categories.add(x));h.promotedFamilies.forEach(x=>g.promotedFamilies.add(x));if(h.maxClosestFaceMm>g.maxClosestFaceMm){g.maxClosestFaceMm=h.maxClosestFaceMm;g.representative={hitIndex:index,time:h.time,side:h.side,digit:h.digit,midi:h.midi,triggerIds:h.triggerIds,active:h.active,phase:h.phase};}}
const families=[...grouped.values()].sort((a,b)=>b.maxClosestFaceMm-a.maxClosestFaceMm).map((g,i)=>({...g,family:'I'+String(i+1).padStart(3,'0'),categories:[...g.categories],promotedFamilies:[...g.promotedFamilies],occurrences:g.hitIndices.length,triggerIds:[...new Set(g.hitIndices.flatMap(i=>hits[i].triggerIds))],times:g.hitIndices.map(i=>hits[i].time)}));
const severe=hits.filter(h=>h.severe),report={scope:'Every score-note midpoint, deduplicated by time and relevant playing hand. Only digits with no active held note in that hand are counted. Exact Human skinned vertices with >=65% total same-finger bone weight tested against all 88 actual key local bounding boxes shrunk by bevel radius (white 1.4 mm / black 2 mm). >3 mm means depth from the closest ORIGINAL key-box face, consistent with existing key-core tools. Numerical flags require visual promotion. No triangle-only crossing test or continuous-between-sample claim.',hashes:{score:sha(scoreBytes),source:sourceHashes,model:sha(bytes)},modelPath,sourceNoteCount:score.notes.length,uniqueMidpointTimes:new Set(requests.map(x=>x.time)).size,relevantHandSamples:requests.length,checkedInactiveDigitPoses:checkedDigits,ownedVertexCounts:Object.fromEntries(Object.entries(owned).map(([k,v])=>[k,v.length])),coreHitRows:hits.length,severeHitRows:severe.length,severeHandSamples:new Set(severe.map(h=>h.sampleIndex)).size,severeFamilies:families.length,maxClosestFaceMm:Math.max(0,...severe.map(h=>h.maxClosestFaceMm)),categories:Object.fromEntries([...new Set(severe.flatMap(h=>h.categories))].map(c=>[c,{hitRows:severe.filter(h=>h.categories.includes(c)).length,handSamples:new Set(severe.filter(h=>h.categories.includes(c)).map(h=>h.sampleIndex)).size}])),knownWindows:known,promotedNonthumbNotes:nonthumb,familyGrouping:'Equal structural context: hand / idle digit / rest-release-approach-short-gap phase, active grip finger order + relative key x + color + contact lift, collided key relative x + color, and influential previous/next contact key relative x/color/lift. Exact current wrist pose and timings remain on every hit; structural grouping is a review queue, not a guarantee of pose equivalence.',families,samples,hits};
fs.writeFileSync(path.join(out,`inventory-${tag}.json`),JSON.stringify(report,null,2));console.log(JSON.stringify({relevantHandSamples:report.relevantHandSamples,checkedInactiveDigitPoses:checkedDigits,severeHitRows:report.severeHitRows,severeHandSamples:report.severeHandSamples,severeFamilies:families.length,maxClosestFaceMm:report.maxClosestFaceMm,categories:report.categories,top:families.slice(0,15).map(g=>({family:g.family,depth:g.maxClosestFaceMm,n:g.occurrences,rep:g.representative,categories:g.categories}))},null,2));
