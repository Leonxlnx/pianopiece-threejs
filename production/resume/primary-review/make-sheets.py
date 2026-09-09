from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parent
index=json.loads((root/'image-index.json').read_text())['images']
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
for id in ['p00163','p00957','p00741','p00914']:
 sheet=Image.new('RGB',(1920,1152),'#1a1e24');draw=ImageDraw.Draw(sheet)
 for row in index:
  if row['id']!=id:continue
  x=0 if row['label']=='baseline' else 960;y=0 if row['camera']=='top' else 576
  draw.text((x+14,y+7),f"{id} | {row['time']:.7f}s | {row['camera']} | {row['label']}",font=font,fill='white')
  sheet.paste(Image.open(row['path']),(x,y+36))
 partial=root/f'{id}-comparison.partial.png';sheet.save(partial);partial.replace(root/f'{id}-comparison.png')
print('SHEETS_PASS: four native-resolution paired camera sheets')
