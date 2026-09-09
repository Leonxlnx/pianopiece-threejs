import {T,fs,score,performer,pose,updateKeys,measure,active,snapshot,wp} from './audit-lib.mjs';
import {applyCurves,curves} from './apply-neutral-blend.mjs';
import {applyCandidate} from './apply-candidate.mjs';
const apply=process.env.DAYBREAK_APPLY_RUNTIME==='1'?applyCandidate:applyCurves;
const begin=Number(process.argv[2]),end=Number(process.argv[3]),fps=Number(process.argv[4]),out=process.argv[5],hi=Number(process.argv[6]??1),rows=[],times=new Set();
for(let i=Math.ceil(begin*fps);i<=Math.floor(end*fps);i++)times.add(i/fps);times.add(begin);times.add(end);
for(const n of score.notes.filter(n=>n.hand===(hi?'R':'L')))for(const t of [n.time,n.time+n.duration])for(const dt of [-1e-6,0,1e-6])if(t+dt>=begin&&t+dt<=end)times.add(t+dt);
for(const c of curves)for(const k of c.knots)for(const dt of [-1e-6,0,1e-6])if(k[0]+dt>=begin&&k[0]+dt<=end)times.add(k[0]+dt);
let activeQ=0,activeTip=0,previous,maxSpeedBase=0,maxSpeedCandidate=0,maxRateBase=0,maxRateCandidate=0;const regressions=[],totals={baseCore:0,candidateCore:0,maxBaseCore:0,maxCandidateCore:0,newPairs:0};
for(const time of [...times].sort((a,b)=>a-b)){
 pose(time);updateKeys();const before=Array.from({length:5},(_,fi)=>measure(hi,fi,time)),qs=snapshot()[hi],tips=performer.hands[hi].fingers.map(f=>wp(f.tip));
 apply(time);const after=Array.from({length:5},(_,fi)=>measure(hi,fi,time)),newQs=snapshot()[hi],newTips=performer.hands[hi].fingers.map(f=>wp(f.tip));
 for(let fi=0;fi<5;fi++){
  if(active(hi,fi,time)){activeTip=Math.max(activeTip,tips[fi].distanceTo(newTips[fi]));activeQ=Math.max(activeQ,...qs[fi].map((q,j)=>q.clone().normalize().angleTo(newQs[fi][j].clone().normalize())));}
  const b=before[fi],a=after[fi],newPairs=a.neighborPairs.map((v,j)=>v&&!b.neighborPairs[j]?j+1:0).filter(Boolean),newPalm=a.ownPalmPairs&&!b.ownPalmPairs,newCore=a.maxCoreMm>Math.max(3,b.maxCoreMm+.25);
  if(newPairs.length||newPalm||newCore)regressions.push({time,finger:fi+1,newPairs,newPalm:!!newPalm,newCore,before:b,after:a});
  totals.baseCore+=b.maxCoreMm>3?1:0;totals.candidateCore+=a.maxCoreMm>3?1:0;totals.maxBaseCore=Math.max(totals.maxBaseCore,b.maxCoreMm);totals.maxCandidateCore=Math.max(totals.maxCandidateCore,a.maxCoreMm);
 }
 if(previous&&time-previous.time>=1e-7){const dt=time-previous.time;for(let fi=0;fi<5;fi++){maxSpeedBase=Math.max(maxSpeedBase,tips[fi].distanceTo(previous.tips[fi])/dt);maxSpeedCandidate=Math.max(maxSpeedCandidate,newTips[fi].distanceTo(previous.newTips[fi])/dt);maxRateBase=Math.max(maxRateBase,...qs[fi].map((q,j)=>q.clone().normalize().angleTo(previous.qs[fi][j].clone().normalize())/dt));maxRateCandidate=Math.max(maxRateCandidate,...newQs[fi].map((q,j)=>q.clone().normalize().angleTo(previous.newQs[fi][j].clone().normalize())/dt));}}
 previous={time,tips,newTips,qs,newQs};rows.push({time,before,after});
}
let seekDelta=0;const read=t=>{pose(t);apply(t);return snapshot().flat(2).flatMap(q=>q.toArray());};for(const t of [begin,(begin+end)/2,end]){const a=read(t);read(4);read(200);const b=read(t);seekDelta=Math.max(seekDelta,...a.map((v,i)=>Math.abs(v-b[i])));}
const report={begin,end,fps,hi,samples:rows.length,scope:'All five actual digit surfaces on the changed hand, against all keys, same-hand neighbors and own palm; exact active-joint/tip parity; finite sample timing only.',curveFile:process.env.DAYBREAK_IDLE_CURVES,scorePath:process.env.DAYBREAK_SCORE_PATH,regressionCount:regressions.length,activeQuaternionDeltaRad:activeQ,activeTipDeltaM:activeTip,seekQuaternionDelta:seekDelta,maxSpeedBase,maxSpeedCandidate,maxRateBase,maxRateCandidate,totals,regressions,rows};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,rows:undefined,regressions:regressions.slice(0,2)}));
