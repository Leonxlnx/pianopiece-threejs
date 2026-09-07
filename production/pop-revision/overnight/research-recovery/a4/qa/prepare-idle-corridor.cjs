const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const src=fs.readFileSync('approach-waypoint/pianist.ts','utf8'),marker=' finger.bones.forEach((bone,j)=>{bone.quaternion.copy(rotations[j]);bone.updateWorldMatrix(false,true);});\n continue;\n }\n\n for(let j=0;j<3;j++)';
if(src.split(marker).length!==2)throw Error('Expected one final inactive nonthumb application');
const insert=` // A named idle interval may give an arriving neighbor room. The whole digit
 // stays in joint space, and the envelope is zero before release/approach blends.
 const idleRoute=previous?.idlePose;
 if(idleRoute&&gap>=.50&&idleRoute.afterRelease>=release&&idleRoute.beforeNext>=approach&&idleRoute.blend>0){
  const weight=smooth((time-end-idleRoute.afterRelease)/idleRoute.blend)*smooth((start-time-idleRoute.beforeNext)/idleRoute.blend);
  if(weight>0){
   const proximal=finger.bones[1].position.clone().applyQuaternion(rotations[0]).normalize().applyQuaternion(pose.q),dorsal=v3(0,0,-1).applyQuaternion(pose.q),axis=proximal.clone().cross(v3(0,1,0));
   const elevation=Math.asin(clamp(proximal.dot(dorsal),-1,1)),available=Math.max(0,55*Math.PI/180-elevation),angle=Math.min(Math.max(0,idleRoute.liftDegrees)*Math.PI/180*weight,available);
   if(axis.lengthSq()>1e-8&&angle>0)rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(axis.normalize().applyQuaternion(pose.q.clone().invert()),angle));
   if(idleRoute.sweepDegrees!==0)rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(0,0,-1),idleRoute.sweepDegrees*Math.PI/180*weight));
  }
 }
`;
const source=src.replace(marker,insert+marker);fs.mkdirSync('approach-idle/compiled',{recursive:true});fs.writeFileSync('approach-idle/pianist.ts',source);
fs.writeFileSync('approach-idle/types.ts',fs.readFileSync('approach-waypoint/types.ts','utf8').replace('export interface Note {','export interface FingerIdlePoseControl { afterRelease: number; beforeNext: number; blend: number; liftDegrees: number; sweepDegrees: number; }\nexport interface Note { idlePose?: FingerIdlePoseControl;'));
const mods=fs.readdirSync('inventory/integrated/compiled').filter(f=>f.endsWith('.mjs'));let code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;for(const f of mods)code=code.replaceAll("'./"+f.slice(0,-4)+"'","'./"+f+"'");for(const f of mods){if(f==='pianist.mjs')fs.writeFileSync('approach-idle/compiled/'+f,code);else fs.symlinkSync(path.resolve('inventory/integrated/compiled/'+f),'approach-idle/compiled/'+f);}
const score=JSON.parse(fs.readFileSync('paired-approach/candidate/score.json'));fs.mkdirSync('approach-idle/candidate',{recursive:true});fs.writeFileSync('approach-idle/candidate/score.json',JSON.stringify(score,null,2)+'\n');fs.symlinkSync('../compiled','approach-idle/candidate/compiled');
const controls=[];for(const liftDegrees of [0,10,20,35])for(const sweepDegrees of [-25,-15,0,15,25])controls.push({afterRelease:.16,beforeNext:.12,blend:.06,liftDegrees,sweepDegrees});fs.writeFileSync('approach-idle/grid-controls.json',JSON.stringify(controls,null,2)+'\n');
let grid=fs.readFileSync('grid-paired.mjs','utf8').replaceAll("'paired-approach/candidate'","'approach-idle/candidate'").replaceAll("'paired-approach/grid-controls.json'","'approach-idle/grid-controls.json'").replaceAll("'paired-approach/candidate/score.json'","'approach-idle/candidate/score.json'").replaceAll("'paired-approach/candidate/compiled/pianist.mjs'","'approach-idle/candidate/compiled/pianist.mjs'").replaceAll("'grid-paired.mjs'","'grid-idle.mjs'").replaceAll('index.releaseWaypoint','index.idlePose').replaceAll("'paired-approach/grid-results.json'","'approach-idle/grid-results.json'");fs.writeFileSync('grid-idle.mjs',grid);
