from PIL import Image,ImageDraw
from pathlib import Path
import json,hashlib
p=Path(__file__).parent/'evidence';idx=json.loads((p/'index.json').read_text());lookup={(r['label'],r['camera'],r['time']):r for r in idx}
for t in sorted({r['time'] for r in idx}):
 sheet=Image.new('RGB',(1920,1140),(245,245,242));d=ImageDraw.Draw(sheet)
 for i,label in enumerate(['baseline','candidate']):
  for j,camera in enumerate(['top','oblique']):
   r=lookup[label,camera,t];src=Path(r['path']);assert hashlib.sha256(src.read_bytes()).hexdigest()==r['sha256'];im=Image.open(src);sheet.paste(im,(i*960,j*570+30));d.text((i*960+15,j*570+9),f'{label} / {camera} / {t:.6f}s',fill=(10,10,10))
 sheet.save(p/f'paired-{t:.6f}.png')
