from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parent;parent=root.parent
original=json.loads((parent/'sources/idle-nonthumb-data.json').read_text())
records=json.loads((parent/'schedule.json').read_text())['records'];chosen=[c for c in records if c['id'] in ['curve-007','index-059']]
(root/'targets.json').write_text(json.dumps(chosen,indent=2)+'\n')
files=['candidate.mjs','baseline.mjs','harness.mjs','sources/score-v11.json','sources/idle-nonthumb-data.json','sources/pianist-candidate-baked.mjs','sources/pianist-combined-thumbs.mjs']
(root/'inputs.json').write_text(json.dumps({f:hashlib.sha256((parent/f).read_bytes()).hexdigest() for f in files},indent=2)+'\n')
src=(parent/'candidate.mjs').read_text().replace("'./compiled/", "'../compiled/")+'\nexport { idleNonthumbData };\n'
(root/'search-candidate.mjs').write_text(src)
print('Targets frozen:',[(c['id'],c['previous'],c['next']) for c in chosen])
print('Other records overlapping target gaps:')
for c in records:
 if c['hi']==0 and any(c['begin']<t['nextTime'] and c['end']>t['previousEnd'] for t in chosen):print(c['id'],c['fi'],c['begin'],c['end'])
