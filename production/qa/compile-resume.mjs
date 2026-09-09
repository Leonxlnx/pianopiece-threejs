import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=process.argv[2],src=path.join(root,'app/performance'),out=path.join(root,'production/qa/compiled');
fs.mkdirSync(out,{recursive:true});
for(const file of fs.readdirSync(src).filter(f=>f.endsWith('.ts'))){
 let code=ts.transpileModule(fs.readFileSync(path.join(src,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/(from\s+|import\s*)(['"])(\.\/[^'"]+)\2/g,(all,lead,quote,name)=>lead+quote+(path.extname(name)?name:name+'.mjs')+quote);
 fs.writeFileSync(path.join(out,file.replace(/\.ts$/,'.mjs')),code);
}
