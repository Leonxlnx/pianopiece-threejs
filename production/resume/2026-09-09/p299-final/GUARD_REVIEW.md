# Frozen scalar-guard candidate for parent review

Current source is `guard.mjs`; typed runtime is `guard-runtime.ts`; native-review source is `guard-native.ts`. The latter embeds the score changes solely for rendering. Parent acceptance is pending. `guard-delta.json` contains all score, wrist, idle-finger, Pinky curve, and guard changes. Merge these local changes into the parent's current integrated runtime.

The held p299 Pinky contact has **0 mm core penetration** and **0.072359 mm maximum pad gap**, versus baseline Index core6.193631 mm and pad gap1.800580 mm. Main wrist travel occurs after p296 releases at66.18, reaches its −35 mm support position at66.30195, returns after p299 releases at66.54, and completes before p301 at66.668093. The Pinky rebound curve at68.32–68.448307 uses unchanged knots bound to real p299/end66.54→p309/start68.448307.

The sole remaining comparison flag is existing **RIndex/F#5,66.964:5.299165924→5.549975209 mm (+0.250809285 mm)**. The0.25 mm flag threshold remains unchanged. There are no new per-key contact states deeper than3 mm and no new timed finger-crossing families across1,271 matched states. The pair sum falls142,556→113,757; residual pre-existing finger crossings remain.

At2 kHz, wrist speed is0.538109615 m/s and acceleration13.586423501 m/s²; Index peak25.385996→22.659912 rad/s, Ring9.885461→16.443004 rad/s, Pinky effectively0→37.511069 rad/s. Fourteen outside pose hashes match; all poses at and after67.016236 match baseline, including the later Pinky calibration. Native/harness parity is exact at1,271 poses.

The scalar cause is demonstrated in `trace-baseline.json` and `trace-candidate.json`: the old next-contact envelope is0.14897594070608658 while the refingered next-contact envelope is0. The other three envelope values are1 during the early release. Restoring that one scalar restores all Index chain points exactly over295 samples from64.184354 through65.7. This authoring value is bound to the actual new gap, with no fictional note anchor.

In the inactive **nonthumb** branch, replace the single next-envelope clamp with:

```ts
if (next) {
  let nextEnvelope = envelope(contactPose(next, start));
  if (hand.side === 'R' && fi === 1 &&
      previous?.id === 'p00285' && next.id === 'p00302' &&
      Math.abs(end - 64.184354) < 1e-7 &&
      Math.abs(start - 67.016236) < 1e-7) {
    nextEnvelope = mix(
      .14897594070608658, nextEnvelope,
      smooth((time - 65.7) / .2)
    );
  }
  weight = Math.min(weight, nextEnvelope);
}
```

Merge the `guard-extension.ts` helper and its plannedPose/update calls with the existing parent's helpers. The Index receives10° MCP lift during its new idle interval from65.9; the released Ring receives15° with100 ms entry/arrival ramps. All held fingers are skipped. The earlier failed5° release bump is absent.

Score edits are p296 duration ending66.18, p299 finger5/contactZ.270/contactLift.003/duration ending66.54. Preserve written durations. Both earlier physical releases lie under the unchanged0.73 sustain pedal. Exact note-field deltas and hashes are in `guard-delta.json` and `guard-handoff.json`; no audio file was changed here.

Final frozen native report: `/workspace/scratch/2e8cc8e77f98/render-recovery/reviews/2f9060f11e9a7b8f/report-960.json`. Viewed frames:64.214000,66.340000,66.964000. The earlier release is visually restored, the supported Pinky is plausible, and the later Index contact retains the disclosed same-key excursion. Earlier source files and reports remain clearly marked as rejected predecessors.
