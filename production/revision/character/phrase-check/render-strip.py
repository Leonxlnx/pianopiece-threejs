import sys,json,gzip
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
sys.path.insert(0,str(Path(__file__).parent.parent))
from render_character import render_asset
root=Path(__file__).parent
report=json.loads((root/'report.json').read_text())
asset='/workspace/sites/daybreak-piano-film/public/assets/pianist.glb'
size=650
for frame in report['frames']:
 data=json.loads(gzip.decompress((root/frame['file']).read_bytes()))
 render_asset(asset,root/f"frame-{frame['index']:02d}.png",azimuth=105,height=1.56,center=(0,.717,.455),size=size,pose_data=data,elevation=8)
 print('rendered',frame['index'],frame['time'],flush=True)
caption=44;gap=12
sheet=Image.new('RGB',(4*size+5*gap,3*(size+caption)+4*gap),(240,240,235))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
draw=ImageDraw.Draw(sheet)
for frame in report['frames']:
 i=frame['index'];x=gap+(i%4)*(size+gap);y=gap+(i//4)*(size+caption+gap)
 with Image.open(root/f'frame-{i:02d}.png') as image:sheet.paste(image,(x,y))
 draw.text((x+12,y+size+9),f"{i+1:02d}   {frame['time']:.3f} s",fill=(30,35,40),font=font)
sheet.save(root/'phrase-strip.jpg',quality=92)
print('strip',root/'phrase-strip.jpg',flush=True)
