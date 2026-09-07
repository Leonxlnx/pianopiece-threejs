const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const src=fs.readFileSync('approach-waypoint/pianist.ts','utf8'),find='const touch=restTouch.clone().lerp(contact,cruise);touch.x+=arrival.x*envelope;';
if(!src.includes(find))throw Error('Missing exact authored arrival branch');
const next=src.replace(find,'const offsetReturn=lift*(1-smooth((u-.50)/.35));\n  const touch=restTouch.clone().lerp(contact,cruise);touch.x+=arrival.x*offsetReturn;');
fs.mkdirSync('approach-offset/compiled',{recursive:true});fs.writeFileSync('approach-offset/pianist.ts',next);
const mods=fs.readdirSync('inventory/integrated/compiled').filter(f=>f.endsWith('.mjs'));let code=ts.transpileModule(next,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;for(const f of mods)code=code.replaceAll("'./"+f.slice(0,-4)+"'","'./"+f+"'");
for(const f of mods){if(f==='pianist.mjs')fs.writeFileSync('approach-offset/compiled/'+f,code);else fs.symlinkSync(path.resolve('inventory/integrated/compiled/'+f),'approach-offset/compiled/'+f);}
const s=JSON.parse(fs.readFileSync('approach-waypoint/midrolln/score.json'));
for(const [name,x]of [['offset15',.015],['offset25',.025],['offset35',.035],['offsetn15',-.015]]){const dir='approach-offset/'+name;fs.mkdirSync(dir,{recursive:true});const v=structuredClone(s);v.notes.find(n=>n.id==='db00522').approachWaypoint.x=x;fs.writeFileSync(dir+'/score.json',JSON.stringify(v,null,2)+'\n');for(const f of ['windows.json','times.json'])fs.copyFileSync('approach-waypoint/high0/'+f,dir+'/'+f);fs.symlinkSync('../compiled',dir+'/compiled');}
fs.writeFileSync('screen-approach-offset.mjs',fs.readFileSync('screen-approach-waypoint.mjs','utf8').replace("const dir='approach-waypoint'","const dir='approach-offset'"));
