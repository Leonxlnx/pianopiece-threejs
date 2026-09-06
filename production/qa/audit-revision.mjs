import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const rigFile=process.env.DAYBREAK_RIG_PATH??'production/qa/compiled/pianist.mjs';
const {Pianist}=await import(pathToFileURL(path.resolve(rigFile)));
import {GrandPiano,keyX,isBlack,keySurfaceY} from './compiled/piano.mjs';
import {pedalPosition,mix,smooth} from './compiled/math.mjs';
import {keyPadContact} from './key-pad-contact.mjs';
import {createDorsalPalmSampler,dorsalElevationDegrees} from './hand-shape.mjs';
const out=process.argv[2]??'production/revision/rig-audit.json';
const fps=Number(process.env.DAYBREAK_QA_FPS??240);
if(![60,120,240].includes(fps))throw new Error('DAYBREAK_QA_FPS must be 60, 120 or 240.');
const context=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-validation-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bytes=fs.readFileSync('public/assets/pianist.glb');const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const score=JSON.parse(fs.readFileSync(process.env.DAYBREAK_SCORE_PATH??'public/assets/score.json'));const model=gltf.scene;model.updateMatrixWorld(true);let body;model.traverse(o=>{if(o.isSkinnedMesh&&o.name==='Human')body=o;});body.skeleton.update();
const names=['Thumb','Index','Middle','Ring','Pinky'],pads={};
for(const side of ['L','R'])for(let f=0;f<5;f++){
 const bi=body.skeleton.bones.findIndex(b=>b.name===(side==='L'?'Left':'Right')+'Hand'+names[f]+'3'),bone=body.skeleton.bones[bi],inv=bone.matrixWorld.clone().invert(),list=[];
 for(let i=0;i<body.geometry.attributes.position.count;i++){
 let weight=0;for(let j=0;j<4;j++)if(body.geometry.attributes.skinIndex.getComponent(i,j)===bi)weight+=body.geometry.attributes.skinWeight.getComponent(i,j);if(weight<.35)continue;
 const v=new T.Vector3();body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld).applyMatrix4(inv);list.push({i,y:v.y});
 }
 const max=Math.max(...list.map(v=>v.y));pads[side+(f+1)]=list.filter(v=>v.y>max-.011).map(v=>v.i);
}
const performer=new Pianist(),piano=new GrandPiano();await performer.load(score,model);const v=new T.Vector3();
function pose(time){let index=score.sections.findIndex(s=>time>=s.start&&time<s.end);if(index<0)index=score.sections.length-1;const section=score.sections[index],previous=score.sections[Math.max(0,index-1)],energy=mix(previous.energy,section.energy,smooth((time-section.start)/1.8)),pedal=pedalPosition(time,score.pedals);piano.update(time,score.notes,pedal);performer.update(time,score,piano,pedal,energy);model.updateMatrixWorld(true);body.skeleton.update();piano.group.updateMatrixWorld(true);}
pose(0);
const dorsalPalm=createDorsalPalmSampler(body,performer.hands),shapePeaks=[],shapeViolationsByState={held:0,released:0};
let shapeViolations=0,maxBackwardPipMm=0;
const skin=[],missing=[];let contactSamples=0,maxContact=0;
for(const n of score.notes)for(const fraction of [.015,.25,.5,.8,.985]){
 const time=n.time+n.duration*fraction;pose(time);
 const {gap,count}=keyPadContact(body,pads[n.hand+n.finger],piano.keys.get(n.midi).mesh);
 const record={id:n.id,time,hand:n.hand,finger:n.finger,midi:n.midi,fraction,gapMm:gap*1000};if(!count)missing.push(record);else skin.push(record);
 for(const c of performer.contacts){contactSamples++;maxContact=Math.max(maxContact,c.error);}
}
const frames=Math.ceil(score.duration*fps),previousWrist=[],previousTip=[],previousVelocity=[],wristPeaks=[],tipPeaks=[];let maxPip=0,maxDip=0,nonfinite=0;
for(let frame=0;frame<=frames;frame++){
 const time=Math.min(frame/fps,score.duration);pose(time);
 for(const [hi,h] of performer.hands.entries()){
 const dorsal=dorsalPalm.normal(h.side);
 const wrist=h.wrist.getWorldPosition(new T.Vector3());if(previousWrist[hi]){const velocity=wrist.clone().sub(previousWrist[hi]).multiplyScalar(fps),speed=velocity.length(),accel=previousVelocity[hi]?velocity.distanceTo(previousVelocity[hi])*fps:0;wristPeaks.push({time,hand:h.side,speed,accel});previousVelocity[hi]=velocity;}previousWrist[hi]=wrist;
 for(let fi=0;fi<5;fi++){
 const f=h.fingers[fi],points=[...f.bones,f.tip].map(b=>b.getWorldPosition(new T.Vector3())),a=points[1].clone().sub(points[0]).normalize(),b=points[2].clone().sub(points[1]).normalize(),c=points[3].clone().sub(points[2]).normalize();
 if(fi>0){maxPip=Math.max(maxPip,a.angleTo(b));maxDip=Math.max(maxDip,b.angleTo(c));const elevation=dorsalElevationDegrees(a,dorsal),backwardPipMm=Math.max(0,(points[1].z-points[0].z)*1000);maxBackwardPipMm=Math.max(maxBackwardPipMm,backwardPipMm);const held=performer.contacts.some(c=>c.hand===h.side&&c.finger===fi+1);if(elevation>60||backwardPipMm>3){shapeViolations++;shapeViolationsByState[held?'held':'released']++;}shapePeaks.push({time,hand:h.side,finger:fi+1,held,dorsalElevationDegrees:elevation,backwardPipMm,pipDegrees:a.angleTo(b)*180/Math.PI,dipDegrees:b.angleTo(c)*180/Math.PI});}
 const index=hi*5+fi,tip=points[3];if(previousTip[index])tipPeaks.push({time,hand:h.side,finger:fi+1,speed:tip.distanceTo(previousTip[index])*fps});previousTip[index]=tip;
 for(const p of points)if(!p.toArray().every(Number.isFinite))nonfinite++;
 }
 }
 for(const c of performer.contacts){contactSamples++;maxContact=Math.max(maxContact,c.error);}
}
// Absolute-time reproducibility under non-monotonic seeks.
const snapshot=t=>{pose(t);return performer.hands.flatMap(h=>h.fingers.flatMap(f=>f.tip.getWorldPosition(new T.Vector3()).toArray()));};let seekError=0;
for(const time of [0,.7,20.9,85.4,118.5,186.2,224.7,232]){const direct=snapshot(time);snapshot(198.3);snapshot(.12);const replay=snapshot(time);seekError=Math.max(seekError,...direct.map((v,i)=>Math.abs(v-replay[i])));}
const gaps=skin.map(x=>x.gapMm).sort((a,b)=>a-b),report={scoreDuration:score.duration,pianoNotes:score.notes.length,skinSamples:skin.length,skinMissing:missing.length,skinGapMm:{min:gaps[0],p01:gaps[Math.floor(gaps.length*.01)],median:gaps[Math.floor(gaps.length*.5)],p99:gaps[Math.floor(gaps.length*.99)],max:gaps.at(-1)},skinOutside3mm:skin.filter(x=>Math.abs(x.gapMm)>3).length,frames:frames+1,frameIntervals:frames,frameRate:fps,contactSamples,maxContactErrorMm:maxContact*1000,nonfinite,maxFingerPipDegrees:maxPip*180/Math.PI,maxFingerDipDegrees:maxDip*180/Math.PI,seekMaxErrorMm:seekError*1000,worstSkin:[...skin].sort((a,b)=>Math.abs(b.gapMm)-Math.abs(a.gapMm)).slice(0,20),wristSpeedPeaks:wristPeaks.sort((a,b)=>b.speed-a.speed).slice(0,20),tipSpeedPeaks:tipPeaks.sort((a,b)=>b.speed-a.speed).slice(0,20),missing};
report.movementLimits={wristSpeedMps:1.5,wristAccelerationMps2:25,tipSpeedMps:5,dorsalElevationDegrees:60,backwardPipMm:3,description:'Engineering review thresholds for this performance; not clinical human limits.'};
report.handShape={sampleCount:shapePeaks.length,violations:shapeViolations,violationsByState:shapeViolationsByState,maxDorsalElevationDegrees:shapePeaks.reduce((max,x)=>Math.max(max,x.dorsalElevationDegrees),-90),maxBackwardPipMm,backwardPeaks:[...shapePeaks].sort((a,b)=>b.backwardPipMm-a.backwardPipMm).slice(0,20),peaks:shapePeaks.sort((a,b)=>b.dorsalElevationDegrees-a.dorsalElevationDegrees).slice(0,20),dorsalPalmTriangleCounts:dorsalPalm.triangleCounts,definition:'Signed proximal elevation above the area-weighted actual dorsal-palm skin plane. Palm triangles have at least 90% wrist ownership, centers at 25–80% of knuckle span, and initial normals within 60 degrees of local negative Z. Thumb shape requires separate review.'};
report.maxWristSpeedMps=wristPeaks.reduce((max,x)=>Math.max(max,x.speed),0);report.maxWristAccelerationMps2=wristPeaks.reduce((max,x)=>Math.max(max,x.accel),0);report.maxTipSpeedMps=tipPeaks.reduce((max,x)=>Math.max(max,x.speed),0);
report.passed=report.maxWristSpeedMps<=report.movementLimits.wristSpeedMps&&report.maxWristAccelerationMps2<=report.movementLimits.wristAccelerationMps2&&report.maxTipSpeedMps<=report.movementLimits.tipSpeedMps&&report.handShape.violations===0&&report.skinMissing===0&&report.skinOutside3mm===0&&report.maxContactErrorMm<1&&report.nonfinite===0&&report.seekMaxErrorMm<.001;
report.scope=`Five actual fingertip-mesh samples in every note, full ${fps}Hz absolute-time replay including the exact score endpoint, joint-bend and movement diagnostics; visual anatomy and audible playback require separate review.`;
report.inputs=Object.fromEntries([process.env.DAYBREAK_SCORE_PATH??'public/assets/score.json','public/assets/pianist.glb',rigFile,'production/qa/compiled/piano.mjs','production/qa/key-pad-contact.mjs','production/qa/hand-shape.mjs'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,worstSkin:report.worstSkin.slice(0,3),wristSpeedPeaks:report.wristSpeedPeaks.slice(0,3),tipSpeedPeaks:report.tipSpeedPeaks.slice(0,3)},null,2));
if(!report.passed)process.exitCode=1;
