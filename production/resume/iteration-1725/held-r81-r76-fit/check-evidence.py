from pathlib import Path
import json,hashlib
p=Path(__file__).parent
sha=lambda path:hashlib.sha256(Path(path).read_bytes()).hexdigest()
rows=json.loads((p/'evidence-v8/index.json').read_text());assert len(rows)==52
reports={}
for row in rows:
 assert sha(row['path'])==row['sha256']
 rp=row['report'];reports.setdefault(rp,json.loads(Path(rp).read_text()));r=reports[rp]
 assert all(f['glError']=='GL_NO_ERROR' for f in r['frames']) and r['samplesAllocation']['effectiveSamples']==4
 assert r['sourceSha256']['public/assets/score.json']==sha(p/('candidate-v8.json' if row['label']=='candidate' else 'baseline-score.json'))
 assert r['sourceSha256']['app/performance/pianist.ts']=='4ef26cd1df3d9b97f8a6e92378af4582fe2077e0cb5d6cc524cdb157891aea45'
 snap=Path(r['snapshot']);assert sha(snap/'production/qa/compiled/wrist-motion.mjs')==sha(p/'compiled/wrist-motion.mjs')
 clean=lambda txt:'\n'.join(s for s in txt.splitlines() if not s.startswith('import '))
 assert clean((snap/'production/qa/compiled/pianist.mjs').read_text())==clean((p/'rig.mjs').read_text())
 assert not r['fullFilmStarted']
summary={'images':len(rows),'reports':len(reports),'glNoError':True,'msaa':4,'scoreSourceRigSamplerExact':True,'fullFilmStarted':False,'candidateSha256':sha(p/'candidate-v8.json'),'rigSha256':sha(p/'rig.mjs'),'sourceSha256':'4ef26cd1df3d9b97f8a6e92378af4582fe2077e0cb5d6cc524cdb157891aea45','samplerSha256':sha(p/'compiled/wrist-motion.mjs'),'reports':list(reports),'frameSecondsRange':[min(f['elapsedSeconds'] for r in reports.values() for f in r['frames']),max(f['elapsedSeconds'] for r in reports.values() for f in r['frames'])],'peakProcessTreeRssBytes':max(r['peakProcessTreeRssBytes'] for r in reports.values())}
(p/'evidence-check.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))
