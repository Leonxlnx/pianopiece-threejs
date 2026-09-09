import {T,fs,score,performer,pose,updateKeys,measure,active,snapshot,wp,modelUpdate} from '../idle-nonthumb/audit-lib.mjs';
import {applyIdleNonthumb} from './idle-nonthumb.mjs';
import {idleNonthumbData as data} from './idle-nonthumb-data.mjs';
const fps=Number(process.argv[2]??60),rows=[],regressions=[],counts={baseCore:0,candidateCore:0,newPairTypes:0,newPalmTypes:0,newCore:0,strictPairIncreases:0},times=new Map();
for(const c of [...data.supportedIndexGaps,...data.curves]){
 const begin=c.knots?.[0][0]??c.previousEnd,end=c.knots?.at(-1)[0]??c.nextTime;
 const add=t=>{if(t<begin-1e-7||t>end+1e-7)return;const k=t.toFixed(9),r=times.get(k)??{time:t,sides:new Set()};r.sides.add(c.hi);times.set(k,r);};
 for(let i=Math.ceil(begin*fps);i<=Math.floor(end*fps);i++)add(i/fps);
 for(const t of [begin,end,...(c.knots??[]).map(k=>k[0])])for(const dt of [-1e-6,0,1e-6])add(t+dt);
 for(const n of score.notes.filter(n=>n.hand===(c.hi?'R':'L')))for(const t of [n.time,n.time+n.duration])for(const dt of [-1e-6,0,1e-6])add(t+dt);
}
function apply(time){for(const h of performer.hands)for(let fi=1;fi<5;fi++){
 const notes=h.fingerNotes[fi];if(notes.some(n=>time>=n.time&&time<n.time+n.duration))continue;
 const previous=notes.filter(n=>n.time+n.duration<=time).at(-1),next=notes.find(n=>n.time>=time);
 applyIdleNonthumb(time,h.side,fi,h.fingers[fi].bones,h.wrist,wp(h.fingers[fi].bones[0]),previous,next);
}modelUpdate();}
let activeComponentDelta=0,processed=0;
const all=[...times.values()].sort((a,b)=>a.time-b.time);
for(const {time,sides} of all){
 pose(time);updateKeys();const before=[...sides].flatMap(hi=>Array.from({length:5},(_,fi)=>({hi,fi,metric:measure(hi,fi,time)}))),q=snapshot();
 apply(time);const after=before.map(({hi,fi})=>measure(hi,fi,time)),q2=snapshot();
 for(let hi=0;hi<2;hi++)for(let fi=0;fi<5;fi++)if(active(hi,fi,time))for(let j=0;j<3;j++)for(let k=0;k<4;k++)activeComponentDelta=Math.max(activeComponentDelta,Math.abs(q[hi][fi][j].toArray()[k]-q2[hi][fi][j].toArray()[k]));
 for(let i=0;i<before.length;i++){
  const {hi,fi,metric:b}=before[i],a=after[i],newPairs=a.neighborPairs.map((v,j)=>v&&!b.neighborPairs[j]?j:undefined).filter(j=>j!==undefined),newPalm=!!a.ownPalmPairs&&!b.ownPalmPairs,newCore=a.maxCoreMm>Math.max(3,b.maxCoreMm+.25),strict=a.neighborPairs.some((v,j)=>v>b.neighborPairs[j]+2)||a.ownPalmPairs>b.ownPalmPairs+2;
  counts.baseCore+=b.maxCoreMm>3?1:0;counts.candidateCore+=a.maxCoreMm>3?1:0;counts.newPairTypes+=newPairs.length;counts.newPalmTypes+=newPalm?1:0;counts.newCore+=newCore?1:0;counts.strictPairIncreases+=strict?1:0;
  if(newPairs.length||newPalm||newCore||strict)regressions.push({time,hi,fi,newPairs,newPalm,newCore,strict,before:b,after:a});
 }
 rows.push({time,before,after});processed++;
 if(processed%500===0)console.log(JSON.stringify({processed,total:all.length,regressions:regressions.length,counts}));
}
const report={scoreSha256:data.sourceScoreSha256,source:process.env.DAYBREAK_RIG_MODULE,fps,samples:rows.length,activeComponentDelta,counts,regressions,rows,scope:'Finite combined changed-support screen; all digits on affected hands. Opposing hands and dense motion remain separate.'};
fs.writeFileSync('replay-'+fps+'.json',JSON.stringify(report));console.log(JSON.stringify({...report,rows:undefined,regressions:undefined}));
