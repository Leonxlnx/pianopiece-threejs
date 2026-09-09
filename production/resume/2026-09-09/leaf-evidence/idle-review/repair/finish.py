from pathlib import Path
from collections import defaultdict,Counter
import json,gzip,math,hashlib
root=Path(__file__).resolve().parent
load=lambda n:json.loads((root/n).read_text())
s=load('summary.json');targets={x['id']:x for x in load('targets.json')}
with gzip.open(root/'qualified-rows.jsonl.gz','rt') as f:rows=[json.loads(l) for l in f]
local={}
for scope,lo,hi in [('curve-007',91.46,91.518),('index-059',176.02,176.201552)]:
 grid=[r for r in rows if r['scope']==scope and '240Hz' in r['kinds']];local[scope]={}
 for rig in ['base','original','fixed']:
  vals=[]
  for a,b in zip(grid,grid[1:]):
   if b['time']>=lo and a['time']<=hi:
    p=a['metrics'][rig]['chains'][1]['points'][-1];q=b['metrics'][rig]['chains'][1]['points'][-1];vals.append((b['time'],math.dist(p,q)/(b['time']-a['time'])))
  t,v=max(vals,key=lambda x:x[1]);local[scope][rig]={'peakTipSpeedMps':v,'time':t}
(root/'local-motion.json').write_text(json.dumps(local,indent=2)+'\n')
block={'status':'unresolved','record':targets['curve-007'],'fullGapNewPerKeyStates':s['curve-007']['comparisons']['fixedVsBase']['counts'].get('newCoreKey',0),'fullGapWorsenedPerKeyStates':s['curve-007']['comparisons']['fixedVsBase']['counts'].get('worsenedCoreKey',0),'witnesses':s['curve-007']['comparisons']['fixedVsBase']['nonStrictWitnesses'],'search':s['search'],'localMotion':local['curve-007'],'rollbackLoss':{'additionalCorePositivePatchStates':s['curve-007']['metrics']['base']['corePositivePatchStates']-s['curve-007']['metrics']['original']['corePositivePatchStates'],'additionalCorePositiveKeyStates':s['curve-007']['metrics']['base']['corePositiveKeyStates']-s['curve-007']['metrics']['original']['corePositiveKeyStates']}}
(root/'blocker.json').write_text(json.dumps(block,indent=2)+'\n')
q={}
for r in load('qualified-queue.json'):
 for e in r['events']:
  key=(r['scope'],r['relation'],e['kind'],e['target']);item=q.setdefault(key,{'scope':r['scope'],'relation':r['relation'],'kind':e['kind'],'target':e['target'],'samples':0,'firstTime':r['time'],'lastTime':r['time'],'worst':None})
  item['samples']+=1;item['lastTime']=r['time']
  if item['worst'] is None or e['after']-e['before']>item['worst']['after']-item['worst']['before']:item['worst']={'time':r['time'],'before':e['before'],'after':e['after']}
(root/'finite-queue.json').write_text(json.dumps(list(q.values()),indent=2)+'\n')
i=s['index-059'];c=s['curve-007'];coverage=load('coverage.json');active=i['parity']['activeStates']+c['parity']['activeStates'];delta=load('delta.json')
text=f'''# Two-record idle repair review

The index-059 early-release candidate removes new/worsened per-key core contacts relative to the frozen no-helper baseline while retaining most of its measured improvement. Curve-007 remains an explicit blocker. This is a review delta, not a clean-hand or whole-piece clearance certification.

## Minimal delta

Add `earlyRelease: [176.02, 176.065]` only to the LH Index record bound to previous note `p00800`, release `171.873523`, next note `p00831`, onset `176.201552`. Multiply its existing lift amount by `1 - idleSmooth((time - start) / (end - start))` for that optional tuple. The multiplier is exactly 1 when the field is absent. The current endpoint ID/time guards and inactive-only call remain intact.

This preserves the original lift until 176.02 s, fades it smoothly over 45 ms, and restores the no-helper index pose from 176.065 s until the next note. All other records retain their default behavior. `delta.json` provides exact before/after fields and helper expression; `fixed.mjs` and `data-fixed.json` are frozen reproduction inputs. Apply the small delta to newer data; do not overwrite newer complete files with this snapshot.

## Finished coverage

Completed {coverage['totalSamples']:,} states: {i['samples']:,} for the index gap and {c['samples']:,} for the curve gap. Both complete gaps include 150 ms margins, a 240 Hz grid, exact note/curve/helper boundaries with ±1 microsecond probes, and an additional 480 Hz grid through the index arrival. Every state checks all six LH patches against actual moving key core solids and all 15 own-hand surface pairs. Both hands' active joint parity is checked. The earlier 13,441-timestamp replay was not repeated.

## Geometry tradeoff

Counts below use the same complete-gap sample set for all three rigs. Boundary probes are samples, not durations.

| Index-059 metric | No helper | Original helper | Early release |
|---|---:|---:|---:|
| Core-positive patch states (>3 mm) | {i['metrics']['base']['corePositivePatchStates']} | {i['metrics']['original']['corePositivePatchStates']} | {i['metrics']['fixed']['corePositivePatchStates']} |
| Core-positive patch/key states (>3 mm) | {i['metrics']['base']['corePositiveKeyStates']} | {i['metrics']['original']['corePositiveKeyStates']} | {i['metrics']['fixed']['corePositiveKeyStates']} |
| New per-key >3 mm states versus no helper | 0 | {i['comparisons']['originalVsBase']['counts'].get('newCoreKey',0)} | {i['comparisons']['fixedVsBase']['counts'].get('newCoreKey',0)} |
| Per-key >3 mm worsening >0.25 mm versus no helper | 0 | {i['comparisons']['originalVsBase']['counts'].get('worsenedCoreKey',0)} | {i['comparisons']['fixedVsBase']['counts'].get('worsenedCoreKey',0)} |
| Strict existing finger-pair increases versus no helper | 0 | {i['comparisons']['originalVsBase']['counts'].get('strictFingerPairIncrease',0)} | {i['comparisons']['fixedVsBase']['counts'].get('strictFingerPairIncrease',0)} |

The candidate retains 57 of the original 58 net improved core-positive patch states, and 61 of 62 net improved patch/key states. It restores four old per-key >3 mm states relative to the original helper and worsens 15 old per-key states by >0.25 mm; these stay within the no-helper comparison and remain listed in `finite-queue.json`. These event counts overlap. There are no new own-palm or finger-pair types versus either comparator in this index gap. The 21 strict existing finger-pair increases remain a separate issue. A triangle-pair count does not measure penetration depth.

## Motion and parity

Active local/world joint deltas, wrist deltas and outside-gap deltas are exactly zero across {active:,} active finger states. Other LH digits' joints/tips are unchanged. The original index pose is exact through 176.02 s, and the index matches the no-helper pose after 176.065 s. Index peak fingertip speed decreases from {i['motion']['original']['indexTipSpeedMps']['value']:.6f} to {i['motion']['fixed']['indexTipSpeedMps']['value']:.6f} m/s; its peak sampled joint angular speed decreases from {i['motion']['original']['indexJointAngularSpeedDegps']['value']:.3f} to {i['motion']['fixed']['indexJointAngularSpeedDegps']['value']:.3f} degrees/s. These measurements do not certify natural motion.

## Curve-007 blocker

The unchanged LH Index curve binds `p00424` release 90.407126 to `p00434` onset 91.530895; its four knots span 91.46–91.518 s. The complete 240 Hz gap screen finds {block['fullGapNewPerKeyStates']} new per-key >3 mm states and {block['fullGapWorsenedPerKeyStates']} worsened per-key states, including LIndex/MIDI 58 at 91.470833333 s (0 → 4.0555 mm) and LIndex/MIDI 56 at 91.4625 s (3.8957 → 4.5583 mm). The earlier 60 Hz screen found fewer states because it did not contain these intermediate times.

The finite curve search completed 113 trials, including 112 nonzero settings across lift, spread, PIP/DIP controls, amplitude and timing adjustments. None met the local per-key novelty/worsening screen. This is not proof that no possible route exists. Deletion was clear relative to the no-helper baseline but forfeits {block['rollbackLoss']['additionalCorePositivePatchStates']} improved core-positive patch states and {block['rollbackLoss']['additionalCorePositiveKeyStates']} improved patch/key states. I preserved the curve and this blocker rather than labeling deletion a complete geometric repair.

The curve's local support peak tip speed is {local['curve-007']['base']['peakTipSpeedMps']:.6f} m/s without the helper versus {local['curve-007']['original']['peakTipSpeedMps']:.6f} m/s with it. The full-gap peak is already {c['motion']['base']['indexTipSpeedMps']['value']:.6f} m/s near 90.458333 s in both rigs; reporting only that overall maximum would mask the curve's additional local motion.

## Evidence and limits

`qualified-rows.jsonl.gz` contains all completed comparison states; `qualified-queue.json` stores exact event rows; `finite-queue.json` groups them into a finite queue. `summary.json`, `blocker.json`, `local-motion.json`, `delta.json`, `inputs.json` and `hashes.json` preserve results, bindings and provenance. Verification commands are in `GATES.md`.

The earlier whole-gap deletion and 0.8-second arrival-fade trial are preserved separately. The fade trial is excluded because the 480 Hz check found an additional deep-key worsening; the final cutoff is the candidate in `delta.json`.

The source/score are the frozen audited v11 inputs. Root's later RH Middle curve and p170 contact-lift change are not included; they do not overlap these LH scopes. No Site edits were made. Moving-key core solids and owned hand-surface subsets follow the preserved harness. Opposing-hand surfaces, continuous-time guarantees, mesh rendering, browser playback, audio and visual naturalness remain outside this leaf.
'''
(root/'FINDINGS.md').write_text(text)
print('Finite queue groups:',len(q));print('Local motion:',json.dumps(local));print('Active states:',active)
