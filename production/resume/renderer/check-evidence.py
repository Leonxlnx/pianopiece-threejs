import hashlib,json,sys
from pathlib import Path
from PIL import Image,ImageStat
root=Path(__file__).resolve().parent
report_path=Path(sys.argv[1]) if len(sys.argv)>1 else root/'reviews/9ab8537c947aefb0/report-960.json'
report=json.loads(report_path.read_text())
assert report['frames'] and report['deformedMeshes']
assert any('Human' in m['name'] and m['vertices']>1000 for m in report['deformedMeshes'])
for frame in report['frames']:
 path=Path(frame['image'])
 assert frame['glError']=='GL_NO_ERROR'
 assert frame['width']==960 and frame['height']==540
 assert hashlib.sha256(path.read_bytes()).hexdigest()==frame['imageSha256']
 image=Image.open(path)
 assert image.size==(960,540)
 assert max(ImageStat.Stat(image).stddev)>10, 'Empty or flat image'
assert report['strictGuardSha256']==report['sourceSha256']['production/revision/video-export/export_video.py']
assert report['rendererSourceSha256']==report['sourceSha256']['production/qa/render-revision.py']
print('FRAME_PASS: 960x540, skinned Human, GL_NO_ERROR, source/guard hashes recorded')
