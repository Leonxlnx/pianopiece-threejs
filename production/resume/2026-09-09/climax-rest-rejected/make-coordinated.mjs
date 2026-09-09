import fs from 'node:fs';import ts from 'typescript';
const root=new URL('./',import.meta.url),base=fs.readFileSync(new URL('baseline.ts',root),'utf8'),code=fs.readFileSync(new URL('neutral-generator.ts',root),'utf8');
const source=base.replace('export class Pianist extends OriginalPianist {',code+'\nexport class Pianist extends OriginalPianist {').replace('p299Idle(this,time);','p299Idle(this,time);coordinatedRest(this,time);');
fs.writeFileSync(new URL('coordinated-arch.ts',root),source);
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from '(\.\/[^']+)'/g,(_,p)=>`from './render-project/production/qa/compiled/${p.slice(2)}.mjs'`);fs.writeFileSync(new URL('coordinated-arch.mjs',root),js);
