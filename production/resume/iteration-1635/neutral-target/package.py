import json,pathlib,hashlib,collections
p=pathlib.Path('.');screen=json.loads((p/'screen-report.json').read_text());score=json.loads((p/'baseline-score.json').read_text());groups={}
for r in screen['regressions']:
 c=r['context'];key=(r['side'],r['finger'],r['active'],c['previous'] if c else None,c['next']if c else None)
 if key not in groups:groups[key]=dict(side=r['side'],finger=r['finger'],activeNote=r['active'],context=c,times=[],maxBaselineCoreMm=0,maxCandidateCoreMm=0,newCoreSamples=0,newPalmSamples=0,newNeighborSamples=0,newNeighborPairs=[])
 g=groups[key];g['times'].append(r['time']);g['maxBaselineCoreMm']=max(g['maxBaselineCoreMm'],r['baseline']['keyCoreMm']);g['maxCandidateCoreMm']=max(g['maxCandidateCoreMm'],r['candidate']['keyCoreMm']);g['newCoreSamples']+=r['newCore'];g['newPalmSamples']+=r['newPalm'];g['newNeighborSamples']+=bool(r['newNeighbor']);g['newNeighborPairs'].extend(r['newNeighbor'])
queue=list(groups.values())
for q in queue:q['times']=sorted(set(q['times']));q['start']=q['times'][0];q['end']=q['times'][-1];q['newNeighborPairs']=list({(x['a'],x['b'],x['pairs']):x for x in q['newNeighborPairs']}.values())
queue.sort(key=lambda q:(-q['maxCandidateCoreMm'],-q['newNeighborSamples']));(p/'regression-queue.json').write_text(json.dumps(queue,indent=2)+'\n')
segs=json.loads((p/'qualified-segments.json').read_text());sub=[]
for seg in segs:
 notes=[n for n in score['notes'] if n['time']<=seg['end'] and n['time']+n['duration']>=seg['start']];sub.append(dict(**seg,heldNotes=notes,qualification='Observed with candidate active globally; both hands core<=3mm, all exact owned/neighbor pairs zero, point contact<=0.2mm at 240Hz plus local event boundaries. A conditional runtime activation/blend is NOT validated.'))
(p/'qualification-subset.json').write_text(json.dumps(sub,indent=2)+'\n')
print('queue groups',len(queue),'segment duration',sum(s['duration']for s in segs),'segment samples',sum(s['samples']for s in segs))
