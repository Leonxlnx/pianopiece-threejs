from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
r=Path(__file__).resolve().parent/'r76-index-sequence';index=json.load(open(r/'index.json'));font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
for angle,box in [('top',(535,190,690,390)),('oblique',(440,270,640,440))]:
 for phase,times in [('release',[49.883542,49.9,49.916,49.97,50.055,50.1]),('arrival',[51.035,51.1,51.19,51.255,51.285,51.325059])]:
  w,h=box[2]-box[0],box[3]-box[1];sheet=Image.new('RGB',(w*6,(h+40)*2),'#121820');d=ImageDraw.Draw(sheet)
  for row,label in enumerate(['baseline','candidate']):
   for col,t in enumerate(times):
    f=next(f for f in index if f['label']==label and f['angle']==angle and abs(f['time']-t)<1e-7)
    sheet.paste(Image.open(f['path']).crop(box),(col*w,row*(h+40)+40));d.text((col*w+4,row*(h+40)+3),f'{label}\n{t:.6f}s',font=font,fill='white')
  sheet.save(r/f'{phase}-{angle}-sheet.png')
