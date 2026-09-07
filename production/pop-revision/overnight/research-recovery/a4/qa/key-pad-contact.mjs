import * as T from 'three';

// Measure the actual deformed pad against the actual assigned rounded key.
// White keys can be played between black keys; a hardcoded front-only Z
// window incorrectly rejects those valid contacts. Whole-hand/all-key
// collision checks remain separate, including occlusion by neighboring keys.
export function keyPadContact(body,ids,keyMesh){
 const ray=new T.Raycaster(),v=new T.Vector3();let gap=Infinity,count=0;
 for(const id of ids){
  body.getVertexPosition(id,v).applyMatrix4(body.matrixWorld);
  ray.set(new T.Vector3(v.x,1.1,v.z),new T.Vector3(0,-1,0));
  const hit=ray.intersectObject(keyMesh,false).find(h=>h.face.normal.y>.5);
  if(!hit)continue;
  count++;gap=Math.min(gap,v.y-hit.point.y);
 }
 return {gap,count};
}
