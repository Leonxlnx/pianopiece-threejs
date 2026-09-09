#!/usr/bin/env python3
"""Verify, optionally restore, exact historical source files split for transport."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import tempfile

def inside(root, relative):
    rel = Path(relative)
    if rel.is_absolute() or '..' in rel.parts:
        raise ValueError('Unsafe manifest path: ' + relative)
    result = (root / rel).resolve()
    result.relative_to(root)
    return result

def hashes(data):
    blob = b'blob ' + str(len(data)).encode() + b'\0' + data
    return hashlib.sha256(data).hexdigest(), hashlib.sha1(blob).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--restore', action='store_true', help='Create missing original files after verification.')
    args = parser.parse_args()
    root = args.root.resolve()
    manifest = args.manifest or root / 'context/large-source-manifest.json'
    spec = json.loads(manifest.read_text())
    restored = []
    for item in spec['files']:
        pieces = []
        for part in item['parts']:
            data = inside(root, part['path']).read_bytes()
            if len(data) != part['bytes'] or hashes(data) != (part['sha256'], part['gitBlobSha1']):
                raise ValueError('Part integrity mismatch: ' + part['path'])
            pieces.append(data)
        data = b''.join(pieces)
        if len(data) != item['bytes'] or hashes(data) != (item['sha256'], item['gitBlobSha1']):
            raise ValueError('Restored object integrity mismatch: ' + item['gitBlobSha1'])
        for entry in item['paths']:
            dest = inside(root, entry['path'])
            if dest.exists():
                if not dest.is_file() or dest.read_bytes() != data:
                    raise ValueError('Refusing to overwrite different content: ' + entry['path'])
            elif args.restore:
                dest.parent.mkdir(parents=True, exist_ok=True)
                fd, temporary = tempfile.mkstemp(prefix='.restore-', dir=dest.parent)
                try:
                    with os.fdopen(fd, 'wb') as stream:
                        stream.write(data)
                    os.chmod(temporary, 0o755 if entry['mode'] == '100755' else 0o644)
                    # A hard link atomically creates the target without replacing any file.
                    os.link(temporary, dest)
                finally:
                    os.unlink(temporary)
                restored.append(entry['path'])
    print(json.dumps({'verifiedObjects': len(spec['files']), 'restored': restored, 'sourceCommit': spec['sourceCommit']}, indent=2))

if __name__ == '__main__':
    main()
