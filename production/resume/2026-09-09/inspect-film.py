#!/usr/bin/env python3
"""Report completed native chunks and extract new camera midpoint witnesses.

Extraction is not visual acceptance. The caller must inspect returned images.
"""
import argparse
import json
from pathlib import Path
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--job', required=True, type=Path)
a = p.parse_args()
j = a.job.resolve()
c = json.loads((j / 'job.json').read_text())
shots = json.loads((Path(c['snapshot']) / 'cuts.json').read_text())
out = j.parent.parent / 'encoded-shots'
out.mkdir(exist_ok=True)
fresh = []
for i, shot in enumerate(shots):
    frame = round((shot['start'] + shot['end']) / 2 * c['fps'])
    first = frame // c['chunkFrames'] * c['chunkFrames']
    count = min(c['chunkFrames'], c['frames'] - first)
    video = j / 'chunks' / f'{first:06d}-{count:05d}.mp4'
    target = out / f'{i:02d}-{frame:06d}.png'
    if video.with_suffix('.json').exists() and not target.exists():
        subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-vf',
                        f'select=eq(n\\,{frame-first})', '-frames:v', '1',
                        '-update', '1', '-y', str(target)], check=True)
        fresh.append({'index': i, 'shot': shot['name'], 'time': frame / c['fps'],
                      'path': str(target), 'reviewed': False})
records = [json.loads(p.read_text()) for p in (j / 'chunks').glob('*.json')]
done = sum(r['frames'] for r in records)
print(json.dumps({'completedFrames': done, 'frames': c['frames'],
                  'percent': round(done / c['frames'] * 100, 1), 'newFrames': fresh,
                  'saved': (j / 'library-upload.json').exists()}))
