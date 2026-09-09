#!/usr/bin/env python3
"""Reuse complete, time-identical native chunks in a prepared excerpt job.

The source full-film job is read-only. Rebased frame indices are local to the
excerpt; absolute score times, samples and encoded video bytes stay unchanged.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import shutil

p = argparse.ArgumentParser()
p.add_argument('--source-job', type=Path, required=True)
p.add_argument('--excerpt-job', type=Path, required=True)
a = p.parse_args()
source_config = json.loads((a.source_job / 'job.json').read_text())
wrapper = Path(source_config['snapshot']) / 'export-wrapper.py'
spec = importlib.util.spec_from_file_location('pinned_export', wrapper)
export = importlib.util.module_from_spec(spec)
spec.loader.exec_module(export)
source, sc, ss, sm = export.load_job(a.source_job)
target, tc, ts, tm = export.load_job(a.excerpt_job)
for key in ['sourceFingerprint', 'wrapperSha256', 'fps', 'width', 'height',
            'chunkFrames', 'samples', 'shutterDegrees', 'crf', 'preset',
            'environmentMode', 'skipUnusedReflection']:
    if sc[key] != tc[key]:
        raise RuntimeError('Excerpt/source configuration differs: ' + key)
if tc['masterScoreMatch'] is not True:
    raise RuntimeError('Excerpt score/master binding failed')
offset_float = (tc['start'] - sc['start']) * sc['fps']
offset = round(offset_float)
if abs(offset_float-offset) > 1e-8 or offset % sc['chunkFrames']:
    raise RuntimeError('Excerpt must start on an exact completed chunk boundary')
cuts = json.loads((ss / 'cuts.json').read_text())
rows = []
for first, count in export.chunks(tc):
    sv, sj = export.chunk_paths(source, first+offset, count)
    if not export.good_chunk(sv, sj, first+offset, count, sc):
        raise RuntimeError('Source chunk is not complete: ' + str(sv))
    metadata = json.loads(sj.read_text())
    for i, actual in enumerate(metadata['sampling']):
        expected = export.sample_times(tc['start']+(first+i)/tc['fps'], tc, cuts)
        if len(actual) != len(expected) or any(abs(x-y) > 1e-10 for x,y in zip(actual,expected)):
            raise RuntimeError('Excerpt would change a native exposure interval')
    dv, dj = export.chunk_paths(target, first, count)
    shutil.copyfile(sv, dv)
    metadata.update(firstFrame=first, reusedFrom={'sourceJob': str(source),
        'firstFrame': first+offset, 'sha256': metadata['sha256']})
    export.atomic_json(dj, metadata)
    records = []
    for line in sv.with_suffix('.frames.jsonl').read_text().splitlines():
        record = json.loads(line)
        record['index'] -= offset
        records.append(json.dumps(record))
    dv.with_suffix('.frames.jsonl').write_text('\n'.join(records)+'\n')
    rows.append({'firstFrame': first, 'sourceFirstFrame': first+offset,
                 'frames': count, 'sha256': metadata['sha256']})
export.atomic_json(target/'reused-chunks.json', {'sourceJob': str(source),
    'newNativeFramesRendered': 0, 'absoluteTimesPreserved': True,
    'encodedVideoBytesPreserved': True, 'chunks': rows})
print(json.dumps({'reusedFrames': sum(r['frames'] for r in rows),
                  'newNativeFramesRendered': 0, 'excerptJob': str(target)}))
