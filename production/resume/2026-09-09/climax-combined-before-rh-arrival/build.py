import pathlib,json
P=pathlib.Path(__file__).parent
data=json.loads((P/'endpoint-data.json').read_text());compact=[]
for c in data['curves']:
 compact.append(dict(side=c['side'],previous=c['previous'],previousEnd=c['previousEnd'],next=c['next'],nextTime=c['nextTime'],knots=[dict(time=k['time'],q=k['localQuaternions'])for k in c['knots']]))
helper='''
// Authored local joint triples sampled from actual endpoints and the clean
// departure pose. Bound to real finger gaps; no live-key IK plane in transit.
const climaxThumbCurves = '''+json.dumps(compact,separators=(',',':'))+''';
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
'''
(P/'continuity-helper.ts').write_text(helper)
s=(P/'input.ts').read_text();marker='export class Pianist extends OriginalPianist {';assert s.count(marker)==1;s=s.replace(marker,helper+'\n'+marker)
old='climaxNonthumbContinuity(this,time);}';assert s.count(old)==1;s=s.replace(old,'climaxNonthumbContinuity(this,time);climaxThumbContinuity(this,time);}')
(P/'candidate.ts').write_text(s)
