#!/usr/bin/env python3
"""Render current Daybreak source to review PNGs; no audio/final-film claims."""
import argparse, hashlib, importlib.util, json, os, resource, shutil, subprocess, threading, time
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
PROC_PID = int(next(row.split()[1] for row in Path('/proc/self/status').read_text().splitlines() if row.startswith('Pid:')))
CAMERAS = {
    'top': {'position':[0,1.55,.26], 'target':[0,.765,.25], 'up':[0,0,-1], 'fov':43},
    'oblique': {'position':[.45,1.34,.58], 'target':[0,.765,.25], 'up':[0,1,0], 'fov':44},
    'arms-front': {'position':[0,1.18,-.05], 'target':[0,.98,.63], 'up':[0,1,0], 'fov':52},
    'arms-side': {'position':[1.05,1.02,.67], 'target':[0,.96,.65], 'up':[0,1,0], 'fov':48},
}

def digest(path):
    with open(path, 'rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def process_tree_rss(pid):
    total = 0
    todo = [pid]
    seen = set()
    while todo:
        current = todo.pop()
        if current in seen:
            continue
        seen.add(current)
        try:
            status = Path(f'/proc/{current}/status').read_text()
            total += next(int(row.split()[1]) * 1024 for row in status.splitlines() if row.startswith('VmRSS:'))
            todo.extend(map(int, Path(f'/proc/{current}/task/{current}/children').read_text().split()))
        except (FileNotFoundError, ProcessLookupError, StopIteration):
            pass
    return total

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=Path('/workspace/sites/daybreak-piano-film'))
    parser.add_argument('--times', default='26.05')
    parser.add_argument('--width', type=int, default=960)
    parser.add_argument('--pianist-source', type=Path)
    parser.add_argument('--piano-source', type=Path)
    parser.add_argument('--camera', choices=CAMERAS)
    args = parser.parse_args()
    project = args.project.resolve()
    wrapper_path = project/'production/revision/video-export/export_video.py'
    wrapper = load_module('export_wrapper', wrapper_path)
    rels = ['production/qa/render-revision.py', 'production/qa/pose-server.mjs', 'production/revision/video-export/export_video.py', 'package.json', 'package-lock.json']
    rels += [str(p.relative_to(project)) for p in sorted((project/'app/performance').glob('*.ts'))]
    rels += [str(p.relative_to(project)) for p in sorted((project/'public/assets').rglob('*')) if p.is_file() and p.suffix in ['.json', '.glb', '.png', '.jpg', '.jpeg']]
    source_hashes = {rel: digest(project/rel) for rel in rels}
    original_hashes = dict(source_hashes)
    overrides = {}
    if args.pianist_source:
        overrides['app/performance/pianist.ts'] = args.pianist_source.read_bytes()
    if args.piano_source:
        overrides['app/performance/piano.ts'] = args.piano_source.read_bytes()
    if args.camera:
        camera = CAMERAS[args.camera]
        marker = 'scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);'
        camera_code = 'camera.position.fromArray('+json.dumps(camera['position'])+');camera.up.fromArray('+json.dumps(camera['up'])+');camera.lookAt(new THREE.Vector3(...'+json.dumps(camera['target'])+'));camera.fov='+str(camera['fov'])+';camera.updateProjectionMatrix();'
        pose_source = (project/'production/qa/pose-server.mjs').read_text()
        assert pose_source.count(marker)==1, 'Review camera insertion point changed'
        overrides['production/qa/pose-server.mjs'] = pose_source.replace(marker,camera_code+marker).encode()
    source_hashes.update({rel:hashlib.sha256(data).hexdigest() for rel,data in overrides.items()})
    dep_paths = ['node_modules/three/package.json', 'node_modules/three/build/three.core.js', 'node_modules/three/build/three.module.js', 'node_modules/typescript/package.json']
    dep_hashes = {rel: digest(project/rel) for rel in dep_paths}
    fingerprint = hashlib.sha256(json.dumps({'source':source_hashes,'dependencies':dep_hashes}, sort_keys=True).encode()).hexdigest()
    snap = HERE/'snapshots'/fingerprint[:16]
    if not snap.exists():
        stage = snap.with_name(snap.name+'.preparing')
        stage.mkdir(parents=True)
        for rel in rels:
            target = stage/rel
            target.parent.mkdir(parents=True, exist_ok=True)
            if rel in overrides:
                target.write_bytes(overrides[rel])
            else:
                shutil.copyfile(project/rel, target)
        if any(digest(project/rel) != value for rel, value in original_hashes.items()) or any(digest(stage/rel) != value for rel, value in source_hashes.items()):
            raise RuntimeError('Source changed during snapshot; repeat after edits stop.')
        (stage/'node_modules').symlink_to(project/'node_modules', target_is_directory=True)
        (stage/'compile.mjs').write_text(wrapper.COMPILE_SCRIPT)
        subprocess.run(['node', str(stage/'compile.mjs'), str(stage)], cwd=stage, check=True)
        manifest = {'sourceFingerprint':fingerprint,'sourceSha256':source_hashes,'dependencySha256':dep_hashes,'project':str(project),'compiledSha256':{str(p.relative_to(stage)):digest(p) for p in sorted((stage/'production/qa/compiled').glob('*.mjs'))}}
        (stage/'source-manifest.json').write_text(json.dumps(manifest,indent=2))
        stage.rename(snap)
    manifest = json.loads((snap/'source-manifest.json').read_text())
    assert all(digest(snap/rel) == sha for rel,sha in {**manifest['sourceSha256'], **manifest['compiledSha256']}.items()), 'Snapshot changed'
    job = HERE/'reviews'/fingerprint[:16]
    job.mkdir(parents=True, exist_ok=True)
    config = {'width':args.width,'sourceFingerprint':fingerprint,'skipUnusedReflection':True}
    peak = [0]
    stop = threading.Event()
    def monitor():
        while not stop.wait(.1):
            peak[0] = max(peak[0], process_tree_rss(PROC_PID))
    thread = threading.Thread(target=monitor, daemon=True)
    thread.start()
    renderer = None
    started = time.perf_counter()
    try:
        renderer = wrapper.renderer_module(snap, job, config)
        initialized = time.perf_counter() - started
        # wrapper.renderer_module has already checked initialization and cached restoration.
        wrapper.check_gl(renderer.ctx, 'recovery initialization confirmation')
        deform = [{'name':m['name'],'vertices':len(m['vertices'])//3} for m in renderer.d['meshes'] if m.get('deformed')]
        assert deform and any('Human' in m['name'] for m in deform), 'No skinned Human geometry in real scene'
        rows = []
        for value in args.times.split(','):
            point = float(value)
            began = time.perf_counter()
            raw, row = renderer.frame(point)
            wrapper.check_gl(renderer.ctx, f'recovery frame/readback at {point:.9f}s')
            image_path = job/f'current-{args.width}-{point:.6f}.png'
            partial = image_path.with_suffix('.partial.png')
            Image.frombytes('RGB',(renderer.W,renderer.H),raw).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(partial)
            partial.replace(image_path)
            rows.append({'image':str(image_path),'imageSha256':digest(image_path),'width':renderer.W,'height':renderer.H,'glError':'GL_NO_ERROR','elapsedSeconds':time.perf_counter()-began,'row':row})
            print(json.dumps({'frame':str(image_path),'glError':'GL_NO_ERROR','seconds':rows[-1]['elapsedSeconds'],'shot':row['shot']}), flush=True)
        report = {'sourceFingerprint':fingerprint,'snapshot':str(snap),'sourceSha256':source_hashes,'originalSourceSha256':original_hashes,'reviewCamera':CAMERAS.get(args.camera),'pianistOverride':str(args.pianist_source) if args.pianist_source else None,'dependencySha256':dep_hashes,'renderer':renderer.ctx.info['GL_RENDERER'],'glVersion':renderer.ctx.info['GL_VERSION'],'initializationSeconds':initialized,'deformedMeshes':deform,'meshes':len(renderer.d['meshes']),'frames':rows,'peakProcessTreeRssBytes':peak[0],'pythonMaxRssBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024,'rssSamplingIntervalSeconds':.1,'steadyProcessTreeRssBytes':process_tree_rss(PROC_PID),'strictGuardSource':str(wrapper_path),'strictGuardSha256':digest(wrapper_path),'rendererSourceSha256':digest(project/'production/qa/render-revision.py'),'fullFilmStarted':False,'note':'Offline native rendered export; no browser pixel-equivalence claim. One sample per frame, full pavilion environment.'}
        report_path = job/f'report-{args.width}.json'
        if any(digest(Path(row['image'])) != row['imageSha256'] for row in rows):
            raise RuntimeError('Image changed before report acceptance; repeat this review.')
        wrapper.atomic_json(report_path, report)
        wrapper.atomic_json(HERE/'latest-report.json', {'report':str(report_path)})
        print(json.dumps({'report':str(report_path),'initializationSeconds':initialized,'peakProcessTreeRssBytes':peak[0]}), flush=True)
    finally:
        stop.set()
        thread.join()
        if renderer is not None:
            wrapper.close_renderer(renderer)

if __name__=='__main__':
    main()
