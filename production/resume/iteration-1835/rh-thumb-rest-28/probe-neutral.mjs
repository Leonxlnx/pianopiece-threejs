import fs from'node:fs';import{install,baseline,measure}from'./harness-pad.mjs';install(baseline);const rows=[];for(const x of[.45,.55,.65])for(const y of[.45,.60,.70])for(const z of[.05,.15,.25]){
 globalThis.__thumbRestCandidate={target:[x,y,z],fade:.5,delay:.08,opposition:0};let pairs=0,core=0,own=0,opp=0,thumb=[];for(const t of[28.7,29.5,30.5,31.5,32.522588,33.4]){const r=measure(t,'R',{opposing:true});const hits=r.crossings.filter(c=>c.a==='RThumb'||c.b==='RThumb');pairs+=hits.filter(c=>c.a[0]===c.b[0]).reduce((n,c)=>n+c.trianglePairs,0);opp+=hits.filter(c=>c.a[0]!==c.b[0]).reduce((n,c)=>n+c.trianglePairs,0);core=Math.max(core,...r.keyHits.filter(h=>h.patch==='RThumb').map(h=>h.depth));if(t===32.522588)thumb=r.chains[0].points;}
 rows.push({target:[x,y,z],pairs,opp,core,thumb,cost:pairs+opp+100*Math.max(0,core-3)});
}
rows.sort((a,b)=>a.cost-b.cost);fs.writeFileSync('neutral-probes.json',JSON.stringify(rows,null,2));console.log(rows.slice(0,9));
