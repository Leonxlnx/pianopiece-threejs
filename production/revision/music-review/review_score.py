#!/usr/bin/env python3
"""Independent score-only musical review; reads inputs and writes this scratch folder."""
import ast
import collections
import hashlib
import json
import statistics
from pathlib import Path

OUT = Path(__file__).resolve().parent
SCORE = Path('/workspace/sites/daybreak-piano-film/public/assets/score.json')
SOURCE = Path('/workspace/scratch/2e8cc8e77f98/music-revision/compose_revision.py')
raw = SCORE.read_bytes()
s = json.loads(raw)
ns = s['notes']
const = {}
for node in ast.parse(SOURCE.read_text()).body:
    if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
        try:
            const[node.targets[0].id] = ast.literal_eval(node.value)
        except (ValueError, TypeError):
            pass
rows = sum((const[k] for k in ('INTRO', 'A', 'ASCENT', 'REFRAIN', 'MIDDLE', 'TURN', 'FINAL', 'CODA')), [])
pcs = {k: v[2] for k, v in const['CHORDS'].items()}
name = lambda m: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][m % 12] + str(m // 12 - 1)
sections = []
for sec in s['sections']:
    notes = [n for n in ns if sec['start'] <= n['time'] < sec['end']]
    melody = [n for n in notes if n['role'] == 'melody']
    sections.append(dict(section=sec['kind'], attacks=len(notes), melodyAttacks=len(melody),
        melodyRange=[name(min(n['midi'] for n in melody)), name(max(n['midi'] for n in melody))],
        melodyMeanVelocity=round(statistics.mean(n['velocity'] for n in melody), 4),
        supportMeanVelocity=round(statistics.mean(n['velocity'] for n in notes if n['role'] != 'melody'), 4)))
foreign_support = []
for n in ns:
    chord = s['harmony'][n['bar'] - 1]['chord']
    if n['role'] != 'melody' and n['midi'] % 12 not in pcs[chord]:
        foreign_support.append({**{k: n[k] for k in ('id', 'bar', 'beat', 'midi', 'role')}, 'chord': chord})
minor_ninths = []
for a in ns:
    if a['role'] != 'harmony' or a['hand'] != 'L':
        continue
    for b in ns:
        if b['role'] == 'melody' and b['midi'] - a['midi'] == 13 and abs(b['time'] - a['time']) < .025:
            minor_ninths.append(dict(bar=b['bar'], time=b['time'], bassId=a['id'], melodyId=b['id'],
                notes=[name(a['midi']), name(b['midi'])], velocities=[a['velocity'], b['velocity']],
                physicalOverlapSeconds=round(max(0, min(a['time'] + a['duration'], b['time'] + b['duration']) - max(a['time'], b['time'])), 6)))
pedals = s['pedals']
def pedal_at(t):
    values = [p['value'] for p in pedals if p['time'] <= t + 1e-7]
    return values[-1] if values else 0
def damper_time(n):
    end = n['time'] + n['duration']
    if not pedal_at(end):
        return end
    return next(p['time'] for p in pedals if p['time'] > end and p['value'] == 0)
sustained = [{**n, 'damperTime': damper_time(n)} for n in ns]
pedal_windows = []
for p in pedals:
    if p['value'] != 0:
        continue
    held = [n for n in sustained if n['time'] < p['time'] and n['damperTime'] >= p['time'] - 1e-7]
    pedal_windows.append(dict(time=p['time'], uniqueMidi=sorted({n['midi'] for n in held}),
        uniquePitchClasses=sorted({n['midi'] % 12 for n in held})))
rhythms = collections.defaultdict(list)
for label, pattern in const['PATTERNS'].items():
    rhythms[tuple(beat for beat, _ in pattern)].append(label)
base = rows[4][1]
theme_bars = [i + 1 for i, row in enumerate(rows) if row[1] == base]
two_bar_returns = [i + 1 for i in range(len(rows) - 1) if rows[i][1] == rows[4][1] and rows[i + 1][1] == rows[5][1]]
melody = [n for n in ns if n['role'] == 'melody']
octave_leaps = [dict(fromBar=a['bar'], toBar=b['bar'], notes=[name(a['midi']), name(b['midi'])],
    interval=b['midi']-a['midi'], onsetGap=round(b['time']-a['time'], 6))
    for a, b in zip(melody, melody[1:]) if abs(b['midi']-a['midi']) >= 12]
old = {n['id']: n for n in json.loads((SOURCE.parent / 'score.json').read_text())['notes']}
uncovered_trims = []
for n in ns:
    a = old[n['id']]
    old_end, new_end = a['time'] + a['duration'], n['time'] + n['duration']
    clears = [p['time'] for p in pedals if new_end <= p['time'] < old_end - 1e-6 and p['value'] == 0]
    if old_end > new_end + 1e-5 and (not pedal_at(new_end) or clears):
        uncovered_trims.append(dict(id=n['id'], bar=n['bar'], role=n['role'],
            physicalTrim=round(old_end-new_end, 6), pedalAtRelease=pedal_at(new_end), pedalClears=clears))
report = dict(scorePath=str(SCORE), scoreSha256=hashlib.sha256(raw).hexdigest(),
    analysisLimit='Score-only review. No listening or perceptual musical-quality certification.',
    sections=sections, firstThemeBarMatches=theme_bars, completeTwoBarThemeMatches=two_bar_returns,
    accompanimentFigureLabels=len(const['PATTERNS']), accompanimentAttackRhythms=len(rhythms),
    sharedAttackRhythms=[dict(beats=list(k), labels=v) for k, v in rhythms.items()],
    nonChordSupportingNotes=foreign_support, simultaneousMinorNinths=minor_ninths,
    octaveOrLargerMelodyLeaps=octave_leaps, physicalTrimsNotCompletelyPedalCarried=uncovered_trims,
    maximumPedalLatchedUniqueKeys=max(pedal_windows, key=lambda x: len(x['uniqueMidi'])),
    finalNotes=[{k: n[k] for k in ('id', 'time', 'duration', 'midi', 'velocity', 'role')} for n in ns if n['bar'] == 80])
(OUT / 'score-review.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k not in ('sections', 'finalNotes', 'sharedAttackRhythms')}, indent=2))
