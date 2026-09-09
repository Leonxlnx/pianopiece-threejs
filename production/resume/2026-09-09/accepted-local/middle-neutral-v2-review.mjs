import fs from 'node:fs';
process.env.DAYBREAK_SCORE=new URL('./score-v11.json',import.meta.url).pathname;
process.env.DAYBREAK_RIG_MODULE=new URL('./pianist-candidate-baked.mjs',import.meta.url).pathname;
const base=await import('./harness.mjs?middle-base');
process.env.DAYBREAK_RIG_MODULE=new URL('./pianist-middle-neutral-v2.mjs',import.meta.url).pathname;
const next=await import('./harness.mjs?middle-next');
const fps=Number(process.argv[2]??240),times=new Set([11.600821,14.170007]);
for(let i=Math.ceil(11.600821*fps);i<=Math.floor(14.170007*fps);i++)times.add(i/fps);
for(const t of [12.4,12.525,12.55,12.76,...base.score.notes.filter(n=>n.time>11.60&&n.time<14.18).flatMap(n=>[n.time,n.time+n.duration])])for(const dt of [-1e-6,0,1e-6])if(t+dt>=11.600821&&t+dt<=14.170007)times.add(t+dt);
let activeDelta=0,outsideDelta=0,newCore=0,newPairs=0,newPalm=0,maxCore=0,peakBase=0,peakNext=0;const regressions=[],rows=[];let last=null;
for(const time of [...times].sort((a,b)=>a-b)){
 const a=base.measure(time,'R',{opposing:true}),b=next.measure(time,'R',{opposing:true});
 const pairs=r=>Object.fromEntries(r.crossings.map(c=>[c.a+'/'+c.b,c.trianglePairs])),ap=pairs(a),bp=pairs(b),core=r=>Math.max(0,...r.keyHits.filter(h=>h.patch==='RMiddle').map(h=>h.depth));
 const nc=core(b)>Math.max(3,core(a)+.25),np=Object.keys(bp).filter(k=>!ap[k]),own=np.filter(k=>k.includes('Palm'));
 newCore+=nc?1:0;newPairs+=np.length;newPalm+=own.length;maxCore=Math.max(maxCore,core(b));
 const ah=base.performer.hands[1],bh=next.performer.hands[1];
 for(let fi=0;fi<5;fi++)for(let j=0;j<3;j++)for(let k=0;k<4;k++){const delta=Math.abs(ah.fingers[fi].bones[j].quaternion.toArray()[k]-bh.fingers[fi].bones[j].quaternion.toArray()[k]);if(a.active.some(n=>n.finger===fi+1))activeDelta=Math.max(activeDelta,delta);if(time<=12.4||time>=12.76)outsideDelta=Math.max(outsideDelta,delta);}
 const pa=ah.fingers[2].tip.getWorldPosition(new base.T.Vector3()),pb=bh.fingers[2].tip.getWorldPosition(new base.T.Vector3());if(last&&time-last.time>1e-5){peakBase=Math.max(peakBase,pa.distanceTo(last.pa)/(time-last.time));peakNext=Math.max(peakNext,pb.distanceTo(last.pb)/(time-last.time));}last={time,pa,pb};
 const row={time,baseCore:core(a),candidateCore:core(b),basePairs:ap,candidatePairs:bp,newCore:nc,newPairs:np};rows.push(row);if(nc||np.length)regressions.push(row);
}
const report={fps,states:rows.length,activeDelta,outsideDelta,newCore,newPairs,newPalm,maxCore,peakBase,peakNext,regressions,rows};fs.writeFileSync('middle-neutral-v2-review-'+fps+'.json',JSON.stringify(report));console.log(JSON.stringify({...report,regressions:regressions.slice(0,6),rows:undefined}));
