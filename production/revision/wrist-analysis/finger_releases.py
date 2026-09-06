#!/usr/bin/env python3
import json,math
from pathlib import Path
r=Path(__file__).resolve().parent;s=json.loads((r/'planned-score.json').read_text());original=json.loads((r/'input-score.json').read_text())
BLACK={1,3,6,8,10}
def x(m):return -.611+sum(n%12 not in BLACK for n in range(21,m))*.0235+(-.0015 if m%12 in BLACK else .01175)
def continuous(a,b):
 if b-a<.000001:return True
 value=0
 for e in s['pedals']:
  if e['time']<=a:value=e['value']
  if a<e['time']<b-.001 and e['value']<.1:return False
 return value>.1
changes=[];unresolved=[]
for hand in ('L','R'):
 for finger in range(1,6):
  ns=[n for n in s['notes'] if n['hand']==hand and n['finger']==finger]
  for a,b in zip(ns,ns[1:]):
   if a['midi']==b['midi']:continue
   distance=math.hypot(x(b['midi'])-x(a['midi']),(.20 if b['midi']%12 in BLACK else .25)-(.20 if a['midi']%12 in BLACK else .25))
   needed=max(.050,1.5*distance/1.7);oldEnd=a['time']+a['duration'];gap=b['time']-oldEnd
   if gap>=needed:continue
   release=b['time']-needed
   if a['role']=='melody':
    entries=[c for c in original['notes'] if c['role']=='countermelody' and c['hand']==hand and a['time']<c['time']<oldEnd-.02]
    if entries and release<max(c['time'] for c in entries)+.025:
     unresolved.append({'id':a['id'],'next':b['id'],'reason':'held soprano entry','gap':gap,'need':needed});continue
   if release<a['time']+.045 or not continuous(release,oldEnd):
    unresolved.append({'id':a['id'],'next':b['id'],'reason':'short attack or pedal clearance','gap':gap,'need':needed});continue
   a.setdefault('writtenDuration',a['duration']);old=a['duration'];a['duration']=round(release-a['time'],6)
   changes.append({'id':a['id'],'next':b['id'],'hand':hand,'finger':finger,'oldDuration':old,'duration':a['duration'],'advanceMs':1000*(old-a['duration']),'requiredGap':needed})
(r/'planned-score.json').write_text(json.dumps(s)+'\n');report={'changes':len(changes),'unresolved':len(unresolved),'details':changes,'unresolvedDetails':unresolved};(r/'finger-release-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='details'},indent=2))
