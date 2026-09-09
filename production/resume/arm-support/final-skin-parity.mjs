import fs from 'node:fs';
import {T,setup,pose,score,sha} from './shared.mjs';
const base=await setup('baseline'),candidate=await setup('candidate-final'),bm=base.gltf.scene.getObjectByName('Human'),cm=candidate.gltf.scene.getObjectByName('Human'),a=bm.geometry.attributes;
const mixed=[],handOnly=[];for(let i=0;i<a.position.count;i++){let forearm=0,hand=0;for(let j=0;j<4;j++){const n=bm.skeleton.bones[a.skinIndex.getComponent(i,j)].name,w=a.skinWeight.getComponent(i,j);if(/ForeArm$/.test(n))forearm+=w;if(/Hand/.test(n))hand+=w;}if(forearm>.001&&hand>.001)mixed.push(i);if(hand>.9999)handOnly.push(i);}
const times=[0,.95,6,11.7,26.05,30.766666666666666,40.93333333333333,55.8,72.04,112.5,156.06666666666666,162.31,173,188.816,189.9,197.5,224.55,228.325,228.99,233.144228];
const report={sourceSha256:sha(fs.readFileSync('candidate-final/pianist.ts')),times,mixedVertices:mixed.length,handOnlyVertices:handOnly.length,maxMixedShiftMm:0,maxHandOnlyShiftMm:0,mixedPeak:null,handOnlyPeak:null};
for(const time of times){pose(base,time);pose(candidate,time);for(const [ids,key,peak]of [[mixed,'maxMixedShiftMm','mixedPeak'],[handOnly,'maxHandOnlyShiftMm','handOnlyPeak']])for(const id of ids){const bv=bm.getVertexPosition(id,new T.Vector3()).applyMatrix4(bm.matrixWorld),cv=cm.getVertexPosition(id,new T.Vector3()).applyMatrix4(cm.matrixWorld),d=bv.distanceTo(cv)*1000;if(d>report[key]){report[key]=d;report[peak]={id,time};}}}
fs.writeFileSync('final-skin-parity-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
