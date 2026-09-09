import fs from 'node:fs';
import {T,setup,pose,point,sha,score} from './shared.mjs';
import {patches,worldPatch} from './geometry.mjs';
function closest(point,node,best={distance:Infinity,point:null,triangle:null}){
 if(node.box.distanceToPoint(point)>best.distance)return best;
 if(node.list){for(const tri of node.list){const p=new T.Triangle(...tri.p).closestPointToPoint(point,new T.Vector3()),d=p.distanceTo(point);if(d<best.distance){best.distance=d;best.point=p;best.triangle=tri;}}}else{closest(point,node.left,best);closest(point,node.right,best);}return best;
}
const versions=process.argv.slice(2);if(!versions.length)versions.push('candidate-final');const reports={};
for(const version of versions){const state=await setup(version),defs=patches(state),rows=[];
 for(const time of [...new Set([...Array.from({length:Math.ceil(score.duration*4)+1},(_,i)=>Math.min(i/4,score.duration)),...score.notes.map(n=>n.time+n.duration*.5),...[[42.7,43.2],[188.5,190.5],[223.8,233.144228]].flatMap(([a,b])=>Array.from({length:Math.ceil((b-a)*20)+1},(_,i)=>Math.min(a+i/20,b))),0,30.766666666666666,40.93333333333333,156.06666666666666,224.55,233.144228])].sort((a,b)=>a-b)){
  pose(state,time);const parts=defs.map(worldPatch),torso=parts.find(p=>p.name==='torso'),surfaces=[];
  for(const hand of state.performer.hands){const sh=point(hand.upper),axis=point(hand.lower).sub(sh).normalize(),sleeve=parts.find(p=>p.name===hand.side+'-sleeve');let sleeveDistal=0;for(const v of sleeve.vertices.values())sleeveDistal=Math.max(sleeveDistal,v.clone().sub(sh).dot(axis));
   const part=parts.find(p=>p.name===hand.side+'-upper-skin'),penetrations=[];let exposedVertices=0;
   for(const [id,v]of part.vertices){const along=v.clone().sub(sh).dot(axis);if(along<=sleeveDistal+.002)continue;exposedVertices++;const best=closest(v,torso.tree),normal=new T.Triangle(...best.triangle.p).getNormal(new T.Vector3()),signed=v.clone().sub(best.point).dot(normal);
    if(signed<-.00001)penetrations.push({id,signedNormalMm:signed*1000,nearestSurfaceDistanceMm:best.distance*1000,point:v.toArray(),nearestPoint:best.point.toArray(),normal:normal.toArray(),upperAxisMm:along*1000,torsoTriangle:best.triangle.ids});
   }penetrations.sort((a,b)=>a.signedNormalMm-b.signedNormalMm);surfaces.push({side:hand.side,exposedVertices,sleeveDistalAxisMm:sleeveDistal*1000,negativeSignedVertices:penetrations.length,maximumDepthMm:-(penetrations[0]?.signedNormalMm??0),worst:penetrations.slice(0,12)});
  }rows.push({time,surfaces});if(rows.length%200===0)console.log(JSON.stringify({samples:rows.length,maxDepthMm:Math.max(...rows.flatMap(row=>row.surfaces.map(s=>s.maximumDepthMm)))}));
 }reports[version]={sourceSha256:sha(fs.readFileSync(`${version}/pianist.ts`)),rows};
}
const report={metric:'Closest actual torso-cloth triangle signed normal distance for >65% upper-arm skin ownership with <35% forearm influence, after sleeve distal-axis extent +2mm. Negative means behind local outward surface. This local signed distance is not a watertight volume test; worst coordinates and triangles retained for independent inspection.',versions:reports};fs.writeFileSync('final-depth-sweep-report.json',JSON.stringify(report,null,2));for(const [version,r]of Object.entries(reports))console.log(version,r.rows.map(row=>[row.time,...row.surfaces.map(s=>[s.side,s.maximumDepthMm,s.negativeSignedVertices])]));
