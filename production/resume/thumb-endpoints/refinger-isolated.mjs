import fs from 'node:fs';import {baseline,install,measure} from './harness.mjs';
const s=structuredClone(baseline),notes=s.notes.filter(n=>['p00193','p00194'].includes(n.id)),times=notes.flatMap(n=>[.04,.5,.96].map(u=>n.time+n.duration*u));
const results=[];
for(const finger of [2,3,4,5]){let best;const evalP=p=>{for(const n of notes)Object.assign(n,{finger,contactZ:p[0],contactLift:p[1],thumbOpposition:0});install(s);let core=0,pairs=0,error=0,gap=0;
 for(const time of times){const r=measure(time,'R',{targetFinger:finger});core=Math.max(core,...r.keyHits.filter(h=>h.active||h.patch==='RPalm').map(h=>h.depth));pairs=Math.max(pairs,r.crossings.reduce((s,c)=>s+c.trianglePairs,0));error=Math.max(error,...r.contacts.map(c=>c.error*1000));gap=Math.max(gap,...r.meshContacts.map(c=>Math.max(c.minGap??100,-(c.minGap??0))));}
 const loss=Math.max(0,core-2.5)*50+pairs*.6+Math.max(0,error-.1)*150+Math.max(0,gap-2.5)*50;
 if(!best||loss<best.loss)best={finger,p:[...p],loss,core,pairs,error,gap};
 };
 for(const z of [.205,.22,.235,.25,.265])for(const y of [.001,.003,.005,.007])evalP([z,y]);
 for(const step of [.005,.0025,.001]){const p=[...best.p];for(const axis of [0,1])for(const sign of [-1,1]){const next=[...p];next[axis]+=sign*step*(axis===1?.3:1);evalP(next);}}
 for(const n of notes)Object.assign(n,{finger,contactZ:best.p[0],contactLift:best.p[1],thumbOpposition:0});install(s);results.push(best);fs.writeFileSync('refinger-isolated-'+finger+'.json',JSON.stringify(s));console.log(JSON.stringify(best));
}fs.writeFileSync('refinger-isolated-report.json',JSON.stringify(results,null,2));
