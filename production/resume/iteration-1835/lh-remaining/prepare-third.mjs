import fs from'node:fs';import{baseline}from'./harness.mjs';const s=JSON.parse(fs.readFileSync('candidate-pass2.json')),ks=s.wristMotion.hands.find(h=>h.side==='L').knots,n=id=>s.notes.find(n=>n.id===id);
ks[436].position=[...ks[433].position];ks[436].quaternion=[...ks[433].quaternion];ks[436].moveStart=n('p00885').time+n('p00885').duration;Object.assign(n('p00887'),{contactZ:n('p00881').contactZ,contactLift:n('p00881').contactLift});n('p00925').contactZ=.239;
fs.writeFileSync('candidate-third-seed.json',JSON.stringify(s,null,2)+'\n');
