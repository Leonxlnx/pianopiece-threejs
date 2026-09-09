import fs from'node:fs';import ts from'typescript';
const p=new URL('.',import.meta.url),input=fs.readFileSync(new URL('guard-runtime.ts',p),'utf8');let out=ts.transpileModule(input,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
for(const name of ['math','piano','wrist-motion','ponytail-motion'])out=out.replaceAll(`'./${name}'`,`'/workspace/sites/daybreak-piano-film/production/qa/compiled/${name}.mjs'`);
fs.writeFileSync(new URL('guard-runtime-compiled.mjs',p),out);
