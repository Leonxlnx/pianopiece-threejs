from pathlib import Path
import shutil,subprocess
root=Path(__file__).parent; project=Path('/workspace/sites/daybreak-piano-film')
for variant in ['base','candidate']:
 target=root/('render-project-'+variant)
 (target/'app').mkdir(parents=True,exist_ok=True)
 shutil.copytree(project/'app/performance',target/'app/performance',dirs_exist_ok=True)
 shutil.copy2(root/variant/'piano.ts',target/'app/performance/piano.ts')
 qa=target/'production/qa';qa.mkdir(parents=True,exist_ok=True)
 for name in ['export-scene.cjs','pose-server.mjs','render-revision.py']:shutil.copy2(project/'production/qa'/name,qa/name)
 # Preserve exact linear-render output for pixel comparisons before JPEG loss.
 path=qa/'render-revision.py';s=path.read_text();s=s.replace("raw,row=frame(t);Image.frombytes", "raw,row=frame(t);Image.frombytes('RGB',(W,H),raw).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(ROOT/f'raw-{W}-{i}.png');Image.frombytes");path.write_text(s)
 for name in ['public','node_modules']:
  link=target/name
  if not link.exists():link.symlink_to(project/name,target_is_directory=True)
 subprocess.run(['node','production/qa/export-scene.cjs'],cwd=target,check=True)
