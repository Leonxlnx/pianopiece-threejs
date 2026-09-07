import fs from 'node:fs';
const dir=process.argv[2],windows=JSON.parse(fs.readFileSync(`${dir}/windows.json`)),before=JSON.parse(fs.readFileSync(`${dir}/baseline-surfaces.json`)),after=JSON.parse(fs.readFileSync(`${dir}/surfaces.json`)),motion=JSON.parse(fs.readFileSync(`${dir}/motion.json`)),names=['Thumb','Index','Middle','Ring','Pinky'];
const results=[];
for(const win of windows){
 const patch=win.hand+names[win.finger-1],data={...win,patch,beforeTargetPairs:0,afterTargetPairs:0,clearedSevere:0,improvedShallow:0,keyRegressions:[],pairRegressions:[],shallowIncreases:[],motionFailures:motion.failures.filter(r=>r.id===win.id).map(r=>({time:r.time,hand:r.hand,tipMax:Math.max(0,...r.tipSpeeds),wristSpeed:r.wristSpeed,wristAccel:r.wristAccel,maxDorsal:Math.max(...r.fingers.map(f=>f.dorsal)),maxBackward:Math.max(...r.fingers.map(f=>f.backwardMm))}))};
 for(let i=0;i<before.rows.length;i++){
  const a=before.rows[i],b=after.rows[i];if(a.time!==b.time)throw Error('Different sample order');if(a.time<win.start-.025001||a.time>win.end+.025001)continue;
  const keys=new Map(a.keyHits.map(h=>[`${h.patch}:${h.key}`,h.maxDepthMm])),nextKeys=new Map(b.keyHits.map(h=>[`${h.patch}:${h.key}`,h.maxDepthMm]));
  for(const h of a.keyHits)if(h.patch===patch){const next=nextKeys.get(`${h.patch}:${h.key}`)??0;if(h.maxDepthMm>3&&next<=3)data.clearedSevere++;else if(h.maxDepthMm>next+1e-8)data.improvedShallow++;}
  for(const h of b.keyHits){const old=keys.get(`${h.patch}:${h.key}`)??0;if(h.maxDepthMm>old+1e-8){const r={time:a.time,patch:h.patch,key:h.key,before:old,after:h.maxDepthMm};if(h.maxDepthMm>3)data.keyRegressions.push(r);else data.shallowIncreases.push(r);}}
  const pairkey=h=>`${h.a}:${h.b}:${h.kind}`,pairs=new Map(a.surfaceHits.map(h=>[pairkey(h),h.trianglePairs]));
  for(const h of b.surfaceHits)if(h.trianglePairs>(pairs.get(pairkey(h))??0))data.pairRegressions.push({time:a.time,pair:pairkey(h),before:pairs.get(pairkey(h))??0,after:h.trianglePairs});
  data.beforeTargetPairs+=a.surfaceHits.filter(h=>[h.a,h.b].includes(patch)).reduce((s,h)=>s+h.trianglePairs,0);data.afterTargetPairs+=b.surfaceHits.filter(h=>[h.a,h.b].includes(patch)).reduce((s,h)=>s+h.trianglePairs,0);
 }
 data.improves=data.beforeTargetPairs>data.afterTargetPairs||data.clearedSevere>0||data.improvedShallow>0;data.passed=data.improves&&!data.keyRegressions.length&&!data.pairRegressions.length&&!data.motionFailures.length;results.push(data);
}
const report={candidate:dir,accepted:results.filter(r=>r.passed).map(r=>r.id),rejected:results.filter(r=>!r.passed).map(r=>r.id),results};fs.writeFileSync(`${dir}/comparison.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,results:results.map(r=>({...r,keyRegressions:r.keyRegressions.length,pairRegressions:r.pairRegressions.length,shallowIncreases:r.shallowIncreases.length,motionFailures:r.motionFailures.length}))},null,2));
