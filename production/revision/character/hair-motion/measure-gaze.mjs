import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),project='/workspace/sites/daybreak-piano-film';
const req=createRequire(path.join(project,'package.json'));
const THREE=await import(pathToFileURL(req.resolve('three')));
const {GLTFLoader}=await import(pathToFileURL(req.resolve('three/addons/loaders/GLTFLoader.js')));
const {Pianist}=await import(pathToFileURL(path.join(root,'compiled/pianist.mjs')));
const {scoreEnergy,pedalPosition}=await import(pathToFileURL(path.join(root,'compiled/math.mjs')));
globalThis.self=globalThis;
const bytes=fs.readFileSync(path.join(project,'public/assets/pianist.glb')),score=JSON.parse(fs.readFileSync(path.join(project,'public/assets/score.json')));
const loader=new GLTFLoader();loader.register(()=>({name:'geometry-only-inspection',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const scene=new THREE.Scene(),pianist=new Pianist();scene.add(pianist.group);await pianist.load(score,gltf.scene);
let eyes;gltf.scene.traverse(mesh=>{if(mesh.isSkinnedMesh&&gltf.parser.associations.get(mesh)?.meshes===2)eyes=mesh;});
const geo=eyes.geometry,uv=geo.attributes.uv,pos=geo.attributes.position,indices=geo.index.array;
const eyeRefs=[];
for(const [name,sign,center] of [['LeftEye',1,[.292,.710]],['RightEye',-1,[.709,.298]]]){
 const point=new THREE.Vector3(...center,0),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),bary=new THREE.Vector3();let reference;
 for(let i=0;i<indices.length;i+=3){
  const ids=[indices[i],indices[i+1],indices[i+2]];if(pos.getX(ids[0])*sign<=0)continue;
  [a,b,c].forEach((v,j)=>v.set(uv.getX(ids[j]),uv.getY(ids[j]),0));
  THREE.Triangle.getBarycoord(point,a,b,c,bary);
  if(bary.x>=-1e-7&&bary.y>=-1e-7&&bary.z>=-1e-7){reference={name,ids,bary:bary.toArray(),texturePupilCenter:center};break;}
 }
 if(!reference)throw Error('Pupil UV center was not found');eyeRefs.push(reference);
}
const targets=[new THREE.Vector3(0,.766,.245),new THREE.Vector3(-.45,.766,.245),new THREE.Vector3(.45,.766,.245)];
const frames=[];
for(const time of [0,30,84.3,136,179.6,186,218]){
 pianist.posture(time,scoreEnergy(time,score.sections),pedalPosition(time,score.pedals));scene.updateMatrixWorld(true);eyes.skeleton.update();
 const readings=eyeRefs.map(ref=>{
  const bone=pianist.bones.get(ref.name),center=bone.getWorldPosition(new THREE.Vector3()),pupil=new THREE.Vector3();
  ref.ids.forEach((id,i)=>pupil.addScaledVector(eyes.getVertexPosition(id,new THREE.Vector3()).applyMatrix4(eyes.matrixWorld),ref.bary[i]));
  const direction=pupil.clone().sub(center).normalize(),hit=center.clone().addScaledVector(direction,(.766-center.y)/direction.y);
  return {eye:ref.name,center:center.toArray(),pupil:pupil.toArray(),radiusMM:center.distanceTo(pupil)*1000,direction:direction.toArray(),downwardDegrees:Math.asin(-direction.y)*180/Math.PI,keyboardCenterErrorDegrees:direction.angleTo(targets[0].clone().sub(center))*180/Math.PI,keyboardEdgesErrorDegrees:targets.slice(1).map(target=>direction.angleTo(target.clone().sub(center))*180/Math.PI),keyHeightPlaneHit:hit.toArray(),insideKeyFootprint:Math.abs(hit.x)<.65&&hit.z>.126&&hit.z<.295,boneAtRest:bone.quaternion.equals(pianist.rest.get(ref.name)),morph:eyes.morphTargetInfluences[eyes.morphTargetDictionary[ref.name==='LeftEye'?'eyeLookDownLeft':'eyeLookDownRight']]};
 });
 frames.push({time,readings});
}
const report={method:'Geometric gaze proxy: current Eye bone pivot to the barycentrically interpolated center of the pupil texture on the actual deformed eye mesh. Compared with the current keyboard height/footprint, not a biological gaze estimate. No gaze edits.',pupilReferences:eyeRefs,frames};
fs.writeFileSync(path.join(root,'gaze-assessment.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({frames:frames.map(frame=>({time:frame.time,eyes:frame.readings.map(v=>({eye:v.eye,down:v.downwardDegrees,centerError:v.keyboardCenterErrorDegrees,hit:v.keyHeightPlaneHit,inside:v.insideKeyFootprint,morph:v.morph,radiusMM:v.radiusMM}))}))},null,2));
