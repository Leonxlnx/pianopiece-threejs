from pathlib import Path
import hashlib, json, os, subprocess, sys
here=Path(__file__).resolve().parent
leaf=Path('/workspace/scratch/2e8cc8e77f98/idle-nonthumb')
src=leaf/'combined-qualification'
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else here/'replay-output'
out.mkdir(parents=True,exist_ok=True)
manifest=json.loads((here/'binding-manifest.json').read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
for row in manifest['dependencies']:
    assert sha(row['path'])==row['current'], 'Dependency changed: '+row['path']
assert sha('/workspace/sites/daybreak-piano-film/public/assets/pianist.glb')==manifest['modelSha256']
subprocess.run(['node',str(here/'verify-combined-binding.mjs'),str(src/'score-v10.json'),str(src/'pianist-combined-base.ts'),str(here/'opening-eight-v10.json'),str(here/'idle-nonthumb-with-blend.ts'),str(here/'binding-manifest.json')],check=True)
env=os.environ.copy()
env.update(DAYBREAK_RIG_MODULE=str(src/'pianist-combined-base.mjs'),DAYBREAK_SCORE_PATH=str(src/'score-v10.json'),DAYBREAK_IDLE_CURVES=str(here/'opening-eight-v10.json'))
for key in ['DAYBREAK_APPLY_RUNTIME','DAYBREAK_CURVE_APPLIER','DAYBREAK_POST_APPLY']:
    env.pop(key,None)
commands=[['verify-support-union.mjs','4.59','15.562','1000',str(out/'surface.json'),'1'],['verify-opposing-curves.mjs',str(out/'opposing.json')],['verify-zero-outside.mjs',str(out/'outside.json')]]
for script,*args in commands:
    with (out/(script+'.log')).open('w') as log:
        subprocess.run(['node',str(leaf/script),*args],env=env,cwd=leaf,stdout=log,stderr=subprocess.STDOUT,check=True)
print(out)
