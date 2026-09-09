import fs from 'node:fs';import assert from 'node:assert/strict';
const [input,output,deltaFile='second-held-delta.json']=process.argv.slice(2);if(!input||!output)throw Error('Usage: node apply-delta.mjs INPUT OUTPUT [DELTA]');const score=JSON.parse(fs.readFileSync(input)),delta=JSON.parse(fs.readFileSync(deltaFile)),byid=new Map(score.notes.map(n=>[n.id,n]));
for(const [id,guard]of Object.entries(delta.noteGuards??{})){const n=byid.get(id);assert(n,'Missing note '+id);for(const [k,v]of Object.entries(guard))assert.deepEqual(n[k],v,'Note guard '+id+'.'+k);}
for(const c of delta.notes){const n=byid.get(c.id);assert(n,'Missing note '+c.id);assert.deepEqual(n[c.field]??null,c.before,'Field changed since baseline: '+c.id+'.'+c.field);if(c.after===null)delete n[c.field];else n[c.field]=c.after;}
for(const c of delta.knots){const knots=score.wristMotion.hands.find(h=>h.side===c.side).knots;assert.deepEqual(knots[c.index],c.before,'Knot changed since baseline: '+c.side+c.index);knots[c.index]=c.after;}
fs.writeFileSync(output,JSON.stringify(score,null,2)+'\n');console.log('APPLIED '+delta.status+' — requires full idle/motion validation before integration.');
