
// Keep the already reviewed curved release posture during this long thumb rest.
// The wrist carries the hand while all three local joints retain their relation.
const climaxRightThumbRest=[[0.4131036044501331,0.65746541850643,-0.35640774368231043,0.5196711996077494],[-0.48850149643925833,-0.3438646331371362,-0.06966535475332468,0.7989181061918433],[-0.14203256974801562,-0.3777384330960695,0.10997893281324457,0.908319910400604]];
function relaxedClimaxThumb(player:OriginalPianist,time:number){
 if(time<=159.5||time>=163.525895)return;
 const hand=player.hands[1],ns=hand.fingerNotes[0];
 const previous=ns.filter(n=>n.time+n.duration<=time).at(-1),next=ns.find(n=>n.time>=time);
 if(previous?.id!=='p00721'||next?.id!=='p00750'||Math.abs(previous.time+previous.duration-159.38365)>1e-7||Math.abs(next.time-163.825895)>1e-7)return;
 const w=smooth((time-159.5)/.16)*(1-smooth((time-163.225895)/.30));
 hand.fingers[0].bones.forEach((b,j)=>{b.quaternion.slerp(new THREE.Quaternion().fromArray(climaxRightThumbRest[j]),w);b.updateWorldMatrix(false,true);});
}
