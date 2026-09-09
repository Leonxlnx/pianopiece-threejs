import fs from 'node:fs';
const root='/workspace/sites/daybreak-piano-film',scratch='/workspace/scratch/2e8cc8e77f98';
process.env.DAYBREAK_SCORE=root+'/public/assets/score.json';process.env.DAYBREAK_RIG_MODULE=root+'/production/qa/compiled/pianist.mjs';
const actual=await import('./harness.mjs?merged');
const cases=[{name:'left-curve-rollback',module:scratch+'/integrated-review/curve007-removed-reference.mjs',begin:90.4,end:91.54,events:[91.46,91.474,91.482,91.518,91.530895]}];
const results=[];
for(const c of cases){
 process.env.DAYBREAK_RIG_MODULE=c.module;const expected=await import('./harness.mjs?'+c.name),times=new Set();
 for(let i=Math.ceil(c.begin*500);i<=Math.floor(c.end*500);i++)times.add(i/500);for(const t of c.events)for(const dt of [-1e-6,0,1e-6])times.add(t+dt);
 let maxLocal=0,maxWorld=0,maxSkin=0,skinStates=0,index=0;
 for(const time of [...times].sort((a,b)=>a-b)){
  actual.update(time);expected.update(time);
  for(const [name,bone]of actual.performer.bones){const other=expected.performer.bones.get(name);for(const k of ['x','y','z','w'])maxLocal=Math.max(maxLocal,Math.abs(bone.quaternion[k]-other.quaternion[k]));for(let j=0;j<16;j++)maxWorld=Math.max(maxWorld,Math.abs(bone.matrixWorld.elements[j]-other.matrixWorld.elements[j]));}
  if(index++%100===0){const a=new actual.T.Vector3(),b=new actual.T.Vector3();for(let v=0;v<actual.body.geometry.attributes.position.count;v++){actual.body.getVertexPosition(v,a);expected.body.getVertexPosition(v,b);maxSkin=Math.max(maxSkin,a.distanceTo(b));}skinStates++;}
 }
 results.push({name:c.name,states:times.size,skinStates,maxLocal,maxWorld,maxSkin,pass:maxLocal===0&&maxWorld===0&&maxSkin===0});
}
fs.writeFileSync('curve007-rollback-parity.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));if(results.some(x=>!x.pass))process.exitCode=1;
