import assert from 'node:assert/strict';
const close=(a,b,label)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-9,`${label}: ${a} differs from ${b}`);
function noteById(score,id){const notes=score.notes.filter(n=>n.id===id);assert.equal(notes.length,1,`Expected exactly one immutable note ${id}`);const n=notes[0];assert.ok(Number.isFinite(n.time)&&Number.isFinite(n.duration)&&n.duration>0);return n;}
export function expectedReleaseWindows(score,ids){
 assert.equal(new Set(ids).size,ids.length);
 const selected=score.notes.filter(n=>ids.includes(n.id));assert.equal(selected.length,ids.length,'Missing immutable release note');
 return selected.map(n=>{
  noteById(score,n.id);const start=n.time+n.duration,duration=n.releaseTravel?.duration??.160;
  const same=score.notes.filter(x=>x.hand===n.hand&&x.finger===n.finger),i=same.findIndex(x=>x.id===n.id),next=same[i+1],gap=next?next.time-start:Infinity;
  assert.ok(n.finger>1&&gap>=.5&&duration>0&&duration<=gap-Math.min(next?.approachPose?.duration??.100,gap*.5),'Route is not an eligible finite long release');
  return{id:n.id,hand:n.hand,finger:n.finger,start,end:start+duration};
 });
}
export function expectedShortGapWindows(score,pairs){
 return pairs.map(([releaseId,approachId])=>{const a=noteById(score,releaseId),b=noteById(score,approachId),same=score.notes.filter(n=>n.hand===a.hand&&n.finger===a.finger),i=same.findIndex(n=>n.id===releaseId);assert.equal(same[i+1]?.id,approachId,'The next same-finger note differs');assert.equal(a.hand,b.hand);assert.equal(a.finger,b.finger);const start=a.time+a.duration,end=b.time;assert.ok(end>start);return{id:releaseId+'-'+approachId,releaseId,approachId,hand:a.hand,finger:a.finger,start,end};});
}
export function expectedTimes(windows){
 const times=[];for(const w of windows){const a=w.start-.025,b=w.end+.025;for(let i=0;i<=Math.ceil((b-a)*240);i++)times.push(Math.min(a+i/240,b));times.push(w.start,w.end,w.start-.00001,w.end+.00001);}
 return [...new Set(times)].sort((a,b)=>a-b);
}
export function assertCoverage(expected,actual,times){
 assert.equal(actual.length,expected.length,'Missing or extra windows');
 for(let i=0;i<expected.length;i++){const a=actual[i],e=expected[i];for(const key of Object.keys(e)){if(typeof e[key]==='number')close(a[key],e[key],`${e.id}.${key}`);else assert.equal(a[key],e[key],`${e.id}.${key}`);}}
 const generated=expectedTimes(expected);assert.equal(times.length,generated.length,'Missing or extra dense or guard samples');
 for(let i=0;i<times.length;i++){close(times[i],generated[i],`sample ${i}`);if(i)assert.ok(times[i]>times[i-1],'Duplicate or unordered sample');}
 return {windows:expected.length,times:times.length,fps:240,guardSeconds:.025,maxTimestampErrorSeconds:Math.max(...times.map((t,i)=>Math.abs(t-generated[i])))};
}
