from pathlib import Path
import hashlib,json,shutil,re
out=Path(__file__).resolve().parent
scratch=out.parent
sources=out/'sources';deps=out/'compiled'
sources.mkdir(exist_ok=True);deps.mkdir(exist_ok=True)
inputs={}
for name in ['harness.mjs','pianist-combined-thumbs.mjs','pianist-candidate-baked.mjs','score-v11.json','idle-nonthumb-data.json']:
 src=scratch/'integrated-review'/name;dst=sources/name
 shutil.copyfile(src,dst);inputs[str(dst.relative_to(out))]={'origin':str(src),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest()}
for name in ['math.mjs','piano.mjs','wrist-motion.mjs','ponytail-motion.mjs','hair-motion-data.mjs']:
 src=Path('/workspace/sites/daybreak-piano-film/production/qa/compiled')/name;dst=deps/name
 shutil.copyfile(src,dst);inputs[str(dst.relative_to(out))]={'origin':str(src),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest()}
for src,rel in [(scratch/'idle-combined/replay.mjs','sources/interrupted-replay.mjs'),(Path('/workspace/sites/daybreak-piano-film/public/assets/pianist.glb'),'sources/pianist.glb'),(Path('/workspace/sites/daybreak-piano-film/production/resume/iteration-1835/README.md'),'sources/resume-README.md')]:
 dst=out/rel;shutil.copyfile(src,dst);inputs[rel]={'origin':str(src),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest()}
prefix='/workspace/sites/daybreak-piano-film/production/qa/compiled/'
for name,dest in [('pianist-combined-thumbs.mjs','baseline.mjs'),('pianist-candidate-baked.mjs','candidate.mjs')]:
 (out/dest).write_text((sources/name).read_text().replace(prefix,'./compiled/'))
src=(sources/'harness.mjs').read_text()
src=src.replace("process.env.DAYBREAK_RIG_MODULE?pathToFileURL(process.env.DAYBREAK_RIG_MODULE).href:'./pianist-candidate-baked.mjs'", "new URL(new URL(import.meta.url).searchParams.get('rig'), import.meta.url).href")
src=src.replace(prefix,'./compiled/')
src=src.replace("process.env.DAYBREAK_WRIST_MODULE?pathToFileURL(process.env.DAYBREAK_WRIST_MODULE).href:'./compiled/wrist-motion.mjs'", "'./compiled/wrist-motion.mjs'")
src=src.replace("'/workspace/sites/daybreak-piano-film/public/assets/pianist.glb'", "new URL('./sources/pianist.glb',import.meta.url)")
src=src.replace("process.env.DAYBREAK_SCORE??'score-v11.json'", "new URL('./sources/score-v11.json',import.meta.url)")
src=src.replace('targetFinger=null,opposing=false','targetFinger=null,opposing=false,alreadyUpdated=false')
src=src.replace(' update(time);const offset=', ' if(!alreadyUpdated)update(time);const offset=')
src+='\nexport function snapshot(){return performer.hands.map(h=>({side:h.side,wristQ:h.wrist.quaternion.toArray(),wristWorld:h.wrist.matrixWorld.toArray(),fingers:h.fingers.map(f=>f.bones.map(b=>({local:b.quaternion.toArray(),world:b.matrixWorld.toArray()})))}));}\n'
(out/'harness.mjs').write_text(src)
(out/'inputs.json').write_text(json.dumps(inputs,indent=2)+'\n')
print('Frozen',len(inputs),'input files')
