import subprocess,pathlib
p=pathlib.Path('/workspace/scratch/2e8cc8e77f98/yaw-passages');h='/workspace/scratch/2e8cc8e77f98/render-recovery/run-single.sh';project='/workspace/scratch/2e8cc8e77f98/render-recovery/snapshots/a94c0a6d4fd6d948'
times='105.528197,105.7149985,106.020543,187.4408685,187.738975,187.896535'
for name in ['baseline-score','diagnostic-candidate']:
 with (p/(name+'-render.log')).open('w') as log:
  subprocess.run([h,'--project',project,'--width','1280','--times',times,'--camera','top','--pianist-source',str(p/'baseline-rig.ts'),'--score-source',str(p/(name+'.json'))],stdout=log,stderr=subprocess.STDOUT,check=True)
 print(name,(p/(name+'-render.log')).read_text()[-2000:],flush=True)
