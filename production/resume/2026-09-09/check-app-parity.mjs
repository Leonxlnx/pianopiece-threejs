import fs from 'node:fs';
import crypto from 'node:crypto';
const project='/workspace/sites/daybreak-piano-film';
process.env.DAYBREAK_SCORE=project+'/public/assets/score.json';
process.env.DAYBREAK_RIG_MODULE=project+'/production/qa/compiled/pianist.mjs';
const actual=await import('./harness.mjs?app');
process.env.DAYBREAK_RIG_MODULE=new URL('./pianist-candidate-baked.mjs',import.meta.url).pathname;
const expected=await import('./harness.mjs?baked');
const times=new Set();
for(let t=0;t<=actual.score.duration;t+=1/30)times.add(t);
for(const n of actual.score.notes)for(const t of [n.time,n.time+n.duration])for(const dt of [-1e-6,0,1e-6])if(t+dt>=0)times.add(t+dt);
let maxLocal=0,maxWorld=0,maxSkin=0,states=0,skinStates=0;
const a=new actual.T.Vector3(),b=new actual.T.Vector3();
for(const time of [...times].sort((a,b)=>a-b)){
 actual.update(time);expected.update(time);
 for(const [name,bone] of actual.performer.bones){const other=expected.performer.bones.get(name);for(const k of ['x','y','z','w'])maxLocal=Math.max(maxLocal,Math.abs(bone.quaternion[k]-other.quaternion[k]));for(let i=0;i<16;i++)maxWorld=Math.max(maxWorld,Math.abs(bone.matrixWorld.elements[i]-other.matrixWorld.elements[i]));}
 if(states%250===0){for(let i=0;i<actual.body.geometry.attributes.position.count;i++){actual.body.getVertexPosition(i,a);expected.body.getVertexPosition(i,b);maxSkin=Math.max(maxSkin,a.distanceTo(b));}skinStates++;}
 states++;
}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report={states,skinStates,maxLocal,maxWorld,maxSkin,scoreSha:hash(project+'/public/assets/score.json'),appRigSha:hash(project+'/app/performance/pianist.ts'),bakedRigSha:hash(new URL('./pianist-candidate-baked.ts',import.meta.url)),pass:maxLocal===0&&maxWorld===0&&maxSkin===0};
fs.writeFileSync('app-parity.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
