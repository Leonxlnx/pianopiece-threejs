import fs from 'node:fs';import {baseline,install} from './harness.mjs';import {sample,summarize,times} from './metric.mjs';
const s=JSON.parse(fs.readFileSync(process.argv[2]??'candidate-v1.json')),out=process.argv[3]??'validation-v1.json';
const ts=times(s,5.95,12.50,120),rows=[];let bi=0;
for(const [kind,sc] of [['baseline',baseline],['candidate',s]]){install(sc);const samples=[];for(const [i,t] of ts.entries()){samples.push(sample(t));if(i%250===0)console.log(kind,i,ts.length);}rows.push({kind,summary:summarize(samples),samples});}
const b=rows[0].samples,c=rows[1].samples,activeIssues=[],newIssues=[];
for(let i=0;i<c.length;i++){
 const r=c[i],old=b[i];const severe=r.keyHits.filter(k=>k.active&&k.depth>3),pad=r.contacts.filter(c=>c.padGap===null||Math.abs(c.padGap)>2.5),palm=r.crossings.filter(x=>(x.a==='RPalm'||x.b==='RPalm')&&r.active.some(n=>'R'+['Thumb','Index','Middle','Ring','Pinky'][n.finger-1]===x.a||'R'+['Thumb','Index','Middle','Ring','Pinky'][n.finger-1]===x.b));
 if(severe.length||pad.length||palm.length||r.pointContactMm>.25)activeIssues.push({time:r.time,severe,pad,palm,ik:r.pointContactMm});
 for(const k of r.keyHits)if(k.depth>3&&!old.keyHits.some(o=>o.patch===k.patch&&o.midi===k.midi&&o.depth>=k.depth-1e-5))newIssues.push({time:r.time,kind:'key',patch:k.patch,active:k.active,midi:k.midi,depth:k.depth});
 for(const p of r.crossings)if(!old.crossings.some(o=>o.a===p.a&&o.b===p.b))newIssues.push({time:r.time,kind:'pair',a:p.a,b:p.b,count:p.trianglePairs});
}
fs.writeFileSync(out,JSON.stringify({rows,activeIssues,newIssues}));console.log(JSON.stringify({summaries:rows.map(r=>({kind:r.kind,...r.summary})),activeIssues:activeIssues.length,firstActiveIssues:activeIssues.slice(0,3),newIssues:newIssues.length}));
