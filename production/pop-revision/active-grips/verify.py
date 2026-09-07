"""Verify the exact bounded active-grip proposal; does not certify idle motion."""
import hashlib,json
from pathlib import Path
p=Path(__file__).resolve().parent
read=lambda name:json.loads((p/name).read_text())
base=read('score-baseline.json');score=read('score-candidate.json');patch=read('active-grip-patch.json');report=read('final-pad-surfaces.json')
assert report['inputs']['score']['sha256']==hashlib.sha256((p/'score-candidate.json').read_bytes()).hexdigest()
assert {k:v for k,v in base.items() if k!='notes'}=={k:v for k,v in score.items() if k!='notes'}
allowed={'finger','contactZ','contactLift','thumbOpposition'}
for a,b in zip(base['notes'],score['notes']):
 assert {k:v for k,v in a.items() if k not in allowed}=={k:v for k,v in b.items() if k not in allowed}
for side in ['L','R']:
 for finger in range(1,6):
  notes=[n for n in score['notes'] if n['hand']==side and n['finger']==finger]
  assert all(a['time']+a['duration']<=b['time']+1e-6 for a,b in zip(notes,notes[1:])),(side,finger)
names=['Thumb','Index','Middle','Ring','Pinky'];results=[]
for change in patch:
 note=next(n for n in score['notes'] if n['id']==change['id']);label=note['hand']+names[note['finger']-1]
 rows=[r for r in report['rows'] if any(n['id']==note['id'] for n in r['active'])]
 assert len(rows)>=5,(note['id'],len(rows))
 pads=[pad for r in rows for pad in r['pads'] if pad['id']==note['id']]
 assert pads and all(pad['vertices'] and abs(pad['gapMm'])<=3 for pad in pads)
 hits=[h for r in rows for h in r['surfaceHits'] if label in [h['a'],h['b']]]
 cores=[h for r in rows for h in r['keyHits'] if h['patch']==label and h['maxDepthMm']>3]
 assert not hits,(note['id'],'actual surface intersections',hits)
 assert not cores,(note['id'],'actual key-core',cores)
 assert max(r['markerMaxErrorMm'] for r in rows)<1,(note['id'],'marker')
 results.append({'id':note['id'],'heldContexts':len(rows),'minPadMm':min(pad['gapMm'] for pad in pads),'maxPadMm':max(pad['gapMm'] for pad in pads)})
assert report['summary']['nonfinite']==0
(p/'verification.json').write_text(json.dumps({'status':'ACTIVE GRIPS VERIFIED','changedNotes':len(patch),'contexts':report['summary']['samples'],'results':results,'scope':'Exact changed-note held meshes and pad-to-assigned-key ray intersections. Unchanged/idle finger motion remains outside acceptance; report retains all its hits.'},indent=2)+'\n')
print('ACTIVE GRIPS VERIFIED')
