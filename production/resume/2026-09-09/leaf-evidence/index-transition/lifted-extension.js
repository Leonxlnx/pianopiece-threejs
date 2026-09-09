function phraseRepair(player,time){
 const envelope=smooth((time-106.64)/.10)*(1-smooth((time-107.39)/.16));if(envelope===0)return;
 const hand=player.hands[1];
 for(let fi=1;fi<5;fi++){
  if(hand.notes.some(n=>n.finger===fi+1&&n.time<=time&&n.time+n.duration>time))continue;
  const f=hand.fingers[fi],ns=hand.fingerNotes[fi];let previous,next;for(const n of ns){if(n.time+n.duration<=time)previous=n;else if(n.time>=time){next=n;break;}}
  const neutral=f.rest.map(q=>q.clone());neutral[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(-1,0,0),(fi===1?25:0)*Math.PI/180));
  const contact=(note,at,lift=0)=>{const anchor=player.plannedPose(hand,at),origin=f.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??player.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),keySurfaceY(note.midi,z,1)+(note.contactLift??.002)+lift,z),chain=player.fingerPoints(origin,touch,f,fi,anchor.q),points=[origin,chain.pip,chain.dip,chain.tip],world=f.bones.map((b,j)=>{const dir=points[j+1].clone().sub(points[j]).normalize(),normal=chain.normal;return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]);});return world.map((q,j)=>(j===0?anchor.q:world[j-1]).clone().invert().multiply(q));};
  const rotations=neutral.map(q=>q.clone());
  if(previous){const end=previous.time+previous.duration,since=time-end;if(since<.13){const a=contact(previous,end),lifted=contact(previous,end,.024);if(since<.035){rotations.forEach((q,j)=>q.copy(a[j]).slerp(lifted[j],smooth(since/.035)));}else rotations.forEach((q,j)=>q.copy(lifted[j]).slerp(neutral[j],smooth((since-.035)/.095)));}}
  if(next){const before=next.time-time,down=fi===1?.027:.065;if(before<.23){const b=contact(next,next.time),lifted=contact(next,next.time,.028);if(before<down)rotations.forEach((q,j)=>q.copy(lifted[j]).slerp(b[j],1-smooth(before/down)));else rotations.forEach((q,j)=>q.slerp(lifted[j],1-smooth((before-down)/(.23-down))));}}
  f.bones.forEach((b,j)=>{b.quaternion.slerp(rotations[j],envelope);b.updateWorldMatrix(false,true);});
 }
}
export class Pianist extends OriginalPianist {update(...args){super.update(...args);phraseRepair(this,args[0]);}}
