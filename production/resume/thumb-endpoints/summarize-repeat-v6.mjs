import fs from 'node:fs';
const a=JSON.parse(fs.readFileSync('repeat-v6-baseline-rows.json')),b=JSON.parse(fs.readFileSync('repeat-v6-candidate-rows.json'));if(a.length!==b.length)throw Error('rows');const failures=[],counts={heldSamples:0,maxHeldCore:0,maxHeldAbsPadGap:0,maxHeldContactMm:0,newCore:0,newPairs:0,newPad:0};
const ids=['p00193','p00194'];
for(let i=0;i<b.length;i++){const p=a[i],r=b[i];if(p.time!==r.time||p.side!==r.side)throw Error('time');const primary=r.active.filter(n=>ids.includes(n.id));if(primary.length){counts.heldSamples++;counts.maxHeldCore=Math.max(counts.maxHeldCore,...r.key.filter(k=>k.patch===r.side+'Thumb').map(k=>k.depth));counts.maxHeldAbsPadGap=Math.max(counts.maxHeldAbsPadGap,...r.mesh.filter(m=>ids.includes(m.id)).map(m=>Math.abs(m.minGap??100)));counts.maxHeldContactMm=Math.max(counts.maxHeldContactMm,...r.contact.filter(c=>c.finger===1).map(c=>c.error*1000));}
 for(const k of r.key){const old=p.key.find(h=>h.patch===k.patch&&h.midi===k.midi)?.depth??0;if(k.depth>3&&old<=3){counts.newCore++;failures.push({time:r.time,side:r.side,type:'newCore',patch:k.patch,midi:k.midi,depth:k.depth,old});}}
 for(const pair of r.pairs){if(!p.pairs.some(q=>q.a===pair.a&&q.b===pair.b)){counts.newPairs++;failures.push({time:r.time,side:r.side,type:'newPairs',...pair});}}
 for(const m of r.mesh){const old=p.mesh.find(n=>n.id===m.id);if(Math.abs(m.minGap??100)>3&&Math.abs(old?.minGap??100)<=3){counts.newPad++;failures.push({time:r.time,type:'newPad',...m});}}
}
fs.writeFileSync('repeat-v6-validation.json',JSON.stringify({counts,failures},null,2));console.log(JSON.stringify({counts,first:failures.slice(0,8)}));
