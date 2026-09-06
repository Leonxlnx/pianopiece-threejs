#!/usr/bin/env python3
import json
from collections import Counter
from pathlib import Path
r=Path(__file__).resolve().parent
before=json.loads((r/'input-score.json').read_text());after=json.loads((r/'planned-score.json').read_text())
old={n['id']:n for n in before['notes']};new={n['id']:n for n in after['notes']};errors=[]
for nid,a in old.items():
 b=new[nid]
 for k in ['time','midi','velocity','hand','role']:
  if a[k]!=b[k]:errors.append(f'{nid} changed {k}')
 if not .04<=b['duration']<=a['duration']+.000001:errors.append(f'{nid} invalid release')
held=0
for c in before['notes']:
 if c['role']!='countermelody':continue
 for n in before['notes']:
  if n['role']=='melody' and n['hand']==c['hand'] and n['time']<c['time'] and n['time']+n['duration']>c['time']+.02:
   held+=1
   if new[n['id']]['time']+new[n['id']]['duration']<=c['time']+.02:errors.append(f'held soprano lost at counter entry {n["id"]}')
   if new[n['id']]['finger']==new[c['id']]['finger']:errors.append('held soprano finger conflict')
events=[]
for n in after['notes']:events.extend([(n['time'],1,n),(round(n['time']+n['duration'],6),0,n)])
active={};poly={'L':0,'R':0};span={'L':0,'R':0}
for t,on,n in sorted(events,key=lambda e:(e[0],e[1])):
 if not on:active.pop(n['id'],None);continue
 active[n['id']]=n
 if any(v>1 for v in Counter(n['midi'] for n in active.values()).values()):errors.append('double key')
 for h in ('L','R'):
  ns=sorted([a for a in active.values() if a['hand']==h],key=lambda a:a['midi']);fs=[a['finger'] for a in ns];width=ns[-1]['midi']-ns[0]['midi'] if ns else 0
  poly[h]=max(poly[h],len(ns));span[h]=max(span[h],width)
  if len(ns)>5 or width>12 or len(fs)!=len(set(fs)) or fs!=sorted(fs,reverse=h=='L'):errors.append(f'invalid hand at{t}')
report={'passed':not errors,'noteCount':len(new),'unchangedAttacksPitchesVelocities':True,'heldSopranoEntriesRetained':held,'maxPolyphony':poly,'maxSpan':span,'changedFingerAssignments':sum(old[k]['finger']!=new[k]['finger'] for k in old),'changedPhysicalReleases':sum(abs(old[k]['duration']-new[k]['duration'])>.000001 for k in old),'errors':errors}
(r/'score-gates.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));raise SystemExit(bool(errors))
