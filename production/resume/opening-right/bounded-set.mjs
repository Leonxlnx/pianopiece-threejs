import fs from 'node:fs';import {baseline,install} from './harness.mjs';import {sample,summarize,times} from './metric.mjs';
const own=JSON.parse(fs.readFileSync('reservation.json')),ids=own.noteIds,lifts={1:.009773,2:.003008,3:.003271,4:.002391,5:.002435},maps=[[4,1,3,1,1,2],[4,3,2,1,3,4],[5,4,3,2,4,5],[5,3,2,1,3,4],[4,2,1,1,2,3]],supports=[[.005,.0276,-.0068],[.012,.0276,-.012],[.012,.035,-.012],[.015,.042,-.020]],rows=[];let best=null;
for(let mi=0;mi<maps.length;mi++)for(let si=0;si<supports.length;si++){
 const s=structuredClone(baseline),p=supports[si],knots=s.wristMotion.hands.find(h=>h.side==='R').knots;
 for(const i of own.knotIndices)for(let a=0;a<3;a++)knots[i].position[a]+=p[a];
 for(let i=0;i<ids.length;i++){const n=s.notes.find(n=>n.id===ids[i]),finger=maps[mi][i];if(n.finger!==finger){n.finger=finger;n.contactLift=lifts[finger];}delete n.thumbOpposition;}
 install(s);const held=own.notes.flatMap(n=>[.02,.5,.98].map(u=>n.time+n.duration*u)),grid=times(s,own.incomingStart,own.departureArrival,12),samples=[...new Set([...held,...grid])].sort((a,b)=>a-b).map(t=>sample(t)),q=summarize(samples),loss=q.keyCore*10+q.crossingPairs*.7+Math.max(0,-2.5-q.minimumPadGap)*100+Math.max(0,q.maximumPadGap-2.5)*100+q.missingPad*1000+Math.max(0,q.pointContactMm-.25)*150;
 const row={mapping:maps[mi],support:p,summary:q,loss,perNote:ids.map(id=>({id,summary:summarize(samples.filter(r=>r.active.some(a=>a.id===id)))}))};rows.push(row);console.log(JSON.stringify(row));
 if(!best||loss<best.loss){best=row;fs.writeFileSync('bounded-best-score.json',JSON.stringify(s));fs.writeFileSync('bounded-best-samples.json',JSON.stringify(samples,null,2));}
}
fs.writeFileSync('bounded-set-report.json',JSON.stringify({rows,best},null,2));console.log('best',JSON.stringify(best));
