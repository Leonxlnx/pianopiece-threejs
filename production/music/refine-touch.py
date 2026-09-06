"""Release keys under an already depressed pedal to prepare genuine register jumps.
The melody, starts, dynamic values, tempo map, sounding ends, and form are intact.
Input plans are measured from the actual performer, in metres and seconds.
"""
import bisect,json,math
from pathlib import Path
root=Path(__file__).resolve().parents[2]
scorepath=root/'public/assets/score.json'
s=json.loads(scorepath.read_text())
original=root/'production/music/score-before-touch-refinement.json'
if not original.exists():original.write_text(json.dumps(s,separators=(',',':')))
else:s=json.loads(original.read_text())
plans=json.loads((root/'production/music/wrist-planning-reference.json').read_text())
notes={n['id']:n for n in s['notes']}
pt=[p['time'] for p in s['pedals']]
def sustain_end(t):
 i=bisect.bisect_right(pt,t)-1
 if i<0 or s['pedals'][i]['value']<=.1:return t
 while i+1<len(pt):
  i+=1
  if s['pedals'][i]['value']<=.1:return pt[i]
 return t
changes=[]
for hand in plans:
 for prev,nxt in zip(hand['knots'],hand['knots'][1:]):
  dist=math.dist(prev['pose']['position'],nxt['pose']['position'])
  # Allow a smooth travel curve to accelerate and decelerate into the key.
  travel=min(.29,.07+dist/1.8)
  if dist<.028:continue
  for pn in prev['notes']:
   n=notes[pn['id']];old=n['time']+n['duration'];minimum=.075 if nxt['time']-n['time']<.19 else .105
   end=max(n['time']+minimum,nxt['time']-travel)
   if end>=old or abs(sustain_end(end)-sustain_end(old))>.0001:continue
   if sustain_end(end)<=end+.01:continue
   n.setdefault('writtenDuration',n['duration']);n['duration']=round(end-n['time'],6)
   changes.append({'id':n['id'],'midi':n['midi'],'oldRelease':round(old,6),'release':round(end,6),'nextOnset':nxt['time'],'handTravelMetres':dist,'sustainEnd':sustain_end(end)})
scorepath.write_text(json.dumps(s,separators=(',',':')))
(root/'production/music/touch-refinement.json').write_text(json.dumps({'reason':'Earlier physical releases under continuous sustain prepare register jumps; all original sounding-end times are preserved.','changes':changes},indent=2))
print(json.dumps({'changedNotes':len(changes),'maxAdvanceSeconds':max((c['oldRelease']-c['release'] for c in changes),default=0),'allSustainEndsPreserved':all(sustain_end(c['oldRelease'])==sustain_end(c['release']) for c in changes)}))
