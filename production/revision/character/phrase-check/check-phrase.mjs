import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),project=process.argv[2]??'/workspace/sites/daybreak-piano-film';
const req=createRequire(path.join(project,'package.json')),ts=req('typescript');
const THREE=await import(pathToFileURL(req.resolve('three')));
const {GLTFLoader}=await import(pathToFileURL(req.resolve('three/addons/loaders/GLTFLoader.js')));
fs.mkdirSync(path.join(out,'compiled'),{recursive:true});const sourceHashes={};
const queue=['math','piano','wrist-motion','pianist'],done=new Set();
while(queue.length){const name=queue.shift();if(done.has(name))continue;done.add(name);const source=fs.readFileSync(path.join(project,'app/performance',name+'.ts'),'utf8');sourceHashes[name]=crypto.createHash('sha256').update(source).digest('hex');let code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;code=code.replace(/from (['"])([^'"]+)\1/g,(_,quote,specifier)=>{if(specifier.startsWith('.'))queue.push(specifier.replace('./',''));return `from ${JSON.stringify(pathToFileURL(specifier.startsWith('.')?path.join(out,'compiled',specifier+'.mjs'):req.resolve(specifier)).href)}`;});fs.writeFileSync(path.join(out,'compiled',name+'.mjs'),code);}
const {Pianist}=await import(pathToFileURL(path.join(out,'compiled/pianist.mjs')));
const {GrandPiano}=await import(pathToFileURL(path.join(out,'compiled/piano.mjs')));
const {scoreEnergy,pedalPosition}=await import(pathToFileURL(path.join(out,'compiled/math.mjs')));
globalThis.self=globalThis;const context=new Proxy({canvas:null},{get:(t,k)=>k in t?t[k]:()=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.window={devicePixelRatio:1};
const bytes=fs.readFileSync(path.join(project,'public/assets/pianist.glb')),scoreBytes=fs.readFileSync(path.join(project,'public/assets/score.json')),score=JSON.parse(scoreBytes);
const loader=new GLTFLoader();loader.register(()=>({name:'geometry-only-inspection',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const scene=new THREE.Scene(),piano=new GrandPiano(),pianist=new Pianist();scene.add(piano.group,pianist.group);await pianist.load(score,gltf.scene);
const meshes=[];gltf.scene.traverse(mesh=>{if(mesh.isSkinnedMesh&&gltf.parser.associations.has(mesh))meshes.push(mesh);});
function exportPose(){const result={};for(const mesh of meshes){
 const association=gltf.parser.associations.get(mesh),g=mesh.geometry,positions=[],normals=[],v=new THREE.Vector3(),n=new THREE.Vector3(),base=new THREE.Vector3(),delta=new THREE.Vector3(),blend=new THREE.Matrix4(),bone=new THREE.Matrix4(),nm=new THREE.Matrix3(),worldNormal=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
 for(let i=0;i<g.attributes.position.count;i++){
  mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);positions.push(...v.toArray());n.fromBufferAttribute(g.attributes.normal,i);base.copy(n);
  for(let k=0;k<(g.morphAttributes.normal?.length??0);k++){const w=mesh.morphTargetInfluences?.[k]??0;if(!w)continue;delta.fromBufferAttribute(g.morphAttributes.normal[k],i);if(!g.morphTargetsRelative)delta.sub(base);n.addScaledVector(delta,w);}
  blend.elements.fill(0);for(let k=0;k<4;k++){const w=g.attributes.skinWeight.array[i*4+k];if(!w)continue;bone.fromArray(mesh.skeleton.boneMatrices,g.attributes.skinIndex.array[i*4+k]*16);for(let j=0;j<16;j++)blend.elements[j]+=bone.elements[j]*w;}
  blend.multiply(mesh.bindMatrix).premultiply(mesh.bindMatrixInverse);nm.setFromMatrix4(blend);n.applyMatrix3(nm).applyMatrix3(worldNormal).normalize();normals.push(...n.toArray());
 }
 result[`${association.meshes}:${association.primitives??0}`]={name:mesh.name,position:positions,normal:normals,indices:g.index?Array.from(g.index.array):null};
}return {meshes:result};}
const {gzipSync}=await import('node:zlib');
const start=169.885523,end=175.189552,hz=120;
const boneNames=['Hips','Spine','Spine1','Spine2','Head','PonytailRoot','Ponytail1','Ponytail2'];
const boneStats=Object.fromEntries(boneNames.map(name=>[name,{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity],maxAdjacentMM:0,maxAdjacentDegrees:0,maxAngleFromStartDegrees:0}]));
const cloth=[];for(const mesh of meshes){if(gltf.parser.associations.get(mesh).meshes!==1)continue;const g=mesh.geometry;
 for(let i=0;i<g.attributes.position.count;i+=5){let unstable=false;for(let k=0;k<4;k++)if(g.attributes.skinWeight.array[i*4+k]>1e-8&&/Arm|Hand|Thumb|Index|Middle|Ring|Pinky/.test(mesh.skeleton.bones[g.attributes.skinIndex.array[i*4+k]].name))unstable=true;if(!unstable)cloth.push({mesh,index:i});}
}
const prevBones=new Map(),firstBones=new Map(),prevCloth=[];let maxClothStep=0,maxRootLocalChange=0;
const rootBone=pianist.bones.get('PonytailRoot'),rootRest=rootBone.quaternion.clone();
const timeline=[],clothSamples=[],footStats=Object.fromEntries(['Left','Right'].map(side=>[side,{heelMinY:Infinity,heelMaxY:-Infinity,heelMinZ:Infinity,heelMaxZ:-Infinity,maxAdjacentHeelMM:0}]));
const heelPrevious=new Map();let seatIds;
function pose(time,full=false){const pedal=pedalPosition(time,score.pedals),energy=scoreEnergy(time,score.sections);if(full){piano.update(time,score.notes,pedal);pianist.update(time,score,piano,pedal,energy);}else pianist.posture(time,energy,pedal);scene.updateMatrixWorld(true);meshes[0].skeleton.update();return {pedal,energy};}
const temp=new THREE.Vector3();
const shoeMeshes={};for(const side of ['Left','Right']){shoeMeshes[side]=[];const shoe=pianist.shoes.get(side);shoe.traverse(mesh=>{if(mesh.isMesh)shoeMeshes[side].push(mesh);});}
function heel(side){const shoe=pianist.shoes.get(side),inverse=shoe.matrixWorld.clone().invert();let point=new THREE.Vector3(0,Infinity,0);
 for(const mesh of shoeMeshes[side]){const a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const local=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);if(local.z<.09||local.y>-.025)continue;const p=local.applyMatrix4(shoe.matrixWorld);if(p.y<point.y)point=p;}}
 return point;
}
for(let i=0;i<=Math.ceil((end-start)*hz);i++){
 const time=Math.min(end,start+i/hz),state=pose(time),record={time,...state,bones:{},heels:{}};
 for(const name of boneNames){const bone=pianist.bones.get(name),p=bone.getWorldPosition(new THREE.Vector3()),q=bone.getWorldQuaternion(new THREE.Quaternion()),s=boneStats[name];
  [p.x,p.y,p.z].forEach((v,k)=>{s.min[k]=Math.min(s.min[k],v);s.max[k]=Math.max(s.max[k],v);});if(prevBones.has(name)){const last=prevBones.get(name);s.maxAdjacentMM=Math.max(s.maxAdjacentMM,p.distanceTo(last.p)*1000);s.maxAdjacentDegrees=Math.max(s.maxAdjacentDegrees,q.angleTo(last.q)*180/Math.PI);}else firstBones.set(name,{p:p.clone(),q:q.clone()});s.maxAngleFromStartDegrees=Math.max(s.maxAngleFromStartDegrees,q.angleTo(firstBones.get(name).q)*180/Math.PI);prevBones.set(name,{p,q});record.bones[name]={p:p.toArray(),q:q.toArray()};
 }
 maxRootLocalChange=Math.max(maxRootLocalChange,rootBone.quaternion.angleTo(rootRest));
 const positions=cloth.map(({mesh,index},k)=>{const p=mesh.getVertexPosition(index,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);if(prevCloth[k])maxClothStep=Math.max(maxClothStep,p.distanceTo(prevCloth[k])*1000);prevCloth[k]=p;return p;});
 if(!seatIds)seatIds=positions.flatMap((p,k)=>Math.abs(p.x)<.28&&p.z>.495&&p.z<.825&&p.y>.44&&p.y<.54?[k]:[]);
 record.seatY=seatIds.map(k=>positions[k].y);clothSamples.push({time,minSeatY:Math.min(...record.seatY),maxSeatY:Math.max(...record.seatY)});
 for(const side of ['Left','Right']){const p=heel(side),s=footStats[side];s.heelMinY=Math.min(s.heelMinY,p.y);s.heelMaxY=Math.max(s.heelMaxY,p.y);s.heelMinZ=Math.min(s.heelMinZ,p.z);s.heelMaxZ=Math.max(s.heelMaxZ,p.z);if(heelPrevious.has(side))s.maxAdjacentHeelMM=Math.max(s.maxAdjacentHeelMM,p.distanceTo(heelPrevious.get(side))*1000);heelPrevious.set(side,p);record.heels[side]=p.toArray();}
 timeline.push(record);
}
const seatDrift=seatIds.map((_,k)=>{const v=timeline.map(row=>row.seatY[k]);return (Math.max(...v)-Math.min(...v))*1000;});
const events=[...score.harmony.map(b=>b.time),...score.notes.flatMap(n=>[n.time-.55,n.time-.09,n.time+.6,n.time+1])].filter(t=>t>start&&t<end);let maxBoundaryHeadMM=0;
for(const time of events){pose(time-.00001);const a=pianist.bones.get('Head').getWorldPosition(new THREE.Vector3());pose(time+.00001);const b=pianist.bones.get('Head').getWorldPosition(new THREE.Vector3());maxBoundaryHeadMM=Math.max(maxBoundaryHeadMM,a.distanceTo(b)*1000);}
function extraMesh(mesh,matrix){const g=mesh.geometry,a=g.attributes.position,n=g.attributes.normal,normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix),position=[],normal=[],uv=[];for(let i=0;i<a.count;i++){temp.fromBufferAttribute(a,i).applyMatrix4(matrix);position.push(...temp.toArray());temp.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();normal.push(...temp.toArray());uv.push(0,0);}const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;return {name:mesh.name||'bench, instrument or shoe context',position,normal,uv,indices:g.index?Array.from(g.index.array):Array.from({length:a.count},(_,i)=>i),color:[...(material.color?.toArray()??[.09,.09,.10]),1],roughness:material.roughness??.55};}
function contextMeshes(){const extras=[];
 pianist.group.traverse(mesh=>{if(mesh.isMesh&&!mesh.isSkinnedMesh)extras.push(extraMesh(mesh,mesh.matrixWorld));});
 piano.group.traverse(mesh=>{if(!mesh.isMesh||mesh.material?.transparent)return;const write=matrix=>{const box=new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position).applyMatrix4(matrix);if((box.min.z>.48&&box.max.y<.55)||(box.max.z>.06&&box.min.z>-.65&&box.max.y<.93))extras.push(extraMesh(mesh,matrix));};if(mesh.isInstancedMesh){for(let i=0;i<mesh.count;i++){const matrix=new THREE.Matrix4();mesh.getMatrixAt(i,matrix);write(matrix.premultiply(mesh.matrixWorld));}}else write(mesh.matrixWorld);});
 extras.push({name:'diagnostic floor',position:[-2,-.008,-1,2,-.008,-1,2,-.008,2,-2,-.008,2],normal:[0,1,0,0,1,0,0,1,0,0,1,0],uv:[0,0,1,0,1,1,0,1],indices:[0,2,1,0,3,2],color:[.15,.17,.19,1],roughness:.9});return extras;
}
const frames=[];
for(let i=0;i<12;i++){const time=start+(end-start)*i/11;pose(time,true);const file=`frame-${String(i).padStart(2,'0')}.json.gz`;const data={time,...exportPose(),extras:contextMeshes()};fs.writeFileSync(path.join(out,file),gzipSync(JSON.stringify(data),{level:6}));frames.push({index:i,time,file,bytes:fs.statSync(path.join(out,file)).size});console.log('exported phrase frame',i,time.toFixed(3));}
const report={sourceHashes,scoreSha256:crypto.createHash('sha256').update(scoreBytes).digest('hex'),glbSha256:crypto.createHash('sha256').update(bytes).digest('hex'),range:[start,end],sampleHz:hz,sampleCount:timeline.length,boneStats,clothProbeCount:cloth.length,maxClothAdjacentMM:maxClothStep,seatProbeCount:seatIds.length,maxSeatProbeVerticalRangeMM:Math.max(...seatDrift),seatProbeLowestY:Math.min(...clothSamples.map(x=>x.minSeatY)),benchCushionTopY:.4975,maxHairRootLocalRotationDegrees:maxRootLocalChange*180/Math.PI,maxBoundaryHeadStepOver20MicrosecondsMM:maxBoundaryHeadMM,footStats,frames,scope:'120Hz torso/head/hair/leg/cloth numeric samples use actual posture, scoreEnergy and pedalPosition. Cloth probes exclude arm/hand weights. Twelve rendered poses use full production update from the captured source snapshot. No hand endpoint or listening assessment.'};
fs.writeFileSync(path.join(out,'trajectory.json.gz'),gzipSync(JSON.stringify(timeline),{level:6}));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
