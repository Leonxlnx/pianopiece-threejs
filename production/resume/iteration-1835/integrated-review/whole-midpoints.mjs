import fs from 'node:fs';import {score,performer,body,T} from './harness.mjs';import{evaluate}from'./metrics.mjs';
const out=process.argv[2]??'midpoints.json',rows=[];
for(const [i,n] of score.notes.entries()){
 const r=evaluate(n.time+n.duration*.5,n.hand);rows.push({id:n.id,...r,chains:undefined});if(i%200===0)console.log(i,score.notes.length);
}
const bad=r=>r.activeCore>3||r.palmCore>3||r.ownPairs||r.activePairs||r.point>.2||r.contacts.some(c=>c.gap===null||Math.abs(c.gap)>3);
const report={score:process.env.DAYBREAK_SCORE,rig:process.env.DAYBREAK_RIG_MODULE,samples:rows.length,activeBad:rows.filter(bad).length,coreBad:rows.filter(r=>r.activeCore>3).length,palmBad:rows.filter(r=>r.palmCore>3).length,ownBad:rows.filter(r=>r.ownPairs).length,activePairBad:rows.filter(r=>r.activePairs).length,padBad:rows.filter(r=>r.contacts.some(c=>c.gap===null||Math.abs(c.gap)>3)).length,allCoreBad:rows.filter(r=>r.allCore>3).length,rows};
fs.writeFileSync(out,JSON.stringify(report));console.log(JSON.stringify({...report,rows:undefined}));
