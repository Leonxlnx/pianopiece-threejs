import json
from collections import Counter, defaultdict
from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parent
baseline=json.loads((root/'inventory-8d92.json').read_text())
current=json.loads((root/'current-local/inventory-merged-local.json').read_text())
def summarize(r):
    groups=defaultdict(list)
    for index,h in enumerate(r['hits']):
        if h['severe'] and 'additional-idle-context' in h['categories']:
            groups[(h['digit'],h['phase'])].append((index,h))
    queue=[]
    for (digit,phase),rows in groups.items():
        index,h=max(rows,key=lambda x:x[1]['maxClosestFaceMm'])
        queue.append(dict(digit=digit,phase=phase,severeDigitKeyRows=len(rows),handPoses=len({h['sampleIndex'] for _,h in rows}),maxClosestFaceMm=h['maxClosestFaceMm'],representative={k:h[k] for k in ['time','triggerIds','active','midi','deepest','previous','next']},hitIndices=[i for i,_ in rows]))
    return sorted(queue,key=lambda x:-x['maxClosestFaceMm'])
queues={'scope':'Finite mechanism review groups by inactive digit and interpolation phase; exact repeated grip/neighbor contexts remain in each inventory families array. One representative does not visually validate the entire group.','baseline':summarize(baseline),'mergedLocal':summarize(current)}
(root/'ranked-context-queue.json').write_text(json.dumps(queues,indent=2))
cases=[('p00410','L2, L3','render-rest-L/gl-960-0.jpg'),('p00416','L2, L3','render-rest-L/gl-960-1.jpg'),('p00426','L2, L3, L4','render-rest-L/gl-960-2.jpg'),('p00914','L1','render-rest-L/gl-960-3.jpg'),('p00937','R1, R2, R3','render-rest-R/gl-960-0.jpg')]
visual=[]
for note,digits,image in cases:
    a=next(s for s in baseline['samples'] if note in s['triggerIds']);b=next(s for s in current['samples'] if note in s['triggerIds'])
    def hitlist(r,s):return [{k:r['hits'][i][k] for k in ['digit','midi','phase','maxClosestFaceMm','deepest']} for i in s['hitIndices'] if r['hits'][i]['severe']]
    visual.append(dict(note=note,digits=digits,baselineTime=a['time'],candidateTime=b['time'],baselineHits=hitlist(baseline,a),candidateHits=hitlist(current,b),image=image))
(root/'visual-comparison.json').write_text(json.dumps({'baselineHashes':baseline['hashes'],'candidateHashes':current['hashes'],'join':'Trigger note ID, using each score version own note midpoint. Two reviewed note durations changed; old timestamp absence is not a clearance result.','rows':visual},indent=2))
sheet=Image.new('RGB',(1920,3*585),'#e5e6e1');draw=ImageDraw.Draw(sheet)
for i,v in enumerate(visual):
    x=(i%2)*960;y=(i//2)*585;sheet.paste(Image.open(root/v['image']),(x,y))
    draw.text((x+12,y+547),f"Baseline {v['note']} | {v['baselineTime']:.6f}s | inspect {v['digits']}",fill='#172029')
sheet.save(root/'rest-review-sheet.jpg',quality=94)

def fmt_hits(hs):return '; '.join(f"{h['digit']}→{h['midi']} {h['maxClosestFaceMm']:.3f} mm" for h in hs) or 'No >3 mm rows at this midpoint'
lines=[
'Inactive finger/key review is complete for the frozen baseline and one captured local candidate. Numerical evidence is broader than the original three idle windows. Five baseline closeups were actually rendered and inspected; they confirm visible intersections in the selected resting silhouettes. No runtime, score, GLB or checkout change was made.',
'',
'Baseline: score `8d92b208`, performer source `fedec1a8`, accepted model `77423a38`. Candidate: captured merged-local score `5fcc7633`, field-capable module `3a105375`. Full SHA-256 values, source snapshots and the score copies are preserved. Candidate results are a snapshot, not a claim about a later mutable candidate file.',
'',
'| Screen | Baseline | Captured merged local |',
'| --- | ---: | ---: |',
f"| Relevant playing-hand midpoints | {baseline['relevantHandSamples']} | {current['relevantHandSamples']} |",
f"| Inactive-digit poses | {baseline['checkedInactiveDigitPoses']} | {current['checkedInactiveDigitPoses']} |",
f"| Digit/key rows deeper than 3 mm | {baseline['severeHitRows']} | {current['severeHitRows']} |",
f"| Hand midpoints containing such a row | {baseline['severeHandSamples']} | {current['severeHandSamples']} |",
f"| Long-rest rows deeper than 3 mm | {sum(h['severe'] and h['phase']=='rest' for h in baseline['hits'])} | {sum(h['severe'] and h['phase']=='rest' for h in current['hits'])} |",
'',
'Each note is sampled at its own held midpoint. Only inactive digits in that note’s playing hand are checked. Every exact skinned Human vertex with at least 65% summed ownership by one finger is tested against all 88 actual key solids: rounded-box bounds conservatively reduced by the real bevel radius, 1.4 mm white / 2 mm black. The reported depth is distance to the nearest original box face, matching the existing key-core tools. This does not detect triangle-only crossings, inactive hands with no sampled note, or behavior between the finite samples.',
'',
'An independent copy of the existing all-key core harness matched seven poses and 28 inactive digit/key pairs exactly: maximum depth difference 0 mm. This also checks the current virtual key meshes against the earlier unbatched key geometry. See `reference-parity.json`.',
'',
'The rendered shortlist and its candidate status are below. Comparison joins by note ID: p00410 and p00426 have changed durations, so their candidate midpoint differs. Every image is baseline geometry; candidate rows below are numerical only.',
'',
'| Note / inspected idle digits | Baseline time | Candidate time | Candidate >3 mm rows |',
'| --- | ---: | ---: | --- |']
for v in visual:lines.append(f"| {v['note']} / {v['digits']} | {v['baselineTime']:.6f} | {v['candidateTime']:.6f} | {fmt_hits(v['candidateHits'])} |")
lines += ['',
'In the inspected baseline views, L2/L3 low proximal portions disappear through white-key edges at 87.807644 and 88.523026 seconds. The 90.576673 view also shows a black-key wedge crossing a finger silhouette; its candidate note midpoint no longer has a >3 mm inactive row. At 188.702540 the idle left thumb visibly crosses neighboring key geometry. The right-hand view at 191.861656 shows low proximal index/middle portions meeting and disappearing into key edges. Individual views and `rest-review-sheet.jpg` preserve the evidence. These character/key-only diagnostic views are not a production room, browser, timing or listening check.',
'',
'Deepest selected nonthumb vertices mostly belong to proximal segments: L2 v9017 is 92.88% Index1; L3 v9040 is 95.34% Middle1; R2 v3188 is 89.25% Index1; R3 v1932 is 98% Middle1. This implicates proximal clearance, not only fingertip-pad offsets. Left-thumb v8952 is 79.57% Thumb1; right-thumb v3577 is 90.24% Thumb2. Exact full weights, coordinates, and MCP/PIP/DIP/tip chains are in `visual-segment-ownership.json`. The named joint weights identify deformation ownership; they are not a clinical model.',
'',
'Known contexts are kept separate. Baseline midpoint sampling finds three >3 mm rows in the known right-hand 147.388–148.819 window; it has no such inactive rows in the two named left-hand windows or coda. The captured candidate has two rows in each left-hand window, three in the right-hand window, and none in coda. This finite result does not clear those intervals between midpoints. Baseline and candidate each have 27 rows across 21 midpoint poses overlapping the six promoted nonthumb held-family queues; those remain assigned to the existing held-fit work.',
'',
'The following ranked mechanism queue excludes the named windows and promoted held-note overlaps. Rest groups receive visual priority; other rows still require their own representative inspection. Complete repeated grip/neighbor structural families and every hit remain in the JSON inventories; a broad digit/phase group is not pose equivalence.',
'',
'| Candidate additional context | Rows | Representative note / time | Key | Maximum closest-face depth |',
'| --- | ---: | --- | ---: | ---: |']
for q in queues['mergedLocal']:
    v=q['representative'];lines.append(f"| {q['digit']} {q['phase']} | {q['severeDigitKeyRows']} | {','.join(v['triggerIds'])} / {v['time']:.6f} | {v['midi']} | {q['maxClosestFaceMm']:.3f} mm |")
lines += ['',
'Reproduce the baseline with `node inventory.mjs`. The script reuses its frozen source/score snapshots. The candidate invocation uses `INVENTORY_OUTPUT=current-local`, `INVENTORY_TAG=merged-local`, `SCORE_PATH` pointing to the captured candidate or original source, and `RIG_MODULE` pointing to the final-fields module; its existing snapshots take precedence. `python summarize.py` regenerates the ranked queue and review sheet. Renderer scripts and logs preserve the five exact camera/time requests. Completed scene interchange caches are removed after inspection; scripts, source, hashes, reports and images remain.',
]
(root/'REVIEW.md').write_text('\n'.join(lines)+'\n')
print('Wrote complete review, finite queue, note-ID comparison, and five-view sheet.')
