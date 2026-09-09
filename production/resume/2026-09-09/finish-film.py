#!/usr/bin/env python3
"""Finish the already-running immutable film, preserving all existing guards.

No rendering or publication is started by this script. It waits for the native
render's completion report, assembles, checks decoded frame order, then saves
the final MP4 through the supported Library upload helper.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time


def write_json(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    temporary.replace(path)


def decoded_frames(args):
    output = subprocess.check_output(
        ['ffmpeg', '-v', 'error', *map(str, args), '-map', '0:v:0',
         '-f', 'framemd5', '-'], text=True)
    return [line.rsplit(',', 1)[-1].strip() for line in output.splitlines()
            if line and not line.startswith('#')]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--job', type=Path, required=True)
    parser.add_argument('--render-log', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--library-helper', type=Path, required=True)
    args = parser.parse_args()
    job = args.job.resolve()
    config = json.loads((job / 'job.json').read_text())
    snapshot = Path(config['snapshot'])
    wrapper = snapshot / 'export-wrapper.py'
    if hashlib.sha256(wrapper.read_bytes()).hexdigest() != config['wrapperSha256']:
        raise RuntimeError('Pinned export wrapper hash mismatch')
    if args.output.exists() or (job / 'library-upload.json').exists():
        raise RuntimeError('Delivery exists; inspect it before attempting another upload')
    started = time.monotonic()
    while not (job / 'last-render.json').exists():
        if time.monotonic() - started > 8 * 3600:
            raise RuntimeError('Completion wait exceeded eight hours; inspect render')
        if time.time() - args.render_log.stat().st_mtime > 600:
            raise RuntimeError('Render log stopped progressing for ten minutes')
        records = [json.loads(p.read_text()) for p in (job / 'chunks').glob('*.json')]
        done = sum(row['frames'] for row in records)
        write_json(job / 'delivery-progress.json', {
            'completedFrames': done, 'totalFrames': config['frames'],
            'percent': round(done / config['frames'] * 100, 2),
            'state': 'waiting-for-render', 'updatedUtc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})
        time.sleep(30)
    with (job / 'assembly.log').open('w') as log:
        subprocess.run([sys.executable, str(wrapper), 'assemble', '--job', str(job),
                        '--final', '--delivery-only'], check=True, stdout=log, stderr=subprocess.STDOUT)
    video = job / 'daybreak-preview.mp4'
    original = decoded_frames(['-f', 'concat', '-safe', '0', '-i', job / 'concat.txt'])
    assembled = decoded_frames(['-i', video])
    if len(original) != config['frames'] or assembled != original:
        raise RuntimeError('Final decoded frame order differs from the native chunks')
    write_json(job / 'frame-order.json', {
        'allFramesInOrder': True, 'frames': len(original),
        'method': 'Full decoded framemd5 sequence of concat input equals final MP4',
        'sequenceSha256': hashlib.sha256('\n'.join(assembled).encode()).hexdigest()})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(video, args.output)
    result = subprocess.run([sys.executable, str(args.library_helper)], check=True,
        input=json.dumps({'uploads': [{'local_path': str(args.output.resolve()),
                                       'purpose': 'create_library_file'}]}),
        text=True, capture_output=True)
    (job / 'library-upload.log').write_text(result.stdout)
    response = json.loads(result.stdout.splitlines()[-1])
    rows = response['results']
    if len(rows) != 1 or rows[0].get('status') != 'succeeded' or rows[0].get('local_path') != str(args.output.resolve()):
        raise RuntimeError('Library did not confirm the expected final video')
    write_json(job / 'library-upload.json', response)
    write_json(job / 'delivery-progress.json', {
        'completedFrames': config['frames'], 'totalFrames': config['frames'],
        'percent': 100, 'state': 'saved', 'output': str(args.output.resolve()),
        'sha256': hashlib.sha256(args.output.read_bytes()).hexdigest(),
        'libraryFileId': rows[0]['library_file_id']})
    print(json.dumps({'saved': True, 'output': str(args.output), 'frames': len(assembled)}), flush=True)


if __name__ == '__main__':
    main()
