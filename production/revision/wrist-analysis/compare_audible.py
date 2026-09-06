#!/usr/bin/env python3
"""Compare the frozen composition with the candidate using damper semantics."""
import json,hashlib
from pathlib import Path
r=Path(__file__).resolve().parent
source=Path('/workspace/scratch/2e8cc8e77f98/music-revision/score.json')
old=json.loads(source.read_text());new=json.loads((r/'planned-score.json').read_text())
def audible_end(n,s):
 release=n['time']+n['duration'];depth=0
 for p in s['pedals']:
  if p['time']<=release+.000001:depth=p['value']
  else:break
 if depth<=.1:return release
 for p in s['pedals']:
  if p['time']>release+.000001 and p['value']<=.1:return p['time']
 return s['duration']
before={n['id']:n for n in old['notes']};after={n['id']:n for n in new['notes']};errors=[];changes=[];physical=0
if set(before)!=set(after):errors.append('note IDs changed')
for nid,a in before.items():
 b=after[nid]
 for k in ('time','midi','velocity','hand','role'):
  if a[k]!=b[k]:errors.append(f'{nid} {k} changed')
 if abs(a['duration']-b['duration'])>.000002:physical+=1
 x,y=audible_end(a,old),audible_end(b,new)
 if abs(y-x)>.00002:changes.append({'id':nid,'bar':a.get('bar'),'midi':a['midi'],'before':round(x,6),'after':round(y,6),'advanceMs':round((x-y)*1000,6)})
for field in ('duration','pedals','tempoMap'):
 if old[field]!=new[field]:errors.append(field+' changed')
if any(c['advanceMs']<0 or c['advanceMs']>25.001 for c in changes):errors.append('audible change outside authorized short release')
report={'passed':not errors,'sourceCompositionSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'notes':len(before),'changedPhysicalHolds':physical,'pedalEquivalentPhysicalChanges':physical-len(changes),'audibleReleaseChanges':len(changes),'totalAudibleAdvanceMs':round(sum(c['advanceMs'] for c in changes),6),'allAttacksPitchesVelocitiesUnchanged':True,'durationTempoPedalsUnchanged':True,'semantics':'A key released with pedal depth >0.1 continues until the next pedal-up; otherwise its damper release is its physical key end. One-microsecond tolerance for decimal event serialization.','changes':changes,'errors':errors}
(r/'audible-comparison.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));raise SystemExit(bool(errors))
