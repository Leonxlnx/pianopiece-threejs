"""Fail on the first GL error after an individual API call during a fresh capture."""
from pathlib import Path
import functools,importlib.util,json,subprocess,traceback,os
import moderngl
ROOT=Path(__file__).resolve().parent;SNAP=ROOT/'source-911870882ae92597';RUN=ROOT/'fresh-gl-diagnostic';RUN.mkdir(exist_ok=True);holder={};events=[];servers=[]
def check(label):
 c=holder.get('ctx')
 if c is not None:
  error=c.error
  if error!='GL_NO_ERROR':
   event={'api':label,'error':error,'stack':traceback.format_stack(limit=12)};events.append(event);(RUN/'gl-error.json').write_text(json.dumps(event,indent=2));print(json.dumps(event),flush=True);raise RuntimeError(label+': '+error)
def wrap(fun,label):
 @functools.wraps(fun)
 def invoke(*a,**kw):
  result=fun(*a,**kw);check(label);return result
 return invoke
originalCreate=moderngl.create_standalone_context
def create(*a,**kw):
 c=originalCreate(*a,**kw);holder['ctx']=c;check('create_standalone_context');return c
moderngl.create_standalone_context=create
for name in ['Context','Texture','TextureArray','TextureCube','Framebuffer','Renderbuffer','VertexArray','Program','Uniform','Buffer']:
 cls=getattr(moderngl,name)
 for attr,value in list(vars(cls).items()):
  if attr.startswith('_') or attr in ['error'] or (name=='Context' and attr=='release'):continue
  if isinstance(value,property) and value.fset is not None:setattr(cls,attr,property(value.fget,wrap(value.fset,name+'.'+attr+' setter'),value.fdel,value.__doc__))
  elif callable(value):setattr(cls,attr,wrap(value,name+'.'+attr))
originalPopen=subprocess.Popen
def Popen(command,*a,**kw):
 p=originalPopen(command,*a,**kw)
 if isinstance(command,list) and any(str(x).endswith('pose-server.mjs') for x in command):servers.append(p)
 return p
subprocess.Popen=Popen
spec=importlib.util.spec_from_file_location('pinned',SNAP/'export-wrapper.py');ex=importlib.util.module_from_spec(spec);spec.loader.exec_module(ex);manifest=json.loads((SNAP/'visual-snapshot.json').read_text());r=None
try:
 # This directory has no environment cache: exercise fresh capture/filter.
 r=ex.renderer_module(SNAP,RUN,{'sourceFingerprint':manifest['fingerprint'],'width':1920,'skipUnusedReflection':True});check('renderer initialization finished');print('FRESH_INIT_NO_ERROR',flush=True)
 for name in ['glBindFramebuffer','glBlitFramebuffer']:setattr(r._depthGL,name,wrap(getattr(r._depthGL,name),'native.'+name))
 r.render_frame_shadows();check('first static shadow build finished');print('STATIC_SHADOW_BUILD_NO_ERROR',flush=True)
 (RUN/'passed.json').write_text(json.dumps({'freshEnvironment':True,'initializationNoError':True,'firstStaticShadowBuildNoError':True,'nativeCameraFramesRendered':0,'sourceFingerprint':manifest['fingerprint']},indent=2))
finally:
 for p in servers:
  if p.poll() is None:p.terminate();p.wait()
 if holder.get('ctx') is not None:holder['ctx'].release()
 (RUN/'renderer-cache/scene.json').unlink(missing_ok=True)
