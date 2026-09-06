from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageDraw
r=Path(__file__).parent;reports=[]
for view in ['wide','interior']:
 paths=[r/f'render-{view}-{v}/raw-960-0.png' for v in ['base','candidate']]
 if not all(p.exists() for p in paths):continue
 imgs=[Image.open(p).convert('RGB') for p in paths];a,b=[np.asarray(i).astype(np.int16) for i in imgs];d=np.abs(a-b);mask=d.max(2)>0
 changed=np.argwhere(mask)
 bbox=[int(changed[:,1].min()),int(changed[:,0].min()),int(changed[:,1].max()),int(changed[:,0].max())] if len(changed) else None
 mse=float(np.mean((a-b).astype(float)**2))
 report={'view':view,'pixels':mask.size,'changedPixels':int(mask.sum()),'changedPercent':float(mask.mean()*100),'pixelsOver2Levels':int((d.max(2)>2).sum()),'pixelsOver8Levels':int((d.max(2)>8).sum()),'maxChannelDifference':int(d.max()),'meanAbsoluteChannelDifference':float(d.mean()),'psnrDb':float(10*np.log10(255**2/mse)) if mse else None,'changedBounds':bbox,'hashes':[hashlib.sha256(p.read_bytes()).hexdigest() for p in paths]}
 reports.append(report)
 sheet=Image.new('RGB',(1920,1120),(24,24,24));draw=ImageDraw.Draw(sheet)
 for i,img in enumerate(imgs):sheet.paste(img,(960*i,24));draw.text((960*i+12,7),['Baseline','Static geometry batches'][i],fill=(255,255,255))
 amplified=np.minimum(d*12,255).astype(np.uint8);sheet.paste(Image.fromarray(amplified),(0,580));draw.text((12,563),'Absolute difference ×12 (black = unchanged)',fill=(255,255,255))
 # Stable crop of piano in wide; interior is full-frame instrument view.
 crop=(270,145,645,460) if view=='wide' else (150,100,810,490)
 zoom=imgs[1].crop(crop);zoom.thumbnail((950,530));sheet.paste(zoom,(960,580));draw.text((972,563),'Candidate detail',fill=(255,255,255));sheet.save(r/f'{view}-comparison.jpg',quality=95)
(r/'pixel-comparison.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports,indent=2))
