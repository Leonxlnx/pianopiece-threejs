#!/usr/bin/env python3
import json,itertools,math,statistics
from pathlib import Path
ROOT=Path(__file__).resolve().parent
score=json.loads(Path('/workspace/sites/daybreak-piano-film/public/assets/score.json').read_text())
BLACK={1,3,6,8,10}
def keyx(m):return -.611+sum(n%12 not in BLACK for n in range(21,m))*.0235+(-.0015 if m%12 in BLACK else .01175)
offset={'L':[.070,.032,.008,-.022,-.055],'R':[-.070,-.032,-.008,.022,.055]}
changes=[];summary=[]
for hand in ('L','R'):
 ns=[n for n in score['notes'] if n['hand']==hand]
 lifts={f:statistics.median([n.get('contactLift',.002) for n in ns if n['finger']==f] or [.002]) for f in range(1,6)}
 groups=[]
 for n in ns:
  if groups and n['time']-groups[-1][0]['time']<.045:groups[-1].append(n)
  else:groups.append([n])
 # State carries fixed fingers of held keys and a backpointer. Equivalent
 # held-state/center buckets are merged, then the best 120 are retained.
 beam=[{'cost':0,'held':{},'center':None,'last':None,'parent':None,'assignment':{}}]
 for gi,g in enumerate(groups):
  t=g[0]['time'];ordered=sorted(g,key=lambda n:n['midi']);candidates={}
  for prev in beam:
   held={nid:v for nid,v in prev['held'].items() if v[2]>t+.00001}
   occupied={v[1] for v in held.values()}
   for combo in itertools.combinations([f for f in range(1,6) if f not in occupied],len(ordered)):
    fingers=tuple(reversed(combo)) if hand=='L' else combo
    fixed=dict(held)
    for n,f in zip(ordered,fingers):fixed[n['id']]=(n['midi'],f,n['time']+n['duration'])
    allheld=sorted(fixed.values());fs=[v[1] for v in allheld]
    if fs!=sorted(fs,reverse=hand=='L'):continue
    centers=[keyx(m)-offset[hand][f-1] for m,f,_ in allheld]
    center=sum(centers)/len(centers)
    spread=sum((x-center)**2 for x in centers)
    cost=prev['cost']+spread*1100
    if prev['center'] is not None:
     gap=max(.035,t-prev['last']['end'])
     if held:gap=max(.16,t-prev['last']['time'])
     dx=center-prev['center']
     # Higher than quadratic for a fast jump, preventing a single very bad
     # hand substitution in exchange for many small local improvements.
     v=abs(dx)/gap
     cost+=dx*dx*80+v*v*.7+max(0,v-.7)**4*.6
     if not held and len(g)==1 and len(prev['assignment'])==1:
      oldf=list(prev['assignment'].values())[0]
      oldm=prev['last']['midi']
      if oldf==fingers[0] and oldm!=ordered[0]['midi']:cost+=.025
    # Small preference for natural long-finger contact, never enough to force
    # the wrist to jump merely to satisfy a nominal fingering template.
    cost+=sum(.006 if n['midi']%12 in BLACK and f==1 else 0 for n,f in zip(ordered,fingers))
    state={'cost':cost,'held':fixed,'center':center,'last':{'time':t,'end':max(n['time']+n['duration'] for n in g),'midi':g[-1]['midi']},'parent':prev,'assignment':{n['id']:f for n,f in zip(ordered,fingers)}}
    key=(tuple((nid,v[1]) for nid,v in sorted(fixed.items())),round(center/.008))
    if key not in candidates or cost<candidates[key]['cost']:candidates[key]=state
  if not candidates:raise RuntimeError(('no fingering',hand,gi,t))
  beam=sorted(candidates.values(),key=lambda s:s['cost'])[:120]
 best=beam[0];assignment={}
 while best['parent'] is not None:
  assignment.update(best['assignment']);best=best['parent']
 for n in ns:
  f=assignment[n['id']]
  if n['finger']!=f:changes.append({'id':n['id'],'hand':hand,'old':n['finger'],'new':f,'time':n['time'],'midi':n['midi']})
  n['finger']=f;n['contactLift']=lifts[f]
 summary.append({'hand':hand,'groups':len(groups),'cost':beam[0]['cost']})
# Exact simultaneous ordering and finger uniqueness after refingering.
errors=[]
for i,a in enumerate(score['notes']):
 for b in score['notes'][i+1:]:
  if b['time']>=a['time']+a['duration']-.000001:break
  if a['hand']==b['hand']:
   if a['finger']==b['finger']:errors.append('shared finger')
   d=(a['midi']-b['midi'])*(a['finger']-b['finger'])
   if (a['hand']=='R' and d<0) or (a['hand']=='L' and d>0):errors.append('crossed grip')
assert not errors,errors
(ROOT/'score-refingered.json').write_text(json.dumps(score,separators=(',',':'))+'\n')
report={'changes':len(changes),'summary':summary,'errors':errors,'details':changes}
(ROOT/'refinger-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='details'},indent=2))
