import pathlib,json
P=pathlib.Path(__file__).parent;B=P.parent/'integrated-review'
score=json.loads((B/'score-v11.json').read_text())
for id,end in [('p00296',66.18),('p00299',66.54)]:
 n=next(n for n in score['notes'] if n['id']==id);n.setdefault('writtenDuration',n['duration']);n['duration']=end-n['time']
next(n for n in score['notes']if n['id']=='p00299').update(finger=5,contactZ=.270,contactLift=.003)
(P/'candidate-score.json').write_text(json.dumps(score,separators=(',',':')))
extension='''
const phraseEase=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
function p299Idle(player,time,piano){
 const hand=player.hands[1],config=player.repairConfig??{lift:10,ringLift:10};
 if(time<65.9||time>67.016236)return;
 for(const fi of [1,3]){
  if(hand.notes.some(n=>n.finger===fi+1&&n.time<=time&&n.time+n.duration>time))continue;
  const f=hand.fingers[fi],ns=hand.fingerNotes[fi];let previous,next;for(const n of ns){if(n.time+n.duration<=time)previous=n;else if(n.time>=time){next=n;break;}}
  if(!previous||!next)continue;
  if(config.lift!==undefined){
   let amount=0;if(fi===1&&previous.id==='p00285'&&next.id==='p00302')amount=config.lift*phraseEase((time-65.9)/.13)*phraseEase((next.time-time)/.27);
   if(fi===3&&previous.id==='p00296'&&next.id==='p00301')amount=config.ringLift*Math.sin(Math.PI*(time-previous.time-previous.duration)/(next.time-previous.time-previous.duration))**2;
   const wristQ=hand.wrist.getWorldQuaternion(new THREE.Quaternion()),axis=v3(-1,0,0).applyQuaternion(wristQ);rotate(f.bones[0],axis,amount);continue;
  }
  const contact=(note,at)=>{const anchor=player.plannedPose(hand,at),origin=f.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??player.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),piano.contact(note.midi,z).y+(note.contactLift??.002),z),chain=player.fingerPoints(origin,touch,f,fi,anchor.q),points=[origin,chain.pip,chain.dip,chain.tip],world=f.bones.map((b,j)=>{const dir=points[j+1].clone().sub(points[j]).normalize(),normal=chain.normal;return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]);});return world.map((q,j)=>(j===0?anchor.q:world[j-1]).clone().invert().multiply(q));};
  let rotations,weight=1;
  if(fi===3&&config.ringMode&&previous.id==='p00296'&&next.id==='p00301'){
   const end=previous.time+previous.duration,u=(time-end)/(next.time-end),a=contact(previous,end),b=contact(next,next.time);rotations=a.map((q,j)=>q.slerp(b[j],phraseEase(u)));
  }else if(fi===1&&config.mcp&&previous.id==='p00285'&&next.id==='p00302'){
   weight=phraseEase((time-65.9)/.13)*phraseEase((next.time-time)/.27);
   rotations=f.rest.map(q=>q.clone());const wristQ=hand.wrist.getWorldQuaternion(new THREE.Quaternion()),axis=v3(-1,0,0).applyQuaternion(wristQ);let parentQ=wristQ.clone();for(let j=0;j<3;j++){const angle=[config.mcp,-35,-20][j],localAxis=axis.clone().applyQuaternion(parentQ.clone().invert());rotations[j].premultiply(new THREE.Quaternion().setFromAxisAngle(localAxis,angle*Math.PI/180));parentQ.multiply(rotations[j]);}
  }else continue;
  f.bones.forEach((b,j)=>{b.quaternion.slerp(rotations[j],weight);b.updateWorldMatrix(false,true);});
 }
}
export class Pianist extends OriginalPianist {
 plannedPose(hand,time){const pose=super.plannedPose(hand,time);if(hand.side==='R'){const w=phraseEase((time-66.18)/(66.30195-66.18))*(1-phraseEase((time-66.54)/(66.668093-66.54)));pose.position.x-=.035*w;}return pose;}
 update(...args){super.update(...args);p299Idle(this,args[0],args[2]);}
}
'''
for kind,name in [('mjs','candidate.mjs'),('ts','candidate-native.ts')]:
 s=(B/('pianist-candidate-baked.'+kind)).read_text().replace('export class Pianist','class OriginalPianist')
 s=s.replace('"previous": "p00293", "previousEnd": 65.563664, "next": "p00309"','"previous": "p00299", "previousEnd": 66.54, "next": "p00309"')
 if kind=='ts':s='// @ts-nocheck\n'+s.replace('async load(score:Score,preparedModel?:THREE.Group){','async load(score:Score,preparedModel?:THREE.Group){\n for(const [id,end]of [["p00296",66.18],["p00299",66.54]]){const n=score.notes.find(n=>n.id===id)!;n.writtenDuration??=n.duration;n.duration=Number(end)-n.time;}Object.assign(score.notes.find(n=>n.id==="p00299")!,{finger:5,contactZ:.270,contactLift:.003});')
 (P/name).write_text(s+extension)
