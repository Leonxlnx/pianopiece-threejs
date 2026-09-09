
// Authored local joint triples sampled from actual endpoints and the clean
// departure pose. Bound to real finger gaps; no live-key IK plane in transit.
const climaxThumbCurves = [{"side":"L","previous":"p00717","previousEnd":159.007812,"next":"p00720","nextTime":159.159706,"knots":[{"time":159.08,"q":[[0.19935835458720774,-0.4196751987049543,0.42625898791429834,0.7761650899061974],[-0.022386235424429746,0.395246957756256,0.0031919725427519696,0.9182965262698277],[-0.006259220784274655,0.38397240656393794,-0.004846495068616674,0.9233106327982048]]},{"time":159.13,"q":[[0.5620542039160664,-0.2769894797373483,0.31088211543283334,0.714649705509443],[-0.4240288510849169,0.35724738164610315,0.06046673019373966,0.830010612157632],[-0.12200164193253055,0.3793856211469744,-0.09447244929809656,0.9122812648280736]]}]},{"side":"R","previous":"p00691","previousEnd":153.403546,"next":"p00721","nextTime":159.181206,"knots":[{"time":159.1,"q":[[0.18688507747278701,0.7973211164992682,-0.2306614847161606,0.5254981326012201],[-0.022389795241872096,-0.3952463993713896,-0.0031899699078017443,0.9182966867766469],[-0.006259353783984123,-0.38397274011256916,0.00484516080351069,0.9233105001880144]]},{"time":159.15,"q":[[0.5516408272269527,0.6964898785337075,-0.2088449786164586,0.40862945320633737],[-0.46224644901314527,-0.3496051679406468,-0.06592091961876159,0.8122554273629368],[-0.13379335310863122,-0.37844725132301854,0.10359902855682862,0.9100243172092065]]}]},{"side":"L","previous":"p00720","previousEnd":159.374607,"next":"p00737","nextTime":161.826373,"knots":[{"time":159.42,"q":[[0.4934638535603837,-0.2987731452669487,0.21870653326946157,0.7870168251641851],[-0.427454107032563,0.3565958001468686,0.060955176407105884,0.8284967641263227],[-0.12304937501645613,0.37930580509522405,-0.09528376878523673,0.9120893382422604]]},{"time":159.47,"q":[[0.12984643104048182,-0.4097100518784169,0.356798093873369,0.8294411974904541],[-0.022386235424430023,0.39524695775625623,0.0031919725427518725,0.9182965262698279],[-0.006259220784272879,0.38397240656393755,-0.0048464950686158415,0.9233106327982055]]}]}];
function climaxThumbContinuity(player:OriginalPianist,time:number){
 for(const c of climaxThumbCurves){
  const first=c.knots[0],last=c.knots[c.knots.length-1];if(time<first.time||time>last.time)continue;
  const hand=player.hands.find(h=>h.side===c.side)!;const notes=hand.fingerNotes[0];
  if(notes.some(n=>n.time<=time&&n.time+n.duration>time))continue;
  const previous=notes.filter(n=>n.time+n.duration<=time).at(-1),next=notes.find(n=>n.time>=time);
  if(previous?.id!==c.previous||next?.id!==c.next||Math.abs(previous.time+previous.duration-c.previousEnd)>1e-7||Math.abs(next.time-c.nextTime)>1e-7)continue;
  let index=1;while(index<c.knots.length-1&&time>c.knots[index].time)index++;
  const a=c.knots[index-1],b=c.knots[index],u=clamp((time-a.time)/(b.time-a.time)),weight=u*u*u*(10+u*(-15+6*u));
  hand.fingers[0].bones.forEach((bone,j)=>{const qa=new THREE.Quaternion().fromArray(a.q[j]),qb=new THREE.Quaternion().fromArray(b.q[j]);bone.quaternion.copy(qa.slerp(qb,weight));bone.updateWorldMatrix(false,true);});
 }
}
