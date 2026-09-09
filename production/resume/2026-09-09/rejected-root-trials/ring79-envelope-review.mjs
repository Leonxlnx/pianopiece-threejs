import fs from 'node:fs';
import {baseline,install} from './harness.mjs';
import {evaluate} from './metrics.mjs';
const candidate=structuredClone(baseline);for(const id of ['p00181','p00659']){const n=candidate.notes.find(n=>n.id===id);n.idleEnvelopeContactLift=n.contactLift;n.contactLift+=.0008;}
const spans=[[41.389078,46.809242],[142.05879,145.694901]],times=new Set();for(const [begin,end]of spans){times.add(begin);times.add(end);for(let i=Math.ceil(begin*120);i<=Math.floor(end*120);i++)times.add(i/120);}
for(const n of baseline.notes.filter(n=>spans.some(([a,b])=>n.time>=a&&n.time<=b)))for(const t of [n.time,n.time+n.duration])for(const dt of [-1e-6,0,1e-6])if(spans.some(([a,b])=>t+dt>=a&&t+dt<=b))times.add(t+dt);
let newCore=0,newOwn=0,newPair=0,newPad=0,beforeBad=0,afterBad=0;const regressions=[];
const bad=r=>r.activeCore>3||r.palmCore>3||r.ownPairs>0||r.activePairs>0||r.contacts.some(c=>c.gap===null||Math.abs(c.gap)>3);
for(const time of [...times].sort((a,b)=>a-b)){
 install(baseline);const a=evaluate(time,'R');install(candidate);const b=evaluate(time,'R');
 beforeBad+=bad(a)?1:0;afterBad+=bad(b)?1:0;
 const ap=Object.fromEntries(a.crossings.map(c=>[c.a+'/'+c.b,c.trianglePairs])),bp=Object.fromEntries(b.crossings.map(c=>[c.a+'/'+c.b,c.trianglePairs]));
 const core=b.allCore>Math.max(3,a.allCore+.25),own=b.ownPairs>0&&a.ownPairs===0,pair=Object.keys(bp).some(k=>!ap[k]),pad=b.contacts.some(c=>(c.gap===null||Math.abs(c.gap)>3)&&!a.contacts.some(d=>d.id===c.id&&(d.gap===null||Math.abs(d.gap)>3)));
 newCore+=core?1:0;newOwn+=own?1:0;newPair+=pair?1:0;newPad+=pad?1:0;
 if(core||own||pair||pad)regressions.push({time,core,own,pair,pad,before:a,after:b});
}
const report={states:times.size,newCore,newOwn,newPair,newPad,beforeBad,afterBad,regressions};fs.writeFileSync('ring79-envelope-review.json',JSON.stringify(report));fs.writeFileSync('ring79-envelope-score.json',JSON.stringify(candidate));console.log(JSON.stringify({...report,regressions:regressions.slice(0,1)}));
