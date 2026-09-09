from pathlib import Path
import shutil,json
root=Path('/workspace/scratch/2e8cc8e77f98');out=root/'climax-rest-review/native'
for name,sha in [('open','e9aae88b2c8b356a'),('compact','d758f0dd66cf6b95'),('round','1776a876e02b82ad'),('coordinated','de49a33d167edd7b'),('coordinated-authored','2b8c96449362b027')]:
 dest=out/name;dest.mkdir(parents=True,exist_ok=True)
 for p in (root/'render-recovery/reviews'/sha).glob('*'):
  if p.suffix in ['.json','.png']:shutil.copy2(p,dest/p.name)

shutil.copy2(root/'final-film-2026-09-09/first-encoded-review.png',out/'baseline-encoded.png')
