import fs from 'node:fs';
import * as T from 'three';
import {Stage} from './compiled/stage.mjs';
import {Direction} from './compiled/direction.mjs';
const score=JSON.parse(fs.readFileSync('public/assets/score.json')),scene=new T.Scene(),stage=new Stage(scene,false),direction=new Direction(score),camera=new T.PerspectiveCamera(40,1,.035,180);
scene.updateMatrixWorld(true);const architecture=[];
stage.group.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&(o.userData.architecture||/wall|side return|pier|lintel|door|ceiling|beam|lining|panel|reveal/i.test(o.name)))architecture.push(o);});
const sources=architecture.flatMap(o=>o.userData.sourceParts?.map(p=>p.name)??[o.name]);
if(sources.filter(name=>name==='Limestone side return').length!==2)throw Error('Both actual side-wall solids must participate in camera clearance checks');
for(const category of ['wall','ceiling','door','beam'])if(!sources.some(name=>name.toLowerCase().includes(category)))throw Error(`Missing ${category} from the actual architecture audit`);
const ray=new T.Raycaster(),forward=new T.Vector3(),failures=[];let samples=0,minClearance=Infinity;
for(const aspect of [16/9,1,9/16,.45])for(const shot of direction.shots)for(const fraction of [0,.08,.25,.5,.75,.92,.999]){
 const time=shot.start+(shot.end-shot.start)*fraction;direction.update(camera,time,aspect);camera.updateMatrixWorld(true);camera.getWorldDirection(forward);ray.set(camera.position,forward);ray.far=camera.position.distanceTo(shot.look)-.15;
 const obstruction=ray.intersectObjects(architecture,false)[0];if(obstruction)failures.push({aspect,time,shot:shot.name,obstruction:obstruction.object.name,distance:obstruction.distance});
 const p=camera.position;minClearance=Math.min(minClearance,7.225-Math.abs(p.x),5.25-p.z,p.z+6.67,4.45-p.y);samples++;
}
let reducedMotionSamples=0;direction.reduce=true;
for(const aspect of [16/9,1,9/16,.45])for(const shot of direction.shots){
 direction.update(camera,shot.start+(shot.end-shot.start)*.1,aspect);
 const position=camera.position.clone(),q=camera.quaternion.clone(),fov=camera.fov;
 direction.update(camera,shot.start+(shot.end-shot.start)*.9,aspect);
 if(position.distanceTo(camera.position)>1e-9||q.angleTo(camera.quaternion)>1e-6||Math.abs(fov-camera.fov)>1e-9)failures.push({kind:'reduced-motion camera drift',aspect,shot:shot.name});
 reducedMotionSamples++;
}
const report={samples,reducedMotionSamples,architecturalMeshes:architecture.length,sourceParts:sources,minimumOriginClearanceM:minClearance,failures,passed:failures.length===0&&minClearance>0,scope:'Room-origin clearance and central sightline at seven points in each shot, four viewport ratios; reduced-motion position/orientation/lens stability. Hands/performer occlusion requires separate visual review.'};
fs.writeFileSync(process.argv[2]??'production/revision/camera-room-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
