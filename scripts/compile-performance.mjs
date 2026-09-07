/** Compile the actual performance modules for native rendering and geometry QA.
 * The manifest prevents a stale compiled rig from certifying newer source.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import ts from 'typescript';

const { values } = parseArgs({ options: {
  source: { type: 'string' }, output: { type: 'string' }, verify: { type: 'boolean' },
} });
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(values.source ?? path.join(project, 'app/performance'));
const output = path.resolve(values.output ?? path.join(project, 'production/qa/compiled'));
const manifestPath = path.join(output, 'compiled-inputs.json');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const names = fs.readdirSync(source).filter(name => name.endsWith('.ts') && !name.endsWith('.d.ts')).sort();
const stems = new Set(names.map(name => name.slice(0, -3)));
if (!names.length) throw new Error(`No performance modules in ${source}`);
const inputs = Object.fromEntries(names.map(name => [name, hash(fs.readFileSync(path.join(source, name)))]));

if (values.verify) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.compiler !== ts.version || JSON.stringify(manifest.inputs) !== JSON.stringify(inputs))
    throw new Error('Compiled performance is stale: source or TypeScript version changed.');
  for (const [name, expected] of Object.entries(manifest.outputs))
    if (hash(fs.readFileSync(path.join(output, name))) !== expected)
      throw new Error(`Compiled performance changed after compilation: ${name}`);
  if (Object.keys(manifest.outputs).length !== names.length)
    throw new Error('Compiled performance manifest has missing modules.');
  console.log(`PERFORMANCE_INPUTS_VERIFIED ${names.length} modules`);
} else {
  // Compile and resolve the complete module graph before replacing any output.
  const compiled = new Map();
  for (const name of names) {
    const result = ts.transpileModule(fs.readFileSync(path.join(source, name), 'utf8'), {
      fileName: name, reportDiagnostics: true,
      compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
    });
    const errors = (result.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error);
    if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
      getCurrentDirectory: () => source, getCanonicalFileName: n => n, getNewLine: () => '\n',
    }));
    const text = result.outputText.replace(/((?:from\s*|import\s*\()\s*['"])\.\/([^'"]+)(['"])/g,
      (whole, prefix, imported, quote) => {
        const stem = imported.replace(/\.ts$/, '');
        if (!stems.has(stem)) throw new Error(`Unresolved performance import ${imported} in ${name}`);
        return `${prefix}./${stem}.mjs${quote}`;
      });
    compiled.set(name.replace(/\.ts$/, '.mjs'), text);
  }
  fs.mkdirSync(output, { recursive: true });
  const outputs = {};
  for (const [name, text] of compiled) {
    const destination = path.join(output, name), temporary = `${destination}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, text); fs.renameSync(temporary, destination); outputs[name] = hash(text);
  }
  const manifest = { version: 1, compiler: ts.version, inputs, outputs };
  const temporary = `${manifestPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(manifest, null, 2) + '\n');
  fs.renameSync(temporary, manifestPath);
  console.log(`PERFORMANCE_COMPILED ${compiled.size} modules`);
}
