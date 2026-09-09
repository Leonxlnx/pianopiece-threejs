import fs from 'node:fs';
import {T,setup,pose,point,sha} from './shared.mjs';
import {patches,worldPatch} from './geometry.mjs';
function closest(point,node,best={distance:Infinity,point:null,triangle:null}){
 if(node.box.distanceToPoint(point)>best.distance)return best;
 if(node.list){for(const tri of node.list){const p=new T.Triangle(...tri.p).closestPointToPoint(point,new T.Vector3()),d=p.distanceTo(point);if(d<best.distance){best.distance=d;best.point=p;best.triangle=tri;}}}else{closest(point,node.left,best);closest(point,node.right,best);}return best;
}
const versions=process.argv.slice(2);if(!versions.length)versions.push('candidate-final');const reports={};
for(const version of versions){const state=await setup(version),defs=patches(state),rows=[];
 for(const time of [0,30.766666666666666,40.93333333333333,42.9375135,43,156.06666666666666,188.75,189.762023,190,190.197742,224.55,225.5,233.144228]){
  pose(state,time);const parts=defs.map(worldPatch),torso=parts.find(p=>p.name==='torso'),surfaces=[];
  for(const hand of state.performer.hands){const sh=point(hand.upper),axis=point(hand.lower).sub(sh).normalize(),sleeve=parts.find(p=>p.name===hand.side+'-sleeve');let sleeveDistal=0;for(const v of sleeve.vertices.values())sleeveDistal=Math.max(sleeveDistal,v.clone().sub(sh).dot(axis));
   const part=parts.find(p=>p.name===hand.side+'-upper-skin'),penetrations=[];let exposedVertices=0;
   for(const [id,v]of part.vertices){const along=v.clone().sub(sh).dot(axis);if(along<=sleeveDistal+.002)continue;exposedVertices++;const best=closest(v,torso.tree),normal=new T.Triangle(...best.triangle.p).getNormal(new T.Vector3()),signed=v.clone().sub(best.point).dot(normal);
    if(signed<-.00001)penetrations.push({id,signedNormalMm:signed*1000,nearestSurfaceDistanceMm:best.distance*1000,point:v.toArray(),nearestPoint:best.point.toArray(),normal:normal.toArray(),upperAxisMm:along*1000,torsoTriangle:best.triangle.ids});
   }penetrations.sort((a,b)=>a.signedNormalMm-b.signedNormalMm);surfaces.push({side:hand.side,exposedVertices,sleeveDistalAxisMm:sleeveDistal*1000,negativeSignedVertices:penetrations.length,maximumDepthMm:-(penetrations[0]?.signedNormalMm??0),worst:penetrations.slice(0,12)});
  }rows.push({time,surfaces});
 }reports[version]={sourceSha256:sha(fs.readFileSync(`${version}/pianist.ts`)),rows};
}
const report={metric:'Closest actual torso-cloth triangle signed normal distance for >65% upper-arm skin ownership with <35% forearm influence, after sleeve distal-axis extent +2mm. Negative means behind local outward surface. This local signed distance is not a watertight volume test; worst coordinates and triangles retained for independent inspection.',versions:reports};fs.writeFileSync('final-upper-depth-report.json',JSON.stringify(report,null,2));for(const [version,r]of Object.entries(reports))console.log(version,r.rows.map(row=>[row.time,...row.surfaces.map(s=>[s.side,s.maximumDepthMm,s.negativeSignedVertices])]));
