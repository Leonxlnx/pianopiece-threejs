import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parent
expected_times={11.700326,224.25}
pairs={'top':('f7243b797448ce32','5319ccb9528cef71'),'oblique':('4299e4913c07e036','fd7224cc41c9be11')}
for camera,(baseline,candidate) in pairs.items():
 reports=[json.loads((root/'reviews'/x/'report-960.json').read_text()) for x in (baseline,candidate)]
 a,b=reports
 assert a['reviewCamera']==b['reviewCamera']
 changes={rel for rel in a['sourceSha256'] if a['sourceSha256'][rel]!=b['sourceSha256'][rel]}
 assert changes=={'app/performance/pianist.ts'}, changes
 assert a['dependencySha256']==b['dependencySha256']
 for report in reports:
  assert {r['row']['time'] for r in report['frames']}==expected_times
  assert len(report['frames'])==2
  for row in report['frames']:
   assert (row['width'],row['height'],row['glError'])==(960,540,'GL_NO_ERROR')
   assert hashlib.sha256(Path(row['image']).read_bytes()).hexdigest()==row['imageSha256']
   assert report['strictGuardSha256']==report['sourceSha256']['production/revision/video-export/export_video.py']
 print(camera, 'paired source/camera/time/GL/image provenance passed')
print('PAIRS_PASS: 8 images, 2 exact cameras, 2 score times, only pianist.ts differs')
