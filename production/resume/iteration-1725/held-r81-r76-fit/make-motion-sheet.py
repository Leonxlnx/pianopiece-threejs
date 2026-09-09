from PIL import Image,ImageDraw
from pathlib import Path
import json
p=Path(__file__).parent/'evidence-v8';idx=json.loads((p/'index.json').read_text());ts=[197.982519,197.9885,197.994,198.0,198.006519];lookup={(r['label'],r['camera'],r['time']):r for r in idx}
im=Image.new('RGB',(1400,1240),(246,246,244));d=ImageDraw.Draw(im)
for row,(label,camera) in enumerate([('baseline','top'),('candidate','top'),('baseline','oblique'),('candidate','oblique')]):
 for col,t in enumerate(ts):
  r=lookup[label,camera,t];src=Image.open(r['path']);box=(340,145,620,425) if camera=='top' else (410,260,690,540);im.paste(src.crop(box),(col*280,row*310+30));d.text((col*280+6,row*310+7),f'{label} {camera} {t:.6f}',fill=(10,10,10))
im.save(p/'pinky-transition-sequence.png')
