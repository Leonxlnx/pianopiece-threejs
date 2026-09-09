import fs from 'node:fs';import{performer,update,T}from'../climax-nonthumb-continuity/harness.mjs';
const result=[];
for(const[a,b]of[[159.48,159.7],[163.20,163.55]]){let prev;const r={interval:[a,b],maxJoint:[0,0,0],maxTip:0,times:[0,0,0],tipTime:0};for(let i=0;i<=Math.round((b-a)*1000);i++){const time=a+i/1000;update(time);const f=performer.hands[1].fingers[0],q=f.bones.map(b=>b.quaternion.clone()),tip=f.tip.getWorldPosition(new T.Vector3());if(prev){for(let j=0;j<3;j++){const v=q[j].angleTo(prev.q[j])/.001;if(v>r.maxJoint[j]){r.maxJoint[j]=v;r.times[j]=time;}}const v=tip.distanceTo(prev.tip)/.001;if(v>r.maxTip){r.maxTip=v;r.tipTime=time;}}prev={q,tip};}result.push(r);}
fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2));console.log(JSON.stringify(result));
