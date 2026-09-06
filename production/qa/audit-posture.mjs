import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './compiled/pianist.mjs';
import {pedalPosition,mix,smooth} from './compiled/math.mjs';
globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bytes=fs.readFileSync('public/assets/pianist.glb'),gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const score=JSON.parse(fs.readFileSync('public/assets/score.json')),p=new Pianist();await p.load(score,gltf.scene);
const names=['Hips','Spine2','Head','LeftShoulder','RightShoulder','LeftLeg','RightLeg'],epsilon=1e-6;
function snapshot(t){let i=score.sections.findIndex(s=>t>=s.start&&t<s.end);if(i<0)i=score.sections.length-1;const s=score.sections[i],prev=score.sections[Math.max(0,i-1)];p.posture(t,mix(prev.energy,s.energy,smooth((t-s.start)/1.8)),pedalPosition(t,score.pedals));p.model.updateMatrixWorld(true);return names.map(name=>({name,p:p.bones.get(name).getWorldPosition(new T.Vector3()),q:p.bones.get(name).getWorldQuaternion(new T.Quaternion())}));}
const candidates=score.notes.flatMap(n=>[-.55,-.09,.6,1].map(offset=>({time:n.time+offset,id:n.id,offset}))).concat(score.harmony.map(b=>({time:b.time,id:'bar-'+b.bar,offset:0})));
const records=[];
for(const c of candidates){if(c.time<=epsilon||c.time>=score.duration-epsilon)continue;const a=snapshot(c.time-epsilon),b=snapshot(c.time+epsilon);for(let i=0;i<names.length;i++)records.push({...c,bone:names[i],displacementMm:a[i].p.distanceTo(b[i].p)*1000,rotationDegrees:a[i].q.angleTo(b[i].q)*180/Math.PI});}
records.sort((a,b)=>b.displacementMm-a.displacementMm);
const report={poses:candidates.length*2,epsilonSeconds:epsilon,maxDisplacementMm:records[0].displacementMm,maxRotationDegrees:records.reduce((m,x)=>Math.max(m,x.rotationDegrees),0),worst:records.slice(0,20),passed:records[0].displacementMm<.02,scope:'Continuity at score-note influence boundaries and bar boundaries; not visual quality or muscle simulation.'};
fs.writeFileSync(process.argv[2]??'production/revision/posture-boundary-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,worst:report.worst.slice(0,4)},null,2));if(!report.passed)process.exitCode=1;
