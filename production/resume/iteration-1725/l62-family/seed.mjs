import fs from 'node:fs';import {baseline} from './harness.mjs';
const s=structuredClone(baseline),k=s.wristMotion.hands.find(h=>h.side==='L').knots;
for(const i of [...Array.from({length:10},(_,j)=>350+j),...Array.from({length:10},(_,j)=>472+j)])k[i].position[1]+=.006;
Object.assign(s.notes.find(n=>n.id==='p00130'),{finger:4,contactLift:.003,contactZ:.259});Object.assign(s.notes.find(n=>n.id==='p00132'),{finger:5,contactLift:.002435,contactZ:.269});for(const i of [68,69])k[i].position[1]+=.012;
Object.assign(s.notes.find(n=>n.id==='p00455'),{contactZ:.255,contactLift:.011});
fs.writeFileSync('candidate-seed.json',JSON.stringify(s,null,2)+'\n');
