import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=path.resolve('.');
for(const label of ['baseline','local40']){
 const source=fs.readFileSync(`pianist-${label}.ts`,'utf8');
 const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
 const compiled=result.outputText.replace(/from '\.\/(.*?)'/g,(_,name)=>`from '${root}/compiled/${name}.mjs'`);
 fs.writeFileSync(`pianist-${label}.mjs`,compiled);
}
console.log('COMPILE_PASS: isolated baseline and local40 modules');
