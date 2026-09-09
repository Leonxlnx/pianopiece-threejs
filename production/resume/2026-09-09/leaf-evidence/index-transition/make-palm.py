import json,pathlib
root=pathlib.Path('/workspace/scratch/2e8cc8e77f98')
base=root/'integrated-review';here=root/'index-transition'
s=json.loads((base/'score-v11.json').read_text());n=next(n for n in s['notes'] if n['id']=='p00524');n.update(finger=3,contactZ=.250,contactLift=.003)
k=next(k for k in s['wristMotion']['hands'][1]['knots'] if k['time']==106.919774);k['position'][1]+=.008
(here/'candidate-score.json').write_text(json.dumps(s,separators=(',',':')))
extension='''
function transitionSmooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
function transitionRepair(player,time){
 if(time<=106.64||time>=107.55)return;
 const hand=player.hands[1],q=hand.wrist.getWorldQuaternion(new THREE.Quaternion());
 const lift=new THREE.Vector3(-1,0,0).applyQuaternion(q),spread=new THREE.Vector3(0,0,-1).applyQuaternion(q);
 for(const fi of [1,3,4]){
  if(hand.notes.some(n=>n.finger===fi+1&&n.time<=time&&n.time+n.duration>time))continue;
  const weight=fi===1?transitionSmooth((time-106.895774)/.045)*(1-transitionSmooth((time-107.194683)/.075)):transitionSmooth((time-106.64)/.16)*(1-transitionSmooth((time-107.35)/.20));
  const values=fi===1?[30,10]:[50,-20],bone=hand.fingers[fi].bones[0];
  for(const [axis,angle]of [[lift,values[0]],[spread,values[1]]]){const world=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromAxisAngle(axis,weight*angle*Math.PI/180));const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion());bone.quaternion.copy(parent.invert().multiply(world));bone.updateWorldMatrix(false,true);}
 }
}
export class Pianist extends OriginalPianist {
 update(...args){super.update(...args);transitionRepair(this,args[0]);}
}
'''
m=(base/'pianist-candidate-baked.mjs').read_text().replace('export class Pianist','class OriginalPianist')+extension
m=m[:m.index('function transitionSmooth')]
m=m.replace('class OriginalPianist','export class Pianist')
m=m.replace("this.chordPalmFrame = hand.side", "this.openingPalmFrame = Math.max(this.openingPalmFrame, hand.side === 'R' ? smooth((time - 106.64)/.18)*(1-smooth((time - 107.36)/.19)) : 0);\n            this.chordPalmFrame = hand.side")
(here/'candidate.mjs').write_text(m)
# Native review embeds exactly the same score delta in load; mutation precedes rig planning.
t=(base/'pianist-candidate-baked.ts').read_text().replace('export class Pianist','class OriginalPianist')
t=t.replace('async load(score:Score,preparedModel?:THREE.Group){','async load(score:Score,preparedModel?:THREE.Group){\n Object.assign(score.notes.find(n=>n.id==="p00524")!,{finger:3,contactZ:.250,contactLift:.003});\n score.wristMotion!.hands.find(h=>h.side==="R")!.knots.find(k=>k.time===106.919774)!.position[1]=.7668;')
t=t.replace('class OriginalPianist','export class Pianist')
t=t.replace("this.chordPalmFrame=","this.openingPalmFrame=Math.max(this.openingPalmFrame,hand.side==='R'?smooth((time-106.64)/.18)*(1-smooth((time-107.36)/.19)):0);this.chordPalmFrame=")
(here/'candidate-native.ts').write_text('// @ts-nocheck\n'+t)
print(here/'candidate.mjs')
