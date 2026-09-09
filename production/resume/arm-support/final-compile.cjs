const fs=require('fs'),path=require('path'),ts=require('typescript');
for(const dir of ['candidate-final']){
 const root=path.join(__dirname,dir),files=fs.readdirSync(root).filter(x=>x.endsWith('.ts'));
 for(const f of files){let s=ts.transpileModule(fs.readFileSync(path.join(root,f),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;for(const name of files.map(f=>f.slice(0,-3)))s=s.replaceAll("'./"+name+"'","'./"+name+".mjs'");fs.writeFileSync(path.join(root,f.replace('.ts','.mjs')),s);}
}
