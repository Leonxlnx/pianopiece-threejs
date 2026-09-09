import json,pathlib,collections
p=pathlib.Path('.');rows=[json.loads(x)for x in (p/'screen-rows.jsonl').read_text().splitlines()];score=json.loads((p/'baseline-score.json').read_text());bad=set((r['kind'],r['time'])for r in json.loads((p/'screen-report.json').read_text())['regressions']);good=[]
def summary(hands):return dict(core=max([0]+[h['depth']for r in hands for h in r['keyHits']]),pairs=sum(c['trianglePairs']for r in hands for c in r['crossings']),point=max([0]+[c['error']*1000 for r in hands for c in r['contacts']]))
for row in rows:
 a=summary(row['baseline']);b=summary(row['candidate']);regression=(row['kind'],row['time'])in bad
 if b['core']<=3 and not b['pairs'] and b['point']<=.2 and not regression:
  good.append(dict(time=row['time'],kind=row['kind'],baseline=a,candidate=b,improved=a['core']>3 or a['pairs']>0))
(p/'qualified-midpoints.json').write_text(json.dumps(good,indent=2)+'\n');chosen=[]
for r in sorted([r for r in good if r['improved']],key=lambda r:-(r['baseline']['pairs']+r['baseline']['core']*5)):
 if any(abs(r['time']-x['centre'])<1.0 for x in chosen):continue
 t=r['time'];chosen.append(dict(index=len(chosen),centre=t,start=max(0,t-.16),end=min(score['duration'],t+.16),selection=r))
 if len(chosen)==12:break
(p/'qualification-windows.json').write_text(json.dumps(chosen,indent=2)+'\n');print('global midpoint samples clear',len(good),'improved',sum(x['improved']for x in good),'windows',[(x['centre'],x['selection']['baseline'])for x in chosen])
