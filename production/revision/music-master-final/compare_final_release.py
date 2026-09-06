#!/usr/bin/env python3
"""Compare final physical holds with the previous frozen musical score."""
import bisect, hashlib, importlib.util, json
from pathlib import Path
import numpy as np

HERE=Path(__file__).resolve().parent
OLD_PATH=Path('/workspace/scratch/2e8cc8e77f98/music-master/score-frozen.json')
NEW_PATH=HERE/'score-final-input.json'
old=json.loads(OLD_PATH.read_text());new=json.loads(NEW_PATH.read_text())
spec=importlib.util.spec_from_file_location('final_renderer',HERE/'render_solo_master.py')
renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
SR=renderer.SR

def endpoint(n,s):
    release=n['time']+n['duration'];depth=0
    for p in s['pedals']:
        if p['time']<=release+.000001:depth=p['value']
        else:break
    if depth<=.1:return release
    return next((p['time'] for p in s['pedals'] if p['time']>release+.000001 and p['value']<=.1),s['duration'])

oldmap={n['id']:n for n in old['notes']}
assert set(oldmap)=={n['id'] for n in new['notes']}
assert all(old[k]==new[k] for k in ['duration','pedals','tempoMap'])
physical=[];changes=[]
for n in new['notes']:
    o=oldmap[n['id']]
    assert all(n[k]==o[k] for k in ['time','midi','velocity','role','hand'])
    previous=o['time']+o['duration'];current=n['time']+n['duration']
    assert current<=previous+.000002
    e0,e1=endpoint(o,old),endpoint(n,new)
    endpoint_changed=abs(e1-e0)>.00002
    if endpoint_changed:
        changes.append({'id':n['id'],'bar':n['bar'],'midi':n['midi'],
            'previousEndpoint':e0,'finalEndpoint':e1,'advanceMilliseconds':(e0-e1)*1000})
    if abs(previous-current)>.000002:
        a=round(current*SR);b=round(previous*SR)
        cuts=[a]+[f for f in renderer.PFRAMES if a<f<b]+[b]
        attenuation=0.0;segments=[]
        for left,right in zip(cuts,cuts[1:]):
            idx=bisect.bisect_right(renderer.PFRAMES,left)-1
            pedal=renderer.PEDALS[idx]['value'] if idx>=0 else 0
            rate=renderer.damping_rate(pedal,n['midi']) if n['midi']<89 else 0
            attenuation+=rate*(right-left)/SR
            segments.append({'startFrame':left,'endFrame':right,'pedal':pedal,'decayRate':rate})
        physical.append({'id':n['id'],'physicalAdvanceMilliseconds':(previous-current)*1000,
            'sameBinaryPedalEndpoint':not endpoint_changed,
            'extraContinuousDampingAtPreviousKeyReleaseDb':attenuation*20/np.log(10),
            'integrationSegments':segments})
equiv=[p for p in physical if p['sameBinaryPedalEndpoint']]
report={
    'previousScoreSha256':hashlib.sha256(OLD_PATH.read_bytes()).hexdigest(),
    'finalScoreSha256':hashlib.sha256(NEW_PATH.read_bytes()).hexdigest(),
    'notes':len(new['notes']),'allAttacksPitchesVelocitiesRolesHandsUnchanged':True,
    'durationTempoPedalsUnchanged':True,'changedPhysicalHolds':len(physical),
    'sameTerminalPedalEndpointChanges':len(equiv),'terminalEndpointChanges':len(changes),
    'totalEndpointAdvanceMilliseconds':sum(c['advanceMilliseconds'] for c in changes),
    'physicalAdvanceMillisecondsRange':[min(p['physicalAdvanceMilliseconds'] for p in physical),max(p['physicalAdvanceMilliseconds'] for p in physical)],
    'continuousPedalPrecision':{
        'binaryEndpointReportIsExactAudioEquivalence':False,
        'reason':'The wrist report checks only whether released keys reach the same pedal-up. This renderer also models continuous half-pedal damping from physical key release, so earlier releases can produce a small extra attenuation while pedal remains partially down.',
        'sameEndpointExtraAttenuationDbPercentiles':dict(zip(['min','median','p95','max'],np.percentile([p['extraContinuousDampingAtPreviousKeyReleaseDb'] for p in equiv],[0,50,95,100]).tolist())),
        'boundInterpretation':'Extra per-voice envelope attenuation at the former key-release instant; later damping is the same. The full-mix change is smaller and depends on source decay, polyphony, restrikes and mixing.'},
    'endpointChanges':changes,'physicalChanges':physical,
}
assert len(physical)==407 and len(equiv)==397 and len(changes)==10
assert abs(report['totalEndpointAdvanceMilliseconds']-206.732)<.01
(HERE/'final-release-comparison.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['physicalChanges','endpointChanges']},indent=2))
