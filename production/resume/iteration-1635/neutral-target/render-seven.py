import pathlib,subprocess,json,hashlib
p=pathlib.Path('/workspace/scratch/2e8cc8e77f98/neutral-target');h='/workspace/scratch/2e8cc8e77f98/render-recovery/run-single.sh';times=','.join(map(str,json.loads((p/'manifest.json').read_text())['neutralTimes']))
for name in ['pianist-baseline','neutral-f72-d0']:
 with (p/(name+'-render.log')).open('w')as log:subprocess.run([h,'--project','/workspace/sites/daybreak-piano-film','--width','1280','--times',times,'--camera','oblique','--pianist-source',str(p/(name+'.ts')),'--score-source',str(p/'baseline-score.json')],stdout=log,stderr=subprocess.STDOUT,check=True)
 print(name,(p/(name+'-render.log')).read_text()[-600:],flush=True)
