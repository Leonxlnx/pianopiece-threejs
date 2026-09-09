import fs from 'fs';import crypto from 'crypto';
const input=process.argv[2],output=process.argv[3],a=JSON.parse(fs.readFileSync(process.argv[4]??'baseline-score.json')),b=JSON.parse(fs.readFileSync(input)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const out={baselineSha256:hash(process.argv[4]??'baseline-score.json'),candidateSha256:hash(input),noteChanges:[],knotChanges:[]};
for(let i=0;i<b.notes.length;i++){const x=a.notes[i],y=b.notes[i],changes={};for(const k of new Set([...Object.keys(x),...Object.keys(y)]))if(JSON.stringify(x[k])!==JSON.stringify(y[k]))changes[k]={before:x[k]??null,after:y[k]??null};if(Object.keys(changes).length)out.noteChanges.push({id:y.id,changes});}
for(let hi=0;hi<2;hi++)for(let i=0;i<b.wristMotion.hands[hi].knots.length;i++){const x=a.wristMotion.hands[hi].knots[i],y=b.wristMotion.hands[hi].knots[i];if(JSON.stringify(x)!==JSON.stringify(y))out.knotChanges.push({hand:b.wristMotion.hands[hi].side,index:i,before:x,after:y});}
fs.writeFileSync(output,JSON.stringify(out,null,2));console.log(JSON.stringify({hash:out.candidateSha256,notes:out.noteChanges.map(n=>n.id),knots:out.knotChanges.map(k=>k.hand+k.index)}));
