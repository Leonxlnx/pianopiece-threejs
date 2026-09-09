# Primary held-pose visual comparison

Sixteen final 960×540 native frames compare the accepted b156 score with frozen primary-v1 score 9db662f1. The original f040 rig is identical in every frame. No compact-thumb or arm-support patch is present. Every matched pair differs only in public/assets/score.json; the camera, all other source and dependencies match.

All sixteen images passed GL_NO_ERROR and image SHA verification. The expected hand, MIDI and assigned finger are active at each held midpoint. The largest reported target-point error is 9.950493055703035e-8 metres. That solver point error does not measure skin clearance.

| Target | Held midpoint (s) | Assignment, baseline → primary | Visual finding |
| --- | ---: | --- | --- |
| p00163 | 38.8525795 | L4 → L3, MIDI 59 | The lateral folded-finger ridge across the hand is replaced by a forward curl. The oblique view shows a more readable active-finger path toward the key; the curl is still pronounced. |
| p00957 | 195.137839 | L4 → L3, MIDI 57 | Clearest visible improvement: the long digit folded diagonally across the hand disappears. The primary middle-finger curl and neighboring digit separation read more coherently in both views. |
| p00741 | 162.313344 | R5 → R4, MIDI 74 | The active ring-finger curl is now distinguishable, with the little finger separately visible. The wrist/hand shifts toward the player; no gross new crossing is apparent from these two angles. |
| p00914 | 188.70254 | L2 → L2, MIDI 61 | The opening around the under-hand contact is less pinched in the oblique view, but this remains the least convincing silhouette: the contact region is crowded and idle digits stay strongly splayed. It warrants continued visual review. |

These are visual observations of the rendered mesh at four isolated times. They do not certify transition continuity, hidden triangle clearance, or final combined arm/idle-thumb behavior. Existing f040 wrist shape and idle digit behavior remain visible. Root's independent visual acceptance is still required.

Each comparison sheet places baseline on the left, primary on the right, top view above and oblique view below. Its four source panels retain the native 960×540 pixels; only labels were added around them.

- p00163-comparison.png
- p00957-comparison.png
- p00741-comparison.png
- p00914-comparison.png

All sixteen original-size copies have descriptive names under frames/, for example frames/p00163-primary-oblique.png. delivery-index.json records their exact paths and SHA values; image-index.json and the referenced reports retain the original hashed render paths. manifest.json contains the full accepted-rig and score hashes, exact note data, and final camera plans. commands.json and prepare-and-render.py reproduce the run.

The initial oblique attempt was rejected because the camera intersected the torso. Those frames are excluded from delivery-index.json and the final comparison sheets. The final camera moves closer to the keyboard side and above the torso. The top view was also reframed for more finger margin. No scene geometry was hidden to obtain the review views.

Recheck:

```bash
python /workspace/scratch/2e8cc8e77f98/render-recovery/primary-review/check-primary.py
```

Render scope: still frames only. No Site operations, checkout edits, or full-film render.
