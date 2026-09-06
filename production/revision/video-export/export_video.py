#!/usr/bin/env python3
"""Snapshot, resume and validate offline Daybreak exports. Does not edit the Site.

prepare freezes inputs; render is limited to one chunk unless --all is explicit.
assemble writes an AAC delivery MP4 and, by default, a PCM24 archival MOV.
--delivery-only muxes the chunks directly to MP4 without duplicate video files.
"""
from pathlib import Path
import argparse,hashlib,json,math,os,shutil,subprocess,sys,time,importlib.util,statistics,signal,ast
from fractions import Fraction

HERE=Path(__file__).resolve().parent
DEFAULT_PROJECT=HERE.parents[2]
DEFAULT_AUDIO=DEFAULT_PROJECT/'production/pop-revision/music/daybreak-solo-master.wav'
DEFAULT_EGL=Path(os.environ.get('DAYBREAK_EGL_ROOT','/'))

def digest(path):
 with open(path,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':'))
def atomic_json(path,value):
 path=Path(path);tmp=path.with_name(path.name+'.tmp');tmp.write_text(json.dumps(value,indent=2));tmp.replace(path)
def run(args,**kw):return subprocess.run([str(x) for x in args],check=True,**kw)
def probe(path):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)]))
def snapshot_inputs(project,audio):
 rel=['production/qa/render-revision.py','production/qa/pose-server.mjs','package.json','package-lock.json']
 rel += [str(p.relative_to(project)) for p in sorted((project/'app/performance').glob('*.ts'))]
 rel += [str(p.relative_to(project)) for p in sorted((project/'public/assets').rglob('*')) if p.is_file() and p.suffix in ['.json','.glb','.png','.jpg','.jpeg']]
 paths={x:project/x for x in rel};paths['audio/master.wav']=audio
 manifest=audio.parent/'reproduction-manifest.json'
 if manifest.exists():paths['audio/reproduction-manifest.json']=manifest
 return paths

COMPILE_SCRIPT="""import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=process.argv[2],src=path.join(root,'app/performance'),out=path.join(root,'production/qa/compiled');
fs.mkdirSync(out,{recursive:true});
for(const file of fs.readdirSync(src).filter(f=>f.endsWith('.ts'))){
 let code=ts.transpileModule(fs.readFileSync(path.join(src,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/(from\\s+|import\\s*)(['"])(\\.\\/[^'"]+)\\2/g,(all,lead,quote,name)=>lead+quote+(path.extname(name)?name:name+'.mjs')+quote);
 fs.writeFileSync(path.join(out,file.replace(/\\.ts$/,'.mjs')),code);
}
"""

def prepare(args):
 project=args.project.resolve();audio=args.audio.resolve();root=args.root.resolve();root.mkdir(parents=True,exist_ok=True)
 inputs=snapshot_inputs(project,audio);hashes={rel:digest(path) for rel,path in inputs.items()}
 depfiles=[project/'node_modules/three/package.json',project/'node_modules/three/build/three.core.js',project/'node_modules/three/build/three.module.js',project/'node_modules/typescript/package.json']
 dependencies={str(p):digest(p) for p in depfiles}
 fingerprint=hashlib.sha256(canonical({'inputs':hashes,'dependencies':dependencies,'wrapper':digest(__file__)}).encode()).hexdigest()
 snap=root/'snapshots'/fingerprint[:16]
 if not snap.exists():
  stage=snap.with_name(snap.name+'.preparing-'+str(os.getpid()));stage.mkdir(parents=True,exist_ok=False)
  try:
   for rel,path in inputs.items():dest=stage/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,dest)
   shutil.copyfile(__file__,stage/'export-wrapper.py')
   if any(digest(inputs[rel])!=value or digest(stage/rel)!=value for rel,value in hashes.items()):raise RuntimeError('Inputs changed while snapshotting; rerun prepare after the edit finishes.')
   (stage/'node_modules').symlink_to(project/'node_modules',target_is_directory=True)
   (stage/'compile.mjs').write_text(COMPILE_SCRIPT);run(['node',stage/'compile.mjs',stage],cwd=stage)
   # Query the real compiled Direction, rather than parse camera labels or infer cuts.
   (stage/'cuts.mjs').write_text("import fs from 'node:fs';import {Direction} from './production/qa/compiled/direction.mjs';const score=JSON.parse(fs.readFileSync('public/assets/score.json'));console.log(JSON.stringify(new Direction(score).shots.map(s=>({start:s.start,end:s.end,name:s.name}))));")
   cuts=json.loads(subprocess.check_output(['node',str(stage/'cuts.mjs')],cwd=stage))
   atomic_json(stage/'cuts.json',cuts)
   compiled={str(p.relative_to(stage)):digest(p) for p in sorted((stage/'production/qa/compiled').glob('*.mjs'))}
   atomic_json(stage/'snapshot.json',{'fingerprint':fingerprint,'project':str(project),'audioSource':str(audio),'sourceSha256':hashes,'dependencySha256':dependencies,'compiledSha256':compiled,'wrapperSha256':digest(__file__),'createdUtc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())})
   stage.rename(snap)
  except BaseException:
   shutil.rmtree(stage);raise
 info=probe(snap/'audio/master.wav');stream=next(s for s in info['streams'] if s['codec_type']=='audio')
 rate=int(stream['sample_rate']);audio_samples=int(stream['duration_ts']);full=Fraction(audio_samples,rate)
 start=Fraction(str(args.start));duration=Fraction(str(args.duration)) if args.duration is not None else full-start
 if start<0 or duration<=0 or start+duration>full+Fraction(1,rate):raise ValueError('Requested interval exceeds the lossless master.')
 audio_start=round(start*rate);audio_end=min(audio_samples,round((start+duration)*rate));audio_count=audio_end-audio_start
 frames=math.ceil(duration*args.fps);height=round(args.width*9/16)
 if args.width%2 or height%2:raise ValueError('H.264 yuv420p requires even dimensions.')
 source_score=digest(snap/'public/assets/score.json');master_manifest=snap/'audio/reproduction-manifest.json'
 master_score_match=json.loads(master_manifest.read_text()).get('scoreSha256')==source_score if master_manifest.exists() else None
 config={'snapshot':str(snap),'sourceFingerprint':fingerprint,'wrapperSha256':digest(__file__),'start':float(start),'duration':float(duration),'durationFraction':str(duration),'fps':args.fps,'frames':frames,'width':args.width,'height':height,'chunkFrames':args.chunk_frames,'samples':args.samples,'shutterDegrees':args.shutter,'crf':args.crf,'preset':args.preset,'audioSampleRate':rate,'audioStartSample':audio_start,'audioSamples':audio_count,'masterScoreMatch':master_score_match,'environmentMode':'pavilion','frameInterpolation':False,'temporalDomain':'linear HDR before bloom/tone mapping','colorConversion':'sRGB full RGB to BT.709 limited YUV using zscale','motionBlurCutRule':'clip shutter interval to authored shot containing frame PTS'}
 config['skipUnusedReflection']=not args.keep_unused_reflection
 config['scoreDuration']=json.loads((snap/'public/assets/score.json').read_text())['duration']
 jobkey=hashlib.sha256(canonical(config).encode()).hexdigest()[:16];job=root/'jobs'/jobkey
 job.mkdir(parents=True,exist_ok=True);(job/'chunks').mkdir(exist_ok=True)
 if (job/'job.json').exists() and json.loads((job/'job.json').read_text())!=config:raise RuntimeError('Job hash collision or altered job manifest.')
 atomic_json(job/'job.json',config)
 print(json.dumps({'job':str(job),'snapshot':str(snap),'frames':frames,'fps':args.fps,'masterScoreMatch':master_score_match,'fullRenderStarted':False}),flush=True)
 return job

def load_job(path):
 job=Path(path).resolve();c=json.loads((job/'job.json').read_text());snap=Path(c['snapshot']);m=json.loads((snap/'snapshot.json').read_text())
 if c['wrapperSha256']!=digest(__file__):
  pinned=snap/'export-wrapper.py'
  if not pinned.exists() or digest(pinned)!=c['wrapperSha256']:raise RuntimeError('Wrapper changed and the original pinned wrapper is unavailable; prepare a new job.')
  print(json.dumps({'resumingPinnedWrapper':str(pinned)}),flush=True)
  os.execv(sys.executable,[sys.executable,str(pinned),*sys.argv[1:]])
 for rel,sha in {**m['sourceSha256'],**m['compiledSha256']}.items():
  if digest(snap/rel)!=sha:raise RuntimeError('Snapshot changed: '+rel)
 for path,sha in m['dependencySha256'].items():
  if digest(path)!=sha:raise RuntimeError('Runtime dependency changed: '+path)
 return job,c,snap,m

def chunks(c):
 return [(first,min(c['chunkFrames'],c['frames']-first)) for first in range(0,c['frames'],c['chunkFrames'])]
def prioritize_chunks(pending,c,start=None,end=None):
 """Stable whole-chunk priority for [start,end), in seconds from job start."""
 if start is None and end is None:return list(pending)
 if start is None or end is None:raise ValueError('Provide both --prioritize-start and --prioritize-end.')
 if not math.isfinite(start) or not math.isfinite(end):raise ValueError('Priority times must be finite.')
 lo=Fraction(str(start));hi=Fraction(str(end));duration=Fraction(c.get('durationFraction',str(c['duration'])))
 if not 0<=lo<hi<=duration:raise ValueError('Priority range must satisfy 0 <= start < end <= job duration.')
 def overlaps(chunk):
  first,count=chunk
  return Fraction(first,c['fps'])<hi and Fraction(first+count,c['fps'])>lo
 return [chunk for chunk in pending if overlaps(chunk)]+[chunk for chunk in pending if not overlaps(chunk)]
def chunk_paths(job,first,count):
 stem=f'{first:06d}-{count:05d}';return job/'chunks'/f'{stem}.mp4',job/'chunks'/f'{stem}.json'
def good_chunk(video,metadata,first,count,c):
 if not video.exists() or not metadata.exists():return False
 m=json.loads(metadata.read_text())
 if m['firstFrame']!=first or m['frames']!=count or m['sourceFingerprint']!=c['sourceFingerprint'] or m['sha256']!=digest(video):raise RuntimeError('Completed chunk integrity mismatch: '+str(video))
 return True

def sample_times(pts,c,cuts):
 if c['samples']==1:return [pts]
 shot=next((s for s in cuts if s['start']<=pts<s['end']),cuts[-1])
 half=c['shutterDegrees']/360/c['fps']/2
 lo=max(0.,pts-half,shot['start']);hi=min(pts+half,shot['end']-1e-9,c['start']+c['duration'])
 if hi<=lo:return [pts]
 return [lo+(i+.5)*(hi-lo)/c['samples'] for i in range(c['samples'])]

def optimized_tree(source):
 """Remove only the proved-unused auxiliary pass, retaining all main-pass code."""
 tree=ast.parse(source);assignments=[];loops=[]
 for node in ast.walk(tree):
  if isinstance(node,ast.Assign):
   for target in node.targets:
    if isinstance(target,ast.Subscript) and isinstance(target.slice,ast.Constant) and target.slice.value=='floorMirror':assignments.append(node.value)
  if isinstance(node,ast.For) and isinstance(node.target,ast.Tuple) and any(isinstance(x,ast.Name) and x.id=='reflectionPass' for x in node.target.elts):loops.append(node)
 if not assignments or not all(isinstance(v,ast.Constant) and v.value is False for v in assignments):raise RuntimeError('Reflection optimization requires every floorMirror assignment to be False.')
 if source.count('texture(reflectionTex,')!=1 or 'if(floorMirror&&!reflectionPass&&world.y>' not in source:raise RuntimeError('Reflection consumer changed; use --keep-unused-reflection until reviewed.')
 if len(loops)!=1 or not isinstance(loops[0].iter,ast.List):raise RuntimeError('Reflection loop changed; optimization requires review.')
 if len(loops[0].iter.elts)==1:
  only=loops[0].iter.elts[0]
  if isinstance(only,ast.Tuple) and isinstance(only.elts[0],ast.Constant) and only.elts[0].value is False:return tree
  raise RuntimeError('Unexpected single render pass.')
 if len(loops[0].iter.elts)!=2:raise RuntimeError('Reflection loop changed; optimization requires review.')
 first,second=loops[0].iter.elts
 if not all(isinstance(x,ast.Tuple) for x in [first,second]) or not isinstance(first.elts[0],ast.Constant) or first.elts[0].value is not True or not isinstance(second.elts[0],ast.Constant) or second.elts[0].value is not False:raise RuntimeError('Unexpected reflection pass order.')
 loops[0].iter.elts=[second];return ast.fix_missing_locations(tree)

def check_gl(ctx,stage):
 """Inspect once and abort immediately; never drain or discard an error flag."""
 error=ctx.error
 if error!='GL_NO_ERROR':raise RuntimeError(f'OpenGL error after {stage}: {error}. Current chunk was not accepted; completed chunks remain resumable.')

def close_renderer(r):
 try:
  if hasattr(r,'server'):r.server.terminate();r.server.wait()
 finally:
  if hasattr(r,'ctx'):r.ctx.release()

def renderer_module(snap,job,c):
 """Execute the unmodified snapshot module; reuse its validated environment cache."""
 cache=job/'renderer-cache';cache.mkdir(exist_ok=True)
 os.environ.update(DAYBREAK_QA_ROOT=str(cache),DAYBREAK_ASPECT=str(16/9),WIDTH=str(c['width']))
 os.environ.pop('DAYBREAK_DETAIL',None);os.environ.pop('DAYBREAK_SHOT',None)
 # A cached environment skips only identical static capture/filter work.
 env=cache/'environment-prefiltered-linear.npz';meta=cache/'environment-cache.json'
 verified=False
 if env.exists() and meta.exists():
  em=json.loads(meta.read_text());verified=em.get('sourceFingerprint')==c['sourceFingerprint'] and em.get('sha256')==digest(env)
 os.environ['DAYBREAK_ENV_MODE']='sky' if verified else 'pavilion'
 path=snap/'production/qa/render-revision.py';spec=importlib.util.spec_from_file_location('daybreak_snapshot_renderer',path);r=importlib.util.module_from_spec(spec)
 try:
  if c.get('skipUnusedReflection',False):exec(compile(optimized_tree(path.read_text()),str(path),'exec'),r.__dict__)
  else:spec.loader.exec_module(r)
  check_gl(r.ctx,'renderer initialization')
  if verified:
   import numpy as np,moderngl
   layers=np.load(env)['layers'];r.envAtlas.release();r.envAtlas=r.ctx.texture_array((layers.shape[2],layers.shape[1],layers.shape[0]),3,layers.astype('f2').tobytes(),dtype='f2');r.envAtlas.filter=(moderngl.LINEAR,moderngl.LINEAR);r.envAtlas.repeat_x=False;r.envAtlas.repeat_y=False;r.envAtlas.use(5);r.prog['envMode']=2
   check_gl(r.ctx,'cached environment restoration')
  else:atomic_json(meta,{'sourceFingerprint':c['sourceFingerprint'],'sha256':digest(env)})
  # The Node server exports this interchange once; both processes now retain its
  # data in memory. Frame rendering and validated environment-cache reuse never
  # read it again. Frozen sources regenerate it on every renderer initialization.
  if os.environ.get('DAYBREAK_KEEP_SCENE_JSON')!='1':
   interchange=Path(r.ready['scene'])
   if interchange.parent.resolve()!=cache.resolve():raise RuntimeError('Unexpected scene interchange path; refusing cleanup.')
   interchange.unlink(missing_ok=True)
 except BaseException:
  close_renderer(r);raise
 return r

def encoder_command(path,c):
 return ['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f"{c['width']}x{c['height']}",'-framerate',str(c['fps']),'-i','pipe:0','-an','-vf','zscale=matrixin=gbr:transferin=iec61966-2-1:primariesin=bt709:rangein=full:matrix=bt709:transfer=bt709:primaries=bt709:range=limited,format=yuv420p','-c:v','libx264','-preset',c['preset'],'-crf',str(c['crf']),'-g',str(c['fps']*2),'-keyint_min',str(c['fps']*2),'-sc_threshold','0','-x264-params','open-gop=0:force-cfr=1','-threads','2','-pix_fmt','yuv420p','-color_range','tv','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-video_track_timescale',str(c['fps']*1000),'-movflags','+faststart',str(path)]

def render(args):
 job,c,snap,m=load_job(args.job)
 todo=[(first,count) for first,count in chunks(c) if not good_chunk(*chunk_paths(job,first,count),first,count,c)]
 todo=prioritize_chunks(todo,c,getattr(args,'prioritize_start',None),getattr(args,'prioritize_end',None))
 if not todo:print(json.dumps({'alreadyComplete':True,'newFrames':0}));return
 if not args.all:todo=todo[:args.max_chunks]
 # EGL must be configured before Python loads its shared libraries; re-exec once.
 egl=Path(args.egl).resolve();envdir=str(egl/'usr/lib/x86_64-linux-gnu')
 if os.environ.get('DAYBREAK_EXPORT_EGL_READY')!=envdir:
  env=os.environ.copy();env.update(LD_LIBRARY_PATH=envdir,__EGL_VENDOR_LIBRARY_FILENAMES=str(egl/'usr/share/glvnd/egl_vendor.d/50_mesa.json'),DAYBREAK_EGL_ROOT=str(egl),LIBGL_ALWAYS_SOFTWARE='1',DAYBREAK_EXPORT_EGL_READY=envdir)
  os.execve(sys.executable,[sys.executable,str(Path(__file__).resolve()),*sys.argv[1:]],env)
 import numpy as np,moderngl
 from PIL import Image
 before=time.perf_counter();r=renderer_module(snap,job,c);init=time.perf_counter()-before
 cuts=json.loads((snap/'cuts.json').read_text());frame_times=[];newframes=0
 try:
  for first,count in todo:
   video,metadata=chunk_paths(job,first,count);partial=video.with_name(video.stem+'.partial.mp4');trace=video.with_suffix('.frames.jsonl');chunk_start=time.perf_counter()
   log=video.with_suffix('.encode.log').open('wb');command=encoder_command(partial,c);p=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=log)
   shots=set();sampling=[]
   try:
    with trace.open('w') as tf:
     for index in range(first,first+count):
      started=time.perf_counter();pts=c['start']+index/c['fps'];times=sample_times(pts,c,cuts);accum=None;rows=[]
      for t in times:
       raw,row=r.frame(t);rows.append(row)
       if len(times)>1:
        hdr=np.frombuffer(r.color.read(),dtype='f2').reshape(r.H,r.W,4).astype('f4');accum=hdr if accum is None else accum+hdr
       check_gl(r.ctx,f'native sample for frame {index} at {t:.9f}s')
      if len(times)>1:
       r.color.write((accum/len(times)).astype('f2').tobytes());r.outfbo.use();r.ctx.disable(moderngl.DEPTH_TEST);r.color.use(0);r.postvao.render(moderngl.TRIANGLE_STRIP);raw=r.outfbo.read(components=3,alignment=1)
       check_gl(r.ctx,f'composited frame {index} at {pts:.9f}s')
      rgb=np.frombuffer(raw,dtype='u1').reshape(r.H,r.W,3)[::-1].copy();p.stdin.write(rgb.tobytes())
      elapsed=time.perf_counter()-started;frame_times.append(elapsed);newframes+=1
      record={'index':index,'pts':pts,'samples':times,'shots':sorted({row['shot'] for row in rows}),'renderSeconds':elapsed,'rows':rows};tf.write(json.dumps(record)+'\n');tf.flush();shots.update(record['shots']);sampling.append(times)
      if len(record['shots'])!=1:raise RuntimeError('Temporal samples crossed a shot boundary.')
      if index in [first,first+count//2,first+count-1]:Image.fromarray(rgb).save(job/f'frame-{index:06d}.jpg',quality=95)
      print(json.dumps({'frame':index,'frames':c['frames'],'pts':pts,'samples':len(times),'seconds':round(elapsed,3),'shot':record['shots'][0]}),flush=True)
    p.stdin.close();code=p.wait();log.close()
    if code:raise RuntimeError('Encoding failed: '+str(video.with_suffix('.encode.log')))
   except BaseException:
    if p.poll() is None:p.terminate();p.wait()
    log.close();partial.unlink(missing_ok=True);raise
   pr=probe(partial);vs=next(s for s in pr['streams'] if s['codec_type']=='video')
   if int(vs['nb_frames'])!=count:raise RuntimeError('Chunk frame count mismatch.')
   partial.replace(video)
   atomic_json(metadata,{'firstFrame':first,'frames':count,'fps':c['fps'],'sourceFingerprint':c['sourceFingerprint'],'sha256':digest(video),'elapsedSeconds':time.perf_counter()-chunk_start,'shots':sorted(shots),'sampling':sampling,'encoder':command,'probe':pr})
  steady=frame_times[1:] or frame_times
  score_duration=c.get('scoreDuration',json.loads((snap/'public/assets/score.json').read_text())['duration'])
  report={'newFrames':newframes,'initializationSeconds':init,'frameSeconds':frame_times,'medianSteadySeconds':statistics.median(steady),'meanSteadySeconds':statistics.mean(steady),'scoreDuration':score_duration,'estimatedFullFilmHours24fps':statistics.mean(steady)/c['samples']*math.ceil(score_duration*24)/3600,'estimatedFullFilmHours30fps':statistics.mean(steady)/c['samples']*math.ceil(score_duration*30)/3600,'temporalSamples':c['samples'],'note':'Shared CPU/software-renderer load affects timings; full estimates exclude startup and multiply by samples for blur.'}
  atomic_json(job/'last-render.json',report);print(json.dumps({'renderReport':report}),flush=True)
 finally:
  close_renderer(r)

def audio_bytes(path,start=None,count=None,float32=False):
 cmd=['ffmpeg','-v','error','-i',str(path),'-map','0:a:0']
 if start is not None:cmd+=['-af',f'atrim=start_sample={start}:end_sample={start+count},asetpts=PTS-STARTPTS']
 cmd+=['-f','f32le' if float32 else 's24le','-c:a','pcm_f32le' if float32 else 'pcm_s24le','pipe:1'];return subprocess.check_output(cmd)

def assemble(args):
 job,c,snap,m=load_job(args.job)
 paths=[]
 for first,count in chunks(c):
  video,metadata=chunk_paths(job,first,count)
  if not good_chunk(video,metadata,first,count,c):raise RuntimeError('Incomplete render: '+str(video))
  paths.append(video)
 if args.final and c['masterScoreMatch'] is not True:raise RuntimeError('Final assembly requires the master manifest score hash to match this snapshot; prepare again after the remaster.')
 concat=job/'concat.txt';concat.write_text(''.join("file '"+str(p).replace("'","'\\''")+"'\n" for p in paths))
 delivery_only=getattr(args,'delivery_only',False)
 if delivery_only:
  video_input=['-f','concat','-safe','0','-i',concat]
 else:
  silent=job/'video-only.mp4';run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',concat,'-map','0:v:0','-c:v','copy','-movflags','+faststart',silent]);video_input=['-i',silent]
 trim=f"atrim=start_sample={c['audioStartSample']}:end_sample={c['audioStartSample']+c['audioSamples']},asetpts=PTS-STARTPTS"
 outputs=[]
 formats=[('mp4',['-c:a','aac','-b:a','320k'])]
 if not delivery_only:formats.append(('mov',['-c:a','pcm_s24le']))
 for suffix,codec in formats:
  target=job/('daybreak-preview.mp4' if suffix=='mp4' else 'daybreak-master.mov')
  run(['ffmpeg','-v','error','-y',*video_input,'-i',snap/'audio/master.wav','-map','0:v:0','-map','1:a:0','-af',trim,'-c:v','copy',*codec,'-ar',c['audioSampleRate'],'-movflags','+faststart','-metadata','title=Daybreak — offline performance export','-metadata',f"comment=Absolute score time {c['start']:.9f}; immutable source {c['sourceFingerprint']}; no frame interpolation",target]);outputs.append(target)
 expected=audio_bytes(snap/'audio/master.wav',c['audioStartSample'],c['audioSamples']);exact=None
 if not delivery_only:
  exact=audio_bytes(outputs[1])==expected
  if not exact:raise RuntimeError('Lossless master audio differs from its exact source sample interval.')
 import numpy as np
 from scipy.signal import correlate,correlation_lags
 source=np.frombuffer(audio_bytes(snap/'audio/master.wav',c['audioStartSample'],c['audioSamples'],True),dtype='f4').reshape(-1,2).mean(axis=1)
 encoded=np.frombuffer(audio_bytes(outputs[0],float32=True),dtype='f4').reshape(-1,2).mean(axis=1)
 n=min(len(source),len(encoded));lags=[]
 for center in sorted(set([min(n//2,22050),n//2,max(n//2,n-22050)])):
  a=max(0,center-11025);b=min(n,center+11025);x=source[a:b];y=encoded[a:b]
  corr=correlate(y,x,mode='full',method='fft');ls=correlation_lags(len(y),len(x),mode='full');mask=np.abs(ls)<=256;lag=int(ls[mask][np.argmax(corr[mask])]);lags.append(lag)
 if any(abs(lag)>1 for lag in lags):raise RuntimeError('AAC/master alignment failed: '+str(lags))
 details=[]
 for target in outputs:
  pr=probe(target);vs=next(s for s in pr['streams'] if s['codec_type']=='video');au=next(s for s in pr['streams'] if s['codec_type']=='audio')
  if int(vs['nb_frames'])!=c['frames'] or Fraction(vs['r_frame_rate'])!=c['fps']:raise RuntimeError('Final frame count or frame rate mismatch.')
  if abs(float(vs['duration'])-c['frames']/c['fps'])>.002:raise RuntimeError('Unexpected video duration.')
  run(['ffmpeg','-v','error','-i',target,'-f','null','-'],stdout=subprocess.DEVNULL)
  details.append({'path':str(target),'sha256':digest(target),'probe':pr})
 result={'outputs':details,'deliveryOnly':delivery_only,'pcmAudioMovieCreated':not delivery_only,'sourceFingerprint':c['sourceFingerprint'],'sourceStart':c['start'],'authoredDuration':c['duration'],'renderedFrames':c['frames'],'frameDuration':1/c['fps'],'audioStartSample':c['audioStartSample'],'audioSamples':c['audioSamples'],'losslessPCMMatchesSourceExactly':exact,'sourcePCMsha256':hashlib.sha256(expected).hexdigest(),'aacAlignmentLagsSamples':lags,'aacDecodedSamples':len(encoded),'expectedAudioSamples':len(source),'masterScoreMatch':c['masterScoreMatch'],'tailVideoHoldSeconds':c['frames']/c['fps']-c['audioSamples']/c['audioSampleRate'],'audioGainChanged':False,'audioResampled':False,'listeningReviewPerformed':False,'visualPlaybackReviewPerformed':False}
 atomic_json(job/'validation.json',result);print(json.dumps({'complete':True,'outputs':[str(p) for p in outputs],'losslessAudioExact':exact,'aacLagsSamples':lags,'validation':str(job/'validation.json')}),flush=True)

def status(args):
 job,c,snap,m=load_job(args.job);completed=sum(count for first,count in chunks(c) if good_chunk(*chunk_paths(job,first,count),first,count,c));print(json.dumps({'job':str(job),'completedFrames':completed,'frames':c['frames'],'fps':c['fps'],'sourceFingerprint':c['sourceFingerprint'],'masterScoreMatch':c['masterScoreMatch']},indent=2))

def main():
 def cancelled(signum,frame):raise KeyboardInterrupt('Export interrupted; completed chunks remain resumable.')
 signal.signal(signal.SIGTERM,cancelled)
 p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
 a=sub.add_parser('prepare');a.add_argument('--project',type=Path,default=DEFAULT_PROJECT);a.add_argument('--audio',type=Path,default=DEFAULT_AUDIO);a.add_argument('--root',type=Path,default=HERE/'work');a.add_argument('--start',type=float,default=0);a.add_argument('--duration',type=float);a.add_argument('--fps',type=int,choices=[24,30],default=24);a.add_argument('--width',type=int,default=1920);a.add_argument('--chunk-frames',type=int,default=24);a.add_argument('--samples',type=int,choices=[1,2,4],default=1);a.add_argument('--shutter',type=float,default=180);a.add_argument('--crf',type=int,default=17);a.add_argument('--preset',default='medium');a.add_argument('--keep-unused-reflection',action='store_true');a.set_defaults(func=prepare)
 a=sub.add_parser('render');a.add_argument('--job',required=True);a.add_argument('--max-chunks',type=int,default=1);a.add_argument('--all',action='store_true');a.add_argument('--egl',type=Path,default=DEFAULT_EGL);a.add_argument('--prioritize-start',type=float,help='Render pending chunks overlapping this time range first (seconds from job start).');a.add_argument('--prioritize-end',type=float,help='Exclusive end of the priority range; requires --prioritize-start.');a.set_defaults(func=render)
 a=sub.add_parser('assemble');a.add_argument('--job',required=True);a.add_argument('--final',action='store_true');a.add_argument('--delivery-only',action='store_true',help='Mux directly to the delivery MP4, omitting the duplicate silent video and optional PCM MOV. The source WAV remains unchanged.');a.set_defaults(func=assemble)
 a=sub.add_parser('status');a.add_argument('--job',required=True);a.set_defaults(func=status)
 args=p.parse_args();args.func(args)
if __name__=='__main__':main()
