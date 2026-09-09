import fs from'node:fs';import{install,measure}from'./harness-pad.mjs';
const base=JSON.parse(fs.readFileSync('candidate-v3.json')),rows=[];
for(const finger of[3,4,5])for(const z of[.224,.232,.24,.248,.256,.264,.273])for(const lift of[.001,.003,.005]){
 const s=structuredClone(base),n=s.notes.find(n=>n.id==='p00505');Object.assign(n,{finger,contactZ:z,contactLift:lift,thumbOpposition:0});install(s);let pairs=0,core=0,ik=0,pad=-1e9;for(let i=0;i<=12;i++){let r=measure(n.time+(n.duration-.000001)*i/12,'R'),p=r.padContacts.find(p=>p.id===n.id),patch='R'+['Thumb','Index','Middle','Ring','Pinky'][finger-1];pairs+=r.crossings.filter(c=>c.a===patch||c.b===patch).reduce((v,c)=>v+c.trianglePairs,0);core=Math.max(core,...r.keyHits.filter(h=>h.active||h.patch==='RPalm').map(h=>h.depth));ik=Math.max(ik,...r.contacts.map(c=>c.error*1000));pad=Math.max(pad,p?.gap??100);}
 const cost=pairs+1000*Math.max(0,ik-.3)+100*Math.max(0,core-3)+100*Math.max(0,pad-3);rows.push({finger,z,lift,pairs,core,ik,pad,cost});
}
rows.sort((a,b)=>a.cost-b.cost);fs.writeFileSync('next-probes.json',JSON.stringify(rows,null,2));console.log(rows.slice(0,12));
