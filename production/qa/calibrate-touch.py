"""Adjust animation-only contact markers using the actual skinned finger-pad gap."""
from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[2]
scorefile=root/'public/assets/score.json';score=json.loads(scorefile.read_text())
records=json.loads(Path(sys.argv[1]).read_text())['records'];notes={n['id']:n for n in score['notes']}
for r in records:
 if r['gapMm'] is None:continue
 n=notes[r['id']]
 if '--thumb-only' in sys.argv and n['finger']!=1:continue
 n['contactLift']=round(max(.001,min(.016,n.get('contactLift',.002)-r['gapMm']*.0008)),6)
scorefile.write_text(json.dumps(score,separators=(',',':')))
print('Calibrated',len(records),'animation contacts; audio note times and durations unchanged.')
