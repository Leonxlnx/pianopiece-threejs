#!/usr/bin/env python3
"""Bounded native llvmpipe thread-count experiment on a frozen snapshot."""
import argparse, hashlib, importlib.util, json, os, sys, time
from pathlib import Path

import numpy as np
import moderngl
from PIL import Image

SNAP = Path('/workspace/scratch/2e8cc8e77f98/final-film-2026-09-09/snapshots/dc1a0bfe8fa61c9a')
OUT = Path('/workspace/scratch/2e8cc8e77f98/render-recovery/throughput')
EXPECTED = 'dc1a0bfe8fa61c9ad36be8f82b2fd402cc2c076ad407a3c540c4328b8a4e82b0'
PTS = [159.3, 170.0, 0.8]
PROC_PID = int(next(row.split()[1] for row in Path('/proc/self/status').read_text().splitlines() if row.startswith('Pid:')))

def digest_bytes(data):
    return hashlib.sha256(data).hexdigest()

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def load_wrapper():
    path = SNAP/'export-wrapper.py'
    spec = importlib.util.spec_from_file_location('frozen_export_wrapper', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def tree_cpu_seconds(pid):
    ticks = os.sysconf(os.sysconf_names['SC_CLK_TCK'])
    total = 0
    todo = [pid]
    seen = set()
    while todo:
        current = todo.pop()
        if current in seen:
            continue
        seen.add(current)
        try:
            fields = Path(f'/proc/{current}/stat').read_text().split()
            total += int(fields[13]) + int(fields[14])
            todo.extend(map(int, Path(f'/proc/{current}/task/{current}/children').read_text().split()))
        except (FileNotFoundError, ProcessLookupError):
            pass
    return total/ticks

def composite_frame(wrapper, renderer, config, cuts, pts):
    times = wrapper.sample_times(pts, config, cuts)
    assert len(times) == 2, times
    accum = None
    rows = []
    for sample in times:
        _, row = renderer.frame(sample)
        rows.append(row)
        hdr = np.frombuffer(renderer.color.read(), dtype='f2').reshape(renderer.H, renderer.W, 4).astype('f4')
        accum = hdr if accum is None else accum + hdr
        wrapper.check_gl(renderer.ctx, f'benchmark native sample at {sample:.9f}s')
    renderer.color.write((accum/len(times)).astype('f2').tobytes())
    renderer.outfbo.use()
    renderer.ctx.disable(moderngl.DEPTH_TEST)
    renderer.color.use(0)
    renderer.postvao.render(moderngl.TRIANGLE_STRIP)
    raw = renderer.outfbo.read(components=3, alignment=1)
    wrapper.check_gl(renderer.ctx, f'benchmark composited frame at {pts:.9f}s')
    return raw, times, rows

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--threads', type=int, choices=[1,4,8], required=True)
    args = parser.parse_args()
    assert os.environ.get('LP_NUM_THREADS') == str(args.threads)
    manifest = json.loads((SNAP/'snapshot.json').read_text())
    assert manifest['fingerprint'] == EXPECTED
    wrapper = load_wrapper()
    assert digest(SNAP/'export-wrapper.py') == manifest['wrapperSha256']
    for rel, sha in {**manifest['sourceSha256'], **manifest['compiledSha256']}.items():
        assert digest(SNAP/rel) == sha, rel
    for path, sha in manifest['dependencySha256'].items():
        assert digest(Path(path)) == sha, path
    OUT.mkdir(parents=True, exist_ok=True)
    job = OUT/'shared-cache'
    job.mkdir(exist_ok=True)
    config = {
        'width': 1920, 'height': 1080, 'fps': 30, 'samples': 2,
        'shutterDegrees': 180, 'start': 0.0, 'duration': 233.14421768707484,
        'sourceFingerprint': EXPECTED, 'skipUnusedReflection': True,
    }
    cuts = json.loads((SNAP/'cuts.json').read_text())
    began = time.perf_counter()
    renderer = wrapper.renderer_module(SNAP, job, config)
    initialized = time.perf_counter() - began
    records = []
    try:
        warm_raw, warm_times, _ = composite_frame(wrapper, renderer, config, cuts, 0.8)
        warm_hash = digest_bytes(warm_raw)
        for repeat in range(2):
            for pts in PTS:
                cpu0 = tree_cpu_seconds(PROC_PID)
                wall0 = time.perf_counter()
                raw, samples, rows = composite_frame(wrapper, renderer, config, cuts, pts)
                wall = time.perf_counter() - wall0
                cpu = tree_cpu_seconds(PROC_PID) - cpu0
                pixels = np.frombuffer(raw, dtype='u1').reshape(renderer.H, renderer.W, 3)[::-1].copy()
                png = OUT/f'lp{args.threads}-t{pts:.3f}-r{repeat+1}.png'
                Image.fromarray(pixels).save(png)
                record = {
                    'threads': args.threads, 'repeat': repeat+1, 'pts': pts,
                    'samples': samples, 'shots': sorted({row['shot'] for row in rows}),
                    'wallSeconds': wall, 'processTreeCpuSeconds': cpu,
                    'cpuToWallRatio': cpu/wall, 'decodedRgbSha256': digest_bytes(pixels.tobytes()),
                    'png': str(png), 'pngSha256': digest(png), 'glError': 'GL_NO_ERROR',
                }
                records.append(record)
                print(json.dumps(record), flush=True)
        result = {
            'snapshot': str(SNAP), 'sourceFingerprint': EXPECTED,
            'wrapperSha256': manifest['wrapperSha256'], 'LP_NUM_THREADS': args.threads,
            'width': renderer.W, 'height': renderer.H, 'fps': 30,
            'temporalSamples': 2, 'shutterDegrees': 180,
            'renderer': renderer.ctx.info['GL_RENDERER'], 'glVersion': renderer.ctx.info['GL_VERSION'],
            'initializationSeconds': initialized, 'warmupPts': 0.8,
            'warmupSamples': warm_times, 'warmupDecodedRgbSha256': warm_hash,
            'records': records,
        }
        target = OUT/f'lp{args.threads}.json'
        target.write_text(json.dumps(result, indent=2))
        print(json.dumps({'result': str(target)}), flush=True)
    finally:
        wrapper.close_renderer(renderer)

if __name__ == '__main__':
    main()
