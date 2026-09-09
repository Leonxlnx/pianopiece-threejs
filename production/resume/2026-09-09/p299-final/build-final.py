import pathlib,json,re
P=pathlib.Path(__file__).parent;B=P.parent/'integrated-review'
score=json.loads((B/'score-v11.json').read_text())
for id,end in [('p00296',66.18),('p00299',66.54)]:
 n=next(n for n in score['notes'] if n['id']==id);n.setdefault('writtenDuration',n['duration']);n['duration']=end-n['time']
next(n for n in score['notes']if n['id']=='p00299').update(finger=5,contactZ=.270,contactLift=.003)
(P/'candidate-score.json').write_text(json.dumps(score,separators=(',',':')))
extension='''
const p299Ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
function p299Idle(player,time){
 if(time<=64.184354||time>=67.016236)return;
 const hand=player.hands[1];
 for(const fi of [1,3]){
  if(hand.notes.some(n=>n.finger===fi+1&&n.time<=time&&n.time+n.duration>time))continue;
  let previous,next;for(const n of hand.fingerNotes[fi]){if(n.time+n.duration<=time)previous=n;else if(n.time>=time){next=n;break;}}
  if(!previous||!next)continue;
  let amount=0;
  if(fi===1&&previous.id==='p00285'&&next.id==='p00302'){const since=time-previous.time-previous.duration;amount=10*p299Ease((time-65.9)/.13)*p299Ease((next.time-time)/.30)+5*p299Ease(since/.025)*(1-p299Ease((since-.05)/.10));}
  if(fi===3&&previous.id==='p00296'&&next.id==='p00301')amount=15*p299Ease((time-previous.time-previous.duration)/.10)*p299Ease((next.time-time)/.10);
  if(!amount)continue;
  const bone=hand.fingers[fi].bones[0],wristQ=hand.wrist.getWorldQuaternion(new THREE.Quaternion()),axis=v3(-1,0,0).applyQuaternion(wristQ),parentQ=bone.parent.getWorldQuaternion(new THREE.Quaternion()),worldQ=new THREE.Quaternion().setFromAxisAngle(axis,amount*Math.PI/180);
  bone.quaternion.premultiply(parentQ.clone().invert().multiply(worldQ).multiply(parentQ));bone.updateWorldMatrix(false,true);
 }
}
export class Pianist extends OriginalPianist {
 plannedPose(hand,time){const pose=super.plannedPose(hand,time);if(hand.side==='R'){const w=p299Ease((time-66.18)/(66.30195-66.18))*(1-p299Ease((time-66.54)/(66.668093-66.54)));pose.position.x-=.035*w;}return pose;}
 update(...args){super.update(...args);p299Idle(this,args[0]);}
}
'''
(P/'candidate-extension.js').write_text(extension)
for kind,name in [('mjs','candidate.mjs'),('ts','candidate-native.ts')]:
 s=(B/('pianist-candidate-baked.'+kind)).read_text().replace('export class Pianist','class OriginalPianist')
 old=r'"previous":\s*"p00293",\s*"previousEnd":\s*65\.563664,\s*"next":\s*"p00309"';new='"previous": "p00299", "previousEnd": 66.54, "next": "p00309"'
 s,count=re.subn(old,new,s);assert count==1
 if kind=='ts':s='// @ts-nocheck\n'+s.replace('async load(score:Score,preparedModel?:THREE.Group){','async load(score:Score,preparedModel?:THREE.Group){\n for(const [id,end]of [["p00296",66.18],["p00299",66.54]]){const n=score.notes.find(n=>n.id===id)!;n.writtenDuration??=n.duration;n.duration=Number(end)-n.time;}Object.assign(score.notes.find(n=>n.id==="p00299")!,{finger:5,contactZ:.270,contactLift:.003});')
 (P/name).write_text(s+extension)
