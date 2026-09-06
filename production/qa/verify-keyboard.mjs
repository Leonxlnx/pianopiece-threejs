import fs from 'node:fs';
import * as T from 'three';
import {GrandPiano, keyX, keySurfaceY, isBlack} from './compiled/piano.mjs';

// Measure the rendered batches with rays against their triangles. This is
// independent of the analytical key plane used by the fingertip solver.
globalThis.document={createElement:()=>({width:512,height:96,getContext:()=>new Proxy({},{get:()=>()=>{}})})};
const piano=new GrandPiano(),score=JSON.parse(fs.readFileSync('public/assets/score.json'));
const ray=new T.Raycaster(),matrix=new T.Matrix4(),expected=new T.Matrix4();
const failures=[];let raySamples=0,maxSurfaceError=0,maxTransformError=0,pressedNotes=0;
const white=[...piano.keys.values()].filter(k=>!k.black),black=[...piano.keys.values()].filter(k=>k.black);
function verify(time,notes,pedal){
 piano.update(time,notes,pedal);piano.group.updateMatrixWorld(true);
 for(const [keys,batch] of [[white,piano.whiteKeyBatch],[black,piano.blackKeyBatch]]){
  keys.forEach((key,i)=>{
   batch.getMatrixAt(i,matrix);expected.multiplyMatrices(key.pivot.matrix,key.mesh.matrix);
   maxTransformError=Math.max(maxTransformError,...matrix.elements.map((x,j)=>Math.abs(x-expected.elements[j])));
   const down=key.pivot.rotation.x/(key.black?.028:.033);
   for(const z of key.black?[.166,.19,.211]:[.239,.254,.269]){
    ray.set(new T.Vector3(key.x,1,z),new T.Vector3(0,-1,0));
    const hit=ray.intersectObject(batch,false).find(h=>h.instanceId===i);
    if(!hit){failures.push({kind:'missing rendered surface',time,midi:key.midi,z});continue;}
    raySamples++;const error=Math.abs(hit.point.y-keySurfaceY(key.midi,z,down));maxSurfaceError=Math.max(maxSurfaceError,error);
    if(error>.00001)failures.push({kind:'analytical and rendered surface differ',time,midi:key.midi,z,errorMm:error*1000});
   }
  });
 }
 for(const n of notes.filter(n=>time>=n.time&&time<n.time+n.duration)){
  pressedNotes++;const key=piano.keys.get(n.midi),angle=key.black?.028:.033;
  if(Math.abs(key.pivot.rotation.x-angle)>1e-10||!piano.active.includes(n.midi))failures.push({kind:'onset not fully depressed',time,id:n.id});
 }
}
verify(0,[],0);
// A complete keyboard at partial and full travel, plus the score's actual
// simultaneous attacks and releases, covers the new instanced render path.
const all=Array.from({length:88},(_,i)=>({id:'test-'+i,time:1,duration:.3,midi:i+21,velocity:.7,hand:'R',finger:1}));
for(const t of [.979,.99,1,1.15,1.34,1.39,1.41])verify(t,all,t>1?1:0);
const times=[...new Set(score.notes.filter((_,i)=>i%16===0).flatMap(n=>[n.time,n.time+n.duration*.5,n.time+n.duration+.05]))];
for(const time of times)verify(time,score.notes.filter(n=>n.time<time+1&&n.time+n.duration>time-.2),.65);
const pattern=Array.from({length:12},(_,i)=>isBlack(60+i));
if(JSON.stringify(pattern)!==JSON.stringify([false,true,false,true,false,false,true,false,true,false,true,false]))failures.push({kind:'keyboard pitch layout'});
if(white.length!==52||black.length!==36)failures.push({kind:'key count',white:white.length,black:black.length});
const report={whiteKeys:white.length,blackKeys:black.length,raySamples,pressedNotes,scoreSnapshots:times.length,maxSurfaceErrorMm:maxSurfaceError*1000,maxTransformError,failures,passed:failures.length===0&&maxTransformError<1e-6,scope:'Rendered instanced-key triangles, actual hinging, full chromatic layout and sampled score attacks; does not verify browser frame timing.'};
fs.mkdirSync('production/revision',{recursive:true});fs.writeFileSync('production/revision/keyboard-geometry-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
