from pathlib import Path
import subprocess,json,os,shutil
ROOT=Path(__file__).resolve().parent;SNAP=ROOT/'source-911870882ae92597';OUT=ROOT/'node-memory';OUT.mkdir(exist_ok=True)
preload=OUT/'memory-preload.mjs';preload.write_text("""const write=process.stdout.write.bind(process.stdout);process.stdout.write=function(chunk,...args){if(typeof chunk==='string'&&chunk.startsWith('{')){const parsed=JSON.parse(chunk);if(parsed.ready||parsed.meshes){const value={time:parsed.time??0,initialization:!!parsed.ready,memory:process.memoryUsage(),resource:process.resourceUsage()};return write(JSON.stringify(value)+'\\n',...args);}}return write(chunk,...args);};""")
env=os.environ.copy();env['DAYBREAK_QA_ROOT']=str(OUT/'cache');env['DAYBREAK_ASPECT']=str(16/9);p=subprocess.Popen(['node','--import',str(preload),str(SNAP/'production/qa/pose-server.mjs')],cwd=SNAP,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
rows=[]
try:
 rows.append(json.loads(p.stdout.readline()))
 for t in [6.,26.05,64.,170.]:p.stdin.write(str(t)+'\n');p.stdin.flush();rows.append(json.loads(p.stdout.readline()))
 report={'sourceSnapshot':str(SNAP),'standaloneNodeProbe':True,'simultaneousWithGlMeasurement':False,'nativeFramesRendered':0,'rows':rows};(ROOT/'node-memory.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
finally:
 p.terminate();p.wait()
 if (OUT/'cache').exists():shutil.rmtree(OUT/'cache')
