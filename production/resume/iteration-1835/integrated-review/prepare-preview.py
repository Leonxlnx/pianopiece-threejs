from pathlib import Path
import json,hashlib,subprocess
r=Path('/workspace/scratch/2e8cc8e77f98'); p=Path('/workspace/sites/daybreak-piano-film'); out=r/'integrated-review/opening-preview';out.mkdir(exist_ok=True)
a=json.loads((p/'production/revision/music-master-final/score-frozen.json').read_text());b=json.loads((r/'integrated-review/score-v10.json').read_text())
fields=['id','time','midi','duration','velocity','hand','role']
notes=lambda s:[{k:n.get(k) for k in fields} for n in s['notes'] if n['time']<15]
assert notes(a)==notes(b)
print('score keys',list(a))
for k in a:
 if 'pedal' in k.lower():
  print('pedal key',k)
  if isinstance(a[k],list):
   select=lambda rows:[v for v in rows if not isinstance(v,dict) or v.get('time',0)<15]
   assert select(a[k])==select(b[k])
mp3=p/'public/assets/daybreak.mp3'; wav=out/'preview-only-decoded-existing-mp3.wav'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(mp3),'-ar','44100','-ac','2','-c:a','pcm_s24le',str(wav)],check=True)
sha=lambda x:hashlib.sha256(x.read_bytes()).hexdigest()
(out/'preview-provenance.json').write_text(json.dumps({'purpose':'Four-second visual motion review only; existing MP3 decoded to PCM, not a new lossless master','interval':[8.8,12.8],'openingMusicEventsCompared':len(notes(a)),'openingMusicEventsAndPedalExact':True,'existingMp3Sha256':sha(mp3),'decodedPcmSha256':sha(wav),'newFullScoreMasterRendered':False},indent=2))
snap=json.loads((r/'integrated-review/opening-preview-prepare.json').read_text())['snapshot']
cmd=['python',str(p/'production/revision/video-export/export_video.py'),'prepare','--project',snap,'--audio',str(wav),'--root',str(out/'export'),'--start','8.8','--duration','4','--fps','30','--width','1280','--chunk-frames','30','--samples','2','--shutter','180']
res=subprocess.check_output(cmd,text=True);print(res);(out/'prepare.json').write_text(res)
