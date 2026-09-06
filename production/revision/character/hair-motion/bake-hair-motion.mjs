import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url));
const project = process.argv[2] ?? '/workspace/sites/daybreak-piano-film';
const requireProject = createRequire(path.join(project, 'package.json'));
const ts = requireProject('typescript');
const THREE = await import(pathToFileURL(requireProject.resolve('three')));
const { GLTFLoader } = await import(pathToFileURL(requireProject.resolve('three/addons/loaders/GLTFLoader.js')));
fs.mkdirSync(path.join(out, 'compiled'), { recursive: true });
const sourceHashes = {};
const compileNames = ['math', 'piano', 'wrist-motion', 'pianist', 'ponytail-motion', 'hair-motion-data'].filter(name => fs.existsSync(path.join(project, 'app/performance', name + '.ts')));
for (const name of compileNames) {
  const text = fs.readFileSync(path.join(project, 'app/performance', name + '.ts'), 'utf8');
  sourceHashes[name] = crypto.createHash('sha256').update(text).digest('hex');
  let compiled = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  compiled = compiled.replace(/from (['"])([^'"]+)\1/g, (_, quote, specifier) => {
    const url = specifier.startsWith('.') ? pathToFileURL(path.join(out, 'compiled', specifier + '.mjs')).href : pathToFileURL(requireProject.resolve(specifier)).href;
    return `from ${JSON.stringify(url)}`;
  });
  fs.writeFileSync(path.join(out, 'compiled', name + '.mjs'), compiled);
}
const { Pianist } = await import(pathToFileURL(path.join(out, 'compiled/pianist.mjs')));
const { GrandPiano } = await import(pathToFileURL(path.join(out, 'compiled/piano.mjs')));
const { scoreEnergy, pedalPosition } = await import(pathToFileURL(path.join(out, 'compiled/math.mjs')));
globalThis.self = globalThis;
const canvasContext = new Proxy({ canvas: null }, { get: (target, key) => key in target ? target[key] : () => {} });
globalThis.document = { createElement: () => ({ width: 512, height: 512, getContext: () => canvasContext }) };
globalThis.window = { devicePixelRatio: 1 };
const bytes = fs.readFileSync(path.join(project, 'public/assets/pianist.glb'));
const scoreBytes = fs.readFileSync(path.join(project, 'public/assets/score.json'));
const score = JSON.parse(scoreBytes);
const loader = new GLTFLoader();
loader.register(() => ({ name: 'geometry-only-inspection', loadTexture: () => Promise.resolve(new THREE.Texture()) }));
const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const scene = new THREE.Scene(), piano = new GrandPiano(), pianist = new Pianist();
scene.add(piano.group, pianist.group); await pianist.load(score, gltf.scene);
const root = pianist.bones.get('PonytailRoot'), joints = ['Ponytail1', 'Ponytail2'].map(name => pianist.bones.get(name));
if (!root || joints.some(bone => !bone)) throw Error('Dedicated ponytail chain is required');
const rests = joints.map(bone => pianist.rest.get(bone.name).clone());
const rootRest = root.quaternion.clone();
const hz = 120, dt = 1 / hz, count = Math.ceil(score.duration * hz) + 1;
const trajectory = [];
for (let i = 0; i < count; i++) {
  const time = Math.min(score.duration, i * dt);
  pianist.posture(time, scoreEnergy(time, score.sections), pedalPosition(time, score.pedals));
  trajectory.push({ p: root.getWorldPosition(new THREE.Vector3()), q: root.getWorldQuaternion(new THREE.Quaternion()) });
  if (i % 6000 === 0) console.log(`sampled ${time.toFixed(1)}s of actual head/root motion`);
}
const down = new THREE.Vector3(0, -1, 0), g0 = down.clone().applyQuaternion(trajectory[0].q.clone().invert());
const baseline = [Math.atan2(g0.z, g0.y), -Math.atan2(g0.x, g0.y)];
const angularVelocity = trajectory.map((pose, i) => {
  const previous = trajectory[Math.max(0, i - 1)];
  const delta = previous.q.clone().invert().multiply(pose.q).normalize();
  if (delta.w < 0) delta.set(-delta.x, -delta.y, -delta.z, -delta.w);
  const sine = Math.hypot(delta.x, delta.y, delta.z), angle = 2 * Math.atan2(sine, delta.w);
  return new THREE.Vector3(delta.x, delta.y, delta.z).multiplyScalar(sine > 1e-10 ? angle / sine / dt : 0).applyQuaternion(previous.q);
});
angularVelocity[0].copy(angularVelocity[1]);
const response = [], value = [0, 0, 0, 0], velocity = [0, 0, 0, 0];
for (let i = 0; i < count; i++) {
  const pose = trajectory[i], inverse = pose.q.clone().invert(), previous = trajectory[Math.max(0, i - 1)], next = trajectory[Math.min(count - 1, i + 1)];
  const acceleration = next.p.clone().addScaledVector(pose.p, -2).add(previous.p).multiplyScalar(i > 0 && i < count - 1 ? 1 / dt ** 2 : 0).applyQuaternion(inverse);
  const alpha = angularVelocity[Math.min(count - 1, i + 1)].clone().sub(angularVelocity[Math.max(0, i - 1)]).multiplyScalar(i > 0 && i < count - 1 ? 1 / (2 * dt) : 0).applyQuaternion(inverse);
  const gravity = down.clone().applyQuaternion(inverse), tilt = [Math.atan2(gravity.z, gravity.y) - baseline[0], -Math.atan2(gravity.x, gravity.y) - baseline[1]];
  const drive = [-.5 * alpha.x + .7 * acceleration.z / .25, -.5 * alpha.z - .7 * acceleration.x / .25];
  for (let axis = 0; axis < 2; axis++) {
    const w = 12, damp = .84;
    velocity[axis] += (drive[axis] + w * w * (.18 * tilt[axis] - value[axis]) - 2 * damp * w * velocity[axis]) * dt;
    value[axis] += velocity[axis] * dt;
    const k = axis + 2, w2 = 15;
    velocity[k] += (w2 * w2 * (.62 * value[axis] - value[k]) - 2 * .82 * w2 * velocity[k]) * dt;
    value[k] += velocity[k] * dt;
  }
  // Smooth amplitude limits: this is a restrained pose response, not a hair solver.
  response.push(value.map((v, j) => (j < 2 ? .018 : .014) * Math.tanh(v / (j < 2 ? .018 : .014))));
}
const rate = 30, quantum = .00001, samples = [];
for (let i = 0; i < count; i += hz / rate) samples.push(...response[i].map(v => Math.round(v / quantum)));
samples.push(...response.at(-1).map(v => Math.round(v / quantum)));
fs.writeFileSync(path.join(out, 'hair-motion-data.ts'), `// Baked from actual Head/PonytailRoot trajectory. Regenerate after posture/score edits.\nexport const HAIR_RATE=${rate};\nexport const HAIR_QUANTUM=${quantum};\nexport const HAIR_DURATION=${score.duration};\nexport const HAIR_SAMPLES=new Int16Array(${JSON.stringify(samples)});\n`);
function sample(time) {
  const f = Math.max(0, Math.min(samples.length / 4 - 1, time * rate)), a = Math.floor(f), b = Math.min(samples.length / 4 - 1, a + 1), u = f - a;
  return [0, 1, 2, 3].map(k => (samples[a * 4 + k] * (1 - u) + samples[b * 4 + k] * u) * quantum);
}
function apply(time) {
  const angles = sample(time);
  joints.forEach((bone, j) => bone.quaternion.copy(rests[j]).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(angles[j * 2], 0, angles[j * 2 + 1], 'XYZ'))));
  root.updateWorldMatrix(false, true);
}
let hair;
gltf.scene.traverse(mesh => { if (mesh.isSkinnedMesh && gltf.parser.associations.get(mesh)?.meshes === 5) hair = mesh; });
const probe = new THREE.Vector3(), hairWeights = hair.geometry.attributes.skinWeight, hairJoints = hair.geometry.attributes.skinIndex;
const movingIds = joints.map(bone => hair.skeleton.bones.indexOf(bone));
const pinned = [];
for (let i = 0; i < hair.geometry.attributes.position.count; i++) if (![0, 1, 2, 3].some(k => movingIds.includes(hairJoints.array[i * 4 + k]) && hairWeights.array[i * 4 + k] > 1e-8)) pinned.push(i);
const magnitude = samples.map((_, i) => i % 4 ? null : { time: i / 4 / rate, score: Math.abs(samples[i]) + Math.abs(samples[i + 1]) + Math.abs(samples[i + 2]) + Math.abs(samples[i + 3]) }).filter(Boolean).sort((a, b) => b.score - a.score);
const strongest = magnitude[0].time, times = [...new Set([strongest, 186, 84.3])];
const pairReport = [];
function update(time) {
  joints.forEach((bone, i) => bone.quaternion.copy(rests[i]));
  const pedal = pedalPosition(time, score.pedals), energy = scoreEnergy(time, score.sections);
  piano.update(time, score.notes, pedal); pianist.update(time, score, piano, pedal, energy);
  // Keep the comparison baseline neutral if this candidate is already integrated.
  joints.forEach((bone, i) => bone.quaternion.copy(rests[i])); scene.updateMatrixWorld(true);
  scene.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
}
function exportPose() {
  const meshes = {};
  gltf.scene.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return; const association = gltf.parser.associations.get(mesh); if (!association) return;
    const g = mesh.geometry, positions = [], normals = [], v = new THREE.Vector3(), normal = new THREE.Vector3(), base = new THREE.Vector3(), delta = new THREE.Vector3(), blend = new THREE.Matrix4(), bone = new THREE.Matrix4(), nm = new THREE.Matrix3(), worldNormal = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    for (let i = 0; i < g.attributes.position.count; i++) {
      mesh.getVertexPosition(i, v).applyMatrix4(mesh.matrixWorld); positions.push(...v.toArray());
      normal.fromBufferAttribute(g.attributes.normal, i); base.copy(normal);
      for (let k = 0; k < (g.morphAttributes.normal?.length ?? 0); k++) { const w = mesh.morphTargetInfluences?.[k] ?? 0; if (!w) continue; delta.fromBufferAttribute(g.morphAttributes.normal[k], i); if (!g.morphTargetsRelative) delta.sub(base); normal.addScaledVector(delta, w); }
      blend.elements.fill(0);
      for (let k = 0; k < 4; k++) { const w = g.attributes.skinWeight.array[i * 4 + k]; if (!w) continue; bone.fromArray(mesh.skeleton.boneMatrices, g.attributes.skinIndex.array[i * 4 + k] * 16); for (let j = 0; j < 16; j++) blend.elements[j] += bone.elements[j] * w; }
      blend.multiply(mesh.bindMatrix).premultiply(mesh.bindMatrixInverse); nm.setFromMatrix4(blend); normal.applyMatrix3(nm).applyMatrix3(worldNormal).normalize(); normals.push(...normal.toArray());
    }
    meshes[`${association.meshes}:${association.primitives ?? 0}`] = { name: mesh.name, position: positions, normal: normals, indices: g.index ? Array.from(g.index.array) : null };
  });
  return { meshes };
}
for (const [index, time] of times.entries()) {
  update(time); const before = exportPose();
  const rootBefore = root.matrixWorld.clone(), bodyBefore = before.meshes['0:0'].position;
  apply(time); scene.updateMatrixWorld(true); hair.skeleton.update(); const after = exportPose();
  const a = before.meshes['5:0'].position, b = after.meshes['5:0'].position, displacement = [];
  for (let i = 0; i < a.length; i += 3) displacement.push(Math.hypot(a[i] - b[i], a[i + 1] - b[i + 1], a[i + 2] - b[i + 2]));
  const nonHairChanged = Object.keys(before.meshes).filter(key => key !== '5:0' && JSON.stringify(before.meshes[key]) !== JSON.stringify(after.meshes[key]));
  const record = { index, time, anglesDegrees: sample(time).map(v => v * 180 / Math.PI), maxDisplacementMM: Math.max(...displacement) * 1000, rmsDisplacementMM: Math.sqrt(displacement.reduce((sum, v) => sum + v * v, 0) / displacement.length) * 1000, pinnedVertices: pinned.length, pinnedMaxMM: Math.max(...pinned.map(i => displacement[i])) * 1000, rootMatrixUnchanged: rootBefore.equals(root.matrixWorld), rootQuaternionUnchanged: root.quaternion.equals(rootRest), nonHairChanged };
  if (nonHairChanged.length || !record.rootMatrixUnchanged || record.pinnedMaxMM > 1e-5) throw Error('Hair isolation check failed: ' + JSON.stringify(record));
  pairReport.push(record);
  fs.writeFileSync(path.join(out, `pair-${index}-before.json`), JSON.stringify({ time, ...before }));
  fs.writeFileSync(path.join(out, `pair-${index}-after.json`), JSON.stringify({ time, ...after }));
}
const report = { sourceHashes, glbSha256: crypto.createHash('sha256').update(bytes).digest('hex'), scoreSha256: crypto.createHash('sha256').update(scoreBytes).digest('hex'), trajectoryRate: hz, tableRate: rate, duration: score.duration, tableBytes: fs.statSync(path.join(out, 'hair-motion-data.ts')).size, maxJointDegrees: [0, 1, 2, 3].map(k => Math.max(...response.map(v => Math.abs(v[k]))) * 180 / Math.PI), strongest, pairs: pairReport };
fs.writeFileSync(path.join(out, 'candidate-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
