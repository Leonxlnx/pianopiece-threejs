from pathlib import Path
import json,subprocess,sys,hashlib,shutil
root=Path.cwd();leaf=root/'nonthumb-plane';rig=Path(sys.argv[1]).resolve();label=sys.argv[2];score=root/'r79-frozen-v2.json';out=leaf/'renders'/label;out.mkdir(parents=True,exist_ok=True)
rows=json.load(open(leaf/'baseline-rows.json'));chosen=[]
for t,side in [(7.7,'R'),(25.5420075,'L'),(159.2921565,'R'),(199.479266,'R')]:chosen.append(min([q for q in rows if q['side']==side],key=lambda q:abs(q['time']-t)))
results={};index=[]
for angle in ['top','oblique']:
 frames=[]
 for q in chosen:
  cx=q['wrist'][0];frames.append({'time':q['time'],'position':[cx,1.22,.26]if angle=='top'else[cx+.22,1.06,.57],'target':[cx,.765,.285],'up':[0,0,-1]if angle=='top'else[0,1,0],'fov':44})
 planfile=out/f'{angle}-camera.json';planfile.write_text(json.dumps({'frames':frames},indent=2));cmd=[str(root.parent/'render-recovery/run-single.sh'),'--project',str(root/'r79-render-project'),'--pianist-source',str(rig),'--score-source',str(score),'--width','960','--times',','.join(str(q['time'])for q in chosen),'--camera-plan',str(planfile)]
 (out/f'{angle}-command.json').write_text(json.dumps(cmd,indent=2))
 with(out/f'{angle}.log').open('w')as log:subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,check=True)
 report=next(json.loads(line)['report']for line in(out/f'{angle}.log').read_text().splitlines()if line.startswith('{')and'report'in json.loads(line));results[angle]=report;d=json.load(open(report));assert d['sourceSha256']['public/assets/score.json']==hashlib.sha256(score.read_bytes()).hexdigest();assert d['sourceSha256']['app/performance/pianist.ts']==hashlib.sha256(rig.read_bytes()).hexdigest();assert d['sourceSha256']['app/performance/wrist-motion.ts']==hashlib.sha256((root/'wrist-motion-arc.ts').read_bytes()).hexdigest()
 for f in d['frames']:
  assert f['glError']=='GL_NO_ERROR';p=out/f'{angle}-{f["row"]["time"]:.6f}.png';shutil.copyfile(f['image'],p);assert hashlib.sha256(p.read_bytes()).hexdigest()==f['imageSha256'];index.append({'time':f['row']['time'],'angle':angle,'image':str(p),'imageSha256':f['imageSha256'],'report':report,'sourceSha256':d['sourceSha256'],'glError':f['glError']})
 print(label,angle,report,flush=True)
(out/'reports.json').write_text(json.dumps(results,indent=2));(out/'image-index.json').write_text(json.dumps(index,indent=2))
