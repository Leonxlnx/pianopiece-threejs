const fs=require('node:fs'),ts=require('typescript');
for(const f of ['piano','pianist','math','wrist-motion','stage','direction','render-settings']){
 let s=ts.transpileModule(fs.readFileSync(f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const dep of ['math','piano','wrist-motion'])s=s.replaceAll("'./"+dep+"'","'./"+dep+".mjs'");
 fs.writeFileSync('compiled/'+f+'.mjs',s);
}
