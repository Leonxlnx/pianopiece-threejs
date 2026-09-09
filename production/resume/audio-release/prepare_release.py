#!/usr/bin/env python3
"""Freeze an explicitly accepted score and the pinned, unchanged audio DSP."""
import argparse, json, re, shutil
from pathlib import Path
from release_common import RENDERER_SHA, audio_signature, require, sha, validate_score, write_json
from recover_samples import load_manifest, verify_sample

HERE=Path(__file__).resolve().parent

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--score',type=Path,required=True)
    p.add_argument('--expected-score-sha',required=True)
    p.add_argument('--sample-root',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--project',type=Path,required=True,help='Read-only source of existing public credits')
    p.add_argument('--status',choices=['candidate','accepted-final'],required=True)
    a=p.parse_args()
    require(re.fullmatch('[0-9a-f]{64}',a.expected_score_sha) is not None,'A complete score SHA is required')
    require(sha(a.score)==a.expected_score_sha,'Score does not match explicitly expected SHA')
    score=json.loads(a.score.read_text());validate_score(score)
    require(sha(HERE/'render_solo_master.py')==RENDERER_SHA,'Saved renderer has changed; refuse to alter DSP silently')
    manifest=load_manifest(HERE/'sample-manifest-frozen.json')
    for entry in manifest['samples']:verify_sample(entry,a.sample_root)
    require(not a.output.exists(),'Output exists; use a new release directory to prevent stale intermediates')
    require((HERE/'piano-samples-LICENSE-CC-BY-3.0.txt').is_file(),'Recovered source license is missing')
    a.output.mkdir(parents=True)
    shutil.copy2(a.score,a.output/'score-final-input.json')
    shutil.copy2(HERE/'sample-manifest-frozen.json',a.output/'sample-manifest-frozen.json')
    shutil.copy2(HERE/'piano-samples-LICENSE-CC-BY-3.0.txt',a.output/'piano-samples-LICENSE-CC-BY-3.0.txt')
    for name in ['credits.txt','software-notices.txt']:
        shutil.copy2(a.project/'public/assets'/name,a.output/name)
    src=(HERE/'render_solo_master.py').read_text()
    replacements={
        "SCORE_PATH=pathlib.Path(os.environ.get('DAYBREAK_SCORE_PATH','/workspace/scratch/2e8cc8e77f98/music-master-final/score-final-input.json'))":"SCORE_PATH=HERE/'score-final-input.json'",
        "SAMPLE_MANIFEST=pathlib.Path(os.environ.get('DAYBREAK_SAMPLE_MANIFEST_PATH','/workspace/scratch/2e8cc8e77f98/piano-assets/sample-manifest.json'))":"SAMPLE_MANIFEST=HERE/'sample-manifest-frozen.json'",
        "EXPECTED_SCORE_SHA='5b47b2ba244b70fd2b7a63b47baccc366bdd0c7faaccbf00959c9aa43ae05baa'":f"EXPECTED_SCORE_SHA='{a.expected_score_sha}'",
    }
    for old,new in replacements.items():
        require(src.count(old)==1,'Renderer header differs from expected preserved source')
        src=src.replace(old,new)
    (a.output/'render_solo_master.py').write_text(src)
    names=['score-final-input.json','sample-manifest-frozen.json','render_solo_master.py','credits.txt','software-notices.txt','piano-samples-LICENSE-CC-BY-3.0.txt']
    binding={'schemaVersion':1,'status':a.status,'scoreSha256':a.expected_score_sha,
             'audioEventSha256':audio_signature(score),'sourceScorePath':str(a.score.resolve()),
             'sampleRoot':str(a.sample_root.resolve()),'sampleCount':160,
             'baseRendererSha256':RENDERER_SHA,'rendererDspUnmodified':True,
             'rendererEdits':'Only exact score SHA and two portable input-path constants changed.',
             'inputFiles':{n:sha(a.output/n) for n in names},
             'audioCanonicalization':'JSON sort_keys=True, separators comma/colon, UTF-8; duration, complete pedals, and note id/time/duration/midi/velocity/role in input order.',
             'noteCount':len(score['notes']),'sampleRate':44100,'expectedFrames':round(score['duration']*44100),
             'criticalListeningPerformed':False}
    write_json(a.output/'release-input.json',binding)
    write_json(a.output/'audio-input-signature.json',{k:binding[k] for k in ['scoreSha256','audioEventSha256','audioCanonicalization']})
    print(json.dumps(binding,indent=2))

if __name__=='__main__':main()
