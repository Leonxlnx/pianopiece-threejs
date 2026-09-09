from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parent;recovery=root.parent
project=recovery/'snapshots/9ab8537c947aefb0'
baseline=project/'public/assets/score.json'
candidate=Path('/workspace/scratch/2e8cc8e77f98/active-hand-fit/candidate-primary-v1.json')
rig=project/'app/performance/pianist.ts'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(baseline)=='b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773'
assert sha(candidate)=='9db662f1e9d4037cc8c505b9818b7782ac1fb52fe70cff85bf362a00a9fb3b30'
assert sha(rig)=='f0407941995f70ecafecebe9559e0289716620f656b51affcfe279aade9c94b8'
scores=[json.loads(p.read_text()) for p in [baseline,candidate]]
notes=[{n['id']:n for n in score['notes']} for score in scores]
ids=['p00163','p00957','p00741','p00914'];rows=[];plans={name:{'name':'primary-held-'+name,'frames':[]} for name in ['top','oblique']}
for id in ids:
 a,b=[d[id] for d in notes]
 assert (a['time'],a['duration'])==(b['time'],b['duration'])
 t=a['time']+a['duration']/2
 midi=a['midi'];black=midi%12 in [1,3,6,8,10]
 x=-.611+sum(m%12 not in [1,3,6,8,10] for m in range(21,midi))*.0235+(-.0015 if black else .0235*.5)
 rows.append({'id':id,'time':t,'fractionOfHeldDuration':.5,'baselineNote':a,'candidateNote':b,'keyX':x})
 for name in plans:
  camera={'noteId':id,'time':t,'position':[x,1.48,.27] if name=='top' else [x+(.42 if a['hand']=='L' else -.42),1.35,.35],'target':[x,.755,.27 if name=='top' else .26],'up':[0,0,-1] if name=='top' else [0,1,0],'fov':32 if name=='top' else 30}
  plans[name]['frames'].append(camera)
for name,plan in plans.items():(root/f'camera-{name}.json').write_text(json.dumps(plan,indent=2))
manifest={'project':str(project),'baselineScore':str(baseline),'baselineSha256':sha(baseline),'candidateScore':str(candidate),'candidateSha256':sha(candidate),'rigSource':str(rig),'rigSha256':sha(rig),'rows':rows,'cameras':plans}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2))
times=','.join(str(r['time']) for r in rows)
commands=[]
for name in ['top','oblique']:
 for label,path in [('baseline',baseline),('primary',candidate)]:
  command=[str(recovery/'run-single.sh'),'--project',str(project),'--width','960','--times',times,'--pianist-source',str(rig),'--score-source',str(path),'--camera-plan',str(root/f'camera-{name}.json')]
  commands.append({'label':label,'camera':name,'command':command})
(root/'commands.json').write_text(json.dumps(commands,indent=2))
for row in commands:
 print('RENDER',row['label'],row['camera'],flush=True)
 with (root/f"render-{row['label']}-{row['camera']}.log").open('w') as log:
  subprocess.run(row['command'],stdout=log,stderr=subprocess.STDOUT,check=True)
 print((root/f"render-{row['label']}-{row['camera']}.log").read_text().splitlines()[-1],flush=True)
