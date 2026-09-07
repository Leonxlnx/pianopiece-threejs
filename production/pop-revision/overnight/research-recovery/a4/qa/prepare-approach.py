import json,os
from pathlib import Path
r=Path('.');d=r/'approach-research';d.mkdir(exist_ok=True)
s=json.loads((r/'release-twelve/score.json').read_text());n=next(n for n in s['notes'] if n['id']=='db00522');windows=[{'id':n['id'],'hand':n['hand'],'finger':n['finger'],'start':n['time']-.2,'end':n['time']}]
times=[]
for w in windows:
 a=w['start']-.025;b=w['end']+.025
 for i in range(__import__('math').ceil((b-a)*240)+1):times.append(min(a+i/240,b))
 times.extend([w['start'],w['end'],w['start']-.00001,w['end']+.00001])
for name,control in [('baseline',None),('lift35',{'liftDegrees':35}),('lift50',{'liftDegrees':50}),('long35',{'liftDegrees':35,'duration':.16}),('long50',{'liftDegrees':50,'duration':.16})]:
 p=d/name;p.mkdir(exist_ok=True);v=json.loads(json.dumps(s))
 if control:next(x for x in v['notes'] if x['id']==n['id'])['approachPose']=control
 (p/'score.json').write_text(json.dumps(v,indent=2)+'\n');(p/'windows.json').write_text(json.dumps(windows,indent=2)+'\n');(p/'times.json').write_text(json.dumps(sorted(set(times)))+'\n');(p/'compiled').symlink_to('../../inventory/integrated/compiled')
print('Prepared five bounded approach variants',len(set(times)))
