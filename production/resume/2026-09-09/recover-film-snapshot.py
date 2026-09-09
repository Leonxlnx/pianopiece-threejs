#!/usr/bin/env python3
"""Recreate a lost immutable snapshot using saved hashes, without changing them."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--project', type=Path, required=True)
p.add_argument('--job', type=Path, required=True)
p.add_argument('--master', type=Path, required=True)
a = p.parse_args()
c = json.loads((a.job / 'job.json').read_text())
m = json.loads((a.job / 'snapshot-manifest.json').read_text())
snap = Path(c['snapshot'])
stage = snap.with_name(snap.name + '.recovering')
stage.mkdir(parents=True, exist_ok=False)
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
for relative, expected in m['sourceSha256'].items():
    if relative == 'audio/master.wav':
        source = a.master
    elif relative == 'audio/reproduction-manifest.json':
        source = a.project / 'production/resume/2026-09-09/final-master-5c/reproduction-manifest.json'
    else:
        source = a.project / relative
    if sha(source) != expected:
        raise RuntimeError('Recovered input differs: ' + relative)
    target = stage / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
for path, expected in m['dependencySha256'].items():
    if sha(Path(path)) != expected:
        raise RuntimeError('Dependency differs: ' + path)
wrapper = a.project / 'production/revision/video-export/export_video.py'
if sha(wrapper) != c['wrapperSha256'] or m['fingerprint'] != c['sourceFingerprint']:
    raise RuntimeError('Wrapper/fingerprint differs')
shutil.copyfile(wrapper, stage / 'export-wrapper.py')
spec = importlib.util.spec_from_file_location('pinned_export', wrapper)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
(stage / 'node_modules').symlink_to(Path(m['project']) / 'node_modules', target_is_directory=True)
(stage / 'compile.mjs').write_text(module.COMPILE_SCRIPT)
subprocess.run(['node', str(stage / 'compile.mjs'), str(stage)], check=True, cwd=stage)
for relative, expected in m['compiledSha256'].items():
    if sha(stage / relative) != expected:
        raise RuntimeError('Compiled module differs: ' + relative)
shutil.copyfile(a.job / 'cuts.json', stage / 'cuts.json')
shutil.copyfile(a.job / 'snapshot-manifest.json', stage / 'snapshot.json')
if snap.exists():
    if any(p.is_file() for p in snap.rglob('*')):
        raise RuntimeError('Refusing to replace nonempty snapshot')
    shutil.rmtree(snap)
stage.rename(snap)
module.load_job(a.job)
report = {'allSourceAndCompiledHashesMatch': True, 'fingerprint': m['fingerprint'],
          'sourceFiles': len(m['sourceSha256']), 'compiledModules': len(m['compiledSha256']),
          'dependencies': len(m['dependencySha256']), 'snapshot': str(snap)}
(a.job / 'snapshot-recovery.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
