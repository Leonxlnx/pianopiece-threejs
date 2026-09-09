function releaseRepair(player,time){
 const envelope=smooth((time-106.65)/.13)*(1-smooth((time-107.35)/.20));if(envelope===0)return;
 const hand=player.hands[1];
 for(let fi=1;fi<5;fi++){
  if(hand.notes.some(n=>n.finger===fi+1&&n.time<=time&&n.time+n.duration>time))continue;
  const f=hand.fingers[fi],ns=hand.fingerNotes[fi];let previous,next;for(const n of ns){if(n.time+n.duration<=time)previous=n;else if(n.time>=time){next=n;break;}}
  const contact=(note,at)=>{const anchor=player.plannedPose(hand,at),origin=f.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??player.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),keySurfaceY(note.midi,z,1)+(note.contactLift??.002),z),chain=player.fingerPoints(origin,touch,f,fi,anchor.q),points=[origin,chain.pip,chain.dip,chain.tip],world=f.bones.map((b,j)=>{const dir=points[j+1].clone().sub(points[j]).normalize(),normal=chain.normal;return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]);});return world.map((q,j)=>(j===0?anchor.q:world[j-1]).clone().invert().multiply(q));};
  let rotations=f.rest.map(q=>q.clone());
  if(fi===1&&previous&&next&&['p00519','p00524'].includes(previous.id)){
   const end=previous.time+previous.duration,gap=next.time-end,u=(time-end)/gap,a=contact(previous,end),b=contact(next,next.time);rotations=a.map((q,j)=>q.slerp(b[j],smooth(u)));rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(-1,0,0),Math.sin(u*Math.PI)**2*30*Math.PI/180));
  }else{
   const since=previous?time-previous.time-previous.duration:100,before=next?next.time-time:100;
   const w=smooth(since/.19)*smooth(before/.27);rotations.forEach((q,j)=>q.copy(f.bones[j].quaternion).slerp(f.rest[j],w));
  }
  f.bones.forEach((b,j)=>{b.quaternion.slerp(rotations[j],envelope);b.updateWorldMatrix(false,true);});
 }
}
export class Pianist extends OriginalPianist {update(...args){super.update(...args);releaseRepair(this,args[0]);}}
