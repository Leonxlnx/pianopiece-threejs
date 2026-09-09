import fs from 'node:fs';import ts from 'typescript';
const source=fs.readFileSync(new URL('candidate.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '../daybreak-site/production/qa/compiled/${p.slice(2)}.mjs'`);
fs.writeFileSync(new URL('candidate.mjs',import.meta.url),code);
