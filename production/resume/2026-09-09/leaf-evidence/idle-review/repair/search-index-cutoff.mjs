import fs from 'node:fs';
import {idleNonthumbData as data} from './search-cutoff-candidate.mjs';
const base=await import('../harness.mjs?rig=./baseline.mjs'),test=await import('../harness.mjs?rig=./repair/search-cutoff-candidate.mjs');
const original=JSON.parse(fs.readFileSync(new URL('../sources/idle-nonthumb-data.json',import.meta.url))),target=original.supportedIndexGaps[58];
const times=new Set();for(let f=Math.ceil(175.4*480);f<=Math.floor(176.25*480);f++)times.add(f/480);
for(const t of [175.4,176.25,target.previousEnd,target.nextTime,...base.score.notes.flatMap(n=>[n.time,n.time+n.duration]).filter(t=>t>=175.4&&t<=176.25)])for(const d of [-1e-6,0,1e-6])times.add(t+d);
const ordered=[...times].sort((a,b)=>a-b),cache=new Map(ordered.map(t=>[t,base.measure(t,'L')]));
function assess(b,a){const old=new Map(b.keyHits.map(x=>[x.patch+':'+x.midi,x.depth])),pairs=new Map(b.crossings.map(x=>[x.a+':'+x.b,x.trianglePairs]));let newCore=0,worseCore=0,newPairs=0,strict=0;for(const h of a.keyHits){const before=old.get(h.patch+':'+h.midi)??0;if(before<=3&&h.depth>3)newCore++;if(h.depth>3&&h.depth>before+.25)worseCore++;}for(const p of a.crossings){const before=pairs.get(p.a+':'+p.b)??0;if(!before)newPairs++;else if(p.trianglePairs>before)strict++;}return{newCore,worseCore,newPairs,strict,max:Math.max(0,...a.keyHits.filter(x=>x.patch==='LIndex').map(x=>x.depth)),deep:a.keyHits.filter(x=>x.depth>3).length};}
const variants=[];for(const start of [175.99,176.00,176.01,176.02,176.03])for(const end of [176.05,176.06,176.065,176.07])variants.push({name:`earlyRelease${start}-${end}`,earlyRelease:[start,end]});
const output=[];
for(const variant of variants){data.supportedIndexGaps.splice(0,data.supportedIndexGaps.length,...structuredClone(original.supportedIndexGaps));data.supportedIndexGaps[58].earlyRelease=variant.earlyRelease;
 const sums={newCore:0,worseCore:0,newPairs:0,strict:0,deep:0,max:0},by=[];let previous=null,maxSpeed=0;
 for(const time of ordered){const a=test.measure(time,'L'),m=assess(cache.get(time),a);for(const k of ['newCore','worseCore','newPairs','strict','deep'])sums[k]+=m[k];sums.max=Math.max(sums.max,m.max);const point=a.chains[1].points.at(-1);if(previous){const speed=Math.hypot(...point.map((v,i)=>v-previous.point[i]))/(time-previous.time);maxSpeed=Math.max(maxSpeed,speed);}previous={time,point};if(m.newCore||m.newPairs)by.push({time,...m});}
 output.push({...variant,samples:ordered.length,...sums,maxTipSpeed:maxSpeed,regressions:by});console.log(JSON.stringify({...output.at(-1),regressions:undefined}));
}
fs.writeFileSync(new URL('./search-index-cutoff-results.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
