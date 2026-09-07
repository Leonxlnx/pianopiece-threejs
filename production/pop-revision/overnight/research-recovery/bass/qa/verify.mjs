import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runtime,T} from './runtime.mjs';
import {assertFiniteMotionRow} from './motion-validity.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const base=path.resolve(process.argv[2]),candidate=path.resolve(process.argv[3]),out=path.resolve(process.argv[4]);
const project=path.resolve(process.env.DAYBREAK_PROJECT),model=path.resolve(process.env.DAYBREAK_MODEL_PATH);
const oldScore=JSON.parse(fs.readFileSync(base+'/score.json')),newScore=JSON.parse(fs.readFileSync(candidate+'/score.json'));
const id='db00407',oldNote=oldScore.notes.find(n=>n.id===id),newNote=newScore.notes.find(n=>n.id===id);
const stripped=structuredClone(newScore);delete stripped.notes.find(n=>n.id===id).releasePose;
assert.deepEqual(stripped,oldScore,'Only the explicit reviewed releasePose may change');
assert.equal(oldNote.releasePose,undefined);
assert.ok(Object.keys(newNote.releasePose).every(k=>['duration','liftDegrees','sweepDegrees','jointPath'].includes(k)));
assert.ok(['duration','liftDegrees','sweepDegrees'].every(k=>Number.isFinite(newNote.releasePose[k])));
if(newNote.releasePose.jointPath){
 const p=newNote.releasePose.jointPath;assert.ok(p.length>=2&&p.length<=16);
 for(const [k,at]of [[p[0],0],[p.at(-1),1]]){assert.equal(k.at,at);assert.equal(k.lift,0);assert.equal(k.sweep,0);assert.equal(k.roll??0,0);}
 for(const [i,k]of p.entries()){assert.ok(Object.keys(k).every(k=>['at','lift','sweep','roll'].includes(k)));assert.ok(['at','lift','sweep'].every(n=>Number.isFinite(k[n])));assert.ok(Object.values(k).every(Number.isFinite));assert.ok(k.lift>=0&&k.lift<=55&&Math.abs(k.sweep)<=30&&Math.abs(k.roll??0)<=15);if(i)assert.ok(k.at>p[i-1].at&&k.at<=1);}
}
const sameFinger=oldScore.notes.filter(n=>n.hand===oldNote.hand&&n.finger===oldNote.finger),ni=sameFinger.findIndex(n=>n.id===id),next=sameFinger[ni+1];
assert.ok(newNote.releasePose.duration>0&&newNote.releasePose.duration<(next.time-oldNote.time-oldNote.duration)*.5);
const start=oldNote.time+oldNote.duration,end=start+Math.max(.080,newNote.releasePose.duration);
const windows=[{id,hand:'L',finger:4,start,end}],times=[];
for(let i=0;i<=Math.ceil((end-start+.05)*240);i++)times.push(Math.min(start-.025+i/240,end+.025));
const bounds=[start-.025,start-1e-5,start,end,end+1e-5,end+.025];
const ordered=[...times.filter(t=>!bounds.some(b=>Math.abs(t-b)<1e-10)),...bounds].sort((a,b)=>a-b);
assert.ok(ordered.every(Number.isFinite));
assert.ok(ordered.every((t,i)=>i===0||(t>ordered[i-1]&&t-ordered[i-1]<=1/240+1e-10)));
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(out+'/windows.json',JSON.stringify(windows,null,2)+'\n');
fs.writeFileSync(out+'/times.json',JSON.stringify(ordered,null,2)+'\n');
const files=[model,project+'/package-lock.json',base+'/score.json',candidate+'/score.json',out+'/windows.json',out+'/times.json',...fs.readdirSync(here).filter(f=>f.endsWith('.mjs')).map(f=>here+'/'+f),...[base,candidate].flatMap(v=>fs.readdirSync(v+'/compiled').filter(f=>f.endsWith('.mjs')).map(f=>v+'/compiled/'+f))];
const hashes=()=>Object.fromEntries(files.sort().map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const initial=hashes();
for(const [variant,prefix]of [[base,'baseline'],[candidate,'candidate']]){
 execFileSync(process.execPath,[here+'/surfaces.mjs','--project',project,'--model',model,'--rig',variant+'/compiled/pianist.mjs','--piano',variant+'/compiled/piano.mjs','--score',variant+'/score.json','--times',out+'/times.json','--out',out+'/'+prefix+'-surfaces.json'],{stdio:'pipe'});
 for(const fps of [240,960])execFileSync(process.execPath,[here+'/motion.mjs',variant,out+'/windows.json',out+'/'+prefix+'-motion-'+fps+'.json',String(fps)],{stdio:'pipe'});
}
const aReport=JSON.parse(fs.readFileSync(out+'/baseline-surfaces.json')),bReport=JSON.parse(fs.readFileSync(out+'/candidate-surfaces.json'));
assert.equal(aReport.summary.nonfinite,0);assert.equal(bReport.summary.nonfinite,0);
assert.equal(aReport.summary.samples,ordered.length);assert.equal(bReport.summary.samples,ordered.length);
assert.ok(aReport.inputsUnchanged&&bReport.inputsUnchanged);
const index=j=>new Map(j.rows.map(r=>[r.time,r]));const aRows=index(aReport),bRows=index(bReport);
let oldTarget=0,newTarget=0,oldMiddle=0,newMiddle=0;const shallowIncreases=[];
for(const time of ordered){
 const a=aRows.get(time)??{keyHits:[],surfaceHits:[]},b=bRows.get(time)??{keyHits:[],surfaceHits:[]};
 const ak=new Map(a.keyHits.map(h=>[h.patch+':'+h.key,h.maxDepthMm]));
 for(const h of b.keyHits){assert.ok(Number.isFinite(h.maxDepthMm));const before=ak.get(h.patch+':'+h.key)??0;if(h.maxDepthMm>3)assert.ok(h.maxDepthMm<=before+1e-8,'New/worsened severe key contact');if(h.maxDepthMm>before+1e-8)shallowIncreases.push({time,patch:h.patch,key:h.key,beforeMm:before,afterMm:h.maxDepthMm});}
 assert.deepEqual(a.keyHits.filter(h=>h.patch!=='LRing'),b.keyHits.filter(h=>h.patch!=='LRing'),'Unrelated key geometry changed');
 const ap=new Map(a.surfaceHits.map(h=>[h.a+':'+h.b+':'+h.kind,h.trianglePairs]));
 for(const h of b.surfaceHits){assert.ok(Number.isInteger(h.trianglePairs)&&h.trianglePairs>=0);assert.ok(h.trianglePairs<=(ap.get(h.a+':'+h.b+':'+h.kind)??0),'New/increased real surface patch-pair incidence');}
 for(const [rows,isNew]of [[a.surfaceHits,false],[b.surfaceHits,true]])for(const h of rows){if(h.a==='LRing'&&h.b==='LPinky'){if(isNew)newTarget+=h.trianglePairs;else oldTarget+=h.trianglePairs;}if(h.a==='LMiddle'&&h.b==='LRing'){if(isNew)newMiddle+=h.trianglePairs;else oldMiddle+=h.trianglePairs;}}
}
assert.ok(oldTarget>0,'Missing actual baseline positive control');assert.equal(newTarget,0,'Target ring–pinky crossing remains');
for(const fps of [240,960])assert.equal(JSON.parse(fs.readFileSync(out+'/candidate-motion-'+fps+'.json')).failures.length,0,'Motion/shape gate failed');
const a=await runtime(base),b=await runtime(candidate);let unrelatedQuaternionError=0,endpointSkinError=0,heldSkinError=0;
function skinError(){let max=0;assert.equal(a.body.geometry.attributes.position.count,b.body.geometry.attributes.position.count);for(let i=0;i<a.body.geometry.attributes.position.count;i++){const p=a.body.getVertexPosition(i,new T.Vector3()).applyMatrix4(a.body.matrixWorld),q=b.body.getVertexPosition(i,new T.Vector3()).applyMatrix4(b.body.matrixWorld);assert.ok([...p.toArray(),...q.toArray()].every(Number.isFinite));max=Math.max(max,p.distanceTo(q));}return max;}
const allowed=new Set([1,2,3].map(i=>'LeftHandRing'+i));
for(const time of ordered){a.pose(time);b.pose(time);for(let i=0;i<a.body.skeleton.bones.length;i++){const x=a.body.skeleton.bones[i],y=b.body.skeleton.bones[i];assert.equal(x.name,y.name);if(!allowed.has(x.name))for(let j=0;j<4;j++)unrelatedQuaternionError=Math.max(unrelatedQuaternionError,Math.abs(x.quaternion.toArray()[j]-y.quaternion.toArray()[j]));}}
for(const time of [start-.00001,start,end,end+.00001]){a.pose(time);b.pose(time);endpointSkinError=Math.max(endpointSkinError,skinError());}
for(const f of [.015,.25,.5,.8,.985]){const time=oldNote.time+oldNote.duration*f;a.pose(time);b.pose(time);heldSkinError=Math.max(heldSkinError,skinError());}
assert.equal(unrelatedQuaternionError,0);assert.equal(endpointSkinError,0);assert.equal(heldSkinError,0);
let negativeControls=0;
const changedAudible=structuredClone(newScore);changedAudible.notes[0].velocity+=.01;delete changedAudible.notes.find(n=>n.id===id).releasePose;assert.throws(()=>assert.deepEqual(changedAudible,oldScore));negativeControls++;
const row={time:0,wristSpeed:0,wristAccel:0,tipSpeeds:[],fingers:Array.from({length:4},()=>({dorsal:0,backwardMm:0,pip:0})),bones:Array.from({length:5},()=>Array.from({length:4},()=>[0,0,0])),quaternions:Array.from({length:5},()=>Array.from({length:3},()=>[0,0,0,1]))};
assertFiniteMotionRow(row);for(const value of [NaN,Infinity,-Infinity]){for(const mutate of [r=>r.wristSpeed=value,r=>r.wristAccel=value,r=>r.fingers[0].dorsal=value,r=>r.bones[0][0][0]=value,r=>r.quaternions[0][0][0]=value]){const altered=structuredClone(row);mutate(altered);assert.throws(()=>assertFiniteMotionRow(altered));negativeControls++;}}
assert.deepEqual(hashes(),initial,'Consumed inputs changed during verification');
const report={passed:true,id,profile:newNote.releasePose,coverage:{windows,times:ordered.length,geometryFps:240,motionFps:[240,960],guardsSeconds:.025,maxGapSeconds:Math.max(...ordered.slice(1).map((t,i)=>t-ordered[i]))},surface:{oldTarget,newTarget,oldMiddle,newMiddle,shallowIncreases},invariants:{unrelatedQuaternionError,endpointSkinErrorMm:endpointSkinError*1000,heldSkinErrorMm:heldSkinError*1000},negativeControls,inputsUnchanged:true,inputHashes:initial,scope:'One finite guarded left-ring release. Actual animated key inner boxes and noncoplanar triangle crossings for strongly owned hand patches. Mixed webs checked against keys; pair counts do not cover coplanar or enclosed surfaces. Existing unrelated defects preserved.'};
fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
