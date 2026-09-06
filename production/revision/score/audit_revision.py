#!/usr/bin/env python3
"""Independent consumer-side check. Reads only score.json, never the composer."""
import json
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parent
s=json.loads((ROOT/'score.json').read_text())
ns=s['notes']; errors=[]; overlaps=0
for i,a in enumerate(ns):
    for b in ns[i+1:]:
        if b['time']>=a['time']+a['duration']-.000001: break
        overlaps+=1
        if a['midi']==b['midi']: errors.append(f'double key: {a["id"]}, {b["id"]}')
        if a['hand']==b['hand']:
            if a['finger']==b['finger']: errors.append('same finger simultaneously')
            if abs(a['midi']-b['midi'])>12: errors.append('simultaneous span beyond octave')
            direction=(a['midi']-b['midi'])*(a['finger']-b['finger'])
            if (a['hand']=='R' and direction<0) or (a['hand']=='L' and direction>0): errors.append('crossed held fingers')

finger_counts={h:dict(sorted(Counter(n['finger'] for n in ns if n['hand']==h).items())) for h in ('L','R')}
for h in ('L','R'):
    if len(finger_counts[h])<4: errors.append(f'implausibly restricted finger vocabulary: {h}')

beat_counts=Counter(n['bar'] for n in ns if n['role']=='melody')
if set(beat_counts)!=set(range(1,81)): errors.append('melody missing from a measure')
for section in s['sections']:
    for bar in range(section['firstBar'],section['firstBar']+section['bars']):
        h=s['harmony'][bar-1]
        if not section['start']-.00001<=h['time']<section['end']+.00001: errors.append('section does not contain its bars')

def phrase(first):
    return [(n['bar']-first,n['beat'],n['midi']) for n in ns if n['role']=='melody' and first<=n['bar']<first+2]
for b in (29,57,73):
    if phrase(5)!=phrase(b): errors.append(f'two-bar theme identity missing at {b}')

last_notes=[n for n in ns if n['bar']==80]
if {n['midi']%12 for n in last_notes}!={2,4,7,9,11}: errors.append('final chord not G6/9')
if any(n['time']+n['duration']>s['pedals'][-1]['time'] for n in last_notes): errors.append('last key extends beyond pedal release')
if len(s['accompaniment'])!=0: errors.append('unexpected ensemble reliance')
for event in s['pedals']:
    if not 0<=event['time']<=s['duration'] or not 0<=event['value']<=1: errors.append('invalid pedal event')

report=dict(passed=not errors,overlappingPairsChecked=overlaps,fingerUsage=finger_counts,melodyBars=len(beat_counts),twoBarThemeReturns=[29,57,73],finalChordPitchClasses=sorted({n['midi']%12 for n in last_notes}),duration=s['duration'],finalResonanceTail=round(s['duration']-s['pedals'][-1]['time'],6),auditoryCheck=False,errors=errors)
(ROOT/'independent_audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
raise SystemExit(bool(errors))
