from pathlib import Path
import hashlib,json,sys
from PIL import Image
root=Path(__file__).resolve().parent
manifest=json.loads((root/'manifest.json').read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert sha(manifest['baselineScore'])==manifest['baselineSha256']=='b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773'
assert sha(manifest['candidateScore'])==manifest['candidateSha256']=='9db662f1e9d4037cc8c505b9818b7782ac1fb52fe70cff85bf362a00a9fb3b30'
assert sha(manifest['rigSource'])==manifest['rigSha256']=='f0407941995f70ecafecebe9559e0289716620f656b51affcfe279aade9c94b8'
assert {r['id'] for r in manifest['rows']}=={'p00163','p00957','p00741','p00914'}
for row in manifest['rows']:
 assert row['time']==row['baselineNote']['time']+row['baselineNote']['duration']/2
print('MANIFEST_PASS: accepted rig and both exact scores, four held midpoints')
if '--manifest-only' in sys.argv:sys.exit(0)
index=[];n_images=0;reports={}
for camera in ['top','oblique']:
 pair={}
 for label in ['baseline','primary']:
  records=[]
  for line in (root/f'render-{label}-{camera}.log').read_text().splitlines():
   if line.startswith('{'):
    record=json.loads(line)
    if 'report' in record:records.append(record)
  assert len(records)==1,(label,camera,'missing completed report')
  report_path=Path(records[0]['report']);d=json.loads(report_path.read_text());pair[label]=d;reports[label+'-'+camera]=str(report_path)
  assert d['sourceSha256']['app/performance/pianist.ts']==manifest['rigSha256']
  assert d['sourceSha256']['public/assets/score.json']==manifest['baselineSha256' if label=='baseline' else 'candidateSha256']
  assert d['reviewCamera']==manifest['cameras'][camera]
  assert d['strictGuardSha256']=='a093d7bd64786dde35d2a9dd67e61e7023fc3f0a5e42944cdf8a3994d7cd9bca'
  assert d['rendererSourceSha256']=='bacdd838f61c2ef83ee45c879859f53288db633b7d682dcabbd74f488e2a8f71'
  assert len(d['frames'])==4
  for row,frame in zip(manifest['rows'],d['frames']):
   assert frame['row']['time']==row['time']
   assert (frame['width'],frame['height'],frame['glError'])==(960,540,'GL_NO_ERROR')
   assert Image.open(frame['image']).size==(960,540)
   assert sha(frame['image'])==frame['imageSha256']
   note=row['baselineNote' if label=='baseline' else 'candidateNote']
   contacts=[c for c in frame['row']['contacts'] if (c['hand'],c['finger'],c['midi'])==(note['hand'],note['finger'],note['midi'])]
   assert len(contacts)==1,(row['id'],label,contacts)
   index.append({'id':row['id'],'time':row['time'],'label':label,'camera':camera,'path':frame['image'],'sha256':frame['imageSha256'],'targetContact':contacts[0],'report':str(report_path)})
   n_images+=1
 changes={rel for rel in pair['baseline']['sourceSha256'] if pair['baseline']['sourceSha256'][rel]!=pair['primary']['sourceSha256'][rel]}
 assert changes=={'public/assets/score.json'},changes
 assert pair['baseline']['dependencySha256']==pair['primary']['dependencySha256']
assert n_images==16
(root/'image-index.json').write_text(json.dumps({'images':index,'reports':reports},indent=2))
print('PRIMARY_RENDER_PASS: 16 exact 960x540 images, held contacts, matched camera/time, only score differs')

delivery=json.loads((root/'delivery-index.json').read_text())['images']
assert len(delivery)==16
for item in delivery:
 assert sha(item['reviewCopy'])==item['sha256']
print('DELIVERY_PASS: 16 named review PNG copies match original render bytes')
