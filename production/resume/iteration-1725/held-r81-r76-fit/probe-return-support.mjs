import fs from'node:fs';import{T,install,measure}from'./harness-pad.mjs';
const base=JSON.parse(fs.readFileSync('candidate-v2.json')),rows=[];
for(const px of[.65,.8,1])for(const yz of[.35,.5,.65,.8])for(const qm of[.35,.65,1]){
 const s=structuredClone(base),k=s.wristMotion.hands.find(h=>h.side==='R').knots,n=s.notes.find(n=>n.id==='p00503');n.contactLift=.003;
 k[219].position=k[218].position.map((v,i)=>v+(k[219].position[i]-v)*(i===0?px:yz));k[219].quaternion=new T.Quaternion(...k[218].quaternion).slerp(new T.Quaternion(...k[219].quaternion),qm).toArray();
 install(s);let pairs=0,core=0,ik=0,pad=-1e9;for(const id of['p00503','p00505']){const n=s.notes.find(n=>n.id===id),patch='R'+['Thumb','Index','Middle','Ring','Pinky'][n.finger-1];for(let i=0;i<=12;i++){let r=measure(n.time+(n.duration-.000001)*i/12,'R'),p=r.padContacts.find(p=>p.id===n.id);pairs+=r.crossings.filter(c=>c.a===patch||c.b===patch).reduce((v,c)=>v+c.trianglePairs,0);core=Math.max(core,...r.keyHits.filter(h=>h.active||h.patch==='RPalm').map(h=>h.depth));ik=Math.max(ik,...r.contacts.map(c=>c.error*1000));pad=Math.max(pad,p?.gap??100);}}
 const cost=pairs+1000*Math.max(0,ik-.3)+100*Math.max(0,core-3)+100*Math.max(0,pad-3);rows.push({px,yz,qm,position:k[219].position,quaternion:k[219].quaternion,pairs,core,ik,pad,cost});
}
rows.sort((a,b)=>a.cost-b.cost);fs.writeFileSync('return-support-probes.json',JSON.stringify(rows,null,2));console.log(rows.slice(0,8));
