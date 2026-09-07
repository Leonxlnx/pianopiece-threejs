import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { PERFORMANCE_LOOK } from './render-settings';
import { GrandPiano } from './piano';
import { Pianist } from './pianist';
import { Stage } from './stage';
import { Direction } from './direction';
import { mix, pedalPosition, scoreEnergy } from './math';
import type { Score, Telemetry } from './types';

export class PerformanceScene {
 renderer:THREE.WebGLRenderer;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(40,1,.035,180);composer:EffectComposer;piano:GrandPiano;pianist=new Pianist();stage:Stage;direction:Direction;score:Score;raf=0;resizeObserver:ResizeObserver;env?:THREE.WebGLRenderTarget;lastFrame=0;fps=60;disposed=false;showTime=-1;contextLost=false;
 dirty=true;renderedTime=NaN;renderedShot=-2;lastTelemetry?:Telemetry;
 constructor(public container:HTMLDivElement,score:Score,public getTime:()=>number,public onTelemetry:(v:Telemetry)=>void){
 this.score=score;const mobile=container.clientWidth<700;
 this.renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',alpha:false});this.renderer.info.autoReset=false;this.renderer.setPixelRatio(this.pixelRatio());this.renderer.setSize(container.clientWidth,container.clientHeight);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=PERFORMANCE_LOOK.exposure;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.domElement.setAttribute('aria-label','A human pianist at a concert grand in a timber and stone recital pavilion at dawn');container.appendChild(this.renderer.domElement);
 this.scene.background=new THREE.Color(0x17232c);this.scene.fog=new THREE.FogExp2(PERFORMANCE_LOOK.fogColor,PERFORMANCE_LOOK.fogDensity);
 this.stage=new Stage(this.scene,mobile);
 this.scene.environmentIntensity=PERFORMANCE_LOOK.environmentIntensity;
 this.piano=new GrandPiano();this.scene.add(this.piano.group,this.pianist.group);this.direction=new Direction(score);this.direction.reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Antialias the actual scene target; antialiasing only the canvas does not
 // reach geometry rendered through the postprocessing composer.
 const target=new THREE.WebGLRenderTarget(Math.max(1,container.clientWidth),Math.max(1,container.clientHeight),{type:THREE.HalfFloatType,samples:Math.min(mobile?2:4,this.renderer.capabilities.maxSamples)});
 this.composer=new EffectComposer(this.renderer,target);this.composer.addPass(new RenderPass(this.scene,this.camera));this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(container.clientWidth,container.clientHeight),mobile?.16:.22,.48,1.3));const output=new OutputPass();output.needsSwap=false;this.composer.addPass(output);
 this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
 this.renderer.domElement.addEventListener('webglcontextlost',this.lost);this.renderer.domElement.addEventListener('webglcontextrestored',this.restored);
 }
 lost=(event:Event)=>{event.preventDefault();this.contextLost=true;cancelAnimationFrame(this.raf);this.raf=0;};
 initialized=false;
 restored=()=>{if(this.disposed)return;this.contextLost=false;this.lastFrame=0;this.dirty=true;if(this.initialized){try{this.captureEnvironment();}catch(error){console.warn('Room reflections could not recover',error);}this.tick(performance.now());}};
 async initialize(){
 const characterTask=this.pianist.load(this.score).finally(()=>{if(this.disposed){disposeTree(this.pianist.group);this.pianist.group.clear();}});
 const roomTask=this.stage.whenReady().finally(()=>{if(this.disposed)disposeTree(this.stage.group);});
 const pianoTask=this.piano.whenReady().finally(()=>{if(this.disposed)disposeTree(this.piano.group);});
 await Promise.all([characterTask,roomTask,pianoTask]);
 if(this.disposed)return;
 if(!this.contextLost)this.captureEnvironment();
 this.initialized=true;this.tick(performance.now());
 }
 captureEnvironment(){
 if(this.disposed||this.contextLost)return;
 this.scene.environment=null;this.env?.dispose();this.env=undefined;
 const captureTime=this.showTime>=0?this.showTime:this.getTime();
 this.stage.update(captureTime,scoreEnergy(captureTime,this.score.sections),0);
 // Wait for actual material images, then capture this room at piano height.
 // The instrument and performer do not appear in their own environment map.
 this.piano.group.visible=false;this.pianist.group.visible=false;this.stage.reflector.visible=false;this.stage.dust.visible=false;
 const pmrem=new THREE.PMREMGenerator(this.renderer);
 try{this.env=pmrem.fromScene(this.scene,.045,.1,110,{position:new THREE.Vector3(...PERFORMANCE_LOOK.environmentPosition),size:PERFORMANCE_LOOK.environmentSize});this.scene.environment=this.env.texture;}
 finally{pmrem.dispose();this.piano.group.visible=true;this.pianist.group.visible=true;this.stage.reflector.visible=true;this.stage.dust.visible=true;}
 }
 pixelRatio(){const w=Math.max(1,this.container.clientWidth),h=Math.max(1,this.container.clientHeight),mobile=w<700;return Math.min(window.devicePixelRatio,mobile?1.5:1.7,Math.sqrt((mobile?1_500_000:3_200_000)/(w*h)));}
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(w===0||h===0)return;const ratio=this.pixelRatio();this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setPixelRatio(ratio);this.renderer.setSize(w,h);this.composer.setPixelRatio(ratio);this.composer.setSize(w,h);this.dirty=true;}
 tick=(now:number)=>{
 if(this.disposed||this.contextLost)return;const dt=(now-this.lastFrame)/1000;if(dt>0&&dt<1)this.fps=mix(this.fps,1/dt,.04);this.lastFrame=now;
 const time=this.showTime>=0?this.showTime:this.getTime();
 if(!this.dirty&&time===this.renderedTime&&this.renderedShot===this.direction.override){if(this.lastTelemetry)this.onTelemetry(this.lastTelemetry);this.raf=requestAnimationFrame(this.tick);return;}
 const energy=scoreEnergy(time,this.score.sections);
 const pedal=pedalPosition(time,this.score.pedals);
 let pulse=0;for(const a of this.score.accents){const dt=time-a.time;if(dt>=0&&dt<1)pulse=Math.max(pulse,a.energy*Math.exp(-dt*5));}
 const notes=this.score.notes.filter(n=>n.time<time+1&&n.time+n.duration>time-.2);
 this.piano.update(time,notes,pedal);this.pianist.update(time,this.score,this.piano,pedal,energy);this.direction.update(this.camera,time,this.camera.aspect);this.stage.update(time,energy,pulse);this.renderer.info.reset();this.composer.render();
 this.dirty=false;this.renderedTime=time;this.renderedShot=this.direction.override;
 this.lastTelemetry={time,activeNotes:this.piano.active,contacts:this.pianist.contacts,fps:this.fps,triangles:this.renderer.info.render.triangles,calls:this.renderer.info.render.calls,shot:this.direction.name,ready:this.pianist.ready};this.onTelemetry(this.lastTelemetry);
 this.raf=requestAnimationFrame(this.tick);
 };
 dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();this.renderer.domElement.removeEventListener('webglcontextlost',this.lost);this.renderer.domElement.removeEventListener('webglcontextrestored',this.restored);this.stage.dispose();for(const pass of this.composer.passes)pass.dispose();this.composer.dispose();disposeTree(this.scene);this.env?.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}

function disposeTree(root:THREE.Object3D){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>(),skeletons=new Set<THREE.Skeleton>();
 root.traverse(o=>{const light=o as THREE.Light & {shadow?:THREE.LightShadow};if(light.isLight)light.shadow?.dispose();const m=o as THREE.Mesh|THREE.Points|THREE.Line;if(!('geometry' in m)||!('material' in m))return;geometries.add(m.geometry);for(const mat of Array.isArray(m.material)?m.material:[m.material]){materials.add(mat);for(const value of Object.values(mat)){if(value instanceof THREE.Texture)textures.add(value);}}if((m as THREE.SkinnedMesh).isSkinnedMesh)skeletons.add((m as THREE.SkinnedMesh).skeleton);});
 root.traverse(o=>{if((o as THREE.InstancedMesh).isInstancedMesh)(o as THREE.InstancedMesh).dispose();});
 const images=new Set<unknown>();for(const t of textures){for(const image of Array.isArray(t.image)?t.image:[t.image])if(image)images.add(image);t.dispose();}
 for(const image of images)if(typeof ImageBitmap!=='undefined'&&image instanceof ImageBitmap)image.close();
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const s of skeletons)s.dispose();
}
