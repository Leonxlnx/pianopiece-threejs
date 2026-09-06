import fs from 'node:fs';import crypto from 'node:crypto';import {T,score,performer,fingers,wp,pose,contextAt} from './runtime.mjs';
const part=Number(process.argv[2]??0),parts=Number(process.argv[3]??4),fps=Number(process.argv[4]??500),frameCount=Math.ceil(score.duration*fps),first=Math.floor(frameCount*part/parts),last=Math.floor(frameCount*(part+1)/parts),deg=180/Math.PI;
const previous=new Map(),open=new Map(),events=[],maxima={},counts={frames:0,speedAbove3:0,speedAbove5:0,rotationAbove2000:0,activeRotationAbove2000:0},allPeaks=[];
let maxContact=0;
const thresholds={tipSpeed:2.5,jointSpeed:2000,dorsalDegrees:60,backward:-.15};
function record(g,time,metrics){const key=g.key;let e=open.get(key);if(e&&time-e.lastBad>.06){events.push(e);open.delete(key);e=null;}if(!e){e={key,start:time,end:time,lastBad:time,samples:0,tip:{value:0},localTip:{value:0},joint:{value:0},dorsal:{value:-90},backward:{value:1},active:false};open.set(key,e);}e.samples++;e.end=time;e.lastBad=time;for(const metric of ['tip','localTip','joint','dorsal'])if(metrics[metric]>e[metric].value)e[metric]={value:metrics[metric],time,joint:metric==='joint'?metrics.jointIndex:null,context:contextAt(g,time)};if(metrics.forward<e.backward.value)e.backward={value:metrics.forward,time,context:contextAt(g,time)};e.active||=!!metrics.active;}
for(let frame=Math.max(0,first-1);frame<=last;frame++){
 const time=Math.min(frame/fps,score.duration);pose(time);counts.frames++;
 for(const g of fingers){const {h,f,key}=g,tip=wp(f.tip),wrist=wp(h.wrist),inv=h.wrist.getWorldQuaternion(new T.Quaternion()).invert(),localTip=tip.clone().sub(wrist).applyQuaternion(inv),qs=f.bones.map(b=>b.quaternion.clone()),dir=wp(f.bones[1]).sub(wp(f.bones[0])).normalize().applyQuaternion(inv),active=g.notes.some(n=>time>=n.time&&time<n.time+n.duration),old=previous.get(key);
  if(old&&time>old.time){const dt=time-old.time,speed=tip.distanceTo(old.tip)/dt,localSpeed=localTip.distanceTo(old.localTip)/dt,jointSpeeds=qs.map((q,j)=>q.angleTo(old.qs[j])*deg/dt),turn=Math.max(...jointSpeeds),jointIndex=jointSpeeds.indexOf(turn)+1,dorsal=Math.asin(T.MathUtils.clamp(-dir.z,-1,1))*deg,metrics={tip:speed,localTip:localSpeed,joint:turn,jointIndex,dorsal,forward:dir.y,active};
   const m=maxima[key]??={tip:{value:0},joint:{value:0},dorsal:{value:-90}};for(const metric of ['tip','joint','dorsal'])if(metrics[metric]>m[metric].value)m[metric]={value:metrics[metric],time,joint:jointIndex,context:contextAt(g,time)};
   if(speed>3)counts.speedAbove3++;if(speed>5)counts.speedAbove5++;if(turn>2000){counts.rotationAbove2000++;if(active)counts.activeRotationAbove2000++;}
   if(speed>thresholds.tipSpeed||turn>thresholds.jointSpeed||dorsal>thresholds.dorsalDegrees||dir.y<thresholds.backward)record(g,time,metrics);
  }
  previous.set(key,{time,tip,localTip,qs});
 }
 for(const c of performer.contacts)maxContact=Math.max(maxContact,c.error);
 if(frame>first&&(frame-first)%10000===0)console.log(JSON.stringify({part,frame,last,time}));
}
events.push(...open.values());const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');const report={part,parts,fps,first,last,counts,thresholds,maxContactMm:maxContact*1000,inputSha256:{rig:sha('pianist.ts'),score:sha('score.json'),plan:sha('motion-plan.json')},maxima,events};
fs.writeFileSync('scan-'+part+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({part,counts,events:events.length,maxTip:Math.max(...Object.values(maxima).map(m=>m.tip.value)),maxTurn:Math.max(...Object.values(maxima).map(m=>m.joint.value)),maxContactMm:report.maxContactMm}));
