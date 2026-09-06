#!/usr/bin/env python3
"""Reproducible DAYBREAK mix: recorded grand piano and CC0 acoustic ensemble.
Requires Python, numpy, scipy, FFmpeg. No music is generated randomly; a seeded
noise field is used only to model the diffuse acoustic reverberation impulse.
"""
from __future__ import annotations
import argparse,bisect,collections,functools,hashlib,json,math,subprocess,wave
from fractions import Fraction
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io import wavfile

HERE=Path(__file__).resolve().parent
BASE=HERE.parent
SR=44100
ARGS=argparse.ArgumentParser()
ARGS.add_argument('--piano-only',action='store_true')
ARGS.add_argument('--mix-only',action='store_true')
ARGS.add_argument('--master-only',action='store_true')
opts=ARGS.parse_args()
SCORE=json.loads((BASE/'score/score.json').read_text())
PM=json.loads((BASE/'audio/sample-manifest.json').read_text())
SM=json.loads((BASE/'audio/support/support-manifest.json').read_text())
N=round(SCORE['duration']*SR)
AUDIT=[]

def log(*a):print(*a,flush=True)
def db(x):return float(20*np.log10(max(float(x),1e-12)))
def rms(x):return float(np.sqrt(np.mean(np.asarray(x,dtype=np.float64)**2)))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def decode(path,sr=SR):
 p=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(path),'-f','f32le','-ar',str(sr),'-ac','2','-'],capture_output=True,check=True)
 return np.frombuffer(p.stdout,np.float32).reshape(-1,2).copy()

def writefloat(name,x):wavfile.write(HERE/name,SR,x.astype(np.float32))

def transpose(x,semi):
 if not semi:return x
 f=Fraction(2**(-semi/12)).limit_denominator(12000)
 return signal.resample_poly(x,f.numerator,f.denominator,axis=0,window=('kaiser',10.0)).astype(np.float32)

@functools.lru_cache(maxsize=180)
def piano_sample(midi,layer):
 a=min((a for a in PM['samples'] if a['velocityLayer']==layer),key=lambda a:abs(a['midi']-midi))
 semi=midi-a['midi']; assert abs(semi)<=1
 x=decode(a['sourceLocalPath'])
 # Remove only source-measured lead-in; remaining natural hammer development
 # occurs after the key contact at the authored score timestamp.
 x=x[round(a['recommendedOffsetSeconds']*SR):round(10.0*SR)]
 x=transpose(x,semi)
 x[:22]*=np.linspace(0,1,22,dtype=np.float32)[:,None]
 # Low-frequency microphone/room rumble is removed without changing attack.
 x=signal.sosfilt(signal.butter(2,28,fs=SR,btype='highpass',output='sos'),x,axis=0).astype(np.float32)
 peak=np.max(np.abs(x[:round(.2*SR)]),axis=1)
 onset=int(np.flatnonzero(peak>max(peak)*.03)[0])/SR
 return x,a,semi,onset

PEDAL_TIMES=[e['time'] for e in SCORE['pedals']]
def sounding_end(n):
 end=n['time']+n['duration'];i=bisect.bisect_right(PEDAL_TIMES,end)-1
 val=SCORE['pedals'][i]['value'] if i>=0 else 0
 if val>.1:
  j=i+1
  while j<len(PEDAL_TIMES) and SCORE['pedals'][j]['value']>.1:j+=1
  if j<len(PEDAL_TIMES):return PEDAL_TIMES[j],val
 return end,0

def add_at(bus,x,t):
 pos=round(t*SR);n=min(len(x),len(bus)-pos)
 if n>0:bus[pos:pos+n]+=x[:n]

def render_piano():
 buses={r:np.zeros((N,2),np.float32) for r in ['melody','harmony','bass']}
 layers=PM['velocityLayers'];counts=collections.Counter()
 for idx,n in enumerate(SCORE['notes']):
  v=n['velocity']*127
  layer=next((a for a in layers if a['recommendedMidiRange'][0]<=v<=a['recommendedMidiRange'][1]),min(layers,key=lambda a:abs(a['midiVelocity']-v)))
  x,a,semi,onset=piano_sample(n['midi'],layer['layer'])
  counts[layer['layer']]+=1
  # Recorded dynamic layer already carries its acoustic level. A capped ±2dB
  # adjustment interpolates within that layer; velocity is never squared again.
  fine_db=float(np.clip(12*np.log10(v/layer['midiVelocity']),-2,2))
  gain=10**(fine_db/20)*{'melody':1.0,'harmony':.83,'bass':.84}[n['role']]
  end,pedal=sounding_end(n)
  release=(.235 if n['midi']<52 else .190) if pedal else (.20 if n['midi']<52 else .155)
  if n['midi']>=84:release=.44
  sustain=max(n['duration'],end-n['time'])
  length=min(len(x),round((sustain+release)*SR))
  voice=x[:length].copy();t=np.arange(length,dtype=np.float32)/SR
  # Extra attenuation models partial pedal and controls long low-register wash;
  # the original recording retains its own pitch-dependent acoustic decay.
  extra=max(0,1-pedal)*(.36 if n['midi']<52 else .13)
  voice*=np.exp(-extra*np.maximum(0,t-n['duration']))[:,None]
  start=round(sustain*SR)
  if start<length:
   u=np.clip((t[start:]-sustain)/release,0,1)
   voice[start:]*=((1-u)**2*(1+2*u))[:,None]
  voice*=gain
  add_at(buses[n['role']],voice,n['time'])
  AUDIT.append({'id':n['id'],'scoreTime':n['time'],'renderTime':round(round(n['time']*SR)/SR,7),'midi':n['midi'],'role':n['role'],'sourceMidi':a['midi'],'transposeSemitones':semi,'velocity':n['velocity'],'velocityLayer':layer['layer'],'withinLayerGainDb':round(fine_db,4),'sourceLeadRemovedSeconds':a['recommendedOffsetSeconds'],'measuredAttackAfterKeyMs':round(onset*1000,3),'keyRelease':round(n['time']+n['duration'],5),'sustainEnd':round(end,5),'damperReleaseSeconds':release,'pedalAtKeyRelease':pedal})
  if idx%300==0:log('Piano',idx,'/',len(SCORE['notes']))
 for r,bus in buses.items():writefloat(f'piano-{r}-dry.wav',bus)
 log('Piano recorded layers',dict(counts))
 (HERE/'attack-audit.json').write_text(json.dumps(AUDIT,indent=2))
 return buses

@functools.lru_cache(maxsize=100)
def support_sample(path,semi=0):return transpose(decode(path),semi)

def trim_leadin(x,instrument):
 # Retain bow attack; percussion has about 100ms of preparation silence in some
 # source files, measured independently instead of guessing a common offset.
 if instrument=='strings':return x,0
 win=max(1,round(.0006*SR));env=np.sqrt(signal.convolve(np.mean(x*x,axis=1),np.ones(win)/win,mode='same'))
 active=np.flatnonzero(env>max(env)*.018)
 onset=max(0,int(active[0])-round(.0015*SR)) if len(active) else 0
 return x[onset:],onset/SR

SUPPORT_AUDIT=[]
def render_support():
 buses={r:np.zeros((N,2),np.float32) for r in ['strings','bass','kick','snare','hihat','cymbal']}
 counts=collections.Counter()
 for n in SCORE['accompaniment']:
  inst=n['instrument'];counts[inst]+=1
  choices=[];semi=0
  if inst=='strings':
   pool=[a for a in SM['samples'] if a['instrument']=='viola_ensemble']
   a=min(pool,key=lambda a:abs(a['midi']-n['midi']));choices=[a];semi=n['midi']-a['midi']
  elif inst=='bass':
   pool=[a for a in SM['samples'] if a['instrument'] in ['bass_plucked'] and a['roundRobin']==1+(counts[inst]-1)%2]
   if not pool:raise RuntimeError('Need the supplied contrabass pizzicato support samples.')
   a=min(pool,key=lambda a:abs(a['midi']-n['midi']));choices=[a];semi=n['midi']-a['midi']
  else:
   actual={'hihat':'hat','cymbal':'crash'}.get(inst,inst)
   pool=[a for a in SM['samples'] if a['instrument']==actual]
   if not pool:raise RuntimeError(f'Need {actual} sample')
   rr=1+(counts[inst]-1)%2
   available=sorted(set(a['velocityLayer'] for a in pool))
   high=n['velocity']>{'kick':.405,'snare':.27,'hihat':.135,'cymbal':.20}[inst]
   layer=available[-1] if high else available[0]
   choices=[a for a in pool if a['velocityLayer']==layer and a['roundRobin']==rr]
   if not choices:choices=[a for a in pool if a['velocityLayer']==layer][:1]
  voices=[];lead=0
  for a in choices:
   x=support_sample(a['localPath'],semi).copy()
   mic=a.get('mic','mono')
   micgain={'beater':.18,'reso':1.0,'top':1.0,'btm':.2}.get(mic,1.0)
   voices.append(x*micgain)
  length=max(map(len,voices));x=np.zeros((length,2),np.float32)
  for voice in voices:x[:len(voice)]+=voice
  x,lead=trim_leadin(x,inst)
  # Source patch gain is not a loudness target: normalize characteristic bodies
  # of the acoustic samples, then apply authored expression and calibrated stem
  # balance after rendering. This also avoids disparate raw recording levels.
  if inst=='strings':
   characteristic=rms(x[round(.2*SR):round(2.0*SR)])
   x*=min(8,.042/max(characteristic,1e-5))
   length=min(len(x),round((n['duration']+.45)*SR));x=x[:length]
   t=np.arange(length)/SR
   attack=.13
   env=np.clip(t/attack,0,1)**1.4
   # Phrase-shaped bow expression, all deterministic.
   env*=.88+.12*np.sin(np.pi*np.clip(t/max(n['duration'],.1),0,1))
   rel=np.clip((t-n['duration'])/.45,0,1)
   env*=.5+.5*np.cos(np.pi*rel)
   x*=env[:,None]*(n['velocity']/.3)
   # Slight desk placement: low voices left, high voices right, close to center.
   pan=np.clip((n['midi']-66)/45,-.22,.22)
  elif inst=='bass':
   peak=float(np.max(np.abs(x)))
   x*=.20/max(peak,1e-5)*(n['velocity']/.5)
   length=min(len(x),round((n['duration']+.22)*SR));x=x[:length]
   rel=np.clip((np.arange(length)/SR-n['duration'])/.22,0,1)
   x*=(.5+.5*np.cos(np.pi*rel))[:,None]
   pan=0
  else:
   peak=float(np.max(np.abs(x)))
   target={'kick':.19,'snare':.095,'hihat':.032,'cymbal':.043}[inst]
   ref={'kick':.42,'snare':.28,'hihat':.15,'cymbal':.22}[inst]
   x*=target/max(peak,1e-5)*(n['velocity']/ref)**.75
   pan={'kick':0,'snare':-.07,'hihat':.22,'cymbal':-.25}[inst]
   maxdur={'kick':.9,'snare':.7,'hihat':.28,'cymbal':3.1}[inst]
   x=x[:round(maxdur*SR)]
   fade=min(round(.045*SR),len(x));x[-fade:]*=np.linspace(1,0,fade)[:,None]
  x[:,0]*=math.sqrt(1-pan);x[:,1]*=math.sqrt(1+pan)
  x[:min(16,len(x))]*=np.linspace(0,1,min(16,len(x)))[:,None]
  add_at(buses[inst],x,n['time'])
  SUPPORT_AUDIT.append({'id':n['id'],'instrument':inst,'scoreTime':n['time'],'midi':n['midi'],'sourceMidi':choices[0]['midi'],'transposeSemitones':semi,'samples':[a['localName'] for a in choices],'sourceLeadRemovedSeconds':round(lead,6)})
 for r,bus in buses.items():writefloat(f'support-{r}-dry.wav',bus)
 (HERE/'support-audit.json').write_text(json.dumps(SUPPORT_AUDIT,indent=2))
 log('Support events',dict(counts))
 return buses

def biquad_peak(x,freq,gain,q):
 a=10**(gain/40);w=2*np.pi*freq/SR;alpha=np.sin(w)/(2*q);c=np.cos(w)
 b=np.array([1+alpha*a,-2*c,1-alpha*a]);d=np.array([1+alpha/a,-2*c,1-alpha/a])
 return signal.lfilter(b/d[0],d/d[0],x,axis=0).astype(np.float32)

def filtered(x,hp=None,lp=None):
 if hp:x=signal.sosfilt(signal.butter(2,hp,fs=SR,btype='highpass',output='sos'),x,axis=0)
 if lp:x=signal.sosfilt(signal.butter(2,lp,fs=SR,btype='lowpass',output='sos'),x,axis=0)
 return np.asarray(x,np.float32)

@functools.lru_cache(maxsize=2)
def room_ir(seed):
 dur=2.25;t=np.arange(round(dur*SR))/SR
 rng=np.random.default_rng(seed)
 tail=rng.standard_normal(len(t)).astype(np.float32)
 tail=filtered(tail[:,None],220,5700)[:,0]
 tail*=np.exp(-np.log(1000)*t/1.72)*(1-np.exp(-t/.035))
 tail/=max(np.sqrt(np.sum(tail*tail)),1e-6)
 ir=tail*.5
 # Recording-to-stage early-reflection pattern, 20ms predelay keeps hammer clear.
 for at,g in [(0,.25),(.013,.20),(.030,.15),(.047,.12),(.069,.095),(.091,.075)]:
  ir[round((at+.003*(seed%3))*SR)]+=g
 ir=np.pad(ir,(round(.021*SR),0))
 return ir.astype(np.float32)

def reverb(bus):
 wet=np.empty_like(bus)
 # Stereo crossfeed supplies a shared hall without flattening recorded width.
 for c in range(2):
  wet[:,c]=signal.oaconvolve(bus[:,c]*.78+bus[:,1-c]*.22,room_ir(101+c))[:N]
 return wet

def mix(piano,support):
 full=sum(piano.values())
 full=biquad_peak(full,290,-1.8,.65)
 full=biquad_peak(full,2200,.45,.7)
 full=filtered(full,None,14500)
 mid=full.mean(axis=1,keepdims=True);full=mid+(full-mid)*.92
 piano_rms=rms(full[round(57.6*SR):round(86.4*SR)])
 stemscale={}
 # Total sampled ensemble remains appreciably behind grand piano; melody lead
 # is checked separately against all support stems at every section.
 if not opts.piano_only:
  melody_rms=rms(piano['melody'][round(57.6*SR):round(86.4*SR)])
  targets={'strings':-14.0,'bass':-15.5,'kick':-20.0,'snare':-23.0,'hihat':-28.0,'cymbal':-28.5}
  ensemble=np.zeros_like(full);drums=np.zeros_like(full)
  for name,bus in support.items():
   if name=='strings':bus=filtered(bus,170,6500)
   elif name=='bass':bus=filtered(bus,36,2000)
   elif name=='snare':bus=filtered(bus,160,9200)
   elif name=='hihat':bus=filtered(bus,1800,12500)
   elif name=='kick':bus=filtered(bus,30,4300)
   elif name=='cymbal':bus=filtered(bus,450,11500)
   region=bus[round(163.2*SR):round(201.6*SR)] if name=='cymbal' else bus[round(57.6*SR):round(86.4*SR)]
   srms=rms(region)
   scale=melody_rms*10**(targets[name]/20)/max(srms,1e-8)
   # No stem is cranked into a sudden blast due to a near-empty region.
   scale=min(scale,4)
   bus*=scale;stemscale[name]={'gainDb':db(scale),'targetVersusChorusMelodyRmsDb':targets[name],'actualReferenceRmsDb':db(rms(region))}
   support[name]=bus
   if name in ['strings','bass']:ensemble+=bus
   else:drums+=bus
  # Verb remains below the acoustic piano with slightly more room for strings.
  piano_wet=reverb(full);ratio=10**(-19/20)*rms(full)/max(rms(piano_wet),1e-9);piano_wet*=ratio
  strings_wet=reverb(support['strings']);ratio2=10**(-13.5/20)*rms(support['strings'])/max(rms(strings_wet),1e-9);strings_wet*=ratio2
  drumwet=reverb(drums)*.11
  mixed=full+piano_wet+ensemble+strings_wet+drums+drumwet
  writefloat('ensemble-balanced.wav',ensemble+drums+strings_wet+drumwet)
 else:
  wet=reverb(full);wet*=10**(-19/20)*rms(full)/max(rms(wet),1e-9)
  mixed=full+wet
 writefloat('piano-balanced.wav',full)
 # Gentle full-band high-pass removes subsonics introduced by mixing; coda
 # already releases all keys and pedal before the 600ms safety fade.
 mixed=filtered(mixed,27,None)
 fade=round(.6*SR);mixed[-fade:]*=(.5+.5*np.cos(np.linspace(0,np.pi,fade)))[:,None]
 assert np.isfinite(mixed).all()
 writefloat('premaster.wav',mixed)
 manifest={'scoreSha256':sha(BASE/'score/score.json'),'duration':N/SR,'sampleRate':SR,'channels':2,'pianoNotes':len(SCORE['notes']),'accompanimentEvents':len(SCORE['accompaniment']),'withinLayerGainLimitDb':[-2,2],'pianoMaxTransposeSemitones':1,'reverb':{'predelaySeconds':.021,'rt60Seconds':1.72,'pianoWetDryRmsDb':-19,'stringsWetDryRmsDb':-13.5},'stemBalance':stemscale,'premasterPeakDbfs':db(np.max(np.abs(mixed))),'premasterRmsDbfs':db(rms(mixed)),'reviewScope':'Composition and signal review; no listening-capable tool was available.'}
 (HERE/'mix-manifest.json').write_text(json.dumps(manifest,indent=2))
 log('Premix peak',manifest['premasterPeakDbfs'],'RMS',manifest['premasterRmsDbfs'])
 return mixed

def loudness(path):
 p=subprocess.run(['ffmpeg','-nostdin','-hide_banner','-nostats','-i',str(path),'-af','loudnorm=I=-16:TP=-1.3:LRA=12:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 txt=p.stderr; obj=txt[txt.rfind('{'):txt.rfind('}')+1]
 return json.loads(obj)

def master():
 pre=loudness(HERE/'premaster.wav');gain=-16.0-float(pre['input_i'])
 # Preserve the score's large arc. Avoid asking a transparent peak limiter to
 # remove more than 3dB on the isolated loudest attack.
 gain=min(gain,-1.35-float(pre['input_tp'])+3.0)
 chain=f'volume={gain:.8f}dB,alimiter=limit={10**(-1.35/20):.8f}:attack=5:release=100:level=false:latency=true'
 p=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(HERE/'premaster.wav'),'-af',chain,'-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True)
 raw=np.frombuffer(p.stdout,np.float32).reshape(-1,2)
 assert len(raw)==N,(len(raw),N,p.stderr.decode())
 integers=np.rint(raw*(2**23-1)).astype(np.int32).reshape(-1)
 pcm=np.stack([integers&255,(integers>>8)&255,(integers>>16)&255],axis=1).astype(np.uint8).tobytes()
 temp=HERE/'daybreak-master.inprogress.wav'
 with wave.open(str(temp),'wb') as wav:
  wav.setnchannels(2);wav.setsampwidth(3);wav.setframerate(SR);wav.writeframes(pcm)
 temp.replace(HERE/'daybreak-master.wav')
 for ext,codec in [('mp3',['-c:a','libmp3lame','-q:a','0']),('m4a',['-c:a','aac','-b:a','256k','-movflags','+faststart'])]:
  subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-i',str(HERE/'daybreak-master.wav'),*codec,'-metadata','title=DAYBREAK','-metadata','artist=Original score for DAYBREAK',str(HERE/f'daybreak-master.{ext}')],check=True)
 results={'premasterLoudness':pre,'linearGainDb':gain,'limiterPeakCeilingDbfs':-1.35,'worstCaseLimiterReductionDb':max(0,float(pre['input_tp'])+gain+1.35),'files':{}}
 for ext in ['wav','mp3','m4a']:
  p=HERE/f'daybreak-master.{ext}';results['files'][ext]={'filename':p.name,'bytes':p.stat().st_size,'sha256':sha(p),'loudness':loudness(p)}
 (HERE/'mastering-analysis.json').write_text(json.dumps(results,indent=2));log('MASTER QA',results)

if __name__=='__main__':
 if not opts.master_only:
  if opts.mix_only:
   piano={r:decode(HERE/f'piano-{r}-dry.wav') for r in ['melody','harmony','bass']}
   support={r:decode(HERE/f'support-{r}-dry.wav') for r in ['strings','bass','kick','snare','hihat','cymbal']} if not opts.piano_only else {}
  else:
   piano=render_piano()
   support=render_support() if not opts.piano_only else {}
  mix(piano,support)
 if not opts.piano_only:master()
