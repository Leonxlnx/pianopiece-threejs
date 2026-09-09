import fs from 'node:fs';import {baseline,install} from './harness.mjs';import {sample,summarize,times} from './metric.mjs';
const ownership=JSON.parse(fs.readFileSync('reservation.json')),candidate=structuredClone(baseline),knots=candidate.wristMotion.hands.find(h=>h.side==='R').knots;
for(const i of ownership.knotIndices){knots[i].position[1]+=.0276;knots[i].position[2]-=.0068;}
const reports={};for(const [label,score]of [['baseline',baseline],['seed',candidate]]){install(score);const held=ownership.notes.flatMap(n=>[.001,.02,.25,.5,.75,.98,.999].map(u=>n.time+n.duration*u)),grid=times(score,ownership.incomingStart,ownership.departureArrival,30),rows=[...new Set([...held,...grid])].sort((a,b)=>a-b).map(t=>sample(t));reports[label]={summary:summarize(rows),rows};console.log(label,JSON.stringify(reports[label].summary));}
fs.writeFileSync('seed-score.json',JSON.stringify(candidate));fs.writeFileSync('seed-report.json',JSON.stringify(reports,null,2));
