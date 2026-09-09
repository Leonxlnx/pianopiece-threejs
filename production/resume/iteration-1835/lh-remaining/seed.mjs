import fs from'node:fs';import{baseline}from'./harness.mjs';const s=structuredClone(baseline),ks=s.wristMotion.hands.find(h=>h.side==='L').knots;
for(const[id,f,z,l]of[['p00063',5,.269,.003],['p01015',5,.269,.003],['p00094',3,.249,.003],['p00805',5,.269,.003],['p00810',4,.245,.003],['p00468',3,.249,.003],['p00470',4,.239,.003],['p00834',3,.249,.003],['p00835',4,.239,.003],['p00609',3,.239,.003]])Object.assign(s.notes.find(n=>n.id===id),{finger:f,contactZ:z,contactLift:l,thumbOpposition:0});
for(const i of[345,507])ks[i].position[1]+=.018;
ks[289].position[1]+=.0179;ks[289].position[2]-=.0015;
for(const i of[431,432,433,434,435,436])ks[i].position[1]+=.020;
for(const i of[449,450,451])ks[i].position[1]+=.024;
for(const id of['p00571'])Object.assign(s.notes.find(n=>n.id===id),{contactLift:.011,contactZ:.269,thumbOpposition:0});
fs.writeFileSync('candidate-seed.json',JSON.stringify(s,null,2)+'\n');
