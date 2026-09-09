from pathlib import Path
import json,subprocess,hashlib,shutil
p=Path(__file__).resolve().parent;rr=p.parent/'render-recovery';ev=p/'evidence-v8';ev.mkdir(exist_ok=True)
times=[87.48,92.85,102.67,103.0,120.99,197.975,197.982519,197.9885,197.994,198.0,198.006519,198.14,200.36]
idx=[]
for label,score in [('candidate',p/'candidate-v8.json')]:
 for camera in ['top','oblique']:
  if camera=='top':pose={'position':[.18,1.2,.265],'target':[.18,.765,.265],'up':[0,0,-1],'fov':44}
  else:pose={'position':[.48,1.16,.58],'target':[.18,.765,.265],'up':[0,1,0],'fov':34}
  plan=p/(camera+'-camera.json');plan.write_text(json.dumps({'frames':[{'time':t,**pose} for t in times]}))
  logfile=ev/(label+'-'+camera+'.log')
  cmd=[str(rr/'run-single.sh'),'--project',str(p/'render-project'),'--width','960','--times',','.join(map(str,times)),'--camera-plan',str(plan),'--pianist-source',str(p.parent/'local-idle-diagnostic/pianist-baseline.ts'),'--score-source',str(score)]
  with logfile.open('w') as log:subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,check=True)
  lines=[json.loads(l) for l in logfile.read_text().splitlines() if l.startswith('{')]
  rp=Path(next(r['report'] for r in reversed(lines) if 'report' in r));report=json.loads(rp.read_text());assert len(report['frames'])==len(times)
  reportcopy=ev/(label+'-'+camera+'-report.json');shutil.copyfile(rp,reportcopy)
  for t,row in zip(times,report['frames']):
   src=Path(row.get('path',row.get('image',row.get('file',''))));print(row,flush=True) if not src.is_file() else None
   if not src.is_file():src=Path(row['imagePath'])
   assert hashlib.sha256(src.read_bytes()).hexdigest()==row['imageSha256'];dst=ev/(label+'-'+camera+'-'+format(t,'.6f')+'.png');shutil.copyfile(src,dst)
   idx.append({'label':label,'camera':camera,'time':t,'path':str(dst),'sha256':row['imageSha256'],'report':str(reportcopy)})
  (ev/'index.json').write_text(json.dumps(idx,indent=2));print(label,camera,'accepted',flush=True)
