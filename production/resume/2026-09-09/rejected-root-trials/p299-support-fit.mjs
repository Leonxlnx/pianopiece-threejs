import fs from 'node:fs';
import {baseline,install,performer,T} from './harness.mjs';
import {evaluate,loss} from './metrics.mjs';
const original=performer.plannedPose.bind(performer);let shift=new T.Vector3();
performer.plannedPose=(hand,time)=>{const p=original(hand,time);if(hand.side==='R'&&time>=66.2&&time<=66.7)p.position.add(shift);return p;};
const rows=[];for(const finger of [2,4,5])for(const x of [-.035,-.02,0,.02])for(const y of [0,.012,.024])for(const z of [.252,.27]){
 const score=structuredClone(baseline);Object.assign(score.notes.find(n=>n.id==='p00299'),{finger,contactZ:z,contactLift:.003});install(score);shift.set(x,y,0);
 const metrics=[66.34,66.47,66.61].map(t=>evaluate(t,'R'));rows.push({finger,x,y,z,...loss(metrics),maxAllCore:Math.max(...metrics.map(r=>r.allCore)),maxPairs:Math.max(...metrics.map(r=>r.allPairs)),metrics});
}
rows.sort((a,b)=>a.loss-b.loss);fs.writeFileSync('p299-support-fits.json',JSON.stringify(rows));console.log(JSON.stringify(rows.slice(0,6).map(({metrics,...r})=>r)));
