import fs from 'node:fs';
const read=n=>JSON.parse(fs.readFileSync(new URL('./sources/'+n,import.meta.url)));
export const score=read('score-v11.json'),data=read('idle-nonthumb-data.json'),fps=60,epsilon=1e-6;
export const records=[...data.supportedIndexGaps.map((c,i)=>({...c,id:`index-${String(i+1).padStart(3,'0')}`,kind:'index'})),...data.curves.map((c,i)=>({...c,id:`curve-${String(i+1).padStart(3,'0')}`,kind:'curve'}))].map(c=>({...c,begin:c.knots?.[0][0]??c.previousEnd,end:c.knots?.at(-1)[0]??c.nextTime}));
const times=new Map();
for(const c of records){
 const add=(t,kind,outside=false)=>{if(t<0||(!outside&&(t<c.begin||t>c.end)))return;const key=t.toString();const r=times.get(key)??{time:t,sides:new Set(),records:new Set(),kinds:new Set()};r.sides.add(c.hi?'R':'L');r.records.add(c.id);r.kinds.add(kind);times.set(key,r);};
 for(let frame=Math.ceil(c.begin*fps);frame<=Math.floor(c.end*fps);frame++)add(frame/fps,'60Hz');
 for(const t of [c.begin,c.end,...(c.knots??[]).map(k=>k[0])])for(const delta of [-epsilon,0,epsilon])add(t+delta,delta===0?'exactCurveOrSupportBoundary':'curveOrSupportBoundaryProbe',true);
 // Moving keys can be driven by either hand, so retain both hands' note boundaries.
 for(const n of score.notes)for(const t of [n.time,n.time+n.duration])for(const delta of [-epsilon,0,epsilon])add(t+delta,delta===0?'exactNoteBoundary':'noteBoundaryProbe');
}
export const schedule=[...times.values()].sort((a,b)=>a.time-b.time).map((r,index)=>({index,time:r.time,sides:[...r.sides].sort(),records:[...r.records].sort(),kinds:[...r.kinds].sort()}));
export const coverage={fps,epsilon,records:records.length,indexRecords:data.supportedIndexGaps.length,curveRecords:data.curves.length,noteCount:score.notes.length,samples:schedule.length,handStates:schedule.reduce((n,r)=>n+r.sides.length,0),patchStates:schedule.reduce((n,r)=>n+6*r.sides.length,0),firstTime:schedule[0].time,lastTime:schedule.at(-1).time,kinds:Object.fromEntries([...new Set(schedule.flatMap(r=>r.kinds))].sort().map(k=>[k,schedule.filter(r=>r.kinds.includes(k)).length])),perRecord:records.map(c=>({id:c.id,hi:c.hi,fi:c.fi,previous:c.previous,next:c.next,begin:c.begin,end:c.end,samples:schedule.filter(r=>r.records.includes(c.id)).length}))};
if(process.argv[1]===new URL(import.meta.url).pathname){fs.writeFileSync(new URL('./schedule.json',import.meta.url),JSON.stringify({coverage,records,schedule})+'\n');console.log(JSON.stringify(coverage));}
