/** Pose-only pronation redistribution; use after Pianist.update for comparison. */
export function redistributeForearmTwist(T,pianist,fraction=1,upperFraction=0){
 const rows=[];
 function worldQ(b){return b.getWorldQuaternion(new T.Quaternion());}
 function setQ(b,q){b.quaternion.copy(worldQ(b.parent).invert().multiply(q));b.updateWorldMatrix(false,true);}
 function twistFor(b,child,desired){const current=worldQ(b),delta=current.clone().invert().multiply(desired),axis=child.position.clone().normalize(),dot=axis.x*delta.x+axis.y*delta.y+axis.z*delta.z;const twist=new T.Quaternion(axis.x*dot,axis.y*dot,axis.z*dot,delta.w).normalize();if(twist.w<0)twist.set(-twist.x,-twist.y,-twist.z,-twist.w);return{current,twist,angle:2*Math.atan2(Math.hypot(twist.x,twist.y,twist.z),twist.w)};}
 for(const h of pianist.hands){
  const wq=worldQ(h.wrist),lq=worldQ(h.lower),desired=wq.clone().multiply(pianist.rest.get(h.wrist.name).clone().invert()),{current,twist,angle}=twistFor(h.lower,h.wrist,desired);
  const corrected=current.clone().multiply(new T.Quaternion().slerp(twist,fraction));
  if(upperFraction){
   const desiredUpper=corrected.clone().multiply(pianist.rest.get(h.lower.name).clone().invert()),upper=twistFor(h.upper,h.lower,desiredUpper);
   setQ(h.upper,upper.current.multiply(new T.Quaternion().slerp(upper.twist,upperFraction)));
  }
  setQ(h.lower,corrected);setQ(h.wrist,wq);rows.push({side:h.side,angle:angle*180/Math.PI,applied:angle*fraction*180/Math.PI});
 }
 return rows;
}
