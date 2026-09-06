import os,subprocess
from pathlib import Path
root=Path(__file__).parent
subprocess.run(['python',str(root/'prepare-render.py')],check=True)
env=os.environ.copy();env.update({'LD_LIBRARY_PATH':'/workspace/scratch/2e8cc8e77f98/render-libs/root/usr/lib/x86_64-linux-gnu','__EGL_VENDOR_LIBRARY_FILENAMES':'/workspace/scratch/2e8cc8e77f98/render-libs/root/usr/share/glvnd/egl_vendor.d/50_mesa.json','LIBGL_ALWAYS_SOFTWARE':'1','WIDTH':'960'})
for view,detail,time in [('wide','','0'),('interior','piano','74.8')]:
 for variant in ['base','candidate']:
  destination=root/f'render-{view}-{variant}';destination.mkdir(exist_ok=True)
  args=env|{'DAYBREAK_QA_ROOT':str(destination),'TIMES':time,'DAYBREAK_DETAIL':detail}
  project=root/f'render-project-{variant}'
  with open(destination/'render.log','w') as log:subprocess.run(['python',str(project/'production/qa/render-revision.py')],cwd=project,env=args,stdout=log,stderr=subprocess.STDOUT,check=True)
  print(view,variant,'done',flush=True)
