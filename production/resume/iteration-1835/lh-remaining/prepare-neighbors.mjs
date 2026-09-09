import fs from'node:fs';import{baseline,T}from'./harness.mjs';const s=JSON.parse(fs.readFileSync('candidate-pass1.json')),ks=s.wristMotion.hands.find(h=>h.side==='L').knots,bk=baseline.wristMotion.hands.find(h=>h.side==='L').knots;
function pose(i,y,z,x=0){ks[i].position=[bk[i].position[0]+x,bk[i].position[1]+y,bk[i].position[2]+z];ks[i].quaternion=[...bk[i].quaternion];}
pose(404,.0179,-.0015);ks[404].quaternion=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.05).multiply(new T.Quaternion().fromArray(bk[404].quaternion)).toArray();for(const i of[244,416])pose(i,.004,0);
Object.assign(s.notes.find(n=>n.id==='p00568'),{finger:2,contactZ:.239,contactLift:.003,thumbOpposition:0});
for(const i of[433,436])pose(i,.008,.050);pose(434,.008,.045);pose(432,.008,0);pose(449,.010,.025);pose(451,.010,.025);
fs.writeFileSync('candidate-neighbor-seed.json',JSON.stringify(s,null,2)+'\n');
