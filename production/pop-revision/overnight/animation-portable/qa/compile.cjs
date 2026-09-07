const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const variant=process.argv[2]||'candidate',src=path.resolve(variant,'app/performance'),out=path.resolve(variant,'compiled');fs.mkdirSync(out,{recursive:true});
const modules=['piano','pianist','stage','direction','math','render-settings','wrist-motion','ponytail-motion','hair-motion-data'];
for(const f of modules){let s=ts.transpileModule(fs.readFileSync(path.join(src,f+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;for(const name of modules)s=s.replaceAll("'./"+name+"'","'./"+name+".mjs'");fs.writeFileSync(path.join(out,f+'.mjs'),s);}
console.log('COMPILE_PASS',variant);
