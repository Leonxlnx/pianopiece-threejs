import fs from 'node:fs';import {baseline,install,measure} from './harness.mjs';
const s=JSON.parse(fs.readFileSync('repeat-e5-neighbor-candidate.json'));
const ids=['p00193','p00194'],windows=[[43.20,45.75,'R']],reports=[];
for(const [label,sc] of [['baseline',baseline],['candidate',s]]){install(sc);const rows=[];for(const [lo,hi,side] of windows){const times=new Set();for(let t=lo;t<hi;t+=1/240)times.add(t);for(const n of sc.notes.filter(n=>n.hand===side&&n.time<hi&&n.time+n.duration>lo))for(const t of [n.time-.00001,n.time,n.time+.00001,n.time+n.duration-.00001,n.time+n.duration,n.time+n.duration+.00001])if(t>=lo&&t<=hi)times.add(t);
for(const t of [...times].sort((a,b)=>a-b)){const r=measure(t,side);rows.push({time:t,side,active:r.active,key:r.keyHits,contact:r.contacts,mesh:r.meshContacts,pairs:r.crossings.map(c=>({a:c.a,b:c.b,pairs:c.trianglePairs}))});}}
fs.writeFileSync('repeat-neighbor-'+label+'-rows.json',JSON.stringify(rows));reports.push({label,rows:rows.length});}
fs.writeFileSync('repeat-neighbor-candidate.json',JSON.stringify(s));console.log(JSON.stringify(reports));
