import fs from 'node:fs';
import {createRequire} from 'node:module';
import {project} from './load.mjs';
const require=createRequire(project+'/package.json'),ts=require('typescript');
const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,removeComments:true};
const a=ts.transpileModule(fs.readFileSync(new URL('wrist-volume.mjs',import.meta.url),'utf8'),{compilerOptions:options}).outputText;
const b=ts.transpileModule(fs.readFileSync(new URL('wrist-volume.ts',import.meta.url),'utf8'),{compilerOptions:options}).outputText;
if(a.trim()!==b.trim()){fs.writeFileSync(new URL('typed-expected.mjs',import.meta.url),a);fs.writeFileSync(new URL('typed-actual.mjs',import.meta.url),b);throw Error('typed deliverable differs from audited JavaScript');}
console.log('WRIST_TYPED_RUNTIME_IDENTICAL');
