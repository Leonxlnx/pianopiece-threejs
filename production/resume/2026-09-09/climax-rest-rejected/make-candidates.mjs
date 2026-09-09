import fs from 'node:fs';import ts from 'typescript';
const root=new URL('./',import.meta.url),base=fs.readFileSync(new URL('baseline.ts',root),'utf8');
const options=[{name:'open-arch',angles:[-15,30,55],spread:15,thumb:[.35,.60,-.12]},{name:'compact-arch',angles:[-25,35,65],spread:30,thumb:[.28,.50,-.14]},{name:'round-arch',angles:[-5,40,70],spread:40,thumb:[.40,.55,-.10]}];
for(const c of options){
const code=`
// Reusable curved neutral posture prototype; reviewed gaps are a validation scope.
function climaxRest(player:OriginalPianist,time:number){
 const gaps:[number,number,number,number][]=[[0,0,159.007812,161.826373],[0,2,158.033095,160.168206],[0,3,158.403465,159.834873],[1,0,153.403546,163.825895],[1,2,158.424465,160.856873]];
 for(const [hi,fi,end,start] of gaps){
 if(time<=end||time>=start)continue;
 const hand=player.hands[hi],f=hand.fingers[fi];if(hand.fingerNotes[fi].some(n=>n.time<=time&&n.time+n.duration>time))continue;
 const weight=smooth((time-end)/.22)*smooth((start-time)/.30),q=hand.wrist.getWorldQuaternion(new THREE.Quaternion()),origin=wp(f.bones[0]),world:THREE.Quaternion[]=[];
 if(fi===0){
  const reach=f.lengths.reduce((a,b)=>a+b,0),offset=v3(${c.thumb[0]}*(hi===0?-1:1),${c.thumb[1]},${c.thumb[2]}).multiplyScalar(reach).applyQuaternion(q),touch=origin.clone().add(offset);
  touch.y=Math.max(touch.y,KEY_TOP+.018);
  const chain=player.fingerPoints(origin,touch,f,fi,q),p=[origin,chain.pip,chain.dip,chain.tip];
  for(let j=0;j<3;j++){const dir=p[j+1].clone().sub(p[j]).normalize(),normal=chain.normal;world.push(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]));}
 }else{
  const spread=(fi===2?${c.spread}:0)*(hi===0?-1:1)*Math.PI/180,normal=v3(-Math.cos(spread),Math.sin(spread),0).applyQuaternion(q);
  for(let j=0;j<3;j++){const angle=${JSON.stringify(c.angles)}[j]*Math.PI/180,dir=v3(Math.sin(spread)*Math.cos(angle),Math.cos(spread)*Math.cos(angle),Math.sin(angle)).applyQuaternion(q);world.push(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]));}
 }
 const local=world.map((rotation,j)=>(j===0?q:world[j-1]).clone().invert().multiply(rotation));
 f.bones.forEach((b,j)=>{b.quaternion.slerp(local[j],weight);b.updateWorldMatrix(false,true);});
 }
}
`;
const source=base.replace('export class Pianist extends OriginalPianist {',code+'\nexport class Pianist extends OriginalPianist {').replace('p299Idle(this,time);','p299Idle(this,time);climaxRest(this,time);');
fs.writeFileSync(new URL(c.name+'.ts',root),source);
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from '(\.\/[^']+)'/g,(_,p)=>`from './render-project/production/qa/compiled/${p.slice(2)}.mjs'`);fs.writeFileSync(new URL(c.name+'.mjs',root),js);
}
fs.writeFileSync(new URL('candidates.json',root),JSON.stringify(options,null,2));
