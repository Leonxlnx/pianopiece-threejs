import fs from 'node:fs';
import {baseline,install,measure,isBlack} from './harness.mjs';
const ids=['p00862'];
const s=structuredClone(baseline);install(s);const results=[];
for(const id of ids){const n=s.notes.find(n=>n.id===id),original=structuredClone(n);let best=null,tried=0;
 const times=[.02,.5,.98].map(u=>n.time+n.duration*u);
 const evalP=p=>{Object.assign(n,{contactZ:p[0],contactLift:p[1],thumbOpposition:p[2]});install(s);let key=0,own=0,neighbor=0,contact=0,gap=-Infinity;
  for(const time of times){const r=measure(time,n.hand,{targetFinger:1});key=Math.max(key,...r.keyHits.filter(v=>v.patch===n.hand+'Thumb'||v.patch===n.hand+'Palm').map(v=>v.depth));
   own=Math.max(own,r.crossings.filter(c=>c.a===n.hand+'Palm'||c.b===n.hand+'Palm').reduce((a,b)=>a+b.trianglePairs,0));neighbor=Math.max(neighbor,r.crossings.filter(c=>c.a!==n.hand+'Palm'&&c.b!==n.hand+'Palm').reduce((a,b)=>a+b.trianglePairs,0));
   contact=Math.max(contact,...r.contacts.filter(c=>c.finger===1).map(c=>c.error*1000));gap=Math.max(gap,r.meshContacts.find(c=>c.id===id)?.minGap??100);
  }
  const loss=Math.max(0,key-2.3)*50+own*.7+neighbor*.7+Math.max(0,contact-.1)*150+Math.max(0,gap-2)*50+Math.max(0,-gap-2.5)*60+Math.abs(p[2])*.15;
  const result={p:[...p],loss,key,own,neighbor,contact,gap};tried++;
  if(!best||result.loss<best.loss){best=result;fs.writeFileSync(id+'-best.json',JSON.stringify({id,original,tried,best},null,2));}
  return result;
 };
 const z=isBlack(n.midi)?[.174,.188,.202,.210]:[.225,.24,.255,.27];
 for(const depth of z)for(const lift of [.001,.003,.005,.007])for(const opposition of [-.6,-.3,0,.3,.6])evalP([depth,lift,opposition]);
 for(const step of [.01,.005,.0025,.001])for(let pass=0;pass<2;pass++){const base=[...best.p];for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const p=[...base];p[axis]+=sign*(axis===0?step:axis===1?step*.25:step*12);if(p[0]<.165||p[0]>.279||p[1]<.0005||p[1]>.01||Math.abs(p[2])>.85)continue;evalP(p);}}
 Object.assign(n,{contactZ:best.p[0],contactLift:best.p[1],thumbOpposition:best.p[2]});install(s);results.push({id,original,tried,best});console.log(JSON.stringify(results.at(-1)));fs.writeFileSync('candidate-862.json',JSON.stringify(s));fs.writeFileSync('fit-862-report.json',JSON.stringify(results,null,2));
}
