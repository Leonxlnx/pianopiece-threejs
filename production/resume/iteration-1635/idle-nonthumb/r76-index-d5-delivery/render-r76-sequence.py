from pathlib import Path
import subprocess,json,hashlib,shutil
r=Path(__file__).resolve().parent;score=r/'score-r76-frozen-v2.json';out=r/'r76-index-sequence';out.mkdir(exist_ok=True)
times='49.883542,49.900,49.916,49.970,50.055,50.100,51.035,51.100,51.190,51.255,51.285,51.325059'
index=[]
for label,source in [('baseline',r/'pianist-final-input.ts'),('candidate',r/'pianist-r76-index-both-v1-baked.ts')]:
 for angle in ['top','oblique']:
  cmd=[str(r.parent/'render-recovery/run-single.sh'),'--project',str(r.parent/'render-recovery/snapshots/12df4efb5ce15f92'),'--width','960','--times',times,'--camera',angle,'--pianist-source',str(source),'--score-source',str(score)]
  log=out/f'{label}-{angle}.log'
  with log.open('w') as f:subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT,check=True)
  rows=[json.loads(x)for x in log.read_text().splitlines()if x.startswith('{')];report=next(x['report']for x in rows if 'report'in x);d=json.loads(Path(report).read_text());assert d['sourceSha256']['app/performance/pianist.ts']==hashlib.sha256(source.read_bytes()).hexdigest();assert d['sourceSha256']['public/assets/score.json']==hashlib.sha256(score.read_bytes()).hexdigest()
  shutil.copyfile(report,out/f'{label}-{angle}-report.json')
  for f in d['frames']:
   assert f['glError']=='GL_NO_ERROR' and hashlib.sha256(Path(f['image']).read_bytes()).hexdigest()==f['imageSha256'];t=f['row']['time'];dest=out/f'{label}-{angle}-{t:.6f}.png';shutil.copyfile(f['image'],dest);index.append({'label':label,'angle':angle,'time':t,'path':str(dest),'sha256':f['imageSha256'],'report':str(out/f'{label}-{angle}-report.json')})
  print(label,angle,'saved',len(d['frames']),flush=True)
(out/'index.json').write_text(json.dumps(index,indent=2))
