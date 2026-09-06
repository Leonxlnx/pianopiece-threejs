"""Exercise real wrapper control flow with fake GL/encoder objects; no native render."""
from pathlib import Path
from types import SimpleNamespace,ModuleType
from unittest.mock import patch
import ast,contextlib,importlib.util,io,json,os,sys,tempfile
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('guard_exporter',ROOT/'export_video.py')
ex=importlib.util.module_from_spec(spec);spec.loader.exec_module(ex)
checks=[];cases=[]
def check(label,condition):
 assert condition,label
 checks.append(label)

class Context:
 def __init__(self,f):self.f=f;self.pending='GL_NO_ERROR';self.released=False
 @property
 def error(self):
  value=self.pending;self.pending='GL_NO_ERROR';self.f.events.append(['gl-check',value]);return value
 def release(self):self.released=True;self.f.events.append(['context-release'])
 def disable(self,*args):pass
 def texture_array(self,*args,**kwargs):
  if self.f.failure=='cached':self.pending='GL_INVALID_OPERATION'
  return Texture(self.f,'environment')

class Server:
 def __init__(self,f):self.f=f;self.terminated=False;self.waited=False
 def terminate(self):self.terminated=True;self.f.events.append(['server-terminate'])
 def wait(self):self.waited=True

class Texture:
 def __init__(self,f,kind):self.f=f;self.kind=kind
 def release(self):pass
 def use(self,*args):pass
 def write(self,*args):pass
 def read(self,*args,**kwargs):
  self.f.events.append(['hdr-readback',self.f.framecalls])
  if self.f.failure=='hdr':self.f.ctx.pending='GL_INVALID_OPERATION'
  return np.zeros((4,4,4),dtype='f2').tobytes()

class Output:
 def __init__(self,f):self.f=f
 def use(self):pass
 def read(self,*args,**kwargs):
  self.f.events.append(['composite-readback'])
  if self.f.failure=='composite':self.f.ctx.pending='GL_INVALID_FRAMEBUFFER_OPERATION'
  return bytes(4*4*3)

class Encoder:
 def __init__(self,f,command):
  self.f=f;self.path=Path(command[-1]);self.path.write_bytes(b'partial');self.stdin=self
  self.writes=[];self.terminated=False;self.code=None;self.closed=False
  f.encoders.append(self);f.events.append(['encoder-start'])
 def write(self,data):self.writes.append(data);self.f.events.append(['encoder-write']);return len(data)
 def close(self):self.closed=True
 def poll(self):return self.code
 def terminate(self):self.terminated=True;self.code=-15;self.f.events.append(['encoder-terminate'])
 def wait(self):
  if self.code is None:self.code=0;self.path.write_bytes(b'encoded'+b''.join(self.writes))
  return self.code

class Fixture:
 def __init__(self,failure):
  self.failure=failure;self.events=[];self.encoders=[];self.framecalls=0
  self.ctx=Context(self);self.server=Server(self);self.color=Texture(self,'color');self.outfbo=Output(self)
  self.postvao=SimpleNamespace(render=lambda *args:None);self.envAtlas=Texture(self,'environment')
  if failure=='initialization':self.ctx.pending='GL_OUT_OF_MEMORY'
 def frame(self,t):
  self.framecalls+=1;self.events.append(['native-readback',self.framecalls])
  if (self.failure=='native-first' and self.framecalls==1) or (self.failure in ['native-second','sample-second'] and self.framecalls==2):self.ctx.pending='GL_INVALID_OPERATION'
  return bytes(4*4*3),{'shot':'Frozen test shot','time':t}

def scenario(name,failure=None,samples=1,cached=False):
 f=Fixture(failure)
 with tempfile.TemporaryDirectory(prefix='guard-',dir=Path(__file__).resolve().parent) as temp:
  base=Path(temp);job=base/'job';snap=base/'snapshot';cache=job/'renderer-cache'
  (job/'chunks').mkdir(parents=True);cache.mkdir();(snap/'production/qa').mkdir(parents=True)
  c={'sourceFingerprint':'frozen-control-test','start':0.,'duration':.2,'durationFraction':'1/5','fps':30,'frames':6,'chunkFrames':2,'width':4,'height':4,'samples':samples,'shutterDegrees':180,'crf':17,'preset':'medium','skipUnusedReflection':False}
  ready=cache/'scene.json';ready.write_text('{}');f.ready={'scene':str(ready)}
  env=cache/'environment-prefiltered-linear.npz';np.savez(env,layers=np.zeros((6,2,2,3),dtype='f2'))
  meta=cache/'environment-cache.json'
  if cached:ex.atomic_json(meta,{'sourceFingerprint':c['sourceFingerprint'],'sha256':ex.digest(env)})
  (snap/'cuts.json').write_text(json.dumps([{'start':0,'end':1,'name':'Frozen test shot'}]))
  (snap/'production/qa/render-revision.py').write_text("from guard_fixture import active\nctx=active.ctx\nserver=active.server\nready=active.ready\nframe=active.frame\ncolor=active.color\noutfbo=active.outfbo\npostvao=active.postvao\nenvAtlas=active.envAtlas\nprog={}\nH=W=4\n")
  bridge=ModuleType('guard_fixture');bridge.active=f
  complete,complete_meta=ex.chunk_paths(job,0,2);complete.write_bytes(b'previously-completed-chunk')
  ex.atomic_json(complete_meta,{'firstFrame':0,'frames':2,'sourceFingerprint':c['sourceFingerprint'],'sha256':ex.digest(complete)})
  preserved={str(p):ex.digest(p) for p in [complete,complete_meta]}
  args=SimpleNamespace(job=str(job),all=True,max_chunks=1,egl=ex.DEFAULT_EGL)
  eglpath=str(args.egl/'usr/lib/x86_64-linux-gnu')
  error=None
  with patch.dict(sys.modules,{'guard_fixture':bridge}),patch.dict(os.environ,{'DAYBREAK_EXPORT_EGL_READY':eglpath,'DAYBREAK_KEEP_SCENE_JSON':'0'}),patch.object(ex,'load_job',return_value=(job,c,snap,{})),patch.object(ex.subprocess,'Popen',side_effect=lambda command,**kwargs:Encoder(f,command)),patch.object(ex,'probe',return_value={'streams':[{'codec_type':'video','nb_frames':'2'}]}),contextlib.redirect_stdout(io.StringIO()):
   try:ex.render(args)
   except RuntimeError as exc:error=str(exc)
  check(name+': completed chunk and metadata byte-identical',preserved=={str(p):ex.digest(p) for p in [complete,complete_meta]})
  check(name+': renderer resources released',f.server.terminated and f.server.waited and f.ctx.released)
  failed_checks=[i for i,event in enumerate(f.events) if event[0]=='gl-check' and event[1]!='GL_NO_ERROR']
  if failure:
   check(name+': precise GL exception',bool(error) and 'OpenGL error after ' in error and 'GL_' in error)
   check(name+': single error observation and immediate abort',len(failed_checks)==1 and not any(e[0] in ['gl-check','native-readback','hdr-readback','composite-readback','encoder-write'] for e in f.events[failed_checks[0]+1:]))
   check(name+': no pending chunk accepted',not any(ex.chunk_paths(job,i,2)[0].exists() or ex.chunk_paths(job,i,2)[1].exists() for i in [2,4]))
   check(name+': no partial survives',not list((job/'chunks').glob('*.partial.mp4')))
   if failure in ['initialization','cached']:
    check(name+': encoder never started',not f.encoders)
   else:
    check(name+': active encoder terminated',len(f.encoders)==1 and f.encoders[0].terminated)
   if failure=='initialization':check(name+': fresh environment not certified',not meta.exists())
   if failure=='native-second':check(name+': earlier good frame entered only discarded partial',len(f.encoders[0].writes)==1)
   if failure=='sample-second':check(name+': bad temporal sample never encoded',not f.encoders[0].writes)
   if failure=='composite':check(name+': bad composite never encoded',not f.encoders[0].writes)
  else:
   check(name+': clean render completes',error is None and all(ex.good_chunk(*ex.chunk_paths(job,i,2),i,2,c) for i in [0,2,4]))
   check(name+': completed prior chunk skipped',f.framecalls==4*samples)
   for i,event in enumerate(f.events):
    if event[0]=='gl-check' and i and f.events[i-1][0] in ['native-readback','hdr-readback','composite-readback']:continue
    if event[0]=='encoder-write':check(name+': check before encoder write '+str(i),f.events[i-1]==['gl-check','GL_NO_ERROR'])
   check(name+': expected readback checks',sum(e[0]=='gl-check' for e in f.events)==1+int(cached)+4*samples+(4 if samples>1 else 0))
  cases.append({'name':name,'error':error,'nativeRenderCount':0,'simulatedSamples':f.framecalls,'encodedFramesBeforeAbortOrCompletion':sum(len(p.writes) for p in f.encoders),'events':f.events})

for args in [('initialization failure','initialization',1,False),('cached restoration failure','cached',1,True),('first native failure','native-first',1,False),('later native failure','native-second',1,False),('HDR readback failure','hdr',2,False),('second temporal sample failure','sample-second',2,False),('composite failure','composite',2,False),('clean single sample',None,1,False),('clean temporal samples and cached restore',None,2,True)]:scenario(*args)

# Existing real smoke evidence is read-only; no pinned wrapper execution or render.
smoke=ROOT/'work/jobs/bf61155d4ae94ce1';c=json.loads((smoke/'job.json').read_text())
files=[p for pair in ex.chunks(c) for p in ex.chunk_paths(smoke,*pair)];hashes={str(p):ex.digest(p) for p in files}
check('Existing native smoke remains complete',all(ex.good_chunk(*ex.chunk_paths(smoke,*pair),*pair,c) for pair in ex.chunks(c)))
check('Existing native smoke media and metadata unchanged',hashes=={str(p):ex.digest(p) for p in files})
def functions(source):return {n.name:ast.dump(n,include_attributes=False) for n in ast.parse(source).body if isinstance(n,ast.FunctionDef)}
old=functions((Path(__file__).resolve().parent/'export_video.before.py').read_text());new=functions((ROOT/'export_video.py').read_text())
for name in ['prepare','load_job','chunks','prioritize_chunks','chunk_paths','good_chunk','sample_times','encoder_command','assemble']:check('Unchanged '+name,old[name]==new[name])
check('No new explicit GL synchronization',not any(isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr in ['finish','flush'] and isinstance(n.func.value,ast.Attribute) and n.func.value.attr=='ctx' for n in ast.walk(ast.parse((ROOT/'export_video.py').read_text()))))
renderer=Path('/workspace/sites/daybreak-piano-film/production/qa/render-revision.py')
check('Verified production renderer unchanged',ex.digest(renderer)=='bacdd838f61c2ef83ee45c879859f53288db633b7d682dcabbd74f488e2a8f71')
report={'passed':True,'nativeFramesRendered':0,'wrapperSha256':ex.digest(ROOT/'export_video.py'),'rendererSha256':ex.digest(renderer),'checks':checks,'cases':cases,'existingSmoke':str(smoke)}
ex.atomic_json(Path(__file__).resolve().parent/'validation.json',report)
print(json.dumps({'passed':True,'checks':len(checks),'cases':len(cases),'nativeFramesRendered':0,'wrapperSha256':report['wrapperSha256']},indent=2))
