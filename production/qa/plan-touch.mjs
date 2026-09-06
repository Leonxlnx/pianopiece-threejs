import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Pianist} from './compiled/pianist.mjs';
const ctx=new Proxy({},{get:(a,k)=>k in a?a[k]:(...args)=>{}});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};globalThis.self=globalThis;
const loader=new GLTFLoader();loader.register(()=>({name:'offline-textures',loadTexture:()=>Promise.resolve(new T.Texture())}));const b=fs.readFileSync('public/assets/pianist.glb');const gltf=await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const score=JSON.parse(fs.readFileSync('public/assets/score.json'));const p=new Pianist();await p.load(score,gltf.scene);
function sustained(a,b){let value=0;for(const e of score.pedals){if(e.time<=a)value=e.value;if(e.time>a&&e.time<b-1e-6&&e.value<.1)return false;}return value>.1;}
const changes=[],unresolved=[];
for(const h of p.hands)for(let i=1;i<h.plan.length;i++){
 const prev=h.plan[i-1],next=h.plan[i],distance=prev.pose.position.distanceTo(next.pose.position),angle=prev.pose.q.angleTo(next.pose.q);
 // C1 position easing peaks at 1.5*d/gap. Use time for an actual spatial
 // movement, rather than inferring travel from pitch intervals alone.
 const needed=Math.min(.32,Math.max(.065,distance*1.5/1.35,angle/.9*.12));
 const gap=next.time-prev.end;if(gap>=needed||distance<.008&&angle<.07)continue;
 const release=next.time-needed;
 for(const n of h.notes){if(n.time>=next.time||n.time+n.duration<=release)continue;
 const end=n.time+n.duration,minEnd=n.time+.040;
 if(release<minEnd||!sustained(Math.max(release,minEnd),end)){unresolved.push({hand:h.side,id:n.id,time:next.time,distance,angle,needed,gap,reason:release<minEnd?'short attack interval':'no continuous pedal'});continue;}
 const old=n.duration;n.writtenDuration??=old;n.duration=Number((release-n.time).toFixed(6));changes.push({id:n.id,hand:h.side,oldDuration:old,duration:n.duration,reason:'continuous-pedal hand travel',next:next.time,distance,angle});
 }
}
if(process.argv.includes('--apply'))fs.writeFileSync('public/assets/score.json',JSON.stringify(score)+'\n');
const report={applied:process.argv.includes('--apply'),changes:changes.length,unresolved:unresolved.length,details:changes,unresolvedDetails:unresolved};fs.writeFileSync(process.argv.find(a=>a.endsWith('.json'))??'/workspace/scratch/2e8cc8e77f98/touch-plan.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,details:changes.slice(0,3),unresolvedDetails:unresolved.slice(0,5)},null,2));
