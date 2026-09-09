import fs from 'node:fs';
import {idleNonthumbData as data} from './search-candidate.mjs';
const base=await import('../harness.mjs?rig=./baseline.mjs'),test=await import('../harness.mjs?rig=./repair/search-candidate.mjs');
const original=JSON.parse(fs.readFileSync(new URL('../sources/idle-nonthumb-data.json',import.meta.url))),target=original.curves[6];
const times=new Set();for(let f=Math.ceil(91.42*480);f<=Math.floor(91.54*480);f++)times.add(f/480);
for(const t of [91.42,91.54,...target.knots.map(x=>x[0]),...base.score.notes.flatMap(n=>[n.time,n.time+n.duration]).filter(t=>t>=91.42&&t<=91.54)])for(const d of [-1e-6,0,1e-6])times.add(t+d);
const ordered=[...times].sort((a,b)=>a-b),cache=new Map(ordered.map(t=>[t,base.measure(t,'L')]));
function assess(b,a){const old=new Map(b.keyHits.map(x=>[x.patch+':'+x.midi,x.depth])),pairs=new Map(b.crossings.map(x=>[x.a+':'+x.b,x.trianglePairs]));let newCore=0,worseCore=0,newPairs=0,strict=0;for(const h of a.keyHits){const before=old.get(h.patch+':'+h.midi)??0;if(before<=3&&h.depth>3)newCore++;if(h.depth>3&&h.depth>before+.25)worseCore++;}for(const p of a.crossings){const before=pairs.get(p.a+':'+p.b)??0;if(!before)newPairs++;else if(p.trianglePairs>before)strict++;}return{newCore,worseCore,newPairs,strict,max:Math.max(0,...a.keyHits.filter(x=>x.patch==='LIndex').map(x=>x.depth)),deep:a.keyHits.filter(x=>x.depth>3).length};}
const variants=[{name:'original',lift:9.5,spread:-13},{name:'remove',remove:true}];
for(const lift of [9.5,12,15,18,22,26])for(const spread of [-13,-10,-7,-4,0])if(lift!==9.5||spread!==-13)variants.push({name:`lift${lift}-spread${spread}`,lift,spread});
const output=[];
for(const variant of variants){data.curves.splice(0,data.curves.length,...structuredClone(original.curves));if(variant.remove)data.curves.splice(6,1);else for(const k of data.curves[6].knots)if(k[1]){k[1]=variant.lift;k[2]=variant.spread;}
 const sums={newCore:0,worseCore:0,newPairs:0,strict:0,deep:0,max:0},by=[];let previous=null,maxSpeed=0;
 for(const time of ordered){const a=test.measure(time,'L'),m=assess(cache.get(time),a);for(const k of ['newCore','worseCore','newPairs','strict','deep'])sums[k]+=m[k];sums.max=Math.max(sums.max,m.max);const point=a.chains[1].points.at(-1);if(previous){const speed=Math.hypot(...point.map((v,i)=>v-previous.point[i]))/(time-previous.time);maxSpeed=Math.max(maxSpeed,speed);}previous={time,point};if(m.newCore||m.newPairs)by.push({time,...m});}
 output.push({...variant,samples:ordered.length,...sums,maxTipSpeed:maxSpeed,regressions:by});console.log(JSON.stringify({...output.at(-1),regressions:undefined}));
}
fs.writeFileSync(new URL('./search-results.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
