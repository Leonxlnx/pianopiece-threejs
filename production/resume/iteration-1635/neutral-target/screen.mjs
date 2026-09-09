import fs from 'node:fs';
import path from 'node:path';
process.env.DAYBREAK_RIG_MODULE=path.resolve('pianist-baseline.mjs');const A=await import('./harness.mjs?baseline');
process.env.DAYBREAK_RIG_MODULE=path.resolve('neutral-f72-d0.mjs');const B=await import('./harness.mjs?candidate');
const score=A.baseline,manifest=JSON.parse(fs.readFileSync('manifest.json')),names=['Thumb','Index','Middle','Ring','Pinky'];
const times=[...new Set([0,score.duration,...score.notes.map(n=>n.time+n.duration/2)])].sort((a,b)=>a-b);if(times.length!==1070)throw new Error(`Unexpected schedule length ${times.length}`);
const schedule=[...times.map(time=>({kind:'midpoint',time})),...manifest.neutralTimes.map(time=>({kind:'neutral',time}))];
const raw=fs.openSync('screen-rows.jsonl','w');let activeQuatDelta=0,activeTipDelta=0,heldJoints=0;
const out={scheduleSamples:times.length,noteMidpoints:score.notes.length,neutralSamples:manifest.neutralTimes.length,baseline:{inactiveNonthumbPoses:0,keyCorePoses:0,palmPairPoses:0,neighborPairPoses:0},candidate:{inactiveNonthumbPoses:0,keyCorePoses:0,palmPairPoses:0,neighborPairPoses:0},regressions:[],improvements:[]};
function metrics(r,patch){return {keyCoreMm:Math.max(0,...r.keyHits.filter(h=>h.patch===patch).map(h=>h.depth)),palmPairs:r.crossings.filter(c=>(c.a===patch&&c.b.endsWith('Palm'))||(c.b===patch&&c.a.endsWith('Palm'))).reduce((n,c)=>n+c.trianglePairs,0),neighbors:r.crossings.filter(c=>(c.a===patch||c.b===patch)&&!c.a.endsWith('Palm')&&!c.b.endsWith('Palm')).map(c=>({a:c.a,b:c.b,pairs:c.trianglePairs}))};}
function context(side,fi,time){const notes=score.notes.filter(n=>n.hand===side&&n.finger===fi+1),prev=notes.filter(n=>n.time+n.duration<=time).at(-1),next=notes.find(n=>n.time>=time);return {previous:prev?.id??null,release:prev?prev.time+prev.duration:null,next:next?.id??null,attack:next?.time??null};}
for(const [i,{kind,time}] of schedule.entries()){
 const all={kind,time,baseline:[],candidate:[]};
 for(const side of ['L','R']){
  const a=A.measure(time,side,{opposing:side==='R'}),b=B.measure(time,side,{opposing:side==='R'});all.baseline.push(a);all.candidate.push(b);
  const hi=side==='L'?0:1;
  for(let fi=0;fi<5;fi++){
   const held=score.notes.find(n=>n.hand===side&&n.finger===fi+1&&n.time<=time&&n.time+n.duration>time);
   if(held){const af=A.performer.hands[hi].fingers[fi],bf=B.performer.hands[hi].fingers[fi];for(let j=0;j<3;j++){const qa=af.bones[j].quaternion.toArray(),qb=bf.bones[j].quaternion.toArray();activeQuatDelta=Math.max(activeQuatDelta,...qa.map((v,k)=>Math.abs(v-qb[k])));heldJoints++;}activeTipDelta=Math.max(activeTipDelta,af.tip.getWorldPosition(new A.T.Vector3()).distanceTo(bf.tip.getWorldPosition(new B.T.Vector3())));}
   const patch=side+names[fi],ma=metrics(a,patch),mb=metrics(b,patch);
   if(!held&&fi>0){for(const [label,m] of [['baseline',ma],['candidate',mb]]){out[label].inactiveNonthumbPoses++;out[label].keyCorePoses+=m.keyCoreMm>3?1:0;out[label].palmPairPoses+=m.palmPairs>0?1:0;out[label].neighborPairPoses+=m.neighbors.length>0?1:0;}}
   const newCore=mb.keyCoreMm>Math.max(3,ma.keyCoreMm+.25),newPalm=mb.palmPairs>ma.palmPairs,newNeighbor=mb.neighbors.filter(c=>c.pairs>(ma.neighbors.find(d=>d.a===c.a&&d.b===c.b)?.pairs??0));
   if(newCore||newPalm||newNeighbor.length)out.regressions.push({kind,time,side,finger:fi+1,active:held?.id??null,context:held?null:context(side,fi,time),baseline:ma,candidate:mb,newCore,newPalm,newNeighbor});
   if((ma.keyCoreMm>3&&mb.keyCoreMm<=3)||(ma.palmPairs&&mb.palmPairs===0)||(ma.neighbors.length&&mb.neighbors.length===0))out.improvements.push({kind,time,side,finger:fi+1,active:held?.id??null,baseline:ma,candidate:mb});
  }
 }
 fs.writeSync(raw,JSON.stringify(all)+'\n');if(i%200===0)console.log(JSON.stringify({sample:i,total:schedule.length,activeQuatDelta,regressions:out.regressions.length}));
}
fs.closeSync(raw);out.heldJoints=heldJoints;out.activeQuatDelta=activeQuatDelta;out.activeTipDelta=activeTipDelta;out.activeParityPassed=activeQuatDelta===0&&activeTipDelta===0;
out.candidateSource='neutral-f72-d0.ts';out.scope='1068 exact note midpoints plus start/end (1070), seven neutral contexts, both hands. Exact >65% owned triangles and all88 beveled key cores; R rows include opposing hand pairs. Strict count increases retained as regressions. No full-time collision pass inferred.';
fs.writeFileSync('screen-report.json',JSON.stringify(out,null,2));console.log(JSON.stringify({...out,regressions:out.regressions.length,improvements:out.improvements.length}));
