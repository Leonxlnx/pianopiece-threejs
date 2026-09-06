#!/usr/bin/env node
// Runs the project's real TypeScript scene logic with deterministic external I/O.
// No browser, WebGL context, network requests, or checkout writes are performed.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const project = path.resolve(option('--project', '/workspace/sites/daybreak-piano-film'));
const output = path.resolve(option('--out', path.join(here, 'results.json')));
const requireProject = createRequire(path.join(project, 'package.json'));
const ts = requireProject('typescript');
const THREE = await import(pathToFileURL(requireProject.resolve('three')));
const { EffectComposer } = await import(pathToFileURL(requireProject.resolve('three/addons/postprocessing/EffectComposer.js')));
const { RenderPass } = await import(pathToFileURL(requireProject.resolve('three/addons/postprocessing/RenderPass.js')));
const { UnrealBloomPass } = await import(pathToFileURL(requireProject.resolve('three/addons/postprocessing/UnrealBloomPass.js')));
const { OutputPass } = await import(pathToFileURL(requireProject.resolve('three/addons/postprocessing/OutputPass.js')));
const sourcePaths = ['scene.ts', 'math.ts', 'render-settings.ts', 'Performance.tsx', 'stage.ts', 'piano.ts'];
const source = Object.fromEntries(sourcePaths.map(name => [name, fs.readFileSync(path.join(project, 'app/performance', name), 'utf8')]));
const sourceHashes = Object.fromEntries(Object.entries(source).map(([name, text]) => [name, crypto.createHash('sha256').update(text).digest('hex')]));

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

function fixture({ width = 1440, height = 900, dpr = 2, maxSamples = 8, time = 0, waitPiano = false } = {}) {
  const state = {
    now: 1000, time, frames: new Map(), nextFrame: 1,
    telemetry: [], warnings: [], captures: [], pmrems: [], renderers: [],
    character: deferred(), room: deferred(), pianoReady: deferred(), pmremFailure: false, sceneTargets: new Set(), passFrames: [],
  };
  if (!waitPiano) state.pianoReady.resolve();
  class Canvas {
    listeners = new Map(); attributes = {}; removed = 0;
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); }
    removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
    dispatch(name) { const event = { prevented: false, preventDefault() { this.prevented = true; } }; for (const fn of [...(this.listeners.get(name) ?? [])]) fn(event); return event; }
    remove() { this.removed++; }
  }
  class Renderer {
    domElement = new Canvas(); shadowMap = {}; capabilities = { maxSamples }; ratio = 1; width = 1; height = 1; disposed = 0; renderTarget = null;
    info = { autoReset: true, render: { triangles: 0, calls: 0 }, resets: 0, reset() { this.resets++; this.render.triangles = 0; this.render.calls = 0; } };
    constructor(options) { this.options = options; state.renderers.push(this); }
    setPixelRatio(ratio) { this.ratio = ratio; }
    getPixelRatio() { return this.ratio; }
    setSize(width, height) { this.width = width; this.height = height; }
    getSize(out) { return out.set(this.width, this.height); }
    getRenderTarget() { return this.renderTarget; }
    setRenderTarget(target) { this.renderTarget = target; }
    dispose() { this.disposed++; }
  }
  class Composer extends EffectComposer {
    renderCount = 0; disposed = 0;
    // Real constructor, sizing, pass order, buffer swaps and disposal. Each pass
    // retains its real API/settings; its GPU render method is replaced below.
    render() { this.renderCount++; super.render(1 / 60); this.renderer.info.render.triangles = 345678; this.renderer.info.render.calls = 321; }
    dispose() { this.disposed++; super.dispose(); }
  }
  const wrappedPass = Base => class extends Base {
    disposed = 0; sizes = [];
    setSize(w, h) { super.setSize(w, h); this.sizes?.push([w, h]); }
    dispose() { this.disposed++; super.dispose(); }
    render(renderer, write, read) {
      state.passFrames.push({ name: Base.name, read, write, screen: this.renderToScreen, needsSwap: this.needsSwap });
      if (Base === RenderPass) state.sceneTargets.add(read);
      renderer.setRenderTarget(this.renderToScreen ? null : (Base === OutputPass ? write : read));
    }
  };
  class PMREM {
    disposed = 0;
    constructor(renderer) { this.renderer = renderer; state.pmrems.push(this); }
    fromScene(scene, sigma, near, far, options) {
      state.captures.push({
        stageUpdate: [...state.stage.updates.at(-1)],
        hidden: [state.piano.group, state.pianist.group, state.stage.reflector, state.stage.dust].every(o => !o.visible),
        detachedEnvironment: scene.environment === null, sigma, near, far, options,
      });
      if (state.pmremFailure) throw new Error('injected PMREM failure');
      const target = new THREE.WebGLRenderTarget(options.size, options.size);
      target.disposals = 0; target.addEventListener('dispose', () => target.disposals++);
      this.target = target;
      return target;
    }
    dispose() { this.disposed++; }
  }
  class Pianist {
    group = new THREE.Group(); contacts = []; ready = false; updates = [];
    constructor() { state.pianist = this; }
    async load() { const attach = await state.character.promise; attach?.(this.group); this.ready = true; }
    update(...args) { this.updates.push(args); }
  }
  class GrandPiano {
    group = new THREE.Group(); active = []; updates = [];
    constructor() { state.piano = this; }
    async whenReady() { const attach = await state.pianoReady.promise; attach?.(this.group); }
    update(...args) { this.updates.push(args); }
  }
  class Stage {
    group = new THREE.Group(); reflector = new THREE.Object3D(); dust = new THREE.Object3D(); updates = []; disposed = 0;
    constructor(scene) { state.stage = this; this.group.add(this.reflector, this.dust); scene.add(this.group); }
    async whenReady() { const attach = await state.room.promise; attach?.(this.group); }
    update(...args) { this.updates.push(args); }
    dispose() { this.disposed++; }
  }
  class Direction {
    override = -1; name = 'test shot'; updates = [];
    update(...args) { this.updates.push(args); }
  }
  class ImageBitmap { closes = 0; close() { this.closes++; } }
  class ResizeObserver {
    disconnected = 0;
    constructor(fn) { this.fn = fn; state.observer = this; }
    observe(container) { this.container = container; }
    disconnect() { this.disconnected++; }
  }
  const mockedThree = { ...THREE, WebGLRenderer: Renderer, PMREMGenerator: PMREM };
  const dependencies = {
    three: mockedThree,
    'three/addons/postprocessing/EffectComposer.js': { EffectComposer: Composer },
    'three/addons/postprocessing/RenderPass.js': { RenderPass: wrappedPass(RenderPass) },
    'three/addons/postprocessing/UnrealBloomPass.js': { UnrealBloomPass: wrappedPass(UnrealBloomPass) },
    'three/addons/postprocessing/OutputPass.js': { OutputPass: wrappedPass(OutputPass) },
    './piano': { GrandPiano }, './pianist': { Pianist }, './stage': { Stage }, './direction': { Direction },
  };
  const globals = {
    console: { ...console, warn: (...args) => state.warnings.push(args.map(String)) },
    performance: { now: () => state.now },
    window: { devicePixelRatio: dpr, matchMedia: () => ({ matches: false }) },
    ImageBitmap, ResizeObserver,
    requestAnimationFrame: fn => { const id = state.nextFrame++; state.frames.set(id, fn); return id; },
    cancelAnimationFrame: id => { state.frames.delete(id); },
  };
  function compile(name) {
    const compiled = ts.transpileModule(source[name], { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(compiled, {
      ...globals, module, exports: module.exports,
      require: id => { if (!(id in dependencies)) throw new Error(`Unexpected dependency ${id}`); return dependencies[id]; },
    }, { filename: path.join(project, 'app/performance', name) });
    return module.exports;
  }
  dependencies['./math'] = compile('math.ts');
  dependencies['./render-settings'] = compile('render-settings.ts');
  const { PerformanceScene } = compile('scene.ts');
  const container = { clientWidth: width, clientHeight: height, children: [], appendChild(el) { this.children.push(el); } };
  const score = { duration: 20, sections: [{ start: 0, end: 10, energy: .2 }, { start: 10, end: 20, energy: .8 }], notes: [], pedals: [], accents: [{ time: 10.1, energy: .5 }] };
  const scene = new PerformanceScene(container, score, () => state.time, telemetry => state.telemetry.push(telemetry));
  return {
    state, scene, container, score, ImageBitmap,
    frame(ms = 16.667) { state.now += ms; const entry = state.frames.entries().next().value; assert.ok(entry, 'expected one scheduled animation frame'); const [id, fn] = entry; state.frames.delete(id); fn(state.now); },
    lose() { const event = scene.renderer.domElement.dispatch('webglcontextlost'); assert.equal(event.prevented, true); },
    restore() { scene.renderer.domElement.dispatch('webglcontextrestored'); },
    async ready() { const promise = scene.initialize(); state.character.resolve(); state.room.resolve(); state.pianoReady.resolve(); await promise; },
  };
}

function trackedAssets(F) {
  const counts = { geometry: 0, material: 0, textureA: 0, textureB: 0, instances: 0, skeleton: 0, shadow: 0 };
  const geometry = new THREE.BufferGeometry(); geometry.addEventListener('dispose', () => counts.geometry++);
  const bitmap = new F.ImageBitmap();
  const textureA = new THREE.Texture(bitmap), textureB = new THREE.Texture(bitmap);
  textureA.addEventListener('dispose', () => counts.textureA++); textureB.addEventListener('dispose', () => counts.textureB++);
  const material = new THREE.MeshStandardMaterial({ map: textureA, normalMap: textureB }); material.addEventListener('dispose', () => counts.material++);
  const instance = new THREE.InstancedMesh(geometry, material, 2); instance.addEventListener('dispose', () => counts.instances++);
  const skinned = new THREE.SkinnedMesh(geometry, [material, material]); skinned.skeleton = { dispose() { counts.skeleton++; } };
  const light = new THREE.SpotLight(); light.shadow.dispose = () => counts.shadow++;
  const group = new THREE.Group(); group.add(instance, skinned, new THREE.Mesh(geometry, material), light);
  return { group, counts, bitmap, assertReleased(times = 1) { for (const [key, count] of Object.entries(counts)) assert.equal(count, times, `${key} disposal count`); assert.equal(bitmap.closes, times, 'shared ImageBitmap close count'); } };
}

const checks = [];
const test = (name, fn, category = 'regression') => checks.push({ name, fn, category });
test('initialize waits for both character and room before PMREM and first render', async () => {
  const F = fixture(); const init = F.scene.initialize();
  F.state.character.resolve(); await settle();
  assert.equal(F.state.captures.length, 0); assert.equal(F.scene.composer.renderCount, 0);
  F.state.room.resolve(); await init;
  assert.equal(F.state.captures.length, 1); assert.equal(F.scene.composer.renderCount, 1); assert.equal(F.state.frames.size, 1);
  assert.equal(F.state.captures[0].hidden, true); assert.equal(F.state.captures[0].detachedEnvironment, true);
  assert.equal(F.state.pmrems[0].disposed, 1); F.scene.dispose();
});
test('piano material readiness also gates the initial PMREM and render', async () => {
  const F = fixture({ waitPiano: true }); const init = F.scene.initialize();
  F.state.character.resolve(); F.state.room.resolve(); await settle();
  assert.equal(F.state.captures.length, 0); assert.equal(F.scene.composer.renderCount, 0);
  F.state.pianoReady.resolve(); await init;
  assert.equal(F.state.captures.length, 1); assert.equal(F.scene.composer.renderCount, 1); assert.equal(F.state.frames.size, 1); F.scene.dispose();
});
test('paused frames skip expensive scene work while telemetry continues', async () => {
  const F = fixture(); await F.ready();
  const before = { draw: F.scene.composer.renderCount, pianist: F.state.pianist.updates.length, stage: F.state.stage.updates.length, telemetry: F.state.telemetry.length, reset: F.scene.renderer.info.resets };
  for (let i = 0; i < 20; i++) F.frame();
  assert.equal(F.scene.composer.renderCount, before.draw); assert.equal(F.state.pianist.updates.length, before.pianist); assert.equal(F.state.stage.updates.length, before.stage);
  assert.equal(F.scene.renderer.info.resets, before.reset); assert.equal(F.state.telemetry.length, before.telemetry + 20); assert.equal(F.state.frames.size, 1);
  F.scene.dispose();
});
test('time, inspector time and camera override each invalidate the paused cache', async () => {
  const F = fixture(); await F.ready();
  F.state.time = 1; F.frame(); assert.equal(F.scene.composer.renderCount, 2);
  F.scene.showTime = 5; F.frame(); assert.equal(F.scene.composer.renderCount, 3); assert.equal(F.state.telemetry.at(-1).time, 5);
  F.scene.direction.override = 2; F.frame(); assert.equal(F.scene.composer.renderCount, 4);
  F.scene.direction.override = -1; F.scene.showTime = -1; F.frame(); assert.equal(F.scene.composer.renderCount, 5);
  F.frame(); assert.equal(F.scene.composer.renderCount, 5); F.scene.dispose();
});
test('resize dirties the paused cache once and uses logical dimensions only once', async () => {
  const F = fixture(); await F.ready();
  F.container.clientWidth = 1920; F.container.clientHeight = 1080; F.state.observer.fn();
  const ratio = F.scene.renderer.getPixelRatio();
  assert.ok(Math.abs(F.scene.composer.renderTarget1.width - 1920 * ratio) < 1e-7);
  assert.ok(Math.abs(F.scene.composer.renderTarget1.height - 1080 * ratio) < 1e-7);
  assert.ok(F.scene.composer.renderTarget1.width * F.scene.composer.renderTarget1.height <= 3_200_000 + 1e-6);
  assert.equal(F.scene.camera.aspect, 1920 / 1080);
  F.frame(); F.frame(); assert.equal(F.scene.composer.renderCount, 2); F.scene.dispose();
});
test('desktop and mobile target budgets, MSAA sample counts and hardware cap', async () => {
  for (const config of [{ width: 3840, height: 2160, dpr: 2, expected: 4, budget: 3_200_000 }, { width: 430, height: 932, dpr: 3, expected: 2, budget: 1_500_000 }, { width: 1440, height: 900, dpr: 2, maxSamples: 1, expected: 1, budget: 3_200_000 }]) {
    const F = fixture(config); const a = F.scene.composer.renderTarget1, b = F.scene.composer.renderTarget2;
    assert.equal(a.samples, config.expected); assert.equal(b.samples, config.expected); assert.equal(a.texture.type, THREE.HalfFloatType);
    assert.ok(a.width * a.height <= config.budget + 1e-6); assert.equal(F.scene.renderer.options.antialias, false); F.scene.dispose();
  }
});
test('screen-only output avoids alternating two full-size MSAA scene targets', async () => {
  const F = fixture();
  try {
    await F.ready(); F.state.time = .1; F.frame(); F.state.time = .2; F.frame();
    assert.equal(F.state.sceneTargets.size, 1, 'final OutputPass buffer swap activates both full-size multisampled targets');
    assert.equal(F.state.passFrames.filter(pass => pass.name === 'OutputPass').every(pass => pass.screen), true);
  } finally { F.scene.dispose(); }
}, 'performance');
test('context loss after initialization cancels RAF; restoration replaces PMREM and renders frozen time', async () => {
  const F = fixture(); await F.ready(); const old = F.scene.env;
  F.lose(); assert.equal(F.state.frames.size, 0); assert.equal(F.scene.contextLost, true);
  F.restore(); assert.equal(F.scene.contextLost, false); assert.equal(F.state.captures.length, 2); assert.equal(old.disposals, 1);
  assert.notEqual(F.scene.env, old); assert.equal(F.scene.scene.environment, F.scene.env.texture); assert.equal(F.scene.composer.renderCount, 2); assert.equal(F.state.frames.size, 1);
  F.frame(); assert.equal(F.scene.composer.renderCount, 2); F.scene.dispose();
});
test('loads completing while context is lost wait for restoration before PMREM/render', async () => {
  const F = fixture(); const init = F.scene.initialize(); F.lose(); F.state.character.resolve(); F.state.room.resolve(); await init;
  assert.equal(F.scene.initialized, true); assert.equal(F.state.captures.length, 0); assert.equal(F.scene.composer.renderCount, 0); assert.equal(F.state.frames.size, 0);
  F.restore(); assert.equal(F.state.captures.length, 1); assert.equal(F.scene.composer.renderCount, 1); assert.equal(F.state.frames.size, 1); F.scene.dispose();
});
test('restoration before loads finish defers PMREM/render and creates one RAF chain', async () => {
  const F = fixture(); const init = F.scene.initialize(); F.lose(); F.restore();
  assert.equal(F.state.captures.length, 0); assert.equal(F.state.frames.size, 0);
  F.state.character.resolve(); F.state.room.resolve(); await init;
  assert.equal(F.state.captures.length, 1); assert.equal(F.scene.composer.renderCount, 1); assert.equal(F.state.frames.size, 1); F.scene.dispose();
});
test('unmount during loads releases assets attached later and never starts rendering', async () => {
  const F = fixture(); const actor = trackedAssets(F), room = trackedAssets(F); const init = F.scene.initialize(); F.scene.dispose();
  F.state.character.resolve(group => group.add(actor.group)); F.state.room.resolve(group => group.add(room.group)); await init;
  actor.assertReleased(); room.assertReleased(); assert.equal(F.state.pianist.group.children.length, 0); assert.equal(F.state.captures.length, 0); assert.equal(F.state.frames.size, 0);
});
test('room failure followed by owner disposal still releases a late successful actor', async () => {
  const F = fixture(); const actor = trackedAssets(F); const init = F.scene.initialize(); const rejected = assert.rejects(init, /room load failed/);
  F.state.room.reject(new Error('room load failed')); await rejected; F.scene.dispose();
  F.state.character.resolve(group => group.add(actor.group)); await settle();
  actor.assertReleased(); assert.equal(F.state.pianist.group.children.length, 0); assert.equal(F.state.frames.size, 0);
});
test('character failure followed by owner disposal still releases late room resources', async () => {
  const F = fixture(); const room = trackedAssets(F); const init = F.scene.initialize(); const rejected = assert.rejects(init, /character load failed/);
  F.state.character.reject(new Error('character load failed')); await rejected; F.scene.dispose();
  F.state.room.resolve(group => group.add(room.group)); await settle(); room.assertReleased(); assert.equal(F.state.frames.size, 0);
});
test('unmount while piano material is pending releases late piano resources', async () => {
  const F = fixture({ waitPiano: true }); const piano = trackedAssets(F); const init = F.scene.initialize();
  F.state.character.resolve(); F.state.room.resolve(); await settle(); F.scene.dispose();
  F.state.pianoReady.resolve(group => group.add(piano.group)); await init;
  piano.assertReleased(); assert.equal(F.state.captures.length, 0); assert.equal(F.state.frames.size, 0);
});
test('piano material failure propagates and late character success is still disposed', async () => {
  const F = fixture({ waitPiano: true }); const actor = trackedAssets(F); const init = F.scene.initialize(); const rejected = assert.rejects(init, /piano material failed/);
  F.state.room.resolve(); F.state.pianoReady.reject(new Error('piano material failed')); await rejected; F.scene.dispose();
  F.state.character.resolve(group => group.add(actor.group)); await settle(); actor.assertReleased(); assert.equal(F.state.frames.size, 0);
});
test('load failure after unmount settles without starting work or double renderer disposal', async () => {
  const F = fixture(); const init = F.scene.initialize(); const rejected = assert.rejects(init, /late error/); F.scene.dispose();
  F.state.character.reject(new Error('late error')); F.state.room.resolve(); await rejected; await settle();
  assert.equal(F.scene.renderer.disposed, 1); assert.equal(F.state.captures.length, 0); assert.equal(F.state.frames.size, 0);
});
test('PMREM failure during restoration releases its generator, restores visibility and resumes safely', async () => {
  const F = fixture(); await F.ready(); F.lose(); F.state.pmremFailure = true; F.restore();
  assert.equal(F.state.warnings.length, 1); assert.equal(F.state.pmrems.at(-1).disposed, 1);
  for (const object of [F.scene.piano.group, F.scene.pianist.group, F.scene.stage.reflector, F.scene.stage.dust]) assert.equal(object.visible, true);
  assert.equal(F.scene.scene.environment, null); assert.equal(F.state.frames.size, 1); assert.equal(F.scene.composer.renderCount, 2); F.scene.dispose();
});
test('dispose releases shared textures, bitmap, geometry, material, instances, skeleton and shadows once', async () => {
  const F = fixture(); await F.ready(); const resources = trackedAssets(F); F.scene.scene.add(resources.group); const env = F.scene.env;
  const targets = [F.scene.composer.renderTarget1, F.scene.composer.renderTarget2]; const targetDisposals = [0, 0]; targets.forEach((target, i) => target.addEventListener('dispose', () => targetDisposals[i]++));
  F.scene.dispose(); F.scene.dispose(); resources.assertReleased();
  assert.deepEqual(targetDisposals, [1, 1]); assert.equal(env.disposals, 1); assert.equal(F.scene.renderer.disposed, 1); assert.equal(F.scene.composer.disposed, 1);
  for (const pass of F.scene.composer.passes) assert.equal(pass.disposed, 1);
  assert.equal(F.state.observer.disconnected, 1); assert.equal(F.scene.renderer.domElement.removed, 1); assert.equal(F.state.frames.size, 0);
  assert.equal(F.scene.renderer.domElement.listeners.get('webglcontextlost').size, 0); assert.equal(F.scene.renderer.domElement.listeners.get('webglcontextrestored').size, 0);
  F.restore(); assert.equal(F.state.frames.size, 0); assert.equal(F.state.captures.length, 1);
});
test('initial PMREM failure rejects initialization and remains cleanly disposable by the owner', async () => {
  const F = fixture(); F.state.pmremFailure = true; const init = F.scene.initialize(); const rejected = assert.rejects(init, /injected PMREM failure/);
  F.state.character.resolve(); F.state.room.resolve(); await rejected; assert.equal(F.state.pmrems[0].disposed, 1); F.scene.dispose(); assert.equal(F.state.frames.size, 0); assert.equal(F.scene.renderer.disposed, 1);
});
test('environment capture uses the same section-transition energy as the rendered frame', async () => {
  const F = fixture({ time: 10.3 });
  try { await F.ready(); const captured = F.state.captures[0].stageUpdate[1]; const rendered = F.state.stage.updates.at(-1)[1]; assert.ok(Math.abs(captured - rendered) < 1e-9, `capture energy ${captured} differs from rendered energy ${rendered}`); }
  finally { F.scene.dispose(); }
}, 'consistency');

const results = [];
for (const check of checks) {
  const started = performance.now();
  let timer;
  try {
    await Promise.race([check.fn(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('check did not settle within 5 seconds')), 5000); })]);
    results.push({ name: check.name, category: check.category, status: 'pass', durationMs: +(performance.now() - started).toFixed(2) });
  }
  catch (error) { results.push({ name: check.name, category: check.category, status: 'fail', durationMs: +(performance.now() - started).toFixed(2), error: error.message, stack: error.stack }); }
  finally { clearTimeout(timer); }
}
const report = {
  generatedAt: new Date().toISOString(), project, sourceHashes,
  packages: { three: JSON.parse(fs.readFileSync(path.join(project, 'node_modules/three/package.json'), 'utf8')).version, typescript: ts.version },
  method: 'Production scene.ts, math.ts and render-settings.ts transpiled unchanged into a VM. Actual Three object tree, disposal events, textures, render targets, EffectComposer sizing/order/swaps/disposal and pass constructors/settings. Controlled loaders, RAF, context events, canvas, PMREM and per-pass GPU draw replacement. React lifecycle owner disposal is explicitly simulated, not mounted.',
  limitations: ['No real browser, WebGL allocation, shader compilation, audio device, raster output or actual network load was exercised.', 'The mocked room can attach resources upon readiness; actual Stage attaches its mesh tree synchronously and its images resolve asynchronously.', 'Resource close/dispose counts are checked per traversal; previously disposed resources can be traversed again by late task finalizers.'],
  summary: { passed: results.filter(r => r.status === 'pass').length, failed: results.filter(r => r.status === 'fail').length, total: results.length },
  results,
};
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report.summary, sourceHashes, output, failures: results.filter(r => r.status === 'fail').map(({ name, error }) => ({ name, error })) }, null, 2));
if (report.summary.failed) process.exitCode = 1;
