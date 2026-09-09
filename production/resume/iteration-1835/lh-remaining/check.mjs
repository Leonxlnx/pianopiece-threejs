// Verifies the frozen bounded review package; does not certify idle motion.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const delta = read('guarded-delta.json');
for (const [file, value] of [['baseline-score.json', delta.baseSha256], ['candidate-final.json', delta.candidateSha256], ['candidate-pass3.json', delta.candidateSha256], ['pianist-baseline.ts', delta.rigSourceSha256], ['pianist-baseline.mjs', delta.compiledRigSha256], ['compiled/wrist-motion.mjs', delta.arcSamplerSha256], ['pianist.glb', delta.modelSha256]]) assert.equal(sha(file), value, file);
assert.equal(delta.baseSha256, '53ce470d5e40226eb196552fe25f2eec13a33879d6011e6f53f82eeef4f8ba0e');
assert.equal(delta.candidateSha256, 'b7082785aeb9b2a69b321861d0a5d04d3760e6fe1cfa8a60b1d5eb2c10b1cf27');
assert.equal(delta.rigSourceSha256, '4ef26cd1df3d9b97f8a6e92378af4582fe2077e0cb5d6cc524cdb157891aea45');
assert.equal(sha('wrist-motion-source.ts'), '792e453eff0a959b970120a8e46f0dcaa1f78872ba87baaa1ab25293996cc256');
const baseline = read('baseline-score.json'), candidate = read('candidate-final.json'), reservation = read('reservation.json');
const noteIds = new Set(reservation.groups.flatMap(g => g.notes.map(n => n.id)));
const knotIds = new Set(reservation.groups.flatMap(g => g.knots));
const permitted = new Set(['finger', 'contactZ', 'contactLift', 'thumbOpposition']);
const rebuilt = structuredClone(baseline);
for (const change of delta.noteChanges) {
  assert(noteIds.has(change.id) && permitted.has(change.field));
  const note = rebuilt.notes.find(n => n.id === change.id);
  assert.deepEqual(note[change.field] ?? null, change.before);
  if (change.after === null) delete note[change.field]; else note[change.field] = change.after;
}
for (const change of delta.knotChanges) {
  assert(change.side === 'L' && (knotIds.has(change.index) || reservation.additionalMoveStartOnly.includes(change.index) && change.field === 'moveStart'));
  const knot = rebuilt.wristMotion.hands.find(h => h.side === change.side).knots[change.index];
  assert.deepEqual(knot[change.field] ?? null, change.before);
  if (change.after === null) delete knot[change.field]; else knot[change.field] = change.after;
}
assert.deepEqual(rebuilt, candidate, 'delta reproduces score with all outside fields exact');
assert.equal(new Set(delta.noteChanges.map(c => c.id)).size, 28);
assert.equal(new Set(delta.knotChanges.map(c => c.index)).size, 24);
assert.equal(delta.knotChanges.filter(c => c.field === 'moveStart').length, 1);
for (const id of ['p00914','p00970','p01008']) assert.deepEqual(candidate.notes.find(n => n.id === id), baseline.notes.find(n => n.id === id));
for (const index of reservation.fixedKnots) assert.deepEqual(candidate.wristMotion.hands.find(h => h.side === 'L').knots[index], baseline.wristMotion.hands.find(h => h.side === 'L').knots[index]);
const summary = read('validation-summary.json');
for (const [key, count, samples] of [['targets', 14, 1627], ['owned', 43, 4899]]) {
  const s = summary[key];
  assert.equal(s.notes, count); assert.equal(s.samples, samples); assert.equal(s.bad, 0);
  assert(s.activeCoreMm <= 3 && s.palmCoreMm <= 3 && s.maxPointMm <= .2);
  assert(s.minPadMm >= -2.5 && s.maxPadMm <= 2.5);
  assert.equal(s.maxOwn, 0); assert.equal(s.maxActiveActive, 0);
}
assert.equal(summary.totals.samples, 10297);
assert.equal(summary.totals.newHeldBad, 0);
assert.equal(summary.totals.newReleasedPalmBad, 4, 'four unresolved newly failing released-palm states remain explicit');
assert.equal(summary.totals.strictRegressions, 1469);
assert.equal(summary.crossHandIntersectionFrames, 0);
assert.equal(read('idle-gap-queue.json').rows.length, 111);
assert.equal(read('residual-queue.json').intervals.length, 478);
for (const guard of read('protected-compatibility.json')) {
  assert(guard.noteExact && guard.maxMatrixDelta <= 1e-14 && guard.maxSkinComponentDeltaMm <= 1e-10);
}
const garment = read('candidate-pass3-garment.json');
assert.equal(garment.rows.length, 42);
for (const row of garment.rows) for (const surface of row.surfaces) assert(surface.maxDepthMm <= 2 && surface.forearmCrossings === 0);
const motion = read('motion-candidate-report.json')[0].out;
assert.equal(motion.length, 12);
assert.equal(motion.reduce((n,r) => n + r.boundaries.length,0),320);
for (const row of motion) {
  assert.equal(row.maxSeekMm,0); assert.equal(row.maxSeekComponent,0);
  assert(row.maxReachFraction < .95 && row.maxWristErrorMm < .001);
}
// Verify measured evidence rather than silently raising a motion acceptance gate.
assert.equal(Math.max(...motion.map(r => r.maxTipSpeed)), 7.107534466981705);
assert.equal(Math.max(...motion.flatMap(r => r.boundaries.map(b => b.maxJointStepRad))), .0010089798411642326);
const detail = read('boundary-detail.json');
assert(Math.max(...detail.at(-1).fingers.map(f => f.maxJointStepRad)) < .00002);
const evidence = read('evidence/index.json').rows;
assert.equal(evidence.length, 30);
for (const frame of evidence) {
  assert(frame.inspected && frame.width === 1280 && frame.camera === 'oblique');
  assert.equal(sha(frame.path), frame.sha256);
  assert.equal(sha(frame.source), frame.sourceSha256);
}
for (const f of ['HANDOFF.md','GATES.md','finalize-summary.mjs']) assert(fs.existsSync(f));
if (fs.existsSync('hashes.json')) for (const [file, hash] of Object.entries(read('hashes.json').files)) assert.equal(sha(file),hash,file);
console.log('PASS: exact bounded candidate, 14 targets / 43 held notes, source guards, actual evidence. Full-hand idle geometry and fast inactive motion remain unresolved and explicitly queued.');
