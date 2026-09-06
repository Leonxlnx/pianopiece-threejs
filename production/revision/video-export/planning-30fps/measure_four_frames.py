"""Four native visual measurements only; no audio, encode or full export job."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,sys,time,importlib.util,threading,statistics,math,resource
ROOT=Path(__file__).resolve().parent;BASE=ROOT.parent;PROJECT=Path('/workspace/sites/daybreak-piano-film');WRAPPER=BASE/'export_video.py'
spec=importlib.util.spec_from_file_location('export_tools',WRAPPER);ex=importlib.util.module_from_spec(spec);spec.loader.exec_module(ex)
# Reuse only immutable snapshot copies with exact content hashes, never checkout links.
inputs={k:v for k,v in ex.snapshot_inputs(PROJECT,ex.DEFAULT_AUDIO).items() if not k.startswith('audio/')};hashes={k:ex.digest(v) for k,v in inputs.items()};deps={str(PROJECT/x):ex.digest(PROJECT/x) for x in ['node_modules/three/package.json','node_modules/three/build/three.core.js','node_modules/three/build/three.module.js','node_modules/typescript/package.json']};fingerprint=hashlib.sha256(ex.canonical({'visualInputs':hashes,'dependencies':deps,'wrapper':ex.digest(WRAPPER)}).encode()).hexdigest();snap=ROOT/('source-'+fingerprint[:16]);snap.mkdir(exist_ok=True)
verified={}
for mpath in (BASE/'work/snapshots').glob('*/snapshot.json'):
 m=json.loads(mpath.read_text())
 for rel,sha in m['sourceSha256'].items():
  if rel.startswith('audio/'):continue
  candidate=mpath.parent/rel
  if sha not in verified and candidate.is_file() and not candidate.is_symlink():verified[sha]=candidate
linked=0;copied=0
for rel,original in inputs.items():
 target=snap/rel;target.parent.mkdir(parents=True,exist_ok=True);sha=hashes[rel]
 if not target.exists():
  candidate=verified.get(sha)
  if candidate and ex.digest(candidate)==sha:os.link(candidate,target);linked+=1
  else:shutil.copyfile(original,target);copied+=1
 if ex.digest(target)!=sha or ex.digest(original)!=sha:raise RuntimeError('Source changed during visual snapshot: '+rel)
(snap/'node_modules').symlink_to(PROJECT/'node_modules',target_is_directory=True) if not (snap/'node_modules').exists() else None
shutil.copyfile(WRAPPER,snap/'export-wrapper.py');(snap/'compile.mjs').write_text(ex.COMPILE_SCRIPT);ex.run(['node',snap/'compile.mjs',snap],cwd=snap)
compiled={str(p.relative_to(snap)):ex.digest(p) for p in (snap/'production/qa/compiled').glob('*.mjs')};manifest={'fingerprint':fingerprint,'visualOnly':True,'sourceSha256':hashes,'dependencySha256':deps,'compiledSha256':compiled,'wrapperSha256':ex.digest(WRAPPER),'linkedImmutableInputs':linked,'copiedInputs':copied};ex.atomic_json(snap/'visual-snapshot.json',manifest)
run=ROOT/('measurement-'+fingerprint[:16]);run.mkdir(exist_ok=True);config={'sourceFingerprint':fingerprint,'width':1920,'skipUnusedReflection':True};os.environ.pop('DAYBREAK_KEEP_SCENE_JSON',None)

def status(pid):
 try:
  values={}
  for line in Path(f'/proc/{pid}/status').read_text().splitlines():
   if line.startswith(('VmRSS:','VmHWM:')):k,v=line.split(':',1);values[k]=int(v.strip().split()[0])*1024
  return values
 except (OSError,ValueError):return {}
def cgroup():
 root=Path('/sys/fs/cgroup');d={}
 for name in ['memory.current','memory.max']:
  try:d[name]=int((root/name).read_text())
  except (OSError,ValueError):pass
 try:d['cpuStat']={k:int(v) for k,v in (line.split() for line in (root/'cpu.stat').read_text().splitlines())}
 except (OSError,ValueError):pass
 return d
samples=[];stop=threading.Event();serverPid=[None]
def sample():
 while not stop.is_set():
  p=status('self');n=status(serverPid[0]) if serverPid[0] else {};cg=cgroup();samples.append({'elapsed':time.perf_counter()-began,'pythonRss':p.get('VmRSS',0),'nodeRss':n.get('VmRSS',0),'combinedRss':p.get('VmRSS',0)+n.get('VmRSS',0),'cgroupMemory':cg.get('memory.current',0)});stop.wait(.25)
began=time.perf_counter();sampler=threading.Thread(target=sample,daemon=True);sampler.start();rows=[];r=None
try:
 r=ex.renderer_module(snap,run,config);init=time.perf_counter()-began;serverPid[0]=r.server.pid;assert not Path(r.ready['scene']).exists();initialGlErrors=[]
 while True:
  error=r.ctx.error
  if error=='GL_NO_ERROR':break
  initialGlErrors.append(error)
 print('INITIAL_GL_ERRORS',json.dumps(initialGlErrors),flush=True);print(json.dumps({'initializedSeconds':init,'meshes':len(r.meshes),'vertices':sum(len(o['data']) for o in r.meshes),'audioCopied':False}),flush=True)
 from PIL import Image
 for t in [6.,26.05,64.,170.]:
  previous=r._staticShadowKey;cg0=cgroup();start=time.perf_counter();raw,detail=r.frame(t);seconds=time.perf_counter()-start;cg1=cgroup();memory={'python':status('self'),'poseServer':status(r.server.pid),'sharedCgroup':cg1};cpu0=cg0.get('cpuStat',{});cpu1=cg1.get('cpuStat',{});interval=[s for s in samples if s['elapsed']>=start-began];item={'time':t,'shot':detail['shot'],'frameSeconds':seconds,'rendererTiming':{k:detail[k] for k in ['update','shadows','render','total']},'staticShadowCacheReused':previous is not None and previous is r._staticShadowKey,'memory':memory,'peakSampledCombinedRssDuringFrame':max((s['combinedRss'] for s in interval),default=0),'sharedAverageCpuCores':(cpu1.get('usage_usec',0)-cpu0.get('usage_usec',0))/1e6/seconds,'sharedThrottledPeriods':cpu1.get('nr_throttled',0)-cpu0.get('nr_throttled',0),'glError':r.ctx.error};rows.append(item)
  Image.frombytes('RGB',(r.W,r.H),raw).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(run/f'frame-{t}.jpg',quality=95);print(json.dumps(item),flush=True);ex.atomic_json(run/'partial-measurement.json',{'initialGlErrors':initialGlErrors,'rows':rows})
  if item['glError']!='GL_NO_ERROR':raise RuntimeError('Per-frame GL error: '+item['glError'])
 stop.set();sampler.join();renderTimes=[x['frameSeconds'] for x in rows];encoderAllowance=.4;frames30=6995;frames24=5596;mean=statistics.mean(renderTimes);median=statistics.median(renderTimes);estimate={'frames30fps':frames30,'frames24fps':frames24,'encodingAllowanceSecondsPerFrame':encoderAllowance,'meanBasedHours30fps':(mean+encoderAllowance)*frames30/3600,'medianBasedHours30fps':(median+encoderAllowance)*frames30/3600,'observedRangeBasedHours30fps':[(min(renderTimes)+encoderAllowance)*frames30/3600,(max(renderTimes)+encoderAllowance)*frames30/3600],'cautiousPlanningHours30fps':[max(mean,median)*frames30/3600,(max(renderTimes)+encoderAllowance)*frames30/3600*1.25],'meanBasedHours24fps':(mean+encoderAllowance)*frames24/3600,'note':'Four representative frames under shared CPU load, not a full-film benchmark. First builds static shadows; later frames reuse them. Encoder allowance comes from prior measurement, not fresh encoding. Initialization excluded from per-frame times.'};report={'sourceFingerprint':fingerprint,'snapshot':str(snap),'visualOnly':True,'audioCopied':False,'width':r.W,'height':r.H,'lpNumThreads':os.environ.get('LP_NUM_THREADS'),'cpuQuota':Path('/sys/fs/cgroup/cpu.max').read_text().strip(),'initializationSeconds':init,'initialGlErrors':initialGlErrors,'meshes':len(r.meshes),'vertices':sum(len(o['data']) for o in r.meshes),'rows':rows,'peakSampledPythonRss':max(s['pythonRss'] for s in samples),'peakSampledNodeRss':max(s['nodeRss'] for s in samples),'nodeLifetimePeakRss':max(x['memory']['poseServer'].get('VmHWM',0) for x in rows),'peakSampledCombinedRss':max(s['combinedRss'] for s in samples),'peakSampledSharedCgroupMemory':max(s['cgroupMemory'] for s in samples),'pythonLifetimePeakRss':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024,'memorySamplingSeconds':.25,'estimates':estimate,'interchangeRemoved':not Path(r.ready['scene']).exists()};ex.atomic_json(run/'measurement.json',report);print(json.dumps({'report':str(run/'measurement.json'),'estimates':estimate}),flush=True)
finally:
 stop.set();sampler.join()
 if r is not None:r.server.terminate();r.server.wait();r.ctx.release()
 # Only reproducible scene interchange is removed; frozen inputs, env cache and images stay.
 for p in (run/'renderer-cache').glob('scene*.tmp'):p.unlink()
 (run/'renderer-cache/scene.json').unlink(missing_ok=True)
