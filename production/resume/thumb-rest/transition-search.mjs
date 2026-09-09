import {T,fs,score,performer,piano,body,vertices,pose,modelUpdate,collisions} from './runtime.mjs';
const times=[...new Set(JSON.parse(fs.readFileSync('compact-new-failures.json')).rows.map(r=>r.time))];
const keys=[...piano.keys.values()].map(k=>{k.mesh.geometry.computeBoundingBox();return{k,b:k.mesh.geometry.boundingBox.clone()};});
const results=[];
for(const flex of [0,-.15,-.30,-.45])for(const spread of [-.20,0,.20]){
 let own=0,neighbor=0,core=0,totalOwn=0,totalNeighbor=0,maxCore=0;const rows=[];
 for(const time of times){pose(time);piano.group.updateMatrixWorld(true);for(const k of keys)k.inv=k.k.mesh.matrixWorld.clone().invert();
  for(const h of performer.hands){if(h.fingerNotes[0].some(n=>time>=n.time&&time<n.time+n.duration))continue;
   const prev=h.fingerNotes[0].filter(n=>n.time+n.duration<=time).at(-1),next=h.fingerNotes[0].find(n=>n.time>=time),end=prev?prev.time+prev.duration:-10,start=next?.time??1e6,gap=start-end;
   const wave=u=>Math.sin(Math.max(0,Math.min(1,u))*Math.PI)**2;
   const weight=prev&&next&&gap<.50?wave((time-end)/gap):Math.max(prev?wave((time-end)/.22):0,next?wave((start-time)/.30):0);
   h.fingers[0].bones[0].quaternion.premultiply(new T.Quaternion().setFromEuler(new T.Euler(flex*weight,0,(h.side==='L'?1:-1)*spread*weight,'XYZ')));
  }modelUpdate();
  for(const [hi,h] of performer.hands.entries()){if(h.fingerNotes[0].some(n=>time>=n.time&&time<n.time+n.duration))continue;let depth=0;
   for(const id of vertices[hi*6]){const v=body.getVertexPosition(id,new T.Vector3()).applyMatrix4(body.matrixWorld);for(const {k,b,inv} of keys){if(Math.abs(v.x-k.x)>.017)continue;const p=v.clone().applyMatrix4(inv),e=.001;if(p.x>b.min.x+e&&p.x<b.max.x-e&&p.y>b.min.y+e&&p.y<b.max.y-e&&p.z>b.min.z+e&&p.z<b.max.z-e)depth=Math.max(depth,Math.min(p.x-b.min.x,b.max.x-p.x,p.y-b.min.y,b.max.y-p.y,p.z-b.min.z,b.max.z-p.z)*1000);}}
   const o=collisions(hi*6,hi*6+5).count,n=[1,2,3,4].reduce((s,f)=>s+collisions(hi*6,hi*6+f).count,0);own+=o>0;neighbor+=n>0;core+=depth>3;totalOwn+=o;totalNeighbor+=n;maxCore=Math.max(maxCore,depth);rows.push({time,side:h.side,own:o,neighbor:n,core:depth});
  }
 }
 const r={flex,spread,own,neighbor,core,totalOwn,totalNeighbor,maxCore,rows};results.push(r);console.log(JSON.stringify({...r,rows:undefined}));
}
fs.writeFileSync('transition-search.json',JSON.stringify(results,null,2));
