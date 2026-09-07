const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),crypto=require('node:crypto');
const root='approach-waypoint',frozen='inventory/integrated/compiled';fs.mkdirSync(root,{recursive:true});
const source=fs.readFileSync('../pianopiece-threejs/app/performance/pianist.ts','utf8'),types=fs.readFileSync('../pianopiece-threejs/app/performance/types.ts','utf8'),modules=fs.readdirSync(frozen).filter(n=>n.endsWith('.mjs')).map(n=>n.slice(0,-4));
function compile(s){let emitted=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;for(const name of modules)emitted=emitted.replaceAll("'./"+name+"'","'./"+name+".mjs'");return emitted;}
assert.equal(compile(source),fs.readFileSync(frozen+'/pianist.mjs','utf8'),'Parent source no longer matches frozen integrated rig');
const marker=' let rotations=natural.map(q=>q.clone());';assert.equal(source.split(marker).length,2);
const insertion=` // A reviewed long approach moves above the key row before its final vertical landing.
 // This opt-in path keeps both endpoint poses and every unflagged route exact.
 const arrival=next?.approachWaypoint;
 if(arrival?.enabled&&gap>=.50&&arrival.duration>0&&arrival.duration<=.20&&arrival.duration<=gap-release&&start-time<arrival.duration){
  const anchor=this.plannedPose(hand,start),origin=finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=next!.contactZ??this.contactDepth(origin.z,isBlack(next!.midi),fi);
  const contact=piano.contact(next!.midi,z).add(v3(0,next!.contactLift??.002,0));
  const u=clamp(1-(start-time)/arrival.duration),liftEnd=clamp(arrival.liftEnd,.05,.45),landStart=clamp(arrival.landStart,liftEnd+.05,.95);
  const lift=smooth(u/liftEnd),land=smooth((u-landStart)/(1-landStart)),cruise=smooth((u-liftEnd)/(landStart-liftEnd)),envelope=lift*(1-land);
  const touch=restTouch.clone().lerp(contact,cruise);touch.x+=arrival.x*envelope;touch.z+=arrival.z*envelope;touch.y=mix(mix(restTouch.y,arrival.height,lift),contact.y,land);
  const rotations=localPose(wp(hand.wrist),pose.q,touch,0,arrival.roll*envelope);
  finger.bones.forEach((bone,j)=>{bone.quaternion.copy(rotations[j]);bone.updateWorldMatrix(false,true);});
  continue;
 }
`;
const changed=source.replace(marker,insertion+marker),changedTypes=types.replace('export interface Note {','export interface Note { approachWaypoint?: FingerReleaseWaypoint;');
fs.writeFileSync(root+'/baseline-pianist.ts',source);fs.writeFileSync(root+'/pianist.ts',changed);fs.writeFileSync(root+'/types.ts',changedTypes);fs.mkdirSync(root+'/compiled',{recursive:true});
for(const n of modules){const dest=path.join(root,'compiled',n+'.mjs');if(n==='pianist')fs.writeFileSync(dest,compile(changed));else if(!fs.existsSync(dest))fs.symlinkSync(path.resolve(frozen,n+'.mjs'),dest);}
const base=JSON.parse(fs.readFileSync('release-twelve/score.json')),n=base.notes.find(n=>n.id==='db00522'),windows=JSON.parse(fs.readFileSync('approach-research/baseline/windows.json')),times=fs.readFileSync('approach-research/baseline/times.json');
const profiles=[['high0',{height:.79,x:0,z:0,duration:.20,landStart:.75}],['highfront',{height:.79,x:0,z:-.03,duration:.20,landStart:.75}],['highleft',{height:.79,x:-.015,z:-.03,duration:.20,landStart:.75}],['highright',{height:.79,x:.015,z:-.03,duration:.20,landStart:.75}]];
for(const [name,p]of profiles){const dir=path.join(root,name);fs.mkdirSync(dir,{recursive:true});const score=structuredClone(base);score.notes.find(n=>n.id==='db00522').approachWaypoint={enabled:true,liftEnd:1/3,roll:0,...p};fs.writeFileSync(dir+'/score.json',JSON.stringify(score,null,2)+'\n');fs.writeFileSync(dir+'/windows.json',JSON.stringify(windows,null,2)+'\n');fs.writeFileSync(dir+'/times.json',times);if(!fs.existsSync(dir+'/compiled'))fs.symlinkSync('../compiled',dir+'/compiled');}
fs.writeFileSync(root+'/manifest.json',JSON.stringify({status:'UNVERIFIED finite approach research; baseline branch and other routes retained',baselineRigSHA256:crypto.createHash('sha256').update(compile(source)).digest('hex'),sourceSHA256:crypto.createHash('sha256').update(changed).digest('hex'),compiledSHA256:crypto.createHash('sha256').update(compile(changed)).digest('hex')},null,2)+'\n');console.log('APPROACH_CANDIDATES_PREPARED');
