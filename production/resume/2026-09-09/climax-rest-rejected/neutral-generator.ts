// A complete resting posture in the wrist frame. Curvature and phalanx roll
// remain linked while a single MCP lift clears the keyboard height envelope.
function curvedNeutral(player:OriginalPianist,hand:HandRig,fi:number,fan:number){
 const f=hand.fingers[fi],q=hand.wrist.getWorldQuaternion(new THREE.Quaternion()),origin=wp(f.bones[0]),world:THREE.Quaternion[]=[];
 if(fi===0){
  const reach=f.lengths.reduce((a,b)=>a+b,0),touch=origin.clone().add(v3(.28*(hand.side==='L'?-1:1),.50,-.14).multiplyScalar(reach).applyQuaternion(q));
  touch.y=Math.max(touch.y,KEY_TOP+.018);
  const chain=player.fingerPoints(origin,touch,f,fi,q),p=[origin,chain.pip,chain.dip,chain.tip];
  for(let j=0;j<3;j++){const dir=p[j+1].clone().sub(p[j]).normalize(),normal=chain.normal;world.push(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]));}
 }else{
  const normal=v3(-Math.cos(fan),Math.sin(fan),0).applyQuaternion(q),angles=[-25,35,65].map(a=>a*Math.PI/180);
  const dirs=(lift:number)=>angles.map(angle=>v3(Math.sin(fan)*Math.cos(angle-lift),Math.cos(fan)*Math.cos(angle-lift),Math.sin(angle-lift)).applyQuaternion(q));
  const clears=(lift:number)=>{let point=origin.clone();return dirs(lift).every((dir,j)=>{point.addScaledVector(dir,f.lengths[j]);return point.y>=KEY_TOP+mix(.030,.017,smooth((point.z-.230)/.030));});};
  let low=0,high=.85;if(clears(0))high=0;else for(let i=0;i<14;i++){const mid=(low+high)/2;if(clears(mid))high=mid;else low=mid;}
  for(const [j,dir] of dirs(high).entries())world.push(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]));
 }
 return world.map((rotation,j)=>(j===0?q:world[j-1]).clone().invert().multiply(rotation));
}
function coordinatedRest(player:OriginalPianist,time:number){
 for(const hand of player.hands){
  const q=hand.wrist.getWorldQuaternion(new THREE.Quaternion()),inverse=q.clone().invert();let fanSum=0,fanWeight=.35;
  // Held proximal directions guide the free fingers as one ordered fan.
  // Contact-weight fades keep the rest pose continuous when notes enter/leave.
  for(let fi=1;fi<5;fi++){const note=hand.fingerNotes[fi].find(n=>n.time<time&&n.time+n.duration>time);if(!note)continue;
   const amount=smooth((time-note.time)/.08)*smooth((note.time+note.duration-time)/.08),f=hand.fingers[fi],dir=wp(f.bones[1]).sub(wp(f.bones[0])).applyQuaternion(inverse);
   fanSum+=clamp(Math.atan2(dir.x,dir.y),-.95,.95)*amount;fanWeight+=amount;
  }
  const fan=fanSum/fanWeight;
  for(let fi=0;fi<5;fi++){
   const notes=hand.fingerNotes[fi];if(notes.some(n=>n.time<=time&&n.time+n.duration>time))continue;
   const previous=notes.filter(n=>n.time+n.duration<=time).at(-1),next=notes.find(n=>n.time>=time);if(!previous||!next)continue;
   const end=previous.time+previous.duration,start=next.time;
   // Local review scope only: full long gaps intersecting the flagged window.
   if(start-end<.50||end>=160.5||start<=158.5||time<=end||time>=start)continue;
   const weight=smooth((time-end)/.22)*smooth((start-time)/.30),neutral=curvedNeutral(player,hand,fi,fan);
   hand.fingers[fi].bones.forEach((bone,j)=>{bone.quaternion.slerp(neutral[j],weight);bone.updateWorldMatrix(false,true);});
  }
 }
}
