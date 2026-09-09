import fs from 'node:fs';import zlib from 'node:zlib';import {install,measure,performer,update,T} from './harness.mjs';
const root=new URL('./',import.meta.url),times=JSON.parse(fs.readFileSync(new URL('final-times.json',root))),s=JSON.parse(fs.readFileSync(process.argv[2]));install(s);
const old=JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('../climax-rest-review/baseline-full.json.gz',root)))),reuse=process.argv[4]==='baseline'?new Map(old.rows.map(r=>[r.time+'/'+r.side,r])):new Map();const rows=[];
for(const [i,time]of times.entries()){
 for(const side of ['L','R']){const key=time+'/'+side;if(reuse.has(key)){rows.push(reuse.get(key));continue;}const r=measure(time,side,{opposing:true});r.pose=performer.hands.find(h=>h.side===side).fingers.map(f=>f.bones.map(b=>b.quaternion.toArray()));rows.push(r);}
 if(i%300===0)console.log(i,times.length,time);
}
const motion={};let previous;
for(let i=0;i<=1100;i++){const time=158.90+i*.001;update(time);const now=performer.hands.map(h=>({side:h.side,wrist:h.wrist.getWorldPosition(new T.Vector3()),fingers:h.fingers.map(f=>({tip:f.tip.getWorldPosition(new T.Vector3()),joints:f.bones.map(b=>b.quaternion.clone())}))}));
 if(previous)for(let hi=0;hi<2;hi++){const h=now[hi],old=previous[hi],side=h.side;const w=motion[side+'Wrist']??={maxSpeedMps:0};const speed=h.wrist.distanceTo(old.wrist)/.001;if(speed>w.maxSpeedMps){w.maxSpeedMps=speed;w.time=time;}
  for(let fi=0;fi<5;fi++){const r=motion[side+(fi+1)]??={maxTipMps:0,maxJointRadps:[0,0,0],jointTimes:[0,0,0]};const v=h.fingers[fi].tip.distanceTo(old.fingers[fi].tip)/.001;if(v>r.maxTipMps){r.maxTipMps=v;r.tipTime=time;}for(let j=0;j<3;j++){const speed=h.fingers[fi].joints[j].angleTo(old.fingers[fi].joints[j])/.001;if(speed>r.maxJointRadps[j]){r.maxJointRadps[j]=speed;r.jointTimes[j]=time;}}}
 }previous=now;
}
fs.writeFileSync(process.argv[3],zlib.gzipSync(JSON.stringify({times,min:old.min,max:old.max,rows,motion})));console.log('DONE',rows.length,'hand states');
