"""Exercise low-storage assembly with existing native frames, without rendering."""
from pathlib import Path
import contextlib,copy,importlib.util,io,json,shutil,subprocess
from types import SimpleNamespace
from unittest.mock import patch

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('export_under_test',HERE/'export_video.py')
export=importlib.util.module_from_spec(spec);spec.loader.exec_module(export)
smoke=Path('/workspace/scratch/2e8cc8e77f98/video-export/work/jobs/bf61155d4ae94ce1')
original=json.loads((smoke/'job.json').read_text());snapshot=Path(original['snapshot'])
source_video,source_meta=export.chunk_paths(smoke,0,2)
assert export.good_chunk(source_video,source_meta,0,2,original)
original_hashes={str(p):export.digest(p) for p in [source_video,source_meta,smoke/'job.json',snapshot/'audio/master.wav']}
work=Path('/workspace/scratch/2e8cc8e77f98/video-export/delivery-only-check')
work.mkdir(exist_ok=True)
checks=[]
def check(label,value):
 assert value,label
 checks.append(label)

def frame_hashes(path):
 text=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-map','0:v:0','-f','framemd5','-'],text=True)
 return [line.rsplit(',',1)[-1].strip() for line in text.splitlines() if line and not line.startswith('#')]

# Repeat the two already-rendered native frames as two test chunks. This tests
# the concat boundary without generating new 3D frames or claiming a new film.
config=copy.deepcopy(original);config.update(frames=4,duration=4/24,durationFraction='1/6',audioSamples=7350)
results={}
for delivery in [False,True]:
 job=work/('delivery' if delivery else 'archival');(job/'chunks').mkdir(parents=True,exist_ok=True)
 for first in [0,2]:
  video,metadata=export.chunk_paths(job,first,2);shutil.copyfile(source_video,video)
  record=json.loads(source_meta.read_text());record.update(firstFrame=first)
  export.atomic_json(metadata,record)
 args=SimpleNamespace(job=str(job),final=False,delivery_only=delivery)
 with patch.object(export,'load_job',return_value=(job,config,snapshot,{})),contextlib.redirect_stdout(io.StringIO()):
  export.assemble(args)
 report=json.loads((job/'validation.json').read_text());target=job/'daybreak-preview.mp4'
 check(f'{delivery}: decoded frame order across two chunks',frame_hashes(target)==frame_hashes(source_video)*2)
 check(f'{delivery}: native dimensions',report['outputs'][0]['probe']['streams'][0]['width']==1920)
 check(f'{delivery}: four frames retained',report['renderedFrames']==4)
 check(f'{delivery}: AAC sample alignment',report['aacAlignmentLagsSamples']==[0])
 check(f'{delivery}: old smoke score mismatch reported',report['masterScoreMatch'] is False)
 check(f'{delivery}: listening remains unverified',report['listeningReviewPerformed'] is False)
 if delivery:
  check('Delivery makes one video file',len(report['outputs'])==1 and not (job/'video-only.mp4').exists() and not (job/'daybreak-master.mov').exists())
  check('Delivery does not claim a PCM output',report['losslessPCMMatchesSourceExactly'] is None and report['pcmAudioMovieCreated'] is False)
 else:
  check('Default archival audio remains exact',report['losslessPCMMatchesSourceExactly'] is True and report['pcmAudioMovieCreated'] is True)
 results[delivery]=(job,report)
check('AAC output samples unchanged by direct concat',export.audio_bytes(results[False][0]/'daybreak-preview.mp4',float32=True)==export.audio_bytes(results[True][0]/'daybreak-preview.mp4',float32=True))
check('Source interval PCM hash unchanged',results[False][1]['sourcePCMsha256']==results[True][1]['sourcePCMsha256'])
job=results[True][0]
with patch.object(export,'load_job',return_value=(job,config,snapshot,{})):
 try:export.assemble(SimpleNamespace(job=str(job),final=True,delivery_only=True))
 except RuntimeError as error:check('Final score/master mismatch still blocks',str(error).startswith('Final assembly requires'))
 else:raise AssertionError('Final assembly unexpectedly bypassed the master gate')
check('All original smoke inputs remain unchanged',all(export.digest(Path(p))==sha for p,sha in original_hashes.items()))
report={'passed':True,'checks':checks,'wrapperSha256':export.digest(HERE/'export_video.py'),'nativeFramesRendered':0,'fixture':'Two copies of the existing two-frame native smoke chunk, to test the real concat boundary. Loader substitution isolates assembly from the historical pinned wrapper; no production manifest is modified.','sourceSmoke':str(smoke),'outputs':{str(key):str(value[0]) for key,value in results.items()}}
export.atomic_json(HERE/'delivery-only-validation.json',report)
print(json.dumps({'passed':True,'checks':len(checks),'nativeFramesRendered':0,'wrapperSha256':report['wrapperSha256']}))
