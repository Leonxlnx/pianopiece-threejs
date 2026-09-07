import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const project = [process.env.DAYBREAK_PROJECT, process.cwd(), path.resolve(here, '../../pianopiece-threejs')]
  .filter(Boolean).find(p => fs.existsSync(path.join(p, 'app/performance/pianist.ts')) && fs.existsSync(path.join(p, 'package.json')));
if (!project) throw Error('Set DAYBREAK_PROJECT to the installed piano checkout.');
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json')));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for (const [file, expected] of Object.entries(manifest.files)) {
  if (sha(path.join(here, file)) !== expected) throw Error('Frozen package file changed: ' + file);
}
const model = path.resolve(process.env.DAYBREAK_MODEL ?? path.join(project, 'public/assets/pianist.glb'));
const score = path.resolve(process.env.DAYBREAK_SCORE ?? path.join(here, 'baseline/score.json'));
function verifyInputs() {
  if (sha(model) !== manifest.modelSha256) throw Error('Model differs from the accepted be0341 baseline. Set DAYBREAK_MODEL to the original Git asset.');
  if (sha(score) !== manifest.scoreSha256) throw Error('Score differs from the accepted 53be5f baseline. Set DAYBREAK_SCORE to the preserved score.');
  for (const [file, expected] of Object.entries(manifest.dependencyFiles)) {
    if (sha(path.join(project, file)) !== expected) throw Error('Dependency differs from the accepted runtime: ' + file);
  }
  for (const [file, expected] of Object.entries(manifest.files)) {
    if (sha(path.join(here, file)) !== expected) throw Error('Frozen package file changed during execution: ' + file);
  }
}
verifyInputs();
if (!fs.existsSync(path.join(project, 'node_modules/three/package.json'))) throw Error('Install repository dependencies first.');
console.log('WRIST_PORTABLE_INPUTS_PINNED');
if (process.argv.includes('--check')) process.exit(0);
const output = path.resolve(process.env.DAYBREAK_REPORTS ?? path.join(here, 'reports'));
if (fs.existsSync(output) && fs.readdirSync(output).length) throw Error('Reports folder must be new or empty; choose a fresh DAYBREAK_REPORTS. Existing evidence will not be overwritten.');
fs.mkdirSync(output, { recursive: true });
const runtime = fs.mkdtempSync(path.join(process.env.DAYBREAK_RUNTIME_ROOT ?? os.tmpdir(), 'daybreak-wrist-'));
try {
  for (const file of Object.keys(manifest.files)) {
    const target = path.join(runtime, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(here, file), target);
  }
  fs.symlinkSync(path.join(project, 'node_modules'), path.join(runtime, 'node_modules'), 'dir');
  const env = { ...process.env, DAYBREAK_PROJECT: project, DAYBREAK_MODEL: model, DAYBREAK_SCORE: score };
  const only = process.argv.includes('--identity') ? 'identity' : process.argv.includes('--numerical') ? 'numerical' : process.argv.includes('--surfaces') ? 'surfaces' : null;
  const checks = [
    ['identity', 'verify-typed.mjs', [], null, 'WRIST_TYPED_RUNTIME_IDENTICAL'],
    ['numerical', 'verify.mjs', ['--roll'], 'verification-roll.json', 'WRIST_CORRECTION_NUMERICAL_PASS'],
    ['surfaces', 'surface-final.mjs', ['8'], 'surface-final.json', 'WRIST_SURFACE_NO_NEW_CROSSINGS'],
  ].filter(row => !only || row[0] === only);
  for (const [name, script, args, report, expect] of checks) {
    verifyInputs();
    console.log('Running pinned ' + name + ' check');
    const result = spawnSync(process.execPath, [path.join(runtime, script), ...args], { cwd: project, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    fs.writeFileSync(path.join(output, name + '.log'), (result.stdout ?? '') + (result.stderr ?? ''));
    if (report && fs.existsSync(path.join(runtime, report))) fs.copyFileSync(path.join(runtime, report), path.join(output, report));
    if (result.error || result.status !== 0 || !result.stdout?.includes(expect)) throw result.error ?? Error(name + ' check failed; see ' + path.join(output, name + '.log'));
    verifyInputs();
    console.log(expect);
  }
  verifyInputs();
  fs.writeFileSync(path.join(output, 'reproduction-inputs.json'), JSON.stringify({ model, score, modelSha256: sha(model), scoreSha256: sha(score), manifest, scope: only ?? 'all' }, null, 2) + '\n');
  console.log('WRIST_PORTABLE_REPRODUCTION_PASS');
} finally {
  fs.rmSync(runtime, { recursive: true, force: true });
}
