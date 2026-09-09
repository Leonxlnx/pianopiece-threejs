import fs from 'node:fs';
import {baseline,install,isBlack} from './harness.mjs';
import {sample,summarize,heldTimes} from './metric.mjs';
const queue=JSON.parse(fs.readFileSync('bad-note-queue.json')).filter(r=>!r.reserved),s=structuredClone(baseline),results=[];install(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function set(n,p){if(p[0]===null)delete n.contactZ;else n.contactZ=+p[0].toFixed(7);n.contactLift=+p[1].toFixed(8);if(Math.abs(p[2])<1e-8)delete n.thumbOpposition;else n.thumbOpposition=+p[2].toFixed(7);}
function cost(q){return Math.max(0,q.keyCore-2.8)*80+Math.max(0,-2.3-q.minimumPadGap)*80+Math.max(0,q.maximumPadGap-2.3)*80+q.missingPad*300+q.ownPairs*1.5+q.neighborPairs*1.5+Math.max(0,q.pointContactMm-.2)*100;}
for(const task of queue){
 const n=s.notes.find(n=>n.id===task.id),original=structuredClone(n),seen=new Map(),times=[.001,.02,.25,.5,.75,.98,.999].map(u=>n.time+n.duration*u);let best=null,accepted=null,tried=0,denseChecks=0;
 const test=p=>{if(accepted)return best;const key=JSON.stringify(p);if(seen.has(key))return seen.get(key);set(n,p);const samples=times.map(t=>sample(n,t)),q=summarize(samples),loss=cost(q),result={p:[...p],loss,summary:q};seen.set(key,result);tried++;if(!best||loss<best.loss-1e-7||(Math.abs(loss-best.loss)<1e-7&&Math.abs(p[2])<Math.abs(best.p[2])))best=result;
  if(loss<1e-7&&denseChecks<12){const dense=heldTimes(n,true).map(t=>sample(n,t)),check=summarize(dense);denseChecks++;if(!check.bad&&check.pointContactMm<=.2){accepted={...result,summary:check,samples:dense};}else{result.loss=cost(check);result.summary=check;const bad=dense.filter(r=>r.keyCore>2.8||r.padGap===null||r.padGap< -2.3||r.padGap>2.3||r.ownPairs||r.neighborPairs).sort((a,b)=>Math.max(b.keyCore,-(b.padGap??-100),b.ownPairs,b.neighborPairs)-Math.max(a.keyCore,-(a.padGap??-100),a.ownPairs,a.neighborPairs));for(const r of bad.slice(0,3))if(!times.some(t=>Math.abs(t-r.time)<.00001))times.push(r.time);best=[...seen.values()].sort((a,b)=>a.loss-b.loss)[0];}}
  return result;
 };
 const initial=[n.contactZ??null,n.contactLift??.002,n.thumbOpposition??0];test(initial);
 const liftNeeded=clamp(initial[1]+Math.max(0,-2.05-task.summary.minimumPadGap)/1000,.0005,.016);
 for(const lift of [liftNeeded,liftNeeded+.0005,liftNeeded+.001,initial[1]+.002,initial[1]+.004]){test([initial[0],clamp(lift,.0005,.016),initial[2]]);if(accepted)break;}
 if(!accepted)for(const opp of [-.15,.15,-.3,.3,-.5,.5,-.7,.7]){for(const lift of [initial[1],liftNeeded,.007,.0125]){test([initial[0],lift,opp]);if(accepted)break;}if(accepted)break;}
 if(!accepted){const depths=isBlack(n.midi)?[.17,.184,.198,.211]:[.225,.24,.255,.27];outer:for(const z of depths)for(const lift of [.006,.009,.012,.015])for(const opp of [0,-.3,.3,-.6,.6]){test([z,lift,opp]);if(accepted)break outer;}}
 if(!accepted)for(const scale of [1,.5,.25]){const origin=[...best.p];for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){if(axis===0&&origin[0]===null)continue;const p=[...origin];p[axis]+=sign*[.008,.0015,.15][axis]*scale;if(p[0]!==null)p[0]=clamp(p[0],isBlack(n.midi)?.165:.22,isBlack(n.midi)?.215:.279);p[1]=clamp(p[1],.0005,.016);p[2]=clamp(p[2],-.85,.85);test(p);if(accepted)break;}if(accepted)break;}
 if(accepted){set(n,accepted.p);results.push({id:n.id,status:'accepted',original,updated:structuredClone(n),tried,denseChecks,before:task.summary,after:accepted.summary,samples:accepted.samples});}
 else{for(const k of Object.keys(n))delete n[k];Object.assign(n,original);results.push({id:n.id,status:'exception',original,tried,denseChecks,before:task.summary,best,reason:'No solution within the declared three-parameter search and held geometry gates; whole-grip/refingering/support review required.'});}
 console.log(JSON.stringify({done:results.length,total:queue.length,id:n.id,status:results.at(-1).status,tried,best:accepted?.summary??best.summary}));fs.writeFileSync('candidate-score.json',JSON.stringify(s));fs.writeFileSync('fit-report.json',JSON.stringify(results,null,2));
}
console.log(JSON.stringify({complete:true,accepted:results.filter(r=>r.status==='accepted').length,exceptions:results.filter(r=>r.status==='exception').length}));
