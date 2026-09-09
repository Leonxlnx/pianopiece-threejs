import {T,fs,score,performer,piano,body,vertices,pose,collisions} from './runtime.mjs';
const out=process.argv[2],rows=[];let ownSamples=0,neighborSamples=0,coreSamples=0,maxCore=0;
const times=process.env.DAYBREAK_TIMES?JSON.parse(fs.readFileSync(process.env.DAYBREAK_TIMES)):[...new Set([0,score.duration,...score.notes.map(n=>n.time+n.duration*.5)])].sort((a,b)=>a-b);
const keyData=[...piano.keys.values()].map(k=>{k.mesh.geometry.computeBoundingBox();return{k,box:k.mesh.geometry.boundingBox.clone()};});
for(const [ti,time] of times.entries()){pose(time);piano.group.updateMatrixWorld(true);for(const d of keyData)d.inv=d.k.mesh.matrixWorld.clone().invert();
 for(const [hi,h] of performer.hands.entries()){
 if(h.fingerNotes[0].some(n=>time>=n.time&&time<n.time+n.duration))continue;
 let max=0,count=0;const own=collisions(hi*6,hi*6+5).count,neighbors=[1,2,3,4].map(i=>collisions(hi*6,hi*6+i).count);
 for(const id of vertices[hi*6]){const v=body.getVertexPosition(id,new T.Vector3()).applyMatrix4(body.matrixWorld);for(const d of keyData){if(Math.abs(v.x-d.k.x)>.017)continue;const p=v.clone().applyMatrix4(d.inv),b=d.box,inset=.001;if(p.x>b.min.x+inset&&p.x<b.max.x-inset&&p.y>b.min.y+inset&&p.y<b.max.y-inset&&p.z>b.min.z+inset&&p.z<b.max.z-inset){count++;max=Math.max(max,Math.min(p.x-b.min.x,b.max.x-p.x,p.y-b.min.y,b.max.y-p.y,p.z-b.min.z,b.max.z-p.z)*1000);}}}
 maxCore=Math.max(maxCore,max);if(max>3)coreSamples++;if(own)ownSamples++;if(neighbors.some(Boolean))neighborSamples++;
 if(max>3||own||neighbors.some(Boolean)){const prev=h.fingerNotes[0].filter(n=>n.time+n.duration<=time).at(-1),next=h.fingerNotes[0].find(n=>n.time>=time);rows.push({time,side:h.side,maxCoreMm:max,coreVertices:count,ownPalmPairs:own,neighbors,previous:prev?.id,previousEnd:prev?prev.time+prev.duration:null,next:next?.id,nextTime:next?.time});}
 }
 if(ti%250===0)console.log(JSON.stringify({sample:ti,coreSamples,ownSamples,neighborSamples}));
}
const report={rig:process.env.DAYBREAK_RIG_MODULE??'baseline',samples:times.length,coreSamples,ownSamples,neighborSamples,maxCoreMm:maxCore,rows,scope:'Actual owned thumb vertices against conservative shrunken key boxes; exact owned thumb/palm/neighbor triangle pairs at all score note midpoints. Candidate still requires full-gap high-rate and visible web review.'};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,rows:rows.slice(0,3)}));
