import fs from 'node:fs';
import {baseline,install,performer,update} from './harness.mjs';
import {evaluate} from './metrics.mjs';
const times=[106.55,106.82,106.89577,106.9083,106.923275,106.96,107.05,107.15,107.24138,107.255,107.2697,107.42,107.58,107.7];
const variants={baseline:{},refinger524:{p00524:{finger:3,contactZ:.250,contactLift:.002}},thumb519:{p00519:{finger:1,contactZ:.267,contactLift:.009}},ring524:{p00524:{finger:4,contactZ:.25,contactLift:.003}}};
const rows={};for(const [name,delta]of Object.entries(variants)){const s=structuredClone(baseline);for(const [id,d]of Object.entries(delta))Object.assign(s.notes.find(n=>n.id===id),d);install(s);rows[name]=times.map(t=>{const r=evaluate(t,'R');return {t,active:r.active,core:r.activeCore,allCore:r.allCore,palm:r.palmCore,point:r.point,gaps:r.contacts.map(c=>[c.id,c.gap]),cross:r.crossings};});}
fs.writeFileSync('probe.json',JSON.stringify(rows));console.log(JSON.stringify(rows,null,2));
