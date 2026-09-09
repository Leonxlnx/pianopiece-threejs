import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
const base=await import('../harness.mjs?rig=./baseline.mjs'),original=await import('../harness.mjs?rig=./candidate.mjs'),fixed=await import('../harness.mjs?rig=./repair/fixed.mjs');
const rigs={base,original,fixed},targets=JSON.parse(fs.readFileSync(new URL('./targets.json',import.meta.url))),score=base.score,fps=240,margin=.15,rows=[],queue=[];
const handNames=['Thumb','Index','Middle','Ring','Pinky','Palm'];
function compact(m){return{active:m.active,keyHits:m.keyHits,crossings:m.crossings.map(p=>({...p,points:p.points.slice(0,1)})),chains:m.chains,meshContacts:m.meshContacts};}
function compare(b,a){const events=[],old=new Map(b.keyHits.map(x=>[x.patch+':'+x.midi,x.depth])),pairs=new Map(b.crossings.map(x=>[x.a+':'+x.b,x.trianglePairs]));for(const h of a.keyHits){const target=h.patch+':'+h.midi,before=old.get(target)??0;if(before<=3&&h.depth>3)events.push({kind:'newCoreKey',target,before,after:h.depth});if(h.depth>3&&h.depth>before+.25)events.push({kind:'worsenedCoreKey',target,before,after:h.depth});}for(const p of a.crossings){const target=p.a+':'+p.b,before=pairs.get(target)??0,own=p.a.endsWith('Palm')||p.b.endsWith('Palm');if(!before)events.push({kind:own?'newOwnPalm':'newFingerPair',target,before,after:p.trianglePairs});else if(p.trianglePairs>before)events.push({kind:own?'strictOwnPalmIncrease':'strictFingerPairIncrease',target,before,after:p.trianglePairs});}return events;}
function core(m){return{deepKeys:m.keyHits.filter(x=>x.depth>3).length,deepPatches:handNames.filter(n=>m.keyHits.some(x=>x.patch==='L'+n&&x.depth>3)).length,indexMax:Math.max(0,...m.keyHits.filter(x=>x.patch==='LIndex').map(x=>x.depth)),allMax:Math.max(0,...m.keyHits.map(x=>x.depth)),pairTotal:m.crossings.reduce((n,p)=>n+p.trianglePairs,0)};}
const results={},started=Date.now();
for(const target of targets){
 const start=target.previousEnd-margin,end=target.nextTime+margin,times=new Map(),add=(t,kind)=>{if(t<start||t>end)return;const s=times.get(t)??new Set();s.add(kind);times.set(t,s);};
 for(let f=Math.ceil(start*fps);f<=Math.floor(end*fps);f++)add(f/fps,'240Hz');
 if(target.id==='index-059')for(let f=Math.ceil((target.nextTime-1)*480);f<=Math.floor((target.nextTime+.05)*480);f++)add(f/480,'480HzArrival');
 for(const t of [start,end,target.previousEnd,target.nextTime,target.previousEnd+.25,target.nextTime-.32,target.nextTime-.8,176.02,176.065,...(target.knots??[]).map(k=>k[0]),...score.notes.flatMap(n=>[n.time,n.time+n.duration])])if(t>=start&&t<=end)for(const d of [-1e-6,0,1e-6])add(t+d,d===0?'exactBoundary':'boundaryProbe');
 const ordered=[...times].sort((a,b)=>a[0]-b[0]);
 for(const [time,kinds] of ordered){const metrics={},q={};for(const [name,rig] of Object.entries(rigs)){metrics[name]=compact(rig.measure(time,'L'));q[name]=rig.snapshot();}
  const active=[...new Set(score.notes.filter(n=>n.time<=time&&time<n.time+n.duration).map(n=>n.hand+':'+(n.finger-1)))];let activeLocal=0,activeWorld=0,outsideLocal=0,wristWorld=0,indexVsBase=0;
  for(let hi=0;hi<2;hi++){
   for(let k=0;k<16;k++)wristWorld=Math.max(wristWorld,Math.abs(q.fixed[hi].wristWorld[k]-q.original[hi].wristWorld[k]));
   for(let fi=0;fi<5;fi++)for(let j=0;j<3;j++){
    const isActive=active.includes((hi?'R':'L')+':'+fi),qb=q.original[hi].fingers[fi][j],qa=q.fixed[hi].fingers[fi][j];
    for(let k=0;k<4;k++){const d=Math.abs(qb.local[k]-qa.local[k]);if(isActive)activeLocal=Math.max(activeLocal,d);if(time<=target.previousEnd||time>=target.nextTime)outsideLocal=Math.max(outsideLocal,d);if(hi===0&&fi===1)indexVsBase=Math.max(indexVsBase,Math.abs(q.base[hi].fingers[fi][j].local[k]-qa.local[k]));}
    if(isActive)for(let k=0;k<16;k++)activeWorld=Math.max(activeWorld,Math.abs(qb.world[k]-qa.world[k]));
   }
  }
  const comparisons={originalVsBase:compare(metrics.base,metrics.original),fixedVsBase:compare(metrics.base,metrics.fixed),fixedVsOriginal:compare(metrics.original,metrics.fixed)};
  for(const [relation,events] of Object.entries(comparisons))if(events.length)queue.push({scope:target.id,time,relation,events});
  rows.push({scope:target.id,time,kinds:[...kinds],insideGap:time>=target.previousEnd&&time<=target.nextTime,metrics,core:Object.fromEntries(Object.entries(metrics).map(([n,m])=>[n,core(m)])),comparisons,parity:{activeStates:active.length,activeLocal,activeWorld,outsideLocal,wristWorld,indexVsBase},joints:Object.fromEntries(Object.entries(q).map(([n,hands])=>[n,hands[0].fingers.map(f=>f.map(b=>b.local))]))});
 }
 results[target.id]={target,start,end,samples:ordered.length,insideGapSamples:rows.filter(r=>r.scope===target.id&&r.insideGap).length};console.log(JSON.stringify({scope:target.id,samples:ordered.length,elapsedSeconds:(Date.now()-started)/1000}));
}
fs.writeFileSync(new URL('./qualified-rows.jsonl.gz',import.meta.url),gzipSync(rows.map(r=>JSON.stringify(r)+'\n').join(''),{level:6}));fs.writeFileSync(new URL('./qualified-queue.json',import.meta.url),JSON.stringify(queue,null,2)+'\n');fs.writeFileSync(new URL('./coverage.json',import.meta.url),JSON.stringify({fps,margin,results,totalSamples:rows.length,elapsedSeconds:(Date.now()-started)/1000},null,2)+'\n');console.log(JSON.stringify({complete:true,samples:rows.length,elapsedSeconds:(Date.now()-started)/1000}));
