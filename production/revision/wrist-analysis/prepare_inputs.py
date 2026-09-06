#!/usr/bin/env python3
"""Snapshot current compiled rig, calibrated score and character into scratch."""
import argparse,hashlib,json,shutil
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('--source',default='/workspace/sites/daybreak-piano-film');ap.add_argument('--wrist-z-floor',type=float,default=.295);args=ap.parse_args()
source=Path(args.source);root=Path(__file__).resolve().parent
for name in ('pianist','types'):shutil.copy2(source/f'app/performance/{name}.ts',root/f'input-source-{name}.ts')
for src,dest in [(source/'public/assets/score.json',root/'input-score.json'),(source/'public/assets/pianist.glb',root/'input-pianist.glb')]:shutil.copy2(src,dest)
for name in ('pianist','piano','math','wrist-motion'):
 if not (source/f'production/qa/compiled/{name}.mjs').exists():continue
 text=(source/f'production/qa/compiled/{name}.mjs').read_text()
 if name=='pianist':text=text.replace('[.341, .447]',f'[{args.wrist_z_floor}, .447]')
 (root/f'{name}.mjs').write_text(text)
manifest={'source':str(source),'wristZFloor':args.wrist_z_floor,'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [root/'input-score.json',root/'input-pianist.glb',root/'pianist.mjs',root/'piano.mjs',root/'math.mjs']}}
(root/'input-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest,indent=2))
