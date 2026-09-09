"""Collect measured idle candidates; reject obsolete finger gaps before replay.

This prepares review data, not an acceptance decision. Score/source changes still
require whole-interval surfaces and motion checks even when endpoints match.
"""
import hashlib, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent
score_path = Path(sys.argv[1])
score = json.loads(score_path.read_text())
paths = [
 'idle-nonthumb/primary-v1-delivery/idle-nonthumb-data.json',
 'idle-nonthumb/rh107-delivery/rh107-additive-curves.json',
 'idle-nonthumb/lh91-delivery/lh91-additive-curves.json',
 'idle-nonthumb/rh68-rh73-delivery/rh68-rh73-additive-curves.json',
 'idle-nonthumb/r76-index-d5-delivery/r76-index-d5-curves.json',
 'idle-nonthumb/r76-index-eight-delivery/r76-index-eight-curves.json',
 'idle-nonthumb/e5-neutral-local-delivery/e5-neutral-local-v1-bound.json',
 'rh89-idle/rh89-clear-subset-v2.json',
]
notes = {(hi, fi): sorted([n for n in score['notes'] if n['hand'] == side and n['finger'] == fi+1], key=lambda n:n['time']) for hi, side in enumerate(['L','R']) for fi in range(5)}
result = {'sourceScoreSha256':hashlib.sha256(score_path.read_bytes()).hexdigest(), 'supportedIndexGaps':[], 'curves':[]}
rows = []
for rel in paths:
    source = json.loads((ROOT/rel).read_text())
    for kind in ['supportedIndexGaps','curves']:
        for index, c in enumerate(source.get(kind,[])):
            chain = notes[(c['hi'],c['fi'])]
            lookup = {n['id']:i for i,n in enumerate(chain)}
            errors = []
            if c.get('previous') is None:
                pi = -1
                if abs(c['previousEnd']) > 1e-7: errors.append('initial end')
            else:
                pi = lookup.get(c['previous'])
                if pi is None: errors.append('previous assigned to different finger')
                elif abs(chain[pi]['time']+chain[pi]['duration']-c['previousEnd']) > 1e-7: errors.append('previous release changed')
            if c.get('next') is None:
                ni = len(chain)
            else:
                ni = lookup.get(c['next'])
                if ni is None: errors.append('next assigned to different finger')
                elif abs(chain[ni]['time']-c['nextTime']) > 1e-7: errors.append('next attack changed')
            if pi is not None and ni is not None and ni != pi+1: errors.append('another note now inside gap')
            if c['fi'] == 0: errors.append('thumb forbidden in this helper')
            if kind == 'curves':
                if c['knots'][0][0] < c['previousEnd']-1e-7 or c['knots'][-1][0] > c['nextTime']+1e-7: errors.append('support outside gap')
                assert all(a[0]<b[0] for a,b in zip(c['knots'],c['knots'][1:])), (rel,index)
            row = {'source':rel, 'kind':kind, 'index':index, 'curve':c, 'eligible':not errors, 'errors':errors}
            rows.append(row)
            if not errors: result[kind].append(c)
for kind in ['supportedIndexGaps','curves']:
    values = [json.dumps(c,sort_keys=True) for c in result[kind]]
    assert len(values)==len(set(values)), 'Duplicate corrections must be resolved explicitly'
(OUT/'candidate-data.json').write_text(json.dumps(result,indent=2))
summary = {'scorePath':str(score_path), 'scoreSha256':result['sourceScoreSha256'], 'eligible':sum(r['eligible'] for r in rows), 'obsolete':sum(not r['eligible'] for r in rows), 'counts':{k:len(result[k]) for k in ['supportedIndexGaps','curves']}, 'qualification':'Endpoint binding only. Every eligible correction remains pending combined whole-gap mesh/motion review.', 'rows':rows}
(OUT/'binding-report.json').write_text(json.dumps(summary,indent=2))
print(json.dumps({k:v for k,v in summary.items() if k!='rows'}))
