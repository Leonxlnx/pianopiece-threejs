// Filesystem-only augmentation of summarize.mjs; no rig/dependency loading.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const summary = read('validation-summary.json');
const base = read('baseline-score-contexts-aligned.json');
const candidate = read('candidate-pass3-contexts-aligned.json');
const hard = r => r.activeCore > 3 || r.palmCore > 3 || r.ownPairs > 0 || r.activePairs > 0 || r.point > .2 || r.contacts.some(c => c.gap === null || Math.abs(c.gap) > 2.5);
summary.newAnchorFailures = [];
summary.crossHandIntersectionFrames = 0;
for (const [index, context] of candidate.out.entries()) {
  const previous = base.out[index];
  assert.equal(context.name, previous.name);
  const byTime = new Map(previous.rows.map(r => [r.time.toFixed(7), r]));
  const stats = summary.contexts.find(c => c.name === context.name);
  stats.newHeldBad = 0;
  stats.newReleasedPalmBad = 0;
  for (const row of context.rows) {
    const old = byTime.get(row.time.toFixed(7));
    assert(old);
    if (hard(row) && !hard(old)) {
      if (row.active.length) stats.newHeldBad++;
      else stats.newReleasedPalmBad++;
      summary.newAnchorFailures.push({context: context.name, time: row.time, active: row.active, palmCoreMm: row.palmCore, activeCoreMm: row.activeCore});
    }
    if (row.crossings.some(p => p.a[0] !== p.b[0])) summary.crossHandIntersectionFrames++;
  }
  assert.equal(stats.newActiveBad, stats.newHeldBad + stats.newReleasedPalmBad);
}
const fields = ['samples', 'baselineActiveBad', 'candidateActiveBad', 'newActiveBad', 'newHeldBad', 'newReleasedPalmBad', 'baselineAllBad', 'candidateAllBad', 'strictRegressions', 'newPairIdentityFrames'];
summary.totals = Object.fromEntries(fields.map(k => [k, summary.contexts.reduce((n, c) => n + c[k], 0)]));
fs.writeFileSync('validation-summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({totals: summary.totals, newAnchorFailures: summary.newAnchorFailures, crossHandIntersectionFrames: summary.crossHandIntersectionFrames}, null, 2));
