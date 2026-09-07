// Export real Three.js skinned geometry without a browser or renderer.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';
const here=path.dirname(fileURLToPath(import.meta.url));
const project=path.resolve(process.argv[2]);
const asset=path.resolve(process.argv[3]);
const output=path.resolve(process.argv[4]);
const times=(process.argv[5]??'186').split(',').map(Number);
// A frozen source snapshot isolates asset comparisons from concurrent work.
const sourceProject=process.argv[6]?path.resolve(process.argv[6]):project;
const req=createRequire(path.join(project,'package.json')),ts=req('typescript');
const THREE=await import(pathToFileURL(req.resolve('three')));
const {GLTFLoader}=await import(pathToFileURL(req.resolve('three/addons/loaders/GLTFLoader.js')));
const compiled=path.join(here,'compiled');fs.mkdirSync(compiled,{recursive:true});
const queue=['math','piano','wrist-motion','pianist'],done=new Set(),sourceHashes={};
while(queue.length){
 const name=queue.shift();if(done.has(name))continue;done.add(name);
 const source=fs.readFileSync(path.join(sourceProject,'app/performance',name+'.ts'),'utf8');
 sourceHashes[name]=crypto.createHash('sha256').update(source).digest('hex');
 let code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 code=code.replace(/from (['"])([^'"]+)\1/g,(_,q,s)=>{if(s.startsWith('.'))queue.push(s.replace('./',''));return `from ${JSON.stringify(pathToFileURL(s.startsWith('.')?path.join(compiled,s+'.mjs'):req.resolve(s)).href)}`;});
 fs.writeFileSync(path.join(compiled,name+'.mjs'),code);
}
const {Pianist}=await import(pathToFileURL(path.join(compiled,'pianist.mjs')));
const {GrandPiano}=await import(pathToFileURL(path.join(compiled,'piano.mjs')));
const {scoreEnergy,pedalPosition}=await import(pathToFileURL(path.join(compiled,'math.mjs')));
globalThis.self=globalThis;
const context=new Proxy({canvas:null},{get:(t,k)=>k in t?t[k]:()=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.window={devicePixelRatio:1};
const bytes=fs.readFileSync(asset),scoreBytes=fs.readFileSync(path.join(sourceProject,'public/assets/score.json')),score=JSON.parse(scoreBytes);
const loader=new GLTFLoader();loader.register(()=>({name:'geometry-only-inspection',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const scene=new THREE.Scene(),piano=new GrandPiano(),pianist=new Pianist();scene.add(piano.group,pianist.group);await pianist.load(score,gltf.scene);
const meshes=[];gltf.scene.traverse(m=>{if(m.isSkinnedMesh&&gltf.parser.associations.has(m))meshes.push(m);});
function exportPose(){
 const result={};
 for(const mesh of meshes){
  const association=gltf.parser.associations.get(mesh),g=mesh.geometry,positions=[],normals=[],v=new THREE.Vector3(),n=new THREE.Vector3(),base=new THREE.Vector3(),delta=new THREE.Vector3(),blend=new THREE.Matrix4(),bone=new THREE.Matrix4(),nm=new THREE.Matrix3(),worldNormal=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  for(let i=0;i<g.attributes.position.count;i++){
   mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);positions.push(...v.toArray());n.fromBufferAttribute(g.attributes.normal,i);base.copy(n);
   for(let k=0;k<(g.morphAttributes.normal?.length??0);k++){
    const w=mesh.morphTargetInfluences?.[k]??0;if(!w)continue;delta.fromBufferAttribute(g.morphAttributes.normal[k],i);if(!g.morphTargetsRelative)delta.sub(base);n.addScaledVector(delta,w);
   }
   blend.elements.fill(0);
   for(let k=0;k<4;k++){
    const w=g.attributes.skinWeight.array[i*4+k];if(!w)continue;bone.fromArray(mesh.skeleton.boneMatrices,g.attributes.skinIndex.array[i*4+k]*16);
    for(let j=0;j<16;j++)blend.elements[j]+=bone.elements[j]*w;
   }
   blend.multiply(mesh.bindMatrix).premultiply(mesh.bindMatrixInverse);nm.setFromMatrix4(blend);n.applyMatrix3(nm).applyMatrix3(worldNormal).normalize();normals.push(...n.toArray());
  }
  result[`${association.meshes}:${association.primitives??0}`]={name:mesh.name,position:positions,normal:normals,indices:g.index?Array.from(g.index.array):null};
 }
 return result;
}
for(const time of times){
 const pedal=pedalPosition(time,score.pedals),energy=scoreEnergy(time,score.sections);piano.update(time,score.notes,pedal);pianist.update(time,score,piano,pedal,energy);scene.updateMatrixWorld(true);
 for(const m of meshes)m.skeleton.update();
 const out={time,sourceHashes,assetSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),scoreSHA256:crypto.createHash('sha256').update(scoreBytes).digest('hex'),meshes:exportPose()};
 const target=times.length===1?output:output.replace('.json.gz',`-${time}.json.gz`);
 fs.writeFileSync(target,gzipSync(JSON.stringify(out),{level:6}));console.log('Exported actual skin',time,target);
}
