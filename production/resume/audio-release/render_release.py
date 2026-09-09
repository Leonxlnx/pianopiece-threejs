#!/usr/bin/env python3
"""Run only a fresh full render; never reuse unbound dry stems or premaster."""
import argparse, json, os, platform, subprocess, sys
from pathlib import Path
import numpy, scipy
from release_common import preflight, require, sha, write_json

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--release',type=Path,required=True)
    p.add_argument('--score',type=Path,required=True)
    p.add_argument('--expected-score-sha',required=True)
    p.add_argument('--sample-root',type=Path)
    a=p.parse_args()
    binding,score,manifest,root=preflight(a.release,a.score,a.expected_score_sha,a.sample_root)
    release=a.release.resolve()
    require(binding['status']=='accepted-final','Final render requires an accepted-final score freeze')
    require(not any(release.glob('*.wav')) and not any(release.glob('*.mp3')) and not (release/'render-started.json').exists(),'Render outputs or a prior attempt exist; prepare a new directory')
    start={'releaseInputSha256':sha(release/'release-input.json'),'scoreSha256':a.expected_score_sha}
    write_json(release/'render-started.json',start)
    env={k:v for k,v in os.environ.items() if k not in ['DAYBREAK_SCORE_PATH','DAYBREAK_SAMPLE_MANIFEST_PATH']}
    env['DAYBREAK_SAMPLE_ROOT']=str(root)
    subprocess.run([sys.executable,str(release/'render_solo_master.py')],env=env,cwd=release,check=True)
    preflight(release,a.score,a.expected_score_sha,root)
    required=['daybreak-solo-master.wav','daybreak-solo-master.mp3','mastering-analysis.json','mix-manifest.json','event-audit.json','source-mapping.json','premaster.wav','score-frozen.json']
    required += [f'daybreak-{label}-excerpt.{ext}' for label in ['first-theme','climax'] for ext in ['wav','mp3']]
    reproduction={**binding,'python':platform.python_version(),'numpy':numpy.__version__,'scipy':scipy.__version__,
                  'ffmpeg':subprocess.run(['ffmpeg','-version'],check=True,capture_output=True,text=True).stdout.splitlines()[0],
                  'releaseInputSha256':start['releaseInputSha256'],
                  'outputFiles':{name:sha(release/name) for name in required},
                  'rerunPolicy':'New output directory and complete rerender; no mix-only or master-only resume.'}
    write_json(release/'reproduction-manifest.json',reproduction)
    subprocess.run([sys.executable,str(Path(__file__).with_name('verify_release.py')),'--release',str(release),
                    '--score',str(a.score.resolve()),'--expected-score-sha',a.expected_score_sha,'--sample-root',str(root)],check=True)

if __name__=='__main__':main()
