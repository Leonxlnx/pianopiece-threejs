import pathlib,json
P=pathlib.Path(__file__).parent;B=P.parent/'integrated-review'
score=json.loads((B/'score-v11.json').read_text())
for id,end in [('p00296',66.18),('p00299',66.54)]:
 n=next(n for n in score['notes'] if n['id']==id);n.setdefault('writtenDuration',n['duration']);n['duration']=end-n['time']
next(n for n in score['notes']if n['id']=='p00299').update(finger=5,contactZ=.270,contactLift=.003)
(P/'candidate-score.json').write_text(json.dumps(score,separators=(',',':')))
extension='''
const phraseEase=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
export class Pianist extends OriginalPianist {
 plannedPose(hand,time){const pose=super.plannedPose(hand,time);if(hand.side==='R'){const w=phraseEase((time-66.18)/(66.30195-66.18))*(1-phraseEase((time-66.54)/(66.668093-66.54)));pose.position.x-=.035*w;}return pose;}
}
'''
for kind,name in [('mjs','candidate.mjs'),('ts','candidate-native.ts')]:
 s=(B/('pianist-candidate-baked.'+kind)).read_text().replace('export class Pianist','class OriginalPianist')
 if kind=='ts':s='// @ts-nocheck\n'+s.replace('async load(score:Score,preparedModel?:THREE.Group){','async load(score:Score,preparedModel?:THREE.Group){\n for(const [id,end]of [["p00296",66.18],["p00299",66.54]]){const n=score.notes.find(n=>n.id===id)!;n.writtenDuration??=n.duration;n.duration=Number(end)-n.time;}Object.assign(score.notes.find(n=>n.id==="p00299")!,{finger:5,contactZ:.270,contactLift:.003});')
 (P/name).write_text(s+extension)
