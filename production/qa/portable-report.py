"""Publish numerical audit results without workspace paths or raw mesh dumps.

Keep the original diagnostic output separately. This removes geometry columns,
not failures, cases, thresholds, counts or source checksums.
"""
import argparse
import json
import re
from pathlib import Path

RAW_GEOMETRY = {'point', 'points', 'deepest', 'weights', 'world', 'local'}

def portable(value, key=''):
    if isinstance(value, dict):
        return {portable(k): portable(v, k) for k, v in value.items()
                if k not in RAW_GEOMETRY}
    if isinstance(value, list):
        if key in {'vertices', 'indices'}:
            return len(value)
        return [portable(v) for v in value]
    if isinstance(value, str):
        value = re.sub(r'/workspace/scratch/[^/]+/pianopiece-threejs(?:/|(?=$))', '', value)
        value = re.sub(r'/workspace/scratch/[^/]+/work/', 'analysis/', value)
        value = re.sub(r'/workspace/scratch/[^/]+/', 'analysis/', value)
        return value
    return value

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    if args.input.resolve() == args.output.resolve():
        parser.error('Use a separate output path to preserve the original diagnostics')
    data = json.loads(args.input.read_text())
    if isinstance(data, dict) and 'notes' in data and 'bpm' in data:
        parser.error('A performance score is source data, not a diagnostic report')
    result = portable(data)
    if isinstance(result, dict):
        result['evidenceFormat'] = ('Portable numerical report. Raw vertex locations, triangle-index '
                                    'pairs, bone-weight dumps and private workspace paths are omitted. '
                                    'All failure cases, counts and tolerances are retained.')
        result['assetProvenance'] = ('Measurements of this repository\'s fictional CC0 avatar and '
                                    'procedural piano; no personal biometric data.')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')

if __name__ == '__main__':
    main()
