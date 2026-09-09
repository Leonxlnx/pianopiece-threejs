#!/usr/bin/env python3
"""Recover and verify the exact pinned Daybreak 160-file piano subset."""
import argparse, concurrent.futures, hashlib, json, os, subprocess, time, urllib.request, urllib.parse
from pathlib import Path

PIN = '3382bf9496bba2486f5ab0de55a264d1dfc38404'
MANIFEST_SHA = '2507cb40c3ad4fe950d2998c94b40400c118654b0df9394477ab44fb6bf29af3'

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def verify_sample(entry, root, decode=False):
    name = entry['sourceFilename']
    if Path(name).name != name:
        raise ValueError('Unsafe sample filename')
    path = Path(root) / name
    data = path.read_bytes()
    checks = {
        'filename': name,
        'bytes': len(data),
        'sha256': hashlib.sha256(data).hexdigest(),
        'gitBlobSha1': hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest(),
    }
    if checks['bytes'] != entry['sourceBytes'] or checks['sha256'] != entry['sourceSha256'] or checks['gitBlobSha1'] != entry['sourceGitBlobSha1'] or data[:4] != b'fLaC':
        raise ValueError(f'Sample mismatch: {name}')
    if decode:
        probe = json.loads(subprocess.run(['ffprobe','-v','error','-show_streams','-of','json',str(path)],check=True,capture_output=True,text=True).stdout)['streams'][0]
        if int(probe['sample_rate']) != entry['sampleRate'] or int(probe['channels']) != entry['channels'] or int(probe['bits_per_raw_sample']) != entry['bitDepth'] or int(probe['duration_ts']) != entry['frames']:
            raise ValueError(f'Source format mismatch: {name}')
        result = subprocess.run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(path),'-f','null','-'],check=True,capture_output=True)
        if result.stderr:
            raise ValueError(result.stderr.decode())
        checks['fullDecodePassed'] = True
        checks['frames'] = entry['frames']
    return checks

def load_manifest(path):
    if sha(path) != MANIFEST_SHA:
        raise ValueError('Pinned sample manifest hash mismatch')
    manifest = json.loads(Path(path).read_text())
    samples = manifest['samples']
    if manifest['repositoryCommit'] != PIN or len(samples) != 160 or len({s['sourceFilename'] for s in samples}) != 160:
        raise ValueError('Unexpected piano sample manifest')
    for s in samples:
        expected = f"https://raw.githubusercontent.com/sfzinstruments/SalamanderGrandPiano/{PIN}/{urllib.parse.quote(s['sourceRepositoryPath'])}"
        if s['sourceUrl'] != expected:
            raise ValueError('Unpinned source URL')
    return manifest

def recover(entry, root, offline, decode):
    path = root / entry['sourceFilename']
    if path.exists():
        return verify_sample(entry, root, decode)
    if offline:
        raise FileNotFoundError(path)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(entry['sourceUrl'],timeout=45) as response:
                data = response.read()
            part = path.with_suffix('.flac.part')
            part.write_bytes(data)
            if len(data) != entry['sourceBytes'] or hashlib.sha256(data).hexdigest() != entry['sourceSha256']:
                raise ValueError(f'Download checksum mismatch: {path.name}')
            os.replace(part, path)
            return verify_sample(entry, root, decode)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1 + attempt)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest',type=Path,required=True)
    parser.add_argument('--root',type=Path,required=True)
    parser.add_argument('--report',type=Path,required=True)
    parser.add_argument('--offline',action='store_true')
    parser.add_argument('--decode',action='store_true')
    parser.add_argument('--workers',type=int,default=4)
    args = parser.parse_args()
    manifest = load_manifest(args.manifest)
    args.root.mkdir(parents=True,exist_ok=True)
    rows = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(recover,s,args.root,args.offline,args.decode) for s in manifest['samples']]
        for future in concurrent.futures.as_completed(futures):
            rows.append(future.result())
            if len(rows) % 20 == 0:
                print(f'Verified {len(rows)}/160 sources',flush=True)
    report = {'allPassed':True,'manifestSha256':sha(args.manifest),'repositoryCommit':PIN,
              'sampleRoot':str(args.root.resolve()),'sampleCount':len(rows),
              'totalBytes':sum(row['bytes'] for row in rows),'freshFullDecodePerformed':args.decode,
              'samples':sorted(rows,key=lambda row:row['filename'])}
    args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='samples'},indent=2))

if __name__ == '__main__':
    main()
