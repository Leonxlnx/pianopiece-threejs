'use client';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Minimize, ArrowUpRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { Score, Telemetry } from './types';
import { PerformanceAudio } from './audio';
import type { PerformanceScene } from './scene';

const fmt=(t:number)=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
export default function Performance(){
 const container=useRef<HTMLDivElement>(null);const stage=useRef<PerformanceScene|null>(null);const audio=useRef<PerformanceAudio|null>(null);const scrub=useRef({active:false,resume:false});const activity=useRef(0);const lastUI=useRef(0);
 const [loadError,setLoadError]=useState('');
 const [score,setScore]=useState<Score|null>(null);const [ready,setReady]=useState(false);const [load,setLoad]=useState(0);const [audioReady,setAudioReady]=useState(false);const [begun,setBegun]=useState(false);const [playing,setPlaying]=useState(false);const [time,setTime]=useState(0);const [volume,setVolume]=useState(.78);const [error,setError]=useState('');const [chrome,setChrome]=useState(true);const [fullscreen,setFullscreen]=useState(false);const [inspect,setInspect]=useState(false);const [telemetry,setTelemetry]=useState<Telemetry|null>(null);const [rms,setRms]=useState(0);const [credits,setCredits]=useState(false);const [graphicsUnavailable,setGraphicsUnavailable]=useState(false);
 useEffect(()=>{let disposed=false;let localScene:PerformanceScene|null=null;const engine=new PerformanceAudio();audio.current=engine;
 const query=new URLSearchParams(location.search);setInspect(query.has('inspect'));activity.current=performance.now();
 (async()=>{try{
 const res=await fetch('/assets/score.json');if(!res.ok)throw Error('The performance could not load. Please refresh.');const s=await res.json() as Score;if(disposed)return;setScore(s);
 const musicTask=engine.load(setLoad).then(()=>{if(!disposed)setAudioReady(true);});
 const graphicsTask=(async()=>{try{const {PerformanceScene}=await import('./scene');if(disposed||!container.current)return;
 const scene=new PerformanceScene(container.current,s,()=>engine.time(),v=>{
 if(performance.now()-lastUI.current<100)return;lastUI.current=performance.now();setTime(v.time);setTelemetry(v);setRms(engine.rms());setPlaying(engine.playing);setChrome(!engine.playing||performance.now()-activity.current<3500);if(engine.ended)setChrome(true);
 });localScene=scene;stage.current=scene;const shot=Number(query.get('shot')??-1);if(shot>=0)scene.direction.override=shot;const at=Number(query.get('at')??-1);if(at>=0)scene.showTime=at;
 await scene.initialize();if(disposed)return;setReady(true);
 }catch(sceneError){if(disposed)return;console.warn('3D display unavailable',sceneError);localScene?.dispose();if(stage.current===localScene)stage.current=null;localScene=null;setGraphicsUnavailable(true);setReady(true);}
 })();await Promise.all([musicTask,graphicsTask]);
 }catch(e){if(!disposed)setLoadError(e instanceof Error?e.message:'The performance could not load. Please refresh.');}})();
 const uiTimer=window.setInterval(()=>{if(stage.current)setGraphicsUnavailable(stage.current.contextLost);if(stage.current&&!stage.current.contextLost)return;setTime(engine.time());setPlaying(engine.playing);setRms(engine.rms());setChrome(!engine.playing||performance.now()-activity.current<3500);},100);
 const onFS=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',onFS);
 return()=>{disposed=true;window.clearInterval(uiTimer);document.removeEventListener('fullscreenchange',onFS);engine.dispose();localScene?.dispose();if(stage.current===localScene)stage.current=null;};
 },[]);
 async function toggle(){if(!audioReady||!ready||!audio.current)return;setError('');activity.current=performance.now();if(stage.current)stage.current.showTime=-1;if(audio.current.playing)audio.current.pause();else{try{await audio.current.play();setBegun(true);}catch{setError('Audio is paused by your browser. Tap play to try again.');}}setPlaying(audio.current.playing);setChrome(true);}
 async function restart(){if(!audioReady||!audio.current)return;try{await audio.current.restart();setError('');}catch{setError('Tap play to resume the music.');}if(stage.current)stage.current.showTime=-1;setTime(0);activity.current=performance.now();}
 async function replay(){if(!audioReady)return;await restart();if(!audio.current)return;try{await audio.current.play();setBegun(true);setPlaying(audio.current.playing);setError('');}catch{setError('Tap play to resume the music.');}}
 async function seek(v:number){if(!audioReady)return;try{if(audio.current)await audio.current.seek(v);setError('');}catch{setError('Tap play to resume the music.');}if(stage.current)stage.current.showTime=-1;setTime(v);activity.current=performance.now();}
 function scrubTo(v:number){const engine=audio.current;if(!engine)return;if(!scrub.current.active){scrub.current={active:true,resume:engine.playing};engine.pause();}void engine.seek(v);if(stage.current)stage.current.showTime=-1;setTime(v);activity.current=performance.now();}
 async function commitScrub(v:number){const engine=audio.current;if(!engine)return;const resume=scrub.current.resume;scrub.current={active:false,resume:false};await engine.seek(v);if(resume&&v<engine.duration){try{await engine.play();setError('');}catch{setError('Tap play to resume the music.');}}setPlaying(engine.playing);}
 function changeVolume(v:number){setVolume(v);audio.current?.setVolume(v);}
 async function full(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{setError('Fullscreen is unavailable in this browser.');}}
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{
 if(e.defaultPrevented||e.isComposing||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Escape'){setCredits(false);setError('');return;}
 const target=e.target;
 if(target instanceof HTMLElement&&target.closest('a,button,[role="slider"],input,select,textarea,[contenteditable="true"]'))return;
 if(e.code==='Space'){e.preventDefault();if(!e.repeat)void toggle();return;}
 if(e.repeat)return;
 if(e.key==='r'||e.key==='R')void restart();
 if(e.key==='f'||e.key==='F')void full();
 if(e.key==='ArrowRight'){e.preventDefault();void seek(Math.min((score?.duration??0),time+5));}
 if(e.key==='ArrowLeft'){e.preventDefault();void seek(Math.max(0,time-5));}
 };window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);});
 const wake=()=>{activity.current=performance.now();setChrome(true);};const canPlay=ready&&audioReady;const duration=score?.duration??233.144228;const section=score?.sections.find(s=>time>=s.start&&time<s.end)?.name??(time>=duration?(score?.sections.at(-1)?.name??'Home in the light'):'First light');
 return <main className={`performance ${begun?'has-begun':''} ${chrome?'show-controls':''}`} onPointerMove={wake} onPointerDown={wake}>
 <div className="world" ref={container}/><picture className={`stage-poster ${ready&&!graphicsUnavailable?'poster-hidden':''}`} aria-hidden="true"><source media="(max-aspect-ratio: 1/1)" srcSet="/assets/stage-portrait.webp"/><img src="/assets/stage-poster.webp" alt=""/></picture>
 <div className="film-shade" aria-hidden="true"/>
 {graphicsUnavailable&&<div className="graphics-notice"><p>3D graphics unavailable in this browser.</p><span>You can still listen to the complete piece.</span></div>}
 <header className="film-header"><a href="/" className="wordmark" aria-label="Daybreak home">Daybreak<span className="wordmark-dot"/></a><button className="credit-trigger" aria-controls="piece-credits" onClick={()=>setCredits(!credits)} aria-expanded={credits}>About the piece <ArrowUpRight size={14}/></button></header>
 {!begun&&<section className={`opening ${ready?'scene-ready':''}`} aria-label="Begin the performance">
 <p className="opening-description">An original piano performance</p><h1>Daybreak</h1>
 <div className="opening-action"><button className="begin" onClick={()=>void toggle()} disabled={!canPlay} aria-label={canPlay?'Play Daybreak':'Loading the performance'}>{canPlay?<Play size={21} fill="currentColor"/>:<span className="loading-ring"/>}</button><div><button className="begin-text" onClick={()=>void toggle()} disabled={!canPlay}>{canPlay?(graphicsUnavailable?'Play the music':'Play the film'):ready?'Preparing the music':'Setting the stage'}</button><p>{canPlay?`${fmt(duration)} · Sound on`:`${Math.round(load*100)}%`}</p></div></div>
 </section>}
 <div className={`playback ${begun?'visible':''}`} aria-label="Playback controls">
 <div className="playback-meta"><span>{section}</span><span className="timecode">{fmt(time)} <span>/ {fmt(duration)}</span></span></div>
 <Slider className="timeline" aria-label="Performance position" aria-valuetext={`${fmt(time)} of ${fmt(duration)}`} min={0} max={duration} step={.1} value={[time]} onValueChange={v=>scrubTo(v[0])} onValueCommit={v=>void commitScrub(v[0])}/>
 <div className="playback-row"><div className="left-controls"><button className="icon-button play-control" onClick={()=>void toggle()} aria-label={playing?'Pause performance':'Play performance'}>{playing?<Pause size={20} fill="currentColor"/>:<Play size={20} fill="currentColor"/>}</button><button className="icon-button" onClick={()=>void restart()} aria-label="Restart performance"><RotateCcw size={18}/></button><span className="piece-label">Daybreak</span></div>
 <div className="right-controls"><button className="icon-button" onClick={()=>changeVolume(volume>.001?0:.78)} aria-label={volume>.001?'Mute':'Unmute'}>{volume>.001?<Volume2 size={18}/>:<VolumeX size={18}/>}</button><Slider className="volume" aria-label="Volume" aria-valuetext={`${Math.round(volume*100)} percent`} min={0} max={1} step={.01} value={[volume]} onValueChange={v=>changeVolume(v[0])}/><button className="icon-button" onClick={()=>void full()} aria-label={fullscreen?'Exit fullscreen':'Fullscreen'}>{fullscreen?<Minimize size={18}/>:<Maximize size={18}/>}</button></div></div>
 </div>
 {begun&&!playing&&time>=duration-.5&&<div className="end-title"><span>Daybreak</span><button onClick={()=>void replay()}><RotateCcw size={16}/> Play again</button></div>}
 {credits&&<aside id="piece-credits" className="credits" aria-label="About Daybreak"><button className="credits-close" onClick={()=>setCredits(false)} aria-label="Close credits">×</button><h2>Daybreak</h2><p>An original piano-led piece, from first light to a final lift.</p><p>Music, movement and camera share one score. The performance is rendered in real time.</p><p className="credits-small">Piano: Salamander Grand Piano v3, Alexander Holm, CC BY 3.0.<br/>Performer: MakeHuman / MPFB, provided by TalkingHead, CC0.</p><a href="/assets/credits.txt" target="_blank" rel="noreferrer">Full credits and licenses <ArrowUpRight size={14}/></a></aside>}
 {(loadError||error)&&<div role="alert" className="load-error"><p>{loadError||error}</p>{loadError?<button onClick={()=>location.reload()}>Reload performance</button>:<button onClick={()=>setError('')}>Dismiss</button>}</div>}
 {inspect&&<aside className="inspection"><div>Performance inspection</div><p>Time {time.toFixed(3)} · {telemetry?.fps.toFixed(1)} fps · PCM RMS {rms.toFixed(5)}</p><p>Camera: {telemetry?.shot} · {telemetry?.calls} calls · {telemetry?.triangles} triangles</p><p>Keys: {telemetry?.activeNotes.join(', ')}</p><p>Contacts: {telemetry?.contacts.map(c=>`${c.hand}${c.finger}=${c.midi} ${(c.error*1000).toFixed(1)}mm`).join(' / ')}</p><div className="inspection-actions">{score?.sections.map(s=><button key={s.start} onClick={()=>{if(stage.current)stage.current.showTime=s.start+.65;setTime(s.start+.65);}}>{s.name}</button>)}</div><div className="inspection-actions">{stage.current?.direction.shots.map((s,i)=><button key={i} onClick={()=>{if(stage.current)stage.current.direction.override=i;}}>{i} {s.name}</button>)}<button onClick={()=>{if(stage.current){stage.current.direction.override=-1;stage.current.showTime=-1;}}}>Automatic</button></div></aside>}
 <output id="performance-state" hidden data-time={time.toFixed(4)} data-playing={playing} data-audio-ready={audioReady} data-rms={rms.toFixed(6)} data-shot={telemetry?.shot} data-contacts={JSON.stringify(telemetry?.contacts??[])} data-notes={JSON.stringify(telemetry?.activeNotes??[])} data-fps={telemetry?.fps.toFixed(1)} data-ready={ready}/>
 </main>;
}
