import {T} from './harness.mjs';
const V=()=>new T.Vector3();
export function patches(state){
 const result=[];
 state.gltf.scene.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||!['Human','tailored_concert_blouse_and_trousers'].includes(mesh.name))return;
  const a=mesh.geometry.attributes,idx=mesh.geometry.index.array,weights=[];
  for(let i=0;i<a.position.count;i++){
   let arms=[0,0],forearms=[0,0];
   for(let j=0;j<4;j++){const name=mesh.skeleton.bones[a.skinIndex.getComponent(i,j)].name,w=a.skinWeight.getComponent(i,j);for(const [side,word]of ['Left','Right'].entries()){if(name===word+'Arm'||name===word+'ForeArm')arms[side]+=w;if(name===word+'ForeArm')forearms[side]+=w;}}
   weights.push({arms,forearms});
  }
  const groups=mesh.name==='Human'?['L-upper-skin','R-upper-skin','L-forearm','R-forearm']:['torso','L-sleeve','R-sleeve'];
  for(const group of groups){const side=group[0]==='L'?0:1,tris=[];
   for(let i=0;i<idx.length;i+=3){const ids=Array.from(idx.slice(i,i+3));let include;
    if(group==='torso')include=ids.every(id=>Math.max(...weights[id].arms)<.05);
    else if(group.includes('forearm'))include=ids.every(id=>weights[id].forearms[side]>.65);
    else include=ids.every(id=>weights[id].arms[side]>.65&&(group.includes('sleeve')||weights[id].forearms[side]<.35));
    if(include)tris.push(ids);
   }
   result.push({name:group,mesh,tris,vertexIds:[...new Set(tris.flat())]});
  }
 });return result;
}
export function worldPatch(patch){
 const vertices=new Map(patch.vertexIds.map(id=>[id,patch.mesh.getVertexPosition(id,V()).applyMatrix4(patch.mesh.matrixWorld)]));
 const list=patch.tris.map(ids=>{const p=ids.map(id=>vertices.get(id)),box=new T.Box3().setFromPoints(p);return {ids,p,box,center:box.getCenter(V())};});
 return {...patch,vertices,list,tree:tree(list)};
}
function tree(list){const box=new T.Box3();for(const tri of list)box.union(tri.box);if(list.length<=12)return {box,list};const size=box.getSize(V()),axis=size.x>=size.y&&size.x>=size.z?'x':size.y>=size.z?'y':'z';list.sort((a,b)=>a.center[axis]-b.center[axis]);const mid=list.length>>1;return{box,left:tree(list.slice(0,mid)),right:tree(list.slice(mid))};}
function edgeHit(a,b,tri){const delta=b.clone().sub(a),length=delta.length();if(length<1e-8)return null;const hit=new T.Ray(a,delta.divideScalar(length)).intersectTriangle(...tri,false,V());if(!hit)return null;const d=hit.distanceTo(a);return d>1e-7&&d<length-1e-7?hit:null;}
export function intersect(a,b,hits={count:0,points:[]}){
 if(!a.box.intersectsBox(b.box))return hits;
 if(a.list&&b.list){for(const ta of a.list)for(const tb of b.list){if(!ta.box.intersectsBox(tb.box))continue;let hit=null;for(let e=0;e<3&&!hit;e++)hit=edgeHit(ta.p[e],ta.p[(e+1)%3],tb.p)??edgeHit(tb.p[e],tb.p[(e+1)%3],ta.p);if(hit){hits.count++;if(hits.points.length<20)hits.points.push({a:ta.ids,b:tb.ids,point:hit.toArray()});}}}
 else if(a.list){intersect(a,b.left,hits);intersect(a,b.right,hits);}else if(b.list){intersect(a.left,b,hits);intersect(a.right,b,hits);}else{intersect(a.left,b.left,hits);intersect(a.left,b.right,hits);intersect(a.right,b.left,hits);intersect(a.right,b.right,hits);}return hits;
}
export function nearest(point,node,best={distance:Infinity,point:null}){if(node.box.distanceToPoint(point)>best.distance)return best;if(node.list){for(const tri of node.list){const p=new T.Triangle(...tri.p).closestPointToPoint(point,V()),d=p.distanceTo(point);if(d<best.distance){best.distance=d;best.point=p;}}}else{nearest(point,node.left,best);nearest(point,node.right,best);}return best;}
