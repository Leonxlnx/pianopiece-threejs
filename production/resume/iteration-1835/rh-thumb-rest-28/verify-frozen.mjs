import fs from 'node:fs';import crypto from 'node:crypto';import {baseline,install,update,measure,performer,body} from './harness.mjs';
const label=process.env.LABEL;globalThis.__thumbRestCandidate=label==='probe'?JSON.parse(fs.readFileSync('v4-surface-report.json')).cfg:null;install(baseline);
const ends=[27.794411,27.894411,28.294411,33.726094,34.126094,34.166094];
const boundaryTimes=[...new Set(ends.flatMap(t=>[t-1e-6,t,t+1e-6]))];
const times=[...new Set([...Array.from({length:7152},(_,i)=>Math.min(34.6,27.45+i/1000)),...baseline.notes.flatMap(n=>[n.time,n.time+n.duration*.5,n.time+n.duration]),...boundaryTimes])].sort((a,b)=>a-b);
const hash=a=>crypto.createHash('sha256').update(JSON.stringify(a)).digest('hex');const thumbBones=new Set(performer.hands[1].fingers[0].bones);const rows=[];
for(const t of times){update(t);const state=body.skeleton.bones.map(b=>[...b.position.toArray(),...b.quaternion.toArray(),...b.scale.toArray()]);const other=body.skeleton.bones.filter(b=>!thumbBones.has(b)).map(b=>[...b.position.toArray(),...b.quaternion.toArray(),...b.scale.toArray()]);rows.push({time:t,all:hash(state),other:hash(other)});}
const boundaries=boundaryTimes.map(t=>measure(t,'R',{opposing:true}));
fs.writeFileSync(`frozen-${label}.json`,JSON.stringify({label,rows,boundaries}));console.log(label,times.length,'states',boundaries.length,'boundaries');
