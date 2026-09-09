import fs from 'node:fs';
import {T,setup,pose,score,sha} from './shared.mjs';
import {patches,worldPatch,intersect,nearest} from './geometry.mjs';
const version=process.argv[2]??'candidate',state=await setup(version),definitions=patches(state),times=process.argv.slice(3).map(Number);
if(!times.length)times.push(0,.95,6,11.7,26.05,38.75,55.8,72.04,112.5,162.31,173,188.816,189.9,197.5,224.55,228.99,233.144228);
const rows=[];
for(const time of times){pose(state,time);const world=definitions.map(worldPatch),torso=world.find(p=>p.name==='torso'),surfaces=[];
 for(const part of world.filter(p=>p!==torso)){const hits=intersect(part.tree,torso.tree);let min=Infinity,at=null;for(const [id,v]of part.vertices){const best=nearest(v,torso.tree);if(best.distance<min){min=best.distance;at={id,point:v.toArray(),torsoPoint:best.point.toArray()};}}surfaces.push({name:part.name,triangles:part.tris.length,trianglePairs:hits.count,minimumVertexToTorsoMm:min*1000,closest:at,hits:hits.points});}
 const row={time,surfaces};rows.push(row);console.log(JSON.stringify({time,pairs:surfaces.filter(s=>s.trianglePairs).map(s=>[s.name,s.trianglePairs]),min:surfaces.map(s=>[s.name,s.minimumVertexToTorsoMm])}));
 if([0,188.816,224.55,233.144228].includes(time)){const meshes=[];state.gltf.scene.traverse(m=>{if(!m.isSkinnedMesh||!['Human','tailored_concert_blouse_and_trousers'].includes(m.name))return;const vertices=[];for(let i=0;i<m.geometry.attributes.position.count;i++)vertices.push(...m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld).toArray());meshes.push({name:m.name,vertices,indices:Array.from(m.geometry.index.array)});});fs.writeFileSync(`${version}-geometry-${time}.json`,JSON.stringify({time,meshes,arms:state.performer.hands.map(h=>({side:h.side,points:[h.upper,h.lower,h.wrist].map(b=>b.getWorldPosition(new T.Vector3()).toArray())})),row}));}
}
fs.writeFileSync(`${version}-clearance.json`,JSON.stringify({sourceSha256:sha(fs.readFileSync(`${version}/pianist.ts`)),criterion:'No noncoplanar arm or sleeve triangle intersections against torso triangles with less than 5% arm influence; arm patches require over 65% arm influence at all vertices. Connected blended underarm omitted, so visual review required.',rows},null,2));
