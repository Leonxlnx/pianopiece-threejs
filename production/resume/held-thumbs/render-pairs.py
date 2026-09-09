from pathlib import Path
import subprocess,json
base=Path('/workspace/scratch/2e8cc8e77f98/held-thumbs')
helper='/workspace/scratch/2e8cc8e77f98/render-recovery/run-single.sh'
project='/workspace/sites/daybreak-piano-film'
for version,score in [('baseline','baseline-score.json'),('candidate','candidate-score.json')]:
    args=[helper,'--project',project,'--width','1280','--times','4.5384775,105.7149985,187.4408685','--camera','top','--pianist-source',str(base/'pianist-arms-compact5.ts'),'--score-source',str(base/score)]
    log=base/(version+'-render.log')
    with log.open('w')as out:subprocess.run(args,stdout=out,stderr=subprocess.STDOUT,check=True)
    reportline=json.loads(log.read_text().splitlines()[-1]);report=json.loads(Path(reportline['report']).read_text());project=report['snapshot'];print(version,reportline['report'],flush=True)
