from pathlib import Path
import shutil,json,hashlib
root=Path('/workspace/scratch/2e8cc8e77f98')
src=root/'final-film-2026-09-09/snapshots/dc1a0bfe8fa61c9a'
out=root/'climax-rest-review'
project=out/'render-project'
for folder in ['app/performance','production/qa/compiled']:
 shutil.copytree(src/folder,project/folder,dirs_exist_ok=True)
for name in ['package.json','package-lock.json','production/qa/render-revision.py','production/qa/pose-server.mjs']:
 p=project/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src/name,p)
p=project/'production/revision/video-export/export_video.py';p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2('/workspace/sites/daybreak-piano-film/production/revision/video-export/export_video.py',p)
for p in (src/'public/assets').rglob('*'):
 if p.is_file():
  d=project/p.relative_to(src);d.parent.mkdir(parents=True,exist_ok=True)
  if not d.exists():d.symlink_to(p)
(project/'node_modules').symlink_to('/workspace/sites/daybreak-piano-film/node_modules',target_is_directory=True)
shutil.copy2(src/'public/assets/score.json',out/'score.json')
shutil.copy2(src/'app/performance/pianist.ts',out/'baseline.ts')
h=(root/'integrated-review/harness.mjs').read_text().replace('/workspace/sites/daybreak-piano-film/production/qa/compiled/',str(project/'production/qa/compiled')+'/').replace('/workspace/sites/daybreak-piano-film/public/assets/pianist.glb',str(src/'public/assets/pianist.glb')).replace("'./pianist-candidate-baked.mjs'","'./render-project/production/qa/compiled/pianist.mjs'").replace("'score-v11.json'","new URL('./score.json',import.meta.url)")
(out/'harness.mjs').write_text(h)
shutil.copy2(root/'integrated-review/metrics.mjs',out/'metrics.mjs')
(out/'baseline-manifest.json').write_text(json.dumps({str(p.relative_to(src)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (src/'app/performance').glob('*.ts')}|{'score.json':hashlib.sha256((out/'score.json').read_bytes()).hexdigest()},indent=2))
