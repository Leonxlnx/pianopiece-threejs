import fs from'node:fs';import{install,measure}from'./harness-pad.mjs';
const base=JSON.parse(fs.readFileSync('candidate-v2.json')),rows=[];
for(const mix of [.35,.5,.65,1])for(const z of [.2466,.255,.265,.273])for(const lift of [.003,.008]){
 const s=structuredClone(base),k=s.wristMotion.hands.find(h=>h.side==='R').knots,n=s.notes.find(n=>n.id==='p00503');n.contactZ=z;n.contactLift=lift;
 k[219].position=k[218].position.map((v,i)=>v+(k[219].position[i]-v)*mix);const q0=k[218].quaternion,q1=k[219].quaternion;let q=q0.map((v,i)=>v+(q1[i]-v)*mix),norm=Math.hypot(...q);k[219].quaternion=q.map(v=>v/norm);
 install(s);let pairs=0,core=0,ik=0,pad=-1e9;for(let i=0;i<=16;i++){let r=measure(n.time+(n.duration-.000001)*i/16,'R'),p=r.padContacts.find(p=>p.id===n.id);pairs+=r.crossings.filter(c=>c.a==='RIndex'||c.b==='RIndex').reduce((v,c)=>v+c.trianglePairs,0);core=Math.max(core,...r.keyHits.filter(h=>h.active||h.patch==='RPalm').map(h=>h.depth));ik=Math.max(ik,...r.contacts.map(c=>c.error*1000));pad=Math.max(pad,p?.gap??100);}
 const cost=pairs+1000*Math.max(0,ik-.3)+100*Math.max(0,core-3)+100*Math.max(0,pad-3);rows.push({mix,z,lift,pairs,core,ik,pad,cost});
}
rows.sort((a,b)=>a.cost-b.cost);fs.writeFileSync('return-probes.json',JSON.stringify(rows,null,2));console.log(rows.slice(0,12));
