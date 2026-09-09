#!/usr/bin/env python3
"""Save costly rendered chunks at 25/50/75%; never duplicate repository source."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
import zipfile

p = argparse.ArgumentParser()
p.add_argument('--job', type=Path, required=True)
p.add_argument('--library-helper', type=Path, required=True)
a = p.parse_args()
j = a.job.resolve()
c = json.loads((j / 'job.json').read_text())
root = j.parent.parent / 'checkpoints'
root.mkdir(exist_ok=True)
saved = set()
for percent in [25, 50, 75]:
    receipt = root / f'checkpoint-{percent}.json'
    if receipt.exists():
        saved.update(json.loads(receipt.read_text())['chunkNames'])
        continue
    while True:
        records = {p.stem: json.loads(p.read_text()) for p in (j / 'chunks').glob('*.json')}
        if sum(v['frames'] for v in records.values()) >= c['frames'] * percent / 100:
            break
        time.sleep(30)
    names = sorted(set(records) - saved)
    archive = root / f'Daybreak-render-checkpoint-{percent}.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=3) as z:
        z.write(j / 'job.json', 'job.json')
        z.write(Path(c['snapshot']) / 'snapshot.json', 'snapshot-manifest.json')
        z.write(Path(c['snapshot']) / 'cuts.json', 'cuts.json')
        for stem in names:
            video = j / 'chunks' / (stem + '.mp4')
            if hashlib.sha256(video.read_bytes()).hexdigest() != records[stem]['sha256']:
                raise RuntimeError('Chunk checksum mismatch before checkpoint: ' + stem)
            for suffix in ['.mp4', '.json', '.frames.jsonl']:
                z.write(j / 'chunks' / (stem + suffix), 'chunks/' + stem + suffix)
        z.writestr('README.txt',
            'Derived native render checkpoint, not a finished film.\n'
            'Combine the nonoverlapping checkpoint archives in the immutable job directory.\n'
            'Recover exact source from GitHub and exact WAV from the saved revised soundtrack.\n'
            'The source/snapshot manifests bind every input; preserve source hashes and frame order.\n'
            'Use the pinned export wrapper to resume missing chunks and assemble with --final.\n'
            'Do not claim whole-film completion or live browser playback from this archive.\n')
    result = subprocess.run([sys.executable, str(a.library_helper)], check=True,
        input=json.dumps({'uploads': [{'local_path': str(archive), 'purpose': 'create_library_file'}]}),
        text=True, capture_output=True)
    (root / f'checkpoint-{percent}.log').write_text(result.stdout)
    response = json.loads(result.stdout.splitlines()[-1])
    rows = response['results']
    if len(rows) != 1 or rows[0].get('status') != 'succeeded' or rows[0].get('local_path') != str(archive):
        raise RuntimeError('Checkpoint save was not confirmed')
    receipt.write_text(json.dumps({'percent': percent, 'chunkNames': names,
        'frames': sum(records[n]['frames'] for n in names), 'archive': str(archive),
        'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'upload': response}, indent=2) + '\n')
    saved.update(names)
    print(json.dumps({'savedCheckpointPercent': percent, 'chunks': len(names)}), flush=True)
