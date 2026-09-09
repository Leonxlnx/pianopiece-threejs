import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
import {schedule,coverage,records,score} from './coverage.mjs';
const base=await import('./harness.mjs?rig=./baseline.mjs'),candidate=await import('./harness.mjs?rig=./candidate.mjs');
const limit=process.env.REPLAY_LIMIT?Number(process.env.REPLAY_LIMIT):schedule.length;
const output=process.env.REPLAY_PREFIX??'replay';
const rowsGzip=[],regGzip=[];
async function write(destination,value){destination.push(JSON.stringify(value)+'\n');}
const names=['Thumb','Index','Middle','Ring','Pinky','Palm'];
const counts={baseCorePatchStates:0,candidateCorePatchStates:0,baseCoreKeyTypes:0,candidateCoreKeyTypes:0,newCorePatchStates:0,worsenedCorePatchStates:0,newCoreKeyTypes:0,worsenedCoreKeyTypes:0,newNeighborPairTypes:0,newOwnPalmTypes:0,strictExistingNeighborPairIncreases:0,strictExistingOwnPalmIncreases:0,existingNeighborIncreasesOver2:0,existingOwnPalmIncreasesOver2:0,regressionHandStates:0,strictOnlyHandStates:0,changedHandStates:0};
const parity={activeFingerStates:0,activeLocalQuaternionComponents:0,activeWorldMatrixComponents:0,maxActiveLocalComponentDelta:0,maxActiveWorldComponentDelta:0,maxWristLocalComponentDelta:0,maxWristWorldComponentDelta:0,activeViolations:0,wristViolations:0};
let processed=0,handStates=0,regressionEvents=0,lastProgress=Date.now();
const start=Date.now(),queue=new Map(),recordStats=Object.fromEntries(records.map(r=>[r.id,{samples:0,changedSamples:0,regressionSamples:0,activeFingerStates:0}]));
function maxDelta(a,b){return Math.max(0,...a.map((x,i)=>Math.abs(x-b[i])));}
function coreMax(m,p){return Math.max(0,...m.keyHits.filter(x=>x.patch===p).map(x=>x.depth));}
function compact(m){return {active:m.active,keyHits:m.keyHits,crossings:m.crossings.map(x=>({...x,points:x.points.slice(0,2)})),meshContacts:m.meshContacts};}
function assess(b,a){
 const events=[];
 for(const p of names.map(n=>b.side+n)){
  const before=coreMax(b,p),after=coreMax(a,p);counts.baseCorePatchStates+=+(before>3);counts.candidateCorePatchStates+=+(after>3);
  if(before<=3&&after>3){counts.newCorePatchStates++;events.push({kind:'newCorePatch',target:p,before,after});}
  if(after>3&&after>before+.25){counts.worsenedCorePatchStates++;events.push({kind:'worsenedCorePatch',target:p,before,after});}
 }
 const oldKeys=new Map(b.keyHits.map(x=>[`${x.patch}:${x.midi}`,x])),newKeys=new Map(a.keyHits.map(x=>[`${x.patch}:${x.midi}`,x]));
 counts.baseCoreKeyTypes+=b.keyHits.filter(x=>x.depth>3).length;counts.candidateCoreKeyTypes+=a.keyHits.filter(x=>x.depth>3).length;
 for(const [target,hit] of newKeys){const before=oldKeys.get(target)?.depth??0,after=hit.depth;
  if(before<=3&&after>3){counts.newCoreKeyTypes++;events.push({kind:'newCoreKey',target,before,after});}
  if(after>3&&after>before+.25){counts.worsenedCoreKeyTypes++;events.push({kind:'worsenedCoreKey',target,before,after});}
 }
 const oldPairs=new Map(b.crossings.map(x=>[`${x.a}:${x.b}`,x.trianglePairs]));
 for(const pair of a.crossings){const target=`${pair.a}:${pair.b}`,before=oldPairs.get(target)??0,after=pair.trianglePairs,own=pair.a.endsWith('Palm')||pair.b.endsWith('Palm');
  if(before===0&&after>0){counts[own?'newOwnPalmTypes':'newNeighborPairTypes']++;events.push({kind:own?'newOwnPalm':'newNeighborPair',target,before,after});}
  if(before>0&&after>before){counts[own?'strictExistingOwnPalmIncreases':'strictExistingNeighborPairIncreases']++;events.push({kind:own?'strictExistingOwnPalmIncrease':'strictExistingNeighborPairIncrease',target,before,after});}
  if(before>0&&after>before+2)counts[own?'existingOwnPalmIncreasesOver2':'existingNeighborIncreasesOver2']++;
 }
 return events;
}
const mesh={vertices:base.vertices.map((v,i)=>({patch:base.patchName(i),count:v.length,triangles:base.triangles[i].length})),keys:base.piano.keys.size,ownershipWeightThreshold:.65};
for(const sample of schedule.slice(0,limit)){
 const {time}=sample;base.update(time);candidate.update(time);const qb=base.snapshot(),qa=candidate.snapshot();
 const active=score.notes.filter(n=>n.time<=time&&time<n.time+n.duration),activeUnique=[...new Set(active.map(n=>`${n.hand}:${n.finger-1}`))];
 const sampleParity={maxActiveLocalComponentDelta:0,maxActiveWorldComponentDelta:0,activeFingerStates:activeUnique.length,violations:[]};
 for(const side of ['L','R']){const hi=side==='L'?0:1,dl=maxDelta(qb[hi].wristQ,qa[hi].wristQ),dw=maxDelta(qb[hi].wristWorld,qa[hi].wristWorld);parity.maxWristLocalComponentDelta=Math.max(parity.maxWristLocalComponentDelta,dl);parity.maxWristWorldComponentDelta=Math.max(parity.maxWristWorldComponentDelta,dw);if(dl>1e-12||dw>1e-12)parity.wristViolations++;}
 for(const key of activeUnique){const [side,fiString]=key.split(':'),hi=side==='L'?0:1,fi=Number(fiString);parity.activeFingerStates++;parity.activeLocalQuaternionComponents+=12;parity.activeWorldMatrixComponents+=48;
  let local=0,world=0;for(let j=0;j<3;j++){local=Math.max(local,maxDelta(qb[hi].fingers[fi][j].local,qa[hi].fingers[fi][j].local));world=Math.max(world,maxDelta(qb[hi].fingers[fi][j].world,qa[hi].fingers[fi][j].world));}
  sampleParity.maxActiveLocalComponentDelta=Math.max(sampleParity.maxActiveLocalComponentDelta,local);sampleParity.maxActiveWorldComponentDelta=Math.max(sampleParity.maxActiveWorldComponentDelta,world);parity.maxActiveLocalComponentDelta=Math.max(parity.maxActiveLocalComponentDelta,local);parity.maxActiveWorldComponentDelta=Math.max(parity.maxActiveWorldComponentDelta,world);
  if(local>1e-12||world>1e-12){parity.activeViolations++;sampleParity.violations.push({key,local,world,before:qb[hi].fingers[fi],after:qa[hi].fingers[fi]});}
 }
 const hands=[];
 for(const side of sample.sides){handStates++;const hi=side==='L'?0:1,b=base.measure(time,side,{alreadyUpdated:true}),a=candidate.measure(time,side,{alreadyUpdated:true}),events=assess(b,a),supportIds=sample.records.filter(id=>records.find(c=>c.id===id).hi===hi);
  const changed=Math.max(0,...qb[hi].fingers.flatMap((f,i)=>f.map((q,j)=>maxDelta(q.local,qa[hi].fingers[i][j].local))))>1e-12;
  counts.changedHandStates+=+changed;
  for(const id of supportIds){recordStats[id].samples++;recordStats[id].changedSamples+=+changed;recordStats[id].regressionSamples+=+(events.length>0);recordStats[id].activeFingerStates+=b.active.length;}
  if(events.length){counts.regressionHandStates++;if(events.every(e=>e.kind.startsWith('strictExisting')))counts.strictOnlyHandStates++;await write(regGzip,{index:sample.index,time,side,supportIds,events,before:compact(b),after:compact(a)});}
  for(const e of events){regressionEvents++;const k=JSON.stringify([e.kind,e.target,supportIds]),q=queue.get(k)??{kind:e.kind,target:e.target,supportIds,samples:0,firstTime:time,lastTime:time,peakAfter:0,largestIncrease:0,worst:null};q.samples++;q.lastTime=time;q.peakAfter=Math.max(q.peakAfter,e.after);if(q.worst===null||e.after-e.before>q.largestIncrease){q.largestIncrease=e.after-e.before;q.worst={time,before:e.before,after:e.after};}queue.set(k,q);}
  hands.push({side,supportIds,changed,before:compact(b),after:compact(a),events});
 }
 await write(rowsGzip,{...sample,parity:sampleParity,hands});processed++;
 if(Date.now()-lastProgress>30000){console.log(JSON.stringify({processed,total:limit,handStates,regressionHandStates:counts.regressionHandStates,elapsedSeconds:(Date.now()-start)/1000}));lastProgress=Date.now();}
}
fs.writeFileSync(new URL(`./${output}-rows.jsonl.gz`,import.meta.url),gzipSync(rowsGzip.join(''),{level:6}));
fs.writeFileSync(new URL(`./${output}-regressions.jsonl.gz`,import.meta.url),gzipSync(regGzip.join(''),{level:6}));
const finiteQueue=[...queue.values()].sort((a,b)=>a.firstTime-b.firstTime||a.kind.localeCompare(b.kind)||a.target.localeCompare(b.target));
const report={complete:processed===schedule.length,coverage,processed,handStates,patchStates:handStates*6,regressionEvents,queueEntries:finiteQueue.length,counts,parity,mesh,recordStats,elapsedSeconds:(Date.now()-start)/1000,definitions:{core:'Moving key mesh bounding solid transformed by actual key matrix; beveled border excluded (black 2 mm, white 1.4 mm). Depth is minimum distance to unshrunk solid face in key-local coordinates; >3 mm threshold.',newCore:'Baseline depth <=3 mm and candidate depth >3 mm, both patch maxima and per patch/key.',worsenedCore:'Candidate depth >3 mm and >baseline+0.25 mm, both patch maxima and per patch/key.',pair:'Exact noncoplanar triangle-edge crossing on >0.65 bone-weight-owned surface patches. All 15 pairs on affected hand, including own palm.',newPair:'Baseline count zero, candidate count positive.',strictExistingPairIncrease:'Baseline count positive and candidate count strictly greater, with >2 pair historical tolerance additionally counted separately.',scope:'60 Hz through every helper support, exact note boundaries from both hands and exact curve/support knots, plus ±1 microsecond probes. All six affected-hand patches. Both hands active local quaternion and world matrix parity checked at every sampled time.',limitations:'Finite geometry screen; key interiors use the preserved harness core-solid approximation and owned mesh subsets. Opposing-hand surface crossings, continuous-time safety, animation speed/twist and natural-looking hands are outside this replay. The missing historical idle-nonthumb/audit-lib.mjs was not run.'}};
fs.writeFileSync(new URL(`./${output}-summary.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(new URL(`./${output}-queue.json`,import.meta.url),JSON.stringify(finiteQueue,null,2)+'\n');console.log(JSON.stringify({...report,recordStats:undefined,coverage:undefined,definitions:undefined,mesh:undefined}));
