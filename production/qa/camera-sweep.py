"""Render each authored camera at fixed score positions; offline visual QA only."""
import json, os, re, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw
project=Path(__file__).resolve().parents[2]
score=json.loads((project/'public/assets/score.json').read_text())
bars=[int(n) for n in re.findall(r'\[atBar\((\d+)\)',(project/'app/performance/direction.ts').read_text())]
starts=[next(h['time'] for h in score['harmony'] if h['bar']==bar) for bar in bars]
ends=starts[1:]+[score['duration']]
aspect=float(sys.argv[1]) if len(sys.argv)>1 else 16/9
width=int(sys.argv[2]) if len(sys.argv)>2 else 1280
root=Path(sys.argv[3]) if len(sys.argv)>3 else Path('/workspace/scratch/2e8cc8e77f98/camera-sweep')
root.mkdir(parents=True,exist_ok=True)
samples=[{'shot':i,'bar':bar,'fraction':f,'time':a+(b-a)*f} for i,(bar,a,b) in enumerate(zip(bars,starts,ends)) for f in [.08,.5,.92]]
env=os.environ.copy();env.update(DAYBREAK_ASPECT=str(aspect),WIDTH=str(width),DAYBREAK_QA_ROOT=str(root),TIMES=','.join(str(x['time']) for x in samples));env.pop('DAYBREAK_DETAIL',None);env.pop('DAYBREAK_SHOT',None)
subprocess.run([sys.executable,str(project/'production/qa/render-revision.py')],cwd=project,env=env,check=True)
(root/'samples.json').write_text(json.dumps(samples,indent=2))
thumb_w=320 if aspect>1 else 190
thumb_h=round(thumb_w/aspect)
for page in range(3):
 rows=8;canvas=Image.new('RGB',(3*thumb_w,rows*(thumb_h+24)),(22,24,27));draw=ImageDraw.Draw(canvas)
 for row in range(rows):
  shot=page*rows+row
  for col in range(3):
   i=shot*3+col
   im=Image.open(root/f'gl-{width}-{i}.jpg');im.thumbnail((thumb_w,thumb_h))
   x,y=col*thumb_w,row*(thumb_h+24);canvas.paste(im,(x,y));draw.text((x+5,y+thumb_h+4),f'Shot {shot+1}  bar {samples[i]["bar"]}  {samples[i]["time"]:.2f}s',fill='white')
 canvas.save(root/f'camera-sheet-{page+1}.jpg',quality=93)
