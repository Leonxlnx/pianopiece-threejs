# Pianist hand and body rig research

Research-only implementation notes, 2026-09-05. No Site files edited. Recommendations below are animation engineering inferences, not a clinical model or piano technique instruction.

## Pass 1 — Gather primary evidence

- Goebl & Palmer (2013), 12 skilled pianists, rapid five-finger melody: MCP motion contributed most to fingertip descent; PIP/DIP often extended slightly. Wrist movement was smaller than finger movement. Reported mean wrist posture was 10.81 degrees of extension, with average within-cycle wrist angle range 12.63 degrees and wrist rotation range 9.39 degrees. These are task observations, not universal limits. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0050901
- Furuya, Flanders & Soechting (2011), expert piano excerpts: thumb and non-striking finger patterns depended on sequence context. Spillover into adjacent fingers was small regardless of which finger struck. https://journals.physiology.org/doi/abs/10.1152/jn.00378.2011
- Furuya et al. (2011), thumb/little-finger alternation: professionals used more forearm pronation/supination, less digit flexion velocity and less finger muscle activation than amateurs. This applies to the studied alternation, not every melody note. https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2011.00050/full
- Chang & Pollard (2008), measured thumb CMC modeling: flexion/extension and abduction/adduction dominate, with additional axial rotation. Anatomical axes are skew, not the axes of a generic finger hinge. https://publications.ri.cmu.edu/storage/publications/pub_files/pub4/chang_lillian_y_2008_2/chang_lillian_y_2008_2.pdf
- Turner et al. (2022), three-pianist case comparison: trunk-hand preparation differed by section. Some sections began with the hand, others with the trunk. Reach and body proportions mattered. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.838554/full
- Massie-Laberge et al. (2019), 10 pianists/three excerpts: expressive head motion related to musical context; recurring movement patterns were not universal across excerpts. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.02725/full
- Delhaye et al. (2021), fingertip contact imaging: contact skin undergoes local deformation and partial slip. Surface contact cannot be inferred solely from the skeleton endpoint. https://elifesciences.org/articles/64679

## Pass 2 — Synthesize into a rig

1. Preserve bone lengths. Place joint pivots inside the modeled knuckles. Build four finger chains with MCP flexion plus restrained spread, then PIP and DIP flexion hinges. Give each digit a distinct rest curvature, root position, and length; do not drive the chain by scaling cylinders toward a target.
2. Give the thumb its own CMC frame, metacarpal, MCP, IP, and pad. Opposition needs combined base movement and axial rotation. Its bend plane and contact patch should differ from the other fingers.
3. Build pose priors for rest, prepare, contact, hold, release, and transit. A finger attack starts mostly at MCP, with small distal-joint compensation. Use soft coupling as a prior rather than a mandatory DIP=PIP ratio.
4. Contact target is the pad surface on the animated key, not the bone tip at the undeformed key height. Use the actual white/black key geometry and travel. Maintain finite fingertip volume above the surface; prevent finger crossings and key penetration.
5. Schedule note events from the same clock as audio/key animation. Prepare the hand shape using upcoming notes, settle to contact, follow the depressed key during hold, and release before lateral transit.
6. Move the palm toward a smoothed upcoming key centroid, and allow arm motion to absorb reach. Add forearm roll for alternating spans and modest wrist accommodation. Keep shoulder/elbow solutions continuous.
7. Seat contact supplies the body base. Phrase-scale torso lean, selective beat accents, and reach-driven lateral movement should use separate smooth signals. Head response can be smaller and delayed, while shoulder positions inherit torso motion and arm IK repairs hand placement.

## Pass 3 — Challenge assumptions

- Contact-correct can still be anatomically wrong: a solver can hit every key with stretched bones, reversed knuckles, collapsed palms, or bad skinning. Track bone lengths, local angles, fingertip/key error, and visible silhouette separately.
- A fixed curl formula is not a biological law. Slight distal extension during a stroke means reducing existing flexion; it does not require the joint to reverse-bend past straight.
- Strong ring-finger coupling is not automatically more human. Expert piano data showed very small spillover; keep any idle-finger response subtle and context dependent.
- Do not enforce an always-trunk-first phase cascade. The measured initiation order changed with the task.
- Do not transfer full opposition or range-of-motion measurements into ordinary keypresses. Most playing occupies a limited portion of the available workspace.
- More global sway does not establish realism. Use phrase events and changes in reach; limit repetitive whole-body bouncing.
- Kinematic evidence does not validate a muscle simulation. Accurate joint frames, hand volume, tendon-like dorsal continuity, and skin deformation are the practical visual priorities.

## Pass 4 — Minimal implementation guide

For each frame: (a) update musical phase and upcoming-note targets; (b) update pelvis/torso/shoulder pose; (c) solve arm/wrist; (d) solve constrained fingers; (e) deform the mesh; (f) verify pad/key contact in world coordinates. Parent changes after the contact solve cause fingertip drift.

An IK objective can combine weighted pad position error, palm workspace error, rest-pose distance, temporal acceleration, joint-limit penalties, and collision penalties. Contact error dominates during held notes; rest-pose and smoothness weights dominate during transit. Start from the previous solution and preserve the elbow/finger bend branch.

Keep animation amplitudes and phase delays labeled as tunable artistic parameters. The numerical wrist observations above are useful scale checks, not anatomical constraints. Confirm at slow playback and multiple camera angles, including a side view where key penetration and joint reversal are easy to see.
