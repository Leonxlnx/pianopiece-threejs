const p299Ease=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
function p299Idle(player:OriginalPianist,time:number){
 if(time<=65.9||time>=67.016236)return;
 const hand=player.hands[1];
 for(const fi of [1,3]){
  if(hand.notes.some(n=>n.finger===fi+1&&n.time<=time&&n.time+n.duration>time))continue;
  let previous:Note|undefined,next:Note|undefined;for(const n of hand.fingerNotes[fi]){if(n.time+n.duration<=time)previous=n;else if(n.time>=time){next=n;break;}}
  if(!previous||!next)continue;
  let amount=0;
  if(fi===1&&previous.id==='p00285'&&next.id==='p00302')amount=10*p299Ease((time-65.9)/.13)*p299Ease((next.time-time)/.27);
  if(fi===3&&previous.id==='p00296'&&next.id==='p00301')amount=15*p299Ease((time-previous.time-previous.duration)/0.1)*p299Ease((next.time-time)/0.1);
  if(!amount)continue;
  const bone=hand.fingers[fi].bones[0],wristQ=hand.wrist.getWorldQuaternion(new THREE.Quaternion()),axis=v3(-1,0,0).applyQuaternion(wristQ),parentQ=bone.parent!.getWorldQuaternion(new THREE.Quaternion()),worldQ=new THREE.Quaternion().setFromAxisAngle(axis,amount*Math.PI/180);
  bone.quaternion.premultiply(parentQ.clone().invert().multiply(worldQ).multiply(parentQ));bone.updateWorldMatrix(false,true);
 }
}
export class Pianist extends OriginalPianist {
 plannedPose(hand:HandRig,time:number){const pose=super.plannedPose(hand,time);if(hand.side==='R'){const w=p299Ease((time-66.18)/(66.30195-66.18))*(1-p299Ease((time-66.54)/(66.668093-66.54)));pose.position.x-=.035*w;}return pose;}
 update(time:number,score:Score,piano:GrandPiano,pedal:number,energy:number){super.update(time,score,piano,pedal,energy);p299Idle(this,time);}
}
