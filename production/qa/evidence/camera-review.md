# Daybreak — automatic camera review, round 2

Reviewed all eleven exported automatic camera samples, rendered with the supplied read-only `render-frame.py` at **960 px width / 16 Cycles samples**, plus `hands-round5.png` at its supplied resolution. All eleven renders completed successfully. No Site files were changed.

Contact sheet: `/workspace/scratch/daybreak-offline/shot-review/contact-sheet.png`

Individual reviewed images: `/workspace/scratch/daybreak-offline/shot-review/section-00.png` through `section-10.png`.

These are offline geometry/camera/pose observations with approximate lighting. They do not establish browser material parity, responsive UI cropping, animation smoothness, or the safety of every point along each camera path. These frames use automatic cameras near the beginning of each sampled section; they are not the earlier midpoint overrides.

## Main findings

- **No catastrophic obstruction in the eleven samples:** faces remain clear of the raised lid; every sampled medium/wide retains a recognizable seated performer; hands and keyboard are readable in the dedicated detail view. No missing limb, entire body clipping, or camera inside a mesh is apparent.
- **Two camera compositions merit adjustment:** section 02 at 39.35 s squeezes the raised lid and front feet against opposite frame boundaries, and section 10 at 202.55 s includes a cut-off chin and a large shoulder/torso foreground in a hand-focused insert.
- **The earlier neckline hole is resolved in the new face samples.** Angular tonal bands remain on the shirt shoulders, especially sections 04, 08, and 10. They read as a mesh/normal or material-region seam under this lighting, not intentional cloth folds. Verify in the browser before changing the garment again because this converter recalculates geometry shading and approximates normal-map strength.
- **Hand pose is substantially improved**, but the near/right hand in `hands-round5.png` still has a sharp wrist bend and overlapping/crossing finger silhouettes. This is a smaller remaining pose issue, separate from the fixed palm-up appearance.

## Every sampled frame

| Section / time | Shot | Specific observation | Action |
| --- | --- | --- | --- |
| 00 / 0.95 s | First light | Piano, bench, performer and feet are fully contained. Subject is relatively small and lower-left of center; broad floor and uprights occupy much of the image. Hands remain distinguishable. | Acceptable establishing frame. No required correction. |
| 01 / 10.55 s | The first phrase | Clear side profile, torso and two hands. Bottom crops legs/bench and top/right crops the piano, which reads as an intentional medium. Lid does not block head or hands. Angular shoulder band visible. | Composition acceptable. Check shoulder shading in browser. |
| 02 / 39.35 s | Toward the horizon | Nearly full-object framing cuts the raised lid at the top while the foreground piano leg and front bench foot reach/cross the lower edge. This feels accidentally tight because most of the other boundaries fit. | Pull back approximately 10–12% along the existing camera-to-look ray, preserving angle and FOV. Current sample position `[2.197,1.052,1.120]`, look `[0,.76,-.3]`; a 12% pullback gives approximately `[2.461,1.087,1.290]`. Proposed coordinates are unrendered. |
| 03 / 58.55 s | Daybreak | Complete performer/piano with generous stage surroundings. Low angle shows less soundboard detail but silhouette remains clear. Bright floor area does not overwhelm the subject. | Acceptable wide. |
| 04 / 87.35 s | Afterglow | Face and neckline clear; the earlier triangular hole is absent. Hands sit mostly beyond the lower edge, appropriate for a face insert. Lid stays in the top-right corner without crossing the face. Angular shoulder patch and flat background horizon behind head are noticeable. | Keep camera. Confirm shoulder shading. Background horizon is a low-priority set-style issue, not a clipping failure. |
| 05 / 96.95 s | The road behind | Clear medium profile and keyboard; legs/bench crop as in section 01. Strong resemblance to section 01 composition, but separated by other coverage. No obstruction. | Acceptable. No need to force variation solely from these stills. |
| 06 / 116.15 s | One more breath | Opposite-side medium retains face and two hands. Lid reflection creates pronounced stripes but stays clear of performer. Feet and lower furniture are cropped. | Acceptable medium; verify whether browser reflections are similarly strong before adjusting lacquer/lighting. |
| 07 / 125.75 s | Daybreak · reprise | Fully contained rear three-quarter performer/piano and bench. Keyboard remains visible, performer’s back and instrument share the frame coherently. | Acceptable reprise wide. |
| 08 / 144.95 s | Before the sun | Face, torso and one hand visible; near arm leaves bottom frame. Lid edge is a right-side frame element, not a face obstruction. Neckline intact. Same shoulder tonal band and flat background horizon remain. | Camera acceptable. Garment shading check as above. |
| 09 / 164.15 s | Everything opens | Complete subject and piano; generous floor and uprights. Visually very close to section 03 at this early sample, although later camera movement may differentiate it. | Acceptable wide. Assess repetition in playback, not from this one frame alone. |
| 10 / 202.55 s | Home in the light | Individual keys and two hands visible. The left foreground is dominated by shoulder, torso and elbow; a fragment of chin is cut by the top edge. That head fragment makes the crop look incidental. Near wrist/fingers still show angular bends. | For a dedicated hands insert, move the camera closer to the keyboard in Z and slightly higher. Current `[.694,1.297,.681]`, look `[0,.756,.16]`, FOV ~43. Candidate `[.48,1.34,.44]`, look `[0,.76,.16]`, FOV 43. This is an unrendered proposal and needs one framing check. |

## Revised hand close-up

In `/workspace/scratch/daybreak-offline/hands-round5.png`:

- The backs of the hands now read as uppermost, and the far/left hand has a plausible arched resting shape. The earlier gross cup/palm-up impression is resolved.
- The near/right wrist makes a sharp downward crease around image `(440,370)` at 1280×720. The transition still feels more abrupt than the rest of the forearm.
- Two raised fingers overlap/cross in silhouette around `(580,320)`, while another curls underneath around `(607,354)`. Avoid assigning exact finger identities from this camera alone. This shape can read as mechanically splayed even if active tips satisfy their targets.
- I cannot confirm finger-key or finger-finger penetration from this single image. The hands in the fallboard are consistent with reflections, not duplicate geometry.
- Section exports with active contact records have errors rounding to 0.000 mm in the supplied metadata; section 10 has no active contact records. This is evidence for target contact at those sampled instants, not proof of all-finger naturalness or temporal continuity.

## Light and material limits

Face and key detail remain readable in all reviewed offline samples; no silhouette-only performer or obvious blown-out facial region is apparent. Black lacquer has coherent highlights. The striped lid/fallboard reflections and broad floor glow are the most visually assertive lighting features. Since the converter uses an added softbox, its own world lighting, AgX, and reconstructed materials, these observations should not be represented as browser exposure or reflection approval.

The efficient remaining visual check is one updated render/browser view for each proposed camera adjustment, plus actual playback for changing hand shapes. No evidence from these eleven frames warrants redesigning the stage or replacing the full camera plan.
