# Two-pose wrist-yaw feasibility checkpoint

The coupled poses visibly reduce the left wrist kink while preserving sampled whole-hand geometry. They are seeds for finite held-passage validation, not accepted global or complete-motion changes.

Actual wrist→MiddleMCP forward and IndexMCP→PinkyMCP transverse define the palm frame. Baseline lateral deviation at 105.7149985/187.4408685 is 38.8866°/57.8594°. Yaw-only −10° retains sampled geometry but leaves 29.5068°/48.3875°; −20° and −30° produce finger crossings or target failure. These are rejected as standalone corrections.

A finite coupled translation/yaw/contact fit finds −30° with [−17.409,+8,−15.009] mm at p00514, and −40° with [−25,+3,−30] mm at p00905. Lateral deviation becomes 5.0197°/11.5278°, key core 0/2.1923 mm, terminal pad +1.8314/−2.1923 mm, exact crossings zero, point error <0.00008 mm. All events and fingering preserved; p00514 held71 lift/opposition retained. p00906 is right hand and untouched. Full parameter/metric record: coupled-summary.json.

Ten matching actual top images were inspected. Coupled images show materially straighter wrist silhouettes; −20/−30 yaw-only images confirm misplaced/bunched digits. Exact render/PNG hashes in render-manifest.json. No complete held interval, transition, or garment clearance claim is made at this checkpoint. Parent authorized subsequent two-passage work atop combined-review/candidate-v1.json.
