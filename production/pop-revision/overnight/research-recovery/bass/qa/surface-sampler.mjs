import * as T from 'three';
export function surfaceSampler(r){
const {body,score,performer,piano}=r;
const geo=body.geometry,si=geo.attributes.skinIndex,sw=geo.attributes.skinWeight,indices=geo.index.array;
const names=['Thumb','Index','Middle','Ring','Pinky','Palm'],label=i=>(i<6?'L':'R')+names[i%6];
const ownership=new Int8Array(si.count).fill(-1),wholeHand=new Int8Array(si.count).fill(-1),owned=Array.from({length:12},()=>[]),triangles=Array.from({length:12},()=>[]),mixed=[];
for(let id=0;id<si.count;id++){
 const sums=new Float64Array(12);for(let j=0;j<4;j++){const m=body.skeleton.bones[si.getComponent(id,j)].name.match(/^(Left|Right)Hand(?:(Thumb|Index|Middle|Ring|Pinky)[123])?$/);if(m)sums[(m[1]==='Left'?0:6)+(m[2]?names.indexOf(m[2]):5)]+=sw.getComponent(id,j);}
 const max=Math.max(...sums),side=[sums.slice(0,6).reduce((x,y)=>x+y,0),sums.slice(6).reduce((x,y)=>x+y,0)];
 if(max>.65){ownership[id]=sums.indexOf(max);owned[ownership[id]].push(id);}
 if(Math.max(...side)>.50){wholeHand[id]=side[0]>side[1]?0:1;if(max<=.65)mixed.push(id);}
}
for(let i=0;i<indices.length;i+=3){const ids=[indices[i],indices[i+1],indices[i+2]],o=ownership[ids[0]];if(o>=0&&ids.every(id=>ownership[id]===o))triangles[o].push(ids);}
const included=[...new Set([...owned.flat(),...mixed])],patchVertices=triangles.map(ts=>[...new Set(ts.flat())]);
const pairs=[];for(let s=0;s<2;s++){for(let f=0;f<5;f++)pairs.push([s*6+f,s*6+5,'own-palm']);for(let f=0;f<5;f++)for(let g=f+1;g<5;g++)pairs.push([s*6+f,s*6+g,'neighbor']);}for(let l=0;l<6;l++)for(let r=0;r<6;r++)pairs.push([l,r+6,'opposing']);
function edgeHit(a,b,tri){const d=b.clone().sub(a),l=d.length();if(l<1e-8)return null;const p=new T.Ray(a,d.divideScalar(l)).intersectTriangle(...tri,false,new T.Vector3());if(!p)return null;const n=p.distanceTo(a);return n>1e-7&&n<l-1e-7?p:null;}
function tree(ts){const box=new T.Box3();for(const t of ts)box.union(t.box);if(ts.length<=12)return{box,list:ts};const s=box.getSize(new T.Vector3()),axis=s.x>=s.y&&s.x>=s.z?'x':s.y>=s.z?'y':'z';ts.sort((a,b)=>a.center[axis]-b.center[axis]);const m=ts.length>>1;return{box,left:tree(ts.slice(0,m)),right:tree(ts.slice(m))};}
function intersect(a,b,h){if(!a.box.intersectsBox(b.box))return;if(a.list&&b.list){for(const x of a.list)for(const y of b.list){if(!x.box.intersectsBox(y.box))continue;let p;for(let e=0;e<3&&!p;e++)p=edgeHit(x.p[e],x.p[(e+1)%3],y.p)??edgeHit(y.p[e],y.p[(e+1)%3],x.p);if(p){h.count++;if(h.points.length<5)h.points.push({a:x.ids,b:y.ids,world:p.toArray()});}}}else if(a.list){intersect(a,b.left,h);intersect(a,b.right,h);}else if(b.list){intersect(a.left,b,h);intersect(a.right,b,h);}else{intersect(a.left,b.left,h);intersect(a.left,b.right,h);intersect(a.right,b.left,h);intersect(a.right,b.right,h);}}

return function sample(t){r.pose(t);
 const active=score.notes.filter(n=>n.time<=t&&n.time+n.duration>t),world=new Map();
 for(const id of included){const p=body.getVertexPosition(id,new T.Vector3()).applyMatrix4(body.matrixWorld);world.set(id,p);if(!p.toArray().every(Number.isFinite))throw Error('Nonfinite posed surface');}
 const keys=[...piano.keys].map(([midi,k])=>{if(!k.mesh.geometry.boundingBox)k.mesh.geometry.computeBoundingBox();const box=k.mesh.geometry.boundingBox,inside=box.clone().expandByScalar(k.black?-.002:-.0014);return{midi,box,inside,world:inside.clone().applyMatrix4(k.mesh.matrixWorld),inverse:k.mesh.matrixWorld.clone().invert()};});
 const keyHits=new Map();for(const id of included){const p=world.get(id),o=ownership[id],side=wholeHand[id];const patch=o>=0?label(o):(side===0?'LMixedWeb':'RMixedWeb');for(const k of keys){if(!k.world.containsPoint(p))continue;const l=p.clone().applyMatrix4(k.inverse);if(!k.inside.containsPoint(l))continue;const depth=1000*Math.min(l.x-k.box.min.x,k.box.max.x-l.x,l.y-k.box.min.y,k.box.max.y-l.y,l.z-k.box.min.z,k.box.max.z-l.z);const key=patch+':'+k.midi;let hit=keyHits.get(key);if(!hit){hit={patch,key:k.midi,active:o>=0&&o%6<5&&active.some(n=>n.hand===(o<6?'L':'R')&&n.finger===o%6+1),vertices:0,deepVertices:0,maxDepthMm:0,deepest:null};keyHits.set(key,hit);}hit.vertices++;if(depth>3)hit.deepVertices++;if(depth>hit.maxDepthMm){hit.maxDepthMm=depth;hit.deepest={vertex:id,world:p.toArray(),local:l.toArray(),weights:Array.from({length:4},(_,j)=>({bone:body.skeleton.bones[si.getComponent(id,j)].name,weight:sw.getComponent(id,j)}))};}}}
 const bounds=patchVertices.map(ids=>new T.Box3().setFromPoints(ids.map(id=>world.get(id)))),trees=new Map(),surfaceHits=[];
 function getTree(i){if(!trees.has(i))trees.set(i,tree(triangles[i].map(ids=>{const p=ids.map(id=>world.get(id)),box=new T.Box3().setFromPoints(p);return{ids,p,box,center:box.getCenter(new T.Vector3())};})));return trees.get(i);}
 for(const [a,b,kind]of pairs){if(!bounds[a].intersectsBox(bounds[b]))continue;const h={count:0,points:[]};intersect(getTree(a),getTree(b),h);if(h.count)surfaceHits.push({a:label(a),b:label(b),kind,trianglePairs:h.count,points:h.points});}
 const skinKeys=[...keyHits.values()],row={time:t,active:active.map(n=>({id:n.id,hand:n.hand,finger:n.finger,midi:n.midi})),keyHits:skinKeys,surfaceHits,markerMaxErrorMm:Math.max(0,...performer.contacts.map(c=>c.error*1000))};return row;

};
}
