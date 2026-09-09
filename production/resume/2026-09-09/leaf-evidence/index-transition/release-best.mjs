import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, smooth, mix, v3, lowerBound } from '/workspace/sites/daybreak-piano-film/production/qa/compiled/math.mjs';
import { keyX, isBlack, KEY_TOP, keySurfaceY } from '/workspace/sites/daybreak-piano-film/production/qa/compiled/piano.mjs';
import { wristMotionSampler } from '/workspace/sites/daybreak-piano-film/production/qa/compiled/wrist-motion.mjs';
import { ponytailMotion } from '/workspace/sites/daybreak-piano-film/production/qa/compiled/ponytail-motion.mjs';
const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const TIP_LENGTH = [.027, .0243, .023, .0244, .0188];
const PALM_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(v3(-1, 0, 0), v3(0, 0, -1), v3(0, -1, 0)));
function wp(b) { return b.getWorldPosition(new THREE.Vector3()); }
function setWorldQ(b, q) { const parent = b.parent.getWorldQuaternion(new THREE.Quaternion()); b.quaternion.copy(parent.invert().multiply(q)); b.updateWorldMatrix(false, true); }
function aim(b, child, target) { const origin = wp(b), dir = wp(child).sub(origin).normalize(); const desired = target.clone().sub(origin).normalize(); const q = b.getWorldQuaternion(new THREE.Quaternion()); setWorldQ(b, new THREE.Quaternion().setFromUnitVectors(dir, desired).multiply(q)); }
function joint(a, b, l1, l2, pole) {
    const ab = b.clone().sub(a), d = clamp(ab.length(), .0001, l1 + l2 - .00001);
    ab.normalize();
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(.0000001, l1 * l1 - along * along));
    const normal = pole.clone().sub(a);
    normal.addScaledVector(ab, -normal.dot(ab)).normalize();
    return a.clone().addScaledVector(ab, along).addScaledVector(normal, h);
}
function concertShoe(upperMaterial) {
    // A shaped toe box, vamp, instep and heel counter above a curved welt sole.
    // The local negative z axis points toward the pedal; the heel stays planted.
    const sections = [[-.145, .002, .005], [-.138, .023, .022], [-.119, .040, .034], [-.080, .047, .043], [-.030, .044, .054], [.016, .039, .075], [.058, .035, .100], [.100, .033, .096], [.126, .029, .077], [.137, .010, .039], [.139, .001, .005]];
    const radial = 24, vertices = [], indices = [];
    for (let i = 0; i < sections.length; i++)
        for (let j = 0; j <= radial; j++) {
            const [z, w, h] = sections[i], a = j / radial * Math.PI;
            vertices.push(Math.cos(a) * w, -.029 + Math.pow(Math.sin(a), .72) * h, z);
            if (i && j) {
                const k = i * (radial + 1) + j;
                indices.push(k, k - 1, k - radial - 1, k - 1, k - radial - 2, k - radial - 1);
            }
        }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const shoe = new THREE.Mesh(geo, upperMaterial);
    shoe.castShadow = true;
    shoe.receiveShadow = true;
    const contour = [...sections.map(([z, w]) => new THREE.Vector2(w + .002, z)), ...sections.slice().reverse().map(([z, w]) => new THREE.Vector2(-w - .002, z))];
    const shape = new THREE.Shape();
    shape.moveTo(contour[0].x, contour[0].y);
    shape.splineThru(contour.slice(1));
    shape.closePath();
    const soleGeo = new THREE.ExtrudeGeometry(shape, { depth: .007, steps: 1, bevelEnabled: true, bevelSize: .001, bevelThickness: .001, bevelSegments: 2, curveSegments: 4 });
    soleGeo.rotateX(Math.PI / 2);
    soleGeo.translate(0, -.029, 0);
    const soleMaterial = new THREE.MeshStandardMaterial({ color: 0x171719, roughness: .73 });
    const sole = new THREE.Mesh(soleGeo, soleMaterial);
    sole.castShadow = true;
    shoe.add(sole);
    const weltPath = new THREE.CatmullRomCurve3(contour.map(p => v3(p.x, -.027, p.y)), true, 'centripetal');
    const welt = new THREE.Mesh(new THREE.TubeGeometry(weltPath, 100, .00105, 5, true), new THREE.MeshStandardMaterial({ color: 0x302b26, roughness: .65 }));
    shoe.add(welt);
    const seamPoints = Array.from({ length: 18 }, (_, i) => { const a = .14 + (Math.PI - .28) * i / 17; return v3(Math.cos(a) * .0425, -.028 + Math.pow(Math.sin(a), .72) * .058, -.018); });
    const seam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seamPoints), 30, .00075, 5, false), soleMaterial);
    shoe.add(seam);
    return shoe;
}
class OriginalPianist {
    torsoEnvelopeZ = 0;
    openingPalmFrame = 0;
    chordPalmFrame = 0;
    score;
    wristMotion;
    hairMotion;
    group = new THREE.Group();
    model;
    bones = new Map();
    rest = new Map();
    hands = [];
    contacts = [];
    head = v3(0, 1.28, .64);
    ready = false;
    poseCache = new Map();
    blinkMeshes = [];
    shoes = new Map();
    async load(score, preparedModel) {
        this.score = score;
        this.model = preparedModel ?? (await new GLTFLoader().loadAsync('/assets/pianist.glb')).scene;
        this.group.add(this.model);
        this.model.rotation.y = Math.PI;
        this.model.position.set(0, -.344, .75);
        this.model.traverse(o => {
            if (o.isBone) {
                const b = o;
                this.bones.set(b.name, b);
                this.rest.set(b.name, b.quaternion.clone());
            }
            if (o.isMesh) {
                const m = o;
                // Footwear replaces the covered foot surface, as in a clothed character asset.
                if (m.name === 'Human' && m.geometry.index) {
                    m.geometry = m.geometry.clone();
                    const pos = m.geometry.attributes.position, old = m.geometry.index.array, kept = [];
                    for (let i = 0; i < old.length; i += 3) {
                        if (Math.max(pos.getY(old[i]), pos.getY(old[i + 1]), pos.getY(old[i + 2])) < .145)
                            continue;
                        kept.push(old[i], old[i + 1], old[i + 2]);
                    }
                    m.geometry.setIndex(kept);
                }
                m.castShadow = true;
                m.receiveShadow = true;
                m.frustumCulled = false;
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                for (const mat of mats) {
                    const p = mat;
                    if (p.map)
                        p.map.anisotropy = 4;
                    if (p.normalMap)
                        p.normalMap.anisotropy = 4;
                }
                if (m.morphTargetDictionary)
                    this.blinkMeshes.push(m);
            }
        });
        this.model.updateMatrixWorld(true);
        for (const side of ['L', 'R']) {
            const word = side === 'L' ? 'Left' : 'Right';
            const fingers = [];
            for (let i = 0; i < 5; i++) {
                const bones = [1, 2, 3].map(n => this.bones.get(word + 'Hand' + FINGERS[i] + n));
                if (bones.some(b => !b))
                    throw new Error('The performer finger rig is incomplete.');
                const tip = new THREE.Object3D();
                tip.name = word + FINGERS[i] + 'Contact';
                tip.position.set(0, TIP_LENGTH[i], 0);
                bones[2].add(tip);
                fingers.push({ bones, tip, lengths: [bones[1].position.length(), bones[2].position.length(), TIP_LENGTH[i]], rest: bones.map(b => b.quaternion.clone()), frameOffsets: [], palmNormal: v3(-1, 0, 0) });
            }
            // Calibrate each phalanx roll against a complete flexion frame. Keeping a
            // full frame avoids the axial spin of repeated shortest-arc aim rotations.
            const wristBone = this.bones.get(word + 'Hand'), oldWristQ = wristBone.getWorldQuaternion(new THREE.Quaternion());
            setWorldQ(wristBone, PALM_Q);
            for (const [fi, finger] of fingers.entries()) {
                if (fi === 0) {
                    const a = wp(finger.bones[1]).sub(wp(finger.bones[0])).normalize(), b = wp(finger.bones[2]).sub(wp(finger.bones[1])).normalize();
                    finger.palmNormal.copy(b.cross(a).normalize().applyQuaternion(PALM_Q.clone().invert()));
                }
                const reference = finger.palmNormal.clone().applyQuaternion(PALM_Q);
                finger.frameOffsets = finger.bones.map((bone, j) => {
                    const child = j < 2 ? finger.bones[j + 1] : finger.tip, dir = wp(child).sub(wp(bone)).normalize(), normal = fi === 0 ? reference.clone().addScaledVector(dir, -reference.dot(dir)).normalize() : dir.clone().cross(v3(0, 1, 0)).normalize();
                    const frame = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal, dir, normal.clone().cross(dir).normalize()));
                    return frame.invert().multiply(bone.getWorldQuaternion(new THREE.Quaternion())).normalize();
                });
            }
            setWorldQ(wristBone, oldWristQ);
            const notes = score.notes.filter(n => n.hand === side);
            this.hands.push({ side, wrist: this.bones.get(word + 'Hand'), upper: this.bones.get(word + 'Arm'), lower: this.bones.get(word + 'ForeArm'), fingers, notes, fingerNotes: Array.from({ length: 5 }, (_, i) => notes.filter(n => n.finger === i + 1)), plan: [] });
        }
        // Understated concert shoes follow the anatomical heel and toe pose.
        const shoeMat = new THREE.MeshPhysicalMaterial({ color: 0x171719, roughness: .45, metalness: 0, clearcoat: .18, clearcoatRoughness: .32 });
        for (const side of ['Left', 'Right']) {
            const shoe = concertShoe(shoeMat);
            shoe.name = side + ' concert shoe';
            this.group.add(shoe);
            this.shoes.set(side, shoe);
        }
        this.hairMotion = ponytailMotion(this.bones, this.rest);
        this.posture(0, .5, 0);
        if (score.wristMotion)
            this.wristMotion = wristMotionSampler(score.wristMotion);
        else
            for (const hand of this.hands)
                this.planHand(hand);
        this.ready = true;
    }
    resetBone(name) { const b = this.bones.get(name); if (b) {
        b.quaternion.copy(this.rest.get(name));
        b.updateWorldMatrix(false, true);
    } return b; }
    posture(time, energy, pedal) {
        if (!this.model)
            return;
        const bars = this.score?.harmony ?? [];
        const barIndex = Math.max(0, lowerBound(bars, time, b => b.time) - 1), bar = bars[barIndex];
        const barPosition = bar ? clamp((time - bar.time) / bar.duration) : (time * (this.score?.bpm ?? 90) / 240) % 1;
        const phrase = ((barIndex % 4) + barPosition) / 4;
        // Musical pulses are reconstructed from score time, so seeking and paused
        // poses are identical to continuous playback. Seat contact stays anchored.
        const beat = barPosition * 4, beatPhase = (beat % 1) * Math.PI * 2;
        const breath = Math.sin(phrase * Math.PI * 2 - .45), release = .5 - .5 * Math.cos(phrase * Math.PI * 2);
        let reach = 0, weight = 0, melodyX = 0, melodyWeight = 0, strike = 0;
        for (const n of this.score?.notes ?? []) {
            const age = time - n.time;
            if (age < -.55 || age > 1.0)
                continue;
            // Fade influence to zero at both edges. Abruptly adding a distant note
            // to a weighted centroid made the hips and head jump before quiet phrases.
            const w = Math.exp(-Math.pow((age + .12) / .38, 2)) * n.velocity * smooth((age + .55) / .18) * (1 - smooth((age - .55) / .45));
            reach += keyX(n.midi) * w;
            weight += w;
            if (n.role === 'melody' || n.hand === 'R') {
                melodyX += keyX(n.midi) * w;
                melodyWeight += w;
            }
            if (age > -.09 && age < .6)
                strike += n.velocity * (n.role === 'bass' ? 1.35 : n.role === 'melody' ? .8 : .28) * Math.exp(-Math.pow((age - .07) / .16, 2)) * smooth((age + .09) / .07) * (1 - smooth((age - .42) / .18));
        }
        // A small neutral weight lets long rests settle continuously at centre.
        reach /= weight + .22;
        melodyX /= melodyWeight + .16;
        const impulse = 1 - Math.exp(-strike * .38), ending = this.score ? 1 - smooth((time - this.score.duration + 6) / 4) : 1;
        this.model.position.set(clamp(reach * .048, -.020, .020), -.344, .75);
        for (const n of ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'RightShoulder', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'])
            this.resetBone(n);
        const spine = this.bones.get('Spine'), spine1 = this.bones.get('Spine1'), head = this.bones.get('Head');
        spine.rotateX(.17 + (.043 * breath + .020 * impulse) * energy * ending);
        spine.rotateZ(clamp(-reach * .12, -.055, .055) + .019 * breath * energy);
        spine1.rotateX(.064 + .008 * Math.sin(beatPhase - .55) * energy * ending);
        spine1.rotateY(clamp(-melodyX * .055, -.022, .022));
        const upperChest = this.bones.get('Spine2');
        upperChest?.rotateZ(.009 * Math.sin(beatPhase - .25) * energy * ending);
        head.rotateX(.105 + .025 * release * energy + .018 * Math.sin(phrase * Math.PI * 2 - .7) * energy * ending + .012 * Math.sin(beatPhase - .82) * energy * ending);
        head.rotateY(clamp(-melodyX * .34, -.13, .13));
        head.rotateZ(-breath * .012 * energy);
        this.bones.get('LeftShoulder')?.rotateZ(.009 * impulse * energy);
        this.bones.get('RightShoulder')?.rotateZ(-.009 * impulse * energy);
        this.model.updateMatrixWorld(true);
        // A small seated lean and clavicle protraction let the upper arms reach
        // around the blouse while preserving clavicle and limb lengths.
        this.torsoEnvelopeZ = (wp(this.bones.get('LeftArm')).z + wp(this.bones.get('RightArm')).z) / 2;
        for (const side of ['Left', 'Right']) {
            const shoulder = this.bones.get(side + 'Shoulder');
            setWorldQ(shoulder, new THREE.Quaternion().setFromAxisAngle(v3(0, 1, 0), (side === 'Left' ? -.32 : .43)).multiply(shoulder.getWorldQuaternion(new THREE.Quaternion())));
        }
        for (const side of ['Left', 'Right']) {
            const sign = side === 'Left' ? -1 : 1;
            const up = this.bones.get(side + 'UpLeg'), lower = this.bones.get(side + 'Leg'), foot = this.bones.get(side + 'Foot'), toe = this.bones.get(side + 'ToeBase');
            const heel = v3(sign * .095, .038, side === 'Right' ? .35 : .38), toeCenter = v3(sign * .095, side === 'Right' ? .107 - pedal * .016 : .038, side === 'Right' ? .11 : .14), forward = toeCenter.clone().sub(heel).normalize(), back = forward.clone().negate(), shoeUp = back.clone().cross(v3(1, 0, 0)).normalize();
            const shoe = this.shoes.get(side);
            if (shoe) {
                shoe.position.copy(heel).lerp(toeCenter, .5);
                shoe.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(v3(1, 0, 0), shoeUp, back));
            }
            const hip = wp(up), ankle = heel.clone().addScaledVector(forward, .032).addScaledVector(shoeUp, .055);
            const pole = v3(sign * .17, .58, .18);
            const knee = joint(hip, ankle, lower.position.length(), foot.position.length(), pole);
            aim(up, lower, knee);
            aim(lower, foot, ankle);
            // Foot long axis follows the pedal, toe stays planted while ankle rolls slightly.
            const toeTarget = ankle.clone().addScaledVector(forward, .12);
            aim(foot, toe, toeTarget);
            toe.quaternion.copy(this.rest.get(side + 'ToeBase'));
        }
        this.head.copy(wp(head));
        const blinkPhase = (time + 2.3) % 4.9;
        const blink = blinkPhase < .14 ? Math.sin(blinkPhase / .14 * Math.PI) : 0;
        for (const mesh of this.blinkMeshes) {
            const dict = mesh.morphTargetDictionary, values = mesh.morphTargetInfluences;
            if (!values)
                continue;
            const set = (name, value) => { const i = dict[name]; if (i !== undefined)
                values[i] = value; };
            for (const name of ['eyeBlinkLeft', 'eyeBlinkRight', 'eyes_closed', 'blink'])
                set(name, blink);
            const softness = .023 + .023 * energy * release;
            set('mouthSmileLeft', softness);
            set('mouthSmileRight', softness * .94);
            set('browInnerUp', .014 + .012 * release * energy);
            // The authored down-look morph also carries the matching eyelid motion.
            const gaze = .55 + .08 * release;
            set('eyeLookDownLeft', gaze);
            set('eyeLookDownRight', gaze);
            set('eyeSquintLeft', .020 * energy);
            set('eyeSquintRight', .020 * energy);
        }
        this.hairMotion?.(time);
    }
    contactDepth(baseZ, black, fi) {
        // Longer fingers reach forward from a supported knuckle. The previous 24mm
        // offset forced 75–85mm chains to fold into a claw even with exact contact.
        const forward = fi === 0 ? .051 : fi === 4 ? .039 : fi === 1 ? .055 : .065;
        return clamp(baseZ - forward, black ? .166 : .239, black ? .211 : .269);
    }
    // Three linked phalanges share one continuous flexion plane. Coupled bends
    // prevent the mathematically reachable but unnatural folded-back IK solution.
    fingerPoints(base, target, f, fi, palmQ, opposition = 0) {
        const [a, b, c] = f.lengths, ratio = fi === 0 ? .35 : .48, maxBend = fi === 0 ? 1.56 : 1.52;
        const reach = (bend) => Math.hypot(a + b * Math.cos(bend) + c * Math.cos((1 + ratio) * bend), b * Math.sin(bend) + c * Math.sin((1 + ratio) * bend));
        const delta = target.clone().sub(base), d = clamp(delta.length(), reach(maxBend), a + b + c - .00003);
        const e = delta.lengthSq() > .00000001 ? delta.normalize() : v3(0, 0, -1);
        let low = 0, high = maxBend;
        for (let i = 0; i < 17; i++) {
            const mid = (low + high) / 2;
            if (reach(mid) > d)
                low = mid;
            else
                high = mid;
        }
        const bend = (low + high) / 2, angle = -Math.atan2(-b * Math.sin(bend) - c * Math.sin((1 + ratio) * bend), a + b * Math.cos(bend) + c * Math.cos((1 + ratio) * bend));
        // Near a vertical touch, world-up no longer defines a stable flexion plane.
        // Blend toward a palm lateral reference before that projection degenerates.
        let normal;
        if (fi === 0) {
            const q = palmQ ?? f.bones[0].parent.getWorldQuaternion(new THREE.Quaternion());
            const reference = f.palmNormal.clone().applyQuaternion(q);
            normal = reference.addScaledVector(e, -reference.dot(e));
            if (normal.lengthSq() < 1e-8)
                normal.copy(v3(0, 1, 0).applyQuaternion(q)).cross(e);
            normal.normalize();
        }
        else {
            const natural = e.clone().cross(v3(0, 1, 0)).normalize(), stable = v3(1, 0, 0).addScaledVector(e, -e.x).normalize();
            const horizontal = Math.hypot(target.x - base.x, target.z - base.z);
            normal = stable.lerp(natural, smooth((horizontal - .004) / .024)).normalize();
            if (this.openingPalmFrame > 0) {
                const q = palmQ ?? f.bones[0].parent.getWorldQuaternion(new THREE.Quaternion()), reference = v3(-1, 0, 0).applyQuaternion(q), hinge = reference.addScaledVector(e, -reference.dot(e));
                if (hinge.lengthSq() > 1e-6)
                    normal.lerp(hinge.normalize(), this.openingPalmFrame).normalize();
            }
            if (this.chordPalmFrame > 0) {
                const q = palmQ ?? f.bones[0].parent.getWorldQuaternion(new THREE.Quaternion()), reference = v3(-1, 0, 0).applyQuaternion(q), hinge = reference.addScaledVector(e, -reference.dot(e));
                if (hinge.lengthSq() > 1e-8)
                    normal.lerp(hinge.normalize(), this.chordPalmFrame).normalize();
            }
        }
        if (fi === 0 && opposition !== 0)
            normal.applyAxisAngle(e, opposition);
        const up = normal.clone().cross(e).normalize();
        const segment = (theta, length) => e.clone().multiplyScalar(Math.cos(theta) * length).addScaledVector(up, Math.sin(theta) * length);
        const pip = base.clone().add(segment(angle, a)), dip = pip.clone().add(segment(angle - bend, b)), tip = dip.clone().add(segment(angle - (1 + ratio) * bend, c));
        return { pip, dip, tip, normal, min: reach(maxBend) };
    }
    planHand(hand) {
        const groups = [];
        for (const note of hand.notes) {
            const last = groups.at(-1);
            if (last && note.time - last.time < .045) {
                last.notes.push(note);
                last.end = Math.max(last.end, note.time + note.duration);
            }
            else
                groups.push({ time: note.time, end: note.time + note.duration, notes: [note] });
        }
        const offsets = hand.side === 'L' ? [.07, .032, .008, -.022, -.055] : [-.07, -.032, -.008, .022, .055];
        hand.plan = groups.map((g, groupIndex) => {
            const support = hand.notes.filter(n => n.time < g.time && n.time + n.duration > g.time + .025 && !g.notes.some(m => m.finger === n.finger));
            const notes = [...g.notes, ...support];
            // Prepare a whole musical figure when the neighboring fingers can share
            // one hand position. Solving every isolated note independently made the
            // wrist chase the fingertips, particularly during thumb substitutions.
            const neighbors = [groups[groupIndex + 1], groups[groupIndex - 1]].filter(k => k && Math.abs(k.time - g.time) < .56);
            for (const neighbor of neighbors)
                for (const note of neighbor.notes) {
                    if (notes.some(n => n.finger === note.finger || n.midi === note.midi))
                        continue;
                    const candidate = [...notes, note].sort((a, b) => a.midi - b.midi);
                    if (candidate.at(-1).midi - candidate[0].midi > 12)
                        continue;
                    if (candidate.some((n, i) => i > 0 && (hand.side === 'L' ? n.finger >= candidate[i - 1].finger : n.finger <= candidate[i - 1].finger)))
                        continue;
                    notes.push(note);
                }
            const x = notes.reduce((a, n) => a + keyX(n.midi) - offsets[n.finger - 1], 0) / notes.length;
            return { ...g, pose: this.handPose(hand, notes, x, notes.some(n => isBlack(n.midi))) };
        });
    }
    plannedPose(hand, time) {
        if (this.wristMotion)
            return this.wristMotion(hand.side, time);
        const index = lowerBound(hand.plan, time, k => k.time), prev = hand.plan[Math.max(0, index - 1)], next = hand.plan[Math.min(index, hand.plan.length - 1)];
        if (prev === next)
            return { position: prev.pose.position.clone(), q: prev.pose.q.clone() };
        const gap = next.time - prev.end;
        const begin = gap > 0 ? Math.max(prev.end, next.time - .46) : Math.max(prev.time, next.time - Math.min(.18, (next.time - prev.time) * .66));
        const end = next.time - .004, u = smooth((time - begin) / Math.max(.001, end - begin));
        const position = prev.pose.position.clone().lerp(next.pose.position, u);
        if (gap > .09)
            position.y += Math.sin(u * Math.PI) * .007;
        return { position, q: prev.pose.q.clone().slerp(next.pose.q, u) };
    }
    handPose(hand, notes, initialX, black) {
        const cacheKey = hand.side + notes.map(n => `${n.midi}/${n.finger}/${(n.contactLift ?? .002).toFixed(4)}/${n.contactZ ?? ""}/${n.thumbOpposition ?? 0}`).sort().join(',');
        const cached = this.poseCache.get(cacheKey);
        if (cached)
            return cached;
        const sign = hand.side === 'L' ? 1 : -1;
        const params = [initialX, black ? .772 : .757, black ? .379 : .412, sign * .055, .035, 0];
        const bounds = [[-.61, .61], [.738, .797], [.295, .447], [-.19, .19], [-.09, .15], [-.15, .15]];
        const initial = [...params];
        const shoulder = wp(hand.upper);
        const quaternion = (p) => new THREE.Quaternion().setFromEuler(new THREE.Euler(p[4], p[5], p[3], 'YXZ')).multiply(PALM_Q);
        const cost = (p) => {
            const q = quaternion(p), w = v3(p[0], p[1], p[2]);
            let cost = 0;
            for (const n of notes) {
                const fi = n.finger - 1, f = hand.fingers[fi];
                const base = f.bones[0].position.clone().applyQuaternion(q).add(w);
                const black = isBlack(n.midi);
                const z = n.contactZ ?? this.contactDepth(base.z, black, fi), target = v3(keyX(n.midi), keySurfaceY(n.midi, z) + (n.contactLift ?? .002), z);
                const length = f.lengths.reduce((a, b) => a + b, 0);
                const d = target.distanceTo(base);
                const shape = this.fingerPoints(base, target, f, fi, q, n.thumbOpposition ?? 0);
                if (fi > 0)
                    cost += Math.pow(Math.max(0, shape.pip.z - base.z + .003), 2) * 400 + Math.pow(Math.max(0, shape.pip.y - base.y - .025), 2) * 60;
                cost += Math.pow(Math.max(0, d - length * .985), 2) * 15000 + Math.pow(Math.max(0, shape.min + .001 - d), 2) * 15000;
                cost += Math.pow(d - length * .88, 2) * 18 + Math.pow(Math.max(0, target.y + .013 - base.y), 2) * 250;
            }
            cost += Math.pow(Math.max(0, w.distanceTo(shoulder) - .490), 2) * 18000;
            cost += Math.pow(p[0] - initial[0], 2) * .14 + Math.pow(p[1] - initial[1], 2) * .18 + Math.pow(p[2] - initial[2], 2) * .06;
            cost += Math.pow(p[3] - sign * .055, 2) * .007 + Math.pow(p[4] - .035, 2) * .006 + Math.pow(p[5], 2) * .014;
            return cost;
        };
        let best = cost(params);
        for (const scale of [1, .5, .25, .1, .035])
            for (let pass = 0; pass < 4; pass++) {
                let changed = false;
                for (let axis = 0; axis < 6; axis++) {
                    const step = [.028, .012, .03, .16, .16, .16][axis] * scale;
                    for (const direction of [-1, 1]) {
                        const old = params[axis];
                        params[axis] = clamp(old + step * direction, ...bounds[axis]);
                        const value = cost(params);
                        if (value < best) {
                            best = value;
                            changed = true;
                        }
                        else
                            params[axis] = old;
                    }
                }
                if (!changed)
                    break;
            }
        const pose = { position: v3(params[0], params[1], params[2]), q: quaternion(params) };
        this.poseCache.set(cacheKey, pose);
        return pose;
    }
    update(time, score, piano, pedal, energy) {
        if (!this.ready)
            return;
        this.contacts = [];
        this.posture(time, energy, pedal);
        for (const hand of this.hands) {
            this.openingPalmFrame = hand.side === 'R' ? smooth((time - 6.0390358363389325) / .10) * (1 - smooth((time - 11.70) / .25)) : 0;
            this.chordPalmFrame = hand.side === 'R' ? smooth((time - 198.348852) / (198.670185 - 198.348852)) * (1 - smooth((time - 199.66868) / (200.026507 - 199.66868))) : 0;
            const current = hand.notes.filter(n => n.time <= time && n.time + n.duration > time);
            const pose = this.plannedPose(hand, time);
            const wrist = pose.position.clone();
            // Keep authored world hand targets while the elbow approaches the palm's
            // forward axis on the fixed-length shoulder/wrist circle. The expanded
            // torso envelope includes sleeve and forearm thickness.
            const word = hand.side === 'L' ? 'Left' : 'Right';
            for (const name of [word + 'Arm', word + 'ForeArm', word + 'Hand'])
                this.resetBone(name);
            const shoulder = wp(hand.upper), l1 = hand.lower.position.length(), l2 = hand.wrist.position.length();
            const axis = wrist.clone().sub(shoulder), d = clamp(axis.length(), .0001, l1 + l2 - .00001);
            axis.normalize();
            const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), height = Math.sqrt(Math.max(.0000001, l1 * l1 - along * along));
            const centre = shoulder.clone().addScaledVector(axis, along), side = hand.side === 'L' ? -1 : 1;
            const desired = wrist.clone().addScaledVector(hand.fingers[2].bones[0].position.clone().normalize().applyQuaternion(pose.q), -l2).sub(centre);
            desired.addScaledVector(axis, -desired.dot(axis)).normalize();
            const outside = v3(side, 0, 0);
            outside.addScaledVector(axis, -outside.dot(axis)).normalize();
            const angle = Math.atan2(axis.dot(desired.clone().cross(outside)), desired.dot(outside));
            const at = (u) => centre.clone().addScaledVector(desired.clone().applyAxisAngle(axis, angle * u), height);
            const clear = (elbow) => {
                for (let i = -4; i <= 8; i++) {
                    const p = i < 0 ? shoulder.clone().lerp(elbow, 1 + i * (hand.side === 'L' ? .1265 : .115)) : elbow.clone().lerp(wrist, i / 8), torsoZ = this.torsoEnvelopeZ - .009 + (1.05 - p.y) * .16;
                    if (Math.pow((p.x - this.model.position.x) / .230, 2) + Math.pow((p.z - torsoZ) / .195, 2) < 1)
                        return false;
                }
                return true;
            };
            let low = 0, high = 1;
            if (clear(at(0)))
                high = 0;
            else
                for (let i = 0; i < 24; i++) {
                    const middle = (low + high) / 2;
                    if (clear(at(middle)))
                        high = middle;
                    else
                        low = middle;
                }
            const elbow = at(high);
            aim(hand.upper, hand.lower, elbow);
            aim(hand.lower, hand.wrist, wrist);
            setWorldQ(hand.wrist, pose.q);
            for (let fi = 0; fi < 5; fi++) {
                const finger = hand.fingers[fi];
                finger.bones.forEach((b, j) => { b.quaternion.copy(finger.rest[j]); b.updateWorldMatrix(false, true); });
                const fnotes = hand.fingerNotes[fi];
                const ni = lowerBound(fnotes, time, n => n.time);
                const prev = fnotes[Math.max(0, ni - 1)], nxt = fnotes[Math.min(ni, fnotes.length - 1)];
                let n = current.find(n => n.finger === fi + 1);
                let target;
                const base = wp(finger.bones[0]), reach = finger.lengths.reduce((a, b) => a + b, 0);
                const idle = base.clone().add(v3(fi === 0 ? (hand.side === 'L' ? 1 : -1) * reach * .35 : 0, -reach * .19, -reach * (fi === 0 ? .81 : .90)));
                idle.y = Math.max(idle.y, KEY_TOP + (fi === 0 ? mix(.027, .011, smooth((idle.z - .230) / .030)) : mix(.027, .011, smooth((idle.z - .237) / .026))));
                const keyTarget = (note) => { const v = piano.contact(note.midi, note.contactZ ?? this.contactDepth(base.z, isBlack(note.midi), fi)); v.y += note.contactLift ?? .002; return v; };
                if (n)
                    target = keyTarget(n);
                else {
                    const previous = prev && prev.time + prev.duration <= time ? prev : undefined, next = nxt && nxt.time >= time ? nxt : undefined;
                    const end = previous ? previous.time + previous.duration : -10, start = next?.time ?? 1e6, gap = start - end;
                    if (previous && next && gap < .50) {
                        const u = clamp((time - end) / Math.max(.001, gap)), s = smooth(u);
                        target = keyTarget(previous).lerp(keyTarget(next), s);
                        target.y += fi === 0 ? Math.sin(u * Math.PI) * Math.min(.043, .014 + gap * .10) : Math.pow(Math.sin(u * Math.PI), 2) * Math.min(.018, gap * .065);
                    }
                    else {
                        target = idle.clone();
                        if (previous) {
                            const weight = 1 - smooth((time - end) / .19);
                            target.lerp(keyTarget(previous), weight);
                        }
                        if (next) {
                            const weight = smooth(1 - (start - time) / .27);
                            target.lerp(keyTarget(next), weight);
                        }
                    }
                }
                if (!n) {
                    const delta = target.clone().sub(base), total = reach, minimum = this.fingerPoints(base, idle, finger, fi).min + .008;
                    const tooClose = 1 - smooth((delta.length() - minimum) / .014), behind = smooth((delta.z + total * .22) / (.035)), tooSide = smooth((Math.abs(delta.x) - total * .62) / (.025));
                    const since = prev ? time - prev.time - prev.duration : 100, before = nxt ? nxt.time - time : 100;
                    target.lerp(idle, Math.max(tooClose, behind, tooSide) * smooth(Math.min(since, before) / .07));
                }
                // The thumb travels with the palm while released. World-space targets
                // can pass through the thumb base during wrist travel and invert its plane.
                // Interpolate complete local joint poses between exact held-note endpoints;
                // a soft neutral pose keeps long rests open without a key-space detour.
                if (!n && fi === 0) {
                    const localPose = (wristPosition, wristQ, touch, opposition = 0) => {
                        const origin = finger.bones[0].position.clone().applyQuaternion(wristQ).add(wristPosition), chain = this.fingerPoints(origin, touch, finger, fi, wristQ, opposition), p = [origin, chain.pip, chain.dip, chain.tip];
                        const world = finger.bones.map((bone, j) => { const dir = p[j + 1].clone().sub(p[j]).normalize(), normal = chain.normal; return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal, dir, normal.clone().cross(dir).normalize())).multiply(finger.frameOffsets[j]); });
                        return world.map((q, j) => (j === 0 ? wristQ : world[j - 1]).clone().invert().multiply(q));
                    };
                    // A stable compact thumb posture preserves the mesh's authored joint rolls.
                    // Calibrated in wrist coordinates: lifting a world-space target can fold
                    // the first web and rotate the distal chain through its own palm.
                    const idlePose = finger.rest.map(q => q.clone());
                    idlePose[0].premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-.85, hand.side === 'L' ? -.30 : .30, hand.side === 'L' ? .30 : -.30, 'XYZ')));
                    if (hand.side === 'R' && time >= 6.0390358363389325 && time <= 12.392821) {
                        const weight = smooth((time - 6.0390358363389325) / .10) * (1 - smooth((time - 11.36) / .24)), neutral = localPose(wp(hand.wrist), pose.q, v3(keyX(62) + .01525 * smooth((time - 10.95) / .18) * (1 - smooth((time - 11.43) / .24)), .757, .267));
                        idlePose.forEach((q, j) => q.slerp(neutral[j], weight));
                    }
                    const contactPose = (note, at) => { const anchor = this.plannedPose(hand, at), origin = finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position), z = note.contactZ ?? this.contactDepth(origin.z, isBlack(note.midi), fi), touch = v3(keyX(note.midi), (hand.side === 'R' && time >= 6.0390358363389325 && time <= 12.392821 ? piano.contact(note.midi, z).y : keySurfaceY(note.midi, z, 1)) + (note.contactLift ?? .002), z); return localPose(anchor.position, anchor.q, touch, note.thumbOpposition ?? 0); };
                    const previous = prev && prev.time + prev.duration <= time ? prev : undefined, next = nxt && nxt.time >= time ? nxt : undefined;
                    const end = previous ? previous.time + previous.duration : -10, start = next?.time ?? 1e6, gap = start - end;
                    let rotations = idlePose.map(q => q.clone());
                    if (previous && next && gap < .50) {
                        const u = clamp((time - end) / Math.max(.001, gap)), s = smooth(u), a = contactPose(previous, end), b = contactPose(next, start), restWeight = Math.pow(Math.sin(u * Math.PI), 2) * smooth(gap / .22) * .35;
                        rotations = a.map((q, j) => q.slerp(b[j], s).slerp(idlePose[j], restWeight));
                    }
                    else {
                        if (previous) {
                            const a = contactPose(previous, end), weight = 1 - smooth((time - end) / .22);
                            rotations.forEach((q, j) => q.slerp(a[j], weight));
                        }
                        if (next) {
                            const b = contactPose(next, start), weight = smooth(1 - (start - time) / .30);
                            rotations.forEach((q, j) => q.slerp(b[j], weight));
                        }
                    }
                    const wave = (u) => Math.pow(Math.sin(clamp(u) * Math.PI), 2);
                    const arch = previous && next && gap < .50 ? wave((time - end) / gap) * smooth(gap / .22) : Math.max(previous ? wave((time - end) / .22) : 0, next ? wave((start - time) / .30) : 0);
                    rotations[0].premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, (hand.side === 'L' ? 1 : -1) * 0.5 * arch, 'XYZ')));
                    // This released RH thumb rests in a curved wrist-local pose between these
                    // two fixed score anchors. Contact lifts clear the moving keys at each end.
                    // localPose retains the authored joint rolls; all held poses remain unchanged.
                    if (hand.side === 'R' && previous?.id === 'p00112' && next?.id === 'p00142'
                        && Math.abs(end - 27.794411) < 1e-7 && Math.abs(start - 34.166094) < 1e-7
                        && time > end && time < start) {
                        const anchor = wp(hand.wrist), origin = finger.bones[0].position.clone().applyQuaternion(pose.q).add(anchor);
                        const neutralTouch = origin.clone().add(v3(.2, .45, .2).multiplyScalar(reach).applyQuaternion(pose.q));
                        const relaxed = localPose(anchor, pose.q, neutralTouch);
                        const liftedContact = (note, at) => { const anchor = this.plannedPose(hand, at), origin = finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position), z = note.contactZ ?? this.contactDepth(origin.z, isBlack(note.midi), fi), touch = v3(keyX(note.midi), keySurfaceY(note.midi, z, 1) + (note.contactLift ?? .002) + .015, z); return localPose(anchor.position, anchor.q, touch, note.thumbOpposition ?? 0); };
                        const a = contactPose(previous, end), b = contactPose(next, start), aLift = liftedContact(previous, end), bLift = liftedContact(next, start);
                        const since = time - end, before = start - time, release = smooth((since - .10) / .4), arrival = smooth(1 - (before - .04) / .4);
                        rotations = a.map((q, j) => q.slerp(aLift[j], smooth(since / .10)).slerp(relaxed[j], release).slerp(bLift[j], arrival).slerp(b[j], smooth(1 - before / .04)));
                    }
                    // Relax the thumb in this measured pause; preserve both contact anchors.
                    const controls = [{ "name": "g95", "previous": "p00451", "next": "p00459", "end": 95.039182, "start": 95.94507, "target": [0.2, 0.45, -0.1], "release": 0.22, "arrival": 0.22, "ramp": 0.1, "arrivalRamp": 0.04, "releaseLift": 0.03, "arrivalLift": 0.03 }].find((c) => c.previous === previous?.id && c.next === next?.id && Math.abs(end - c.end) < 1e-7 && Math.abs(start - c.start) < 1e-7);
                    if (controls && hand.side === 'R' && time > end && time < start) {
                        const anchor = wp(hand.wrist), origin = finger.bones[0].position.clone().applyQuaternion(pose.q).add(anchor);
                        const neutralTouch = origin.clone().add(v3(...controls.target).multiplyScalar(reach).applyQuaternion(pose.q));
                        const relaxed = localPose(anchor, pose.q, neutralTouch, controls.opposition ?? 0);
                        const liftedContact = (note, at, lift) => { const anchor = this.plannedPose(hand, at), origin = finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position), z = note.contactZ ?? this.contactDepth(origin.z, isBlack(note.midi), fi), touch = v3(keyX(note.midi), keySurfaceY(note.midi, z, 1) + (note.contactLift ?? .002) + lift, z); return localPose(anchor.position, anchor.q, touch, note.thumbOpposition ?? 0); };
                        const a = contactPose(previous, end), b = contactPose(next, start), aLift = liftedContact(previous, end, controls.releaseLift ?? .015), bLift = liftedContact(next, start, controls.arrivalLift ?? .015);
                        const since = time - end, before = start - time, ramp = controls.ramp ?? .10, arrivalRamp = controls.arrivalRamp ?? ramp, release = smooth((since - ramp) / (controls.release ?? .4)), arrival = smooth(1 - (before - arrivalRamp) / (controls.arrival ?? .4));
                        rotations = a.map((q, j) => q.slerp(aLift[j], smooth(since / ramp)).slerp(relaxed[j], release).slerp(bLift[j], arrival).slerp(b[j], smooth(1 - before / arrivalRamp)));
                    }
                    finger.bones.forEach((bone, j) => { bone.quaternion.copy(rotations[j]); bone.updateWorldMatrix(false, true); });
                    continue;
                }
                const desired = target.clone();
                const shape = this.fingerPoints(base, target, finger, fi, undefined, n?.thumbOpposition ?? 0);
                const points = [base, shape.pip, shape.dip, shape.tip];
                if (!n && fi > 0) {
                    const localPose = (wristPosition, wristQ, touch, opposition = 0) => {
                        const origin = finger.bones[0].position.clone().applyQuaternion(wristQ).add(wristPosition), chain = this.fingerPoints(origin, touch, finger, fi, wristQ, opposition), p = [origin, chain.pip, chain.dip, chain.tip];
                        const world = finger.bones.map((bone, j) => { const dir = p[j + 1].clone().sub(p[j]).normalize(), normal = chain.normal; return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal, dir, normal.clone().cross(dir).normalize())).multiply(finger.frameOffsets[j]); });
                        return world.map((q, j) => (j === 0 ? wristQ : world[j - 1]).clone().invert().multiply(q));
                    };
                    const idlePose = localPose(wp(hand.wrist), pose.q, idle);
                    const openingRest = hand.side === 'R' ? smooth((time - 6.0390358363389325) / .10) * (1 - smooth((time - 11.36) / .24)) : 0;
                    if (openingRest > 0) {
                        const midi = [62, 64, 67, 69, 71][fi], touch = v3(keyX(midi), KEY_TOP + .016, [.267, .245, .224, .235, .257][fi]), reference = localPose(wp(hand.wrist), pose.q, touch);
                        idlePose.forEach((q, j) => q.slerp(reference[j], openingRest));
                    }
                    const contactPose = (note, at) => { const anchor = this.plannedPose(hand, at), origin = finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position), z = note.contactZ ?? this.contactDepth(origin.z, isBlack(note.midi), fi), touch = v3(keyX(note.midi), (mix(keySurfaceY(note.midi, z, 1), piano.contact(note.midi, z).y, hand.side === 'R' ? smooth((time - 6.0390358363389325) / .10) * (1 - smooth((time - 12.50) / .25)) : 0)) + (note.contactLift ?? .002), z); return localPose(anchor.position, anchor.q, touch, note.thumbOpposition ?? 0); };
                    const previous = prev && prev.time + prev.duration <= time ? prev : undefined, next = nxt && nxt.time >= time ? nxt : undefined;
                    const end = previous ? previous.time + previous.duration : -10, start = next?.time ?? 1e6, gap = start - end;
                    let rotations = idlePose.map(q => q.clone());
                    if (previous && next && gap < .50) {
                        const u = clamp((time - end) / Math.max(.001, gap)), s = smooth(u), a = contactPose(previous, end), b = contactPose(next, start), restWeight = Math.pow(Math.sin(u * Math.PI), 2) * smooth(gap / .16) * .55;
                        rotations = a.map((q, j) => q.slerp(b[j], s).slerp(idlePose[j], restWeight));
                    }
                    else {
                        if (previous) {
                            const a = contactPose(previous, end), weight = 1 - smooth((time - end) / .19);
                            rotations.forEach((q, j) => q.slerp(a[j], weight));
                        }
                        if (next) {
                            const b = contactPose(next, start), weight = smooth(1 - (start - time) / .27);
                            rotations.forEach((q, j) => q.slerp(b[j], weight));
                        }
                    }
                    // Restrict the alternate path to a forward envelope. Contact poses outside
                    // it keep the existing IK path, so an invalid contact cannot pull the
                    // resting path through a larger MCP rotation.
                    const envelope = (qs) => { const dir = finger.bones[1].position.clone().applyQuaternion(qs[0]).normalize(), turn = finger.rest[0].angleTo(qs[0]); return Math.min(smooth((1.40 - turn) / .25), smooth((dir.y - .25) / .20), smooth((.65 + dir.z) / .20), smooth((.85 - Math.abs(dir.x)) / .20)); };
                    let weight = Math.min(envelope(idlePose), envelope(rotations));
                    if (previous)
                        weight = Math.min(weight, envelope(contactPose(previous, end)));
                    if (next)
                        weight = Math.min(weight, envelope(contactPose(next, start)));
                    weight = mix(weight, 1, openingRest);
                    const fallback = localPose(wp(hand.wrist), pose.q, target);
                    finger.bones.forEach((bone, j) => { bone.quaternion.copy(fallback[j].slerp(rotations[j], weight)); bone.updateWorldMatrix(false, true); });
                    applyIdleNonthumb(time, hand.side, fi, finger.bones, hand.wrist, base, previous, next);
                    continue;
                }
                for (let j = 0; j < 3; j++) {
                    const dir = points[j + 1].clone().sub(points[j]).normalize(), normal = shape.normal;
                    let q;
                    q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal, dir, normal.clone().cross(dir).normalize())).multiply(finger.frameOffsets[j]);
                    setWorldQ(finger.bones[j], q);
                }
                if (n && time >= n.time && time < n.time + n.duration)
                    this.contacts.push({ hand: hand.side, finger: fi + 1, midi: n.midi, error: wp(finger.tip).distanceTo(desired) });
            }
        }
    }
}
const idleNonthumbData = { "sourceScoreSha256": "ab41e7f6999a82b364a1d4117bdf4618a6f3e9e5209f18b327da7c12a4a8bdb0", "supportedIndexGaps": [{ "hi": 0, "fi": 1, "previousEnd": 0, "next": "p00003", "nextTime": 1.165846 }, { "hi": 0, "fi": 1, "previous": "p00003", "previousEnd": 1.911077, "next": "p00016", "nextTime": 4.987657 }, { "hi": 0, "fi": 1, "previous": "p00016", "previousEnd": 5.723151, "next": "p00021", "nextTime": 7.280744 }, { "hi": 0, "fi": 1, "previous": "p00021", "previousEnd": 8.025975, "next": "p00030", "nextTime": 9.603821 }, { "hi": 0, "fi": 1, "previous": "p00030", "previousEnd": 9.979821, "next": "p00038", "nextTime": 12.391821 }, { "hi": 1, "fi": 1, "previous": "p00039", "previousEnd": 12.749658, "next": "p00046", "nextTime": 13.81217 }, { "hi": 0, "fi": 1, "previous": "p00047", "previousEnd": 14.472844, "next": "p00054", "nextTime": 15.539346 }, { "hi": 0, "fi": 1, "previous": "p00054", "previousEnd": 15.860174, "next": "p00061", "nextTime": 16.918656 }, { "hi": 0, "fi": 1, "previous": "p00106", "previousEnd": 26.613345, "next": "p00109", "nextTime": 27.115756 }, { "hi": 0, "fi": 1, "previous": "p00111", "previousEnd": 27.781411000000002, "next": "p00118", "nextTime": 28.839894 }, { "hi": 0, "fi": 1, "previous": "p00120", "previousEnd": 29.392067, "next": "p00125", "nextTime": 30.231233 }, { "hi": 0, "fi": 1, "previous": "p00136", "previousEnd": 32.674311, "next": "p00144", "nextTime": 34.854985 }, { "hi": 1, "fi": 1, "previous": "p00140", "previousEnd": 34.063977, "next": "p00152", "nextTime": 36.275334 }, { "hi": 0, "fi": 1, "previous": "p00144", "previousEnd": 35.049341999999996, "next": "p00151", "nextTime": 36.262334 }, { "hi": 1, "fi": 1, "previous": "p00152", "previousEnd": 36.608171, "next": "p00162", "nextTime": 38.360338 }, { "hi": 1, "fi": 1, "previous": "p00162", "previousEnd": 38.689166, "next": "p00170", "nextTime": 39.739649 }, { "hi": 1, "fi": 1, "previous": "p00170", "previousEnd": 40.357316, "next": "p00179", "nextTime": 41.824653 }, { "hi": 0, "fi": 1, "previous": "p00174", "previousEnd": 41.020021, "next": "p00186", "nextTime": 43.195001 }, { "hi": 0, "fi": 1, "previous": "p00188", "previousEnd": 43.905893, "next": "p00198", "nextTime": 46.086568 }, { "hi": 0, "fi": 1, "previous": "p00200", "previousEnd": 46.772242000000006, "next": "p00209", "nextTime": 48.191591 }, { "hi": 0, "fi": 1, "previous": "p00209", "previousEnd": 48.516428000000005, "next": "p00215", "nextTime": 49.578921 }, { "hi": 0, "fi": 1, "previous": "p00228", "previousEnd": 52.321561, "next": "p00240", "nextTime": 54.426584 }, { "hi": 0, "fi": 1, "previous": "p00242", "previousEnd": 55.067518, "next": "p00251", "nextTime": 57.31815 }, { "hi": 0, "fi": 1, "previous": "p00251", "previousEnd": 57.533486, "next": "p00270", "nextTime": 61.111498 }, { "hi": 0, "fi": 1, "previous": "p00311", "previousEnd": 69.44229, "next": "p00319", "nextTime": 70.500773 }, { "hi": 1, "fi": 1, "previous": "p00338", "previousEnd": 74.25622800000001, "next": "p00345", "nextTime": 75.310011 }, { "hi": 0, "fi": 1, "previous": "p00339", "previousEnd": 74.513399, "next": "p00344", "nextTime": 75.297011 }, { "hi": 0, "fi": 1, "previous": "p00346", "previousEnd": 75.89270900000001, "next": "p00364", "nextTime": 79.524964 }, { "hi": 0, "fi": 1, "previous": "p00364", "previousEnd": 79.79744099999999, "next": "p00372", "nextTime": 80.8971 }, { "hi": 1, "fi": 1, "previous": "p00366", "previousEnd": 79.85947300000001, "next": "p00373", "nextTime": 80.9101 }, { "hi": 0, "fi": 1, "previous": "p00372", "previousEnd": 81.14509199999999, "next": "p00381", "nextTime": 82.597815 }, { "hi": 0, "fi": 1, "previous": "p00381", "previousEnd": 82.910894, "next": "p00392", "nextTime": 84.620287 }, { "hi": 1, "fi": 1, "previous": "p00391", "previousEnd": 84.946366, "next": "p00400", "nextTime": 85.652184 }, { "hi": 1, "fi": 1, "previous": "p00400", "previousEnd": 86.09982000000001, "next": "p00413", "nextTime": 87.701139 }, { "hi": 1, "fi": 1, "previous": "p00436", "previousEnd": 92.14815, "next": "p00444", "nextTime": 93.251941 }, { "hi": 1, "fi": 1, "previous": "p00508", "previousEnd": 104.532324, "next": "p00519", "nextTime": 106.245617 }, { "hi": 0, "fi": 1, "previous": "p00532", "previousEnd": 108.928229, "next": "p00541", "nextTime": 109.986988 }, { "hi": 1, "fi": 1, "previous": "p00540", "previousEnd": 110.328929, "next": "p00546", "nextTime": 111.058812 }, { "hi": 1, "fi": 1, "previous": "p00546", "previousEnd": 111.748694, "next": "p00550", "nextTime": 113.202284 }, { "hi": 1, "fi": 1, "previous": "p00557", "previousEnd": 116.096297, "next": "p00561", "nextTime": 116.843189 }, { "hi": 1, "fi": 1, "previous": "p00564", "previousEnd": 119.370533, "next": "p00578", "nextTime": 121.984295 }, { "hi": 1, "fi": 1, "previous": "p00591", "previousEnd": 126.067044, "next": "p00600", "nextTime": 128.626388 }, { "hi": 1, "fi": 1, "previous": "p00608", "previousEnd": 132.243293, "next": "p00614", "nextTime": 132.999001 }, { "hi": 1, "fi": 1, "previous": "p00619", "previousEnd": 134.493988, "next": "p00645", "nextTime": 140.305883 }, { "hi": 0, "fi": 1, "previous": "p00624", "previousEnd": 136.23962600000002, "next": "p00631", "nextTime": 137.452547 }, { "hi": 0, "fi": 1, "previous": "p00641", "previousEnd": 139.915942, "next": "p00649", "nextTime": 141.351706 }, { "hi": 1, "fi": 1, "previous": "p00650", "previousEnd": 141.693647, "next": "p00676", "nextTime": 147.921607 }, { "hi": 0, "fi": 1, "previous": "p00667", "previousEnd": 145.27853100000002, "next": "p00709", "nextTime": 156.945984 }, { "hi": 1, "fi": 1, "previous": "p00693", "previousEnd": 153.76038300000002, "next": "p00721", "nextTime": 159.181206 }, { "hi": 0, "fi": 1, "previous": "p00709", "previousEnd": 157.29235400000002, "next": "p00716", "nextTime": 158.427465 }, { "hi": 0, "fi": 1, "previous": "p00720", "previousEnd": 159.424607, "next": "p00729", "nextTime": 160.501539 }, { "hi": 1, "fi": 1, "previous": "p00721", "previousEnd": 159.43365, "next": "p00730", "nextTime": 160.514539 }, { "hi": 1, "fi": 1, "previous": "p00730", "previousEnd": 160.831873, "next": "p00738", "nextTime": 161.847873 }, { "hi": 1, "fi": 1, "previous": "p00738", "previousEnd": 162.109752, "next": "p00760", "nextTime": 165.151902 }, { "hi": 0, "fi": 1, "previous": "p00742", "previousEnd": 162.781958, "next": "p00751", "nextTime": 164.142565 }, { "hi": 1, "fi": 1, "previous": "p00760", "previousEnd": 165.589235, "next": "p00766", "nextTime": 166.160902 }, { "hi": 1, "fi": 1, "previous": "p00766", "previousEnd": 166.41217899999998, "next": "p00774", "nextTime": 167.155402 }, { "hi": 1, "fi": 1, "previous": "p00783", "previousEnd": 168.86903999999998, "next": "p00799", "nextTime": 171.243856 }, { "hi": 0, "fi": 1, "previous": "p00800", "previousEnd": 171.873523, "next": "p00831", "nextTime": 176.201552 }, { "hi": 1, "fi": 1, "previous": "p00816", "previousEnd": 174.147977, "next": "p00825", "nextTime": 175.218052 }, { "hi": 1, "fi": 1, "previous": "p00825", "previousEnd": 175.530018, "next": "p00836", "nextTime": 177.214552 }, { "hi": 0, "fi": 1, "previous": "p00831", "previousEnd": 176.510885, "next": "p00857", "nextTime": 180.618339 }, { "hi": 1, "fi": 1, "previous": "p00836", "previousEnd": 177.47032099999998, "next": "p00854", "nextTime": 180.02815 }, { "hi": 0, "fi": 1, "previous": "p00857", "previousEnd": 180.883241, "next": "p00867", "nextTime": 181.960173 }, { "hi": 1, "fi": 1, "previous": "p00858", "previousEnd": 180.967173, "next": "p00866", "nextTime": 181.648839 }, { "hi": 1, "fi": 1, "previous": "p00866", "previousEnd": 181.949173, "next": "p00877", "nextTime": 183.306506 }, { "hi": 0, "fi": 1, "previous": "p00867", "previousEnd": 182.200589, "next": "p00880", "nextTime": 183.623176 }, { "hi": 1, "fi": 1, "previous": "p00886", "previousEnd": 185.26052800000002, "next": "p00895", "nextTime": 185.947369 }, { "hi": 1, "fi": 1, "previous": "p00904", "previousEnd": 187.262202, "next": "p00915", "nextTime": 188.610535 }, { "hi": 0, "fi": 1, "previous": "p00905", "previousEnd": 187.494856, "next": "p00914", "nextTime": 188.589035 }, { "hi": 1, "fi": 1, "previous": "p00915", "previousEnd": 189.063501, "next": "p00924", "nextTime": 190.067811 }, { "hi": 1, "fi": 1, "previous": "p00951", "previousEnd": 194.34476, "next": "p00961", "nextTime": 195.693174 }, { "hi": 1, "fi": 1, "previous": "p00961", "previousEnd": 195.95318, "next": "p00967", "nextTime": 196.676685 }, { "hi": 0, "fi": 1, "previous": "p00965", "previousEnd": 196.88501300000001, "next": "p00985", "nextTime": 200.016507 }, { "hi": 0, "fi": 1, "previous": "p00985", "previousEnd": 200.337335, "next": "p00989", "nextTime": 201.05099 }, { "hi": 1, "fi": 1, "previous": "p00988", "previousEnd": 201.392818, "next": "p00991", "nextTime": 202.098473 }, { "hi": 0, "fi": 1, "previous": "p00990", "previousEnd": 202.30112400000002, "next": "p00997", "nextTime": 203.514044 }, { "hi": 1, "fi": 1, "previous": "p01002", "previousEnd": 204.931616, "next": "p01016", "nextTime": 207.150738 }, { "hi": 1, "fi": 1, "previous": "p01016", "previousEnd": 207.83344499999998, "next": "p01026", "nextTime": 210.132445 }, { "hi": 0, "fi": 1, "previous": "p01018", "previousEnd": 208.077964, "next": "p01048", "nextTime": 218.143564 }, { "hi": 1, "fi": 1, "previous": "p01036", "previousEnd": 213.22210700000002, "next": "p01046", "nextTime": 217.286999 }, { "hi": 1, "fi": 1, "previous": "p01046", "previousEnd": 218.132564, "next": "p01061", "nextTime": 224.107593 }, { "hi": 0, "fi": 1, "previous": "p01051", "previousEnd": 219.85869499999998, "next": "p01057", "nextTime": 221.704641 }, { "hi": 0, "fi": 1, "previous": "p01057", "previousEnd": 222.633022, "nextTime": 233.144228 }, { "hi": 1, "fi": 1, "previous": "p01066", "previousEnd": 228.89211699999998, "nextTime": 233.144228 }], "curves": [{ "hi": 1, "fi": 3, "previous": "p00739", "previousEnd": 162.084383, "next": "p00741", "nextTime": 162.186543, "knots": [[162.084383, 0.0, 0.0, 0.0, 0.0], [162.090383, 4.0, 0.0, 5.0, 0.0], [162.096383, 8.0, 0.0, 5.0, 0.0], [162.102383, 12.0, 0.0, 5.0, 0.0], [162.108383, 12.0, 0.0, 5.0, 0.0], [162.114383, 14.0, 0.0, 5.0, 0.0], [162.117, 16.104597754101285, 0.0, 5.0, 0.0], [162.120383, 16.0, 0.0, 5.0, 0.0], [162.126383, 16.0, 0.0, 5.0, 0.0], [162.132383, 16.0, 0.0, 5.0, 0.0], [162.138383, 16.0, 0.0, 5.0, 0.0], [162.144383, 16.0, 0.0, 5.0, 0.0], [162.150383, 16.0, 1.0, 5.0, 0.0], [162.156383, 18.026626345515538, 2.0, 5.0, 0.0], [162.162383, 23.469143595294025, 4.0, 3.8266963413145825, -1.3066336198996695], [162.168383, 23.5, 7.0, 0.5, -6.125], [162.174383, 12.307215521396621, 4.0, -5.5, -6.125], [162.180383, 4.589617275715273, 2.0, -2.356238282719648, -2.623992633028699], [162.186543, 0.0, 0.0, 0.0, 0.0]], "mode": "hermite-controls" }, { "hi": 1, "fi": 4, "previous": "p00727", "previousEnd": 160.490539, "next": "p00743", "nextTime": 162.507213, "knots": [[162.084383, 0.0, 0.0, 0.0, 0.0], [162.125, 0.0, -8.5, 0.0, 0.0], [162.195, 0.0, -8.5, 0.0, 0.0], [162.25, 0.0, 0.0, 0.0, 0.0]] }, { "hi": 1, "fi": 3, "previous": "p00739", "previousEnd": 162.084383, "next": "p00741", "nextTime": 162.186543, "knots": [[162.168, 0, 0, 0, 0], [162.172, 0, 0, -1.2, 0], [162.176, 0, 0, 0, 0]] }, { "hi": 1, "fi": 2, "previous": "p00535", "previousEnd": 109.290138, "next": "p00543", "nextTime": 110.352929, "knots": [[109.52, 0, 0, 0, 0], [109.59, 20, -30, 0, 0], [109.627, 20, -30, 0, 0], [109.72, 0, 0, 0, 0]] }, { "hi": 1, "fi": 3, "previous": "p00533", "previousEnd": 108.94122899999999, "next": "p00554", "nextTime": 114.308845, "knots": [[109.52, 0, 0, 0, 0], [109.59, 20, -30, 0, 0], [109.627, 20, -30, 0, 0], [109.72, 0, 0, 0, 0]] }, { "hi": 1, "fi": 4, "previous": "p00529", "previousEnd": 108.60831999999999, "next": "p00572", "nextTime": 120.484094, "knots": [[109.52, 0, 0, 0, 0], [109.59, 20, -30, 0, 0], [109.627, 20, -30, 0, 0], [109.72, 0, 0, 0, 0]] }, { "hi": 0, "fi": 1, "previous": "p00424", "previousEnd": 90.407126, "next": "p00434", "nextTime": 91.530895, "knots": [[91.46, 0, 0, 0, 0], [91.474, 9.5, -13, 0, 0], [91.482, 9.5, -13, 0, 0], [91.518, 0, 0, 0, 0]] }, { "hi": 1, "fi": 4, "previous": "p00293", "previousEnd": 65.563664, "next": "p00309", "nextTime": 68.448307, "knots": [[68.32, 0, 0, 0, 0], [68.37, 0, -6.5, 0, 0], [68.41, 0, -6.5, 0, 0], [68.448307, 0, 0, 0, 0]] }, { "hi": 1, "fi": 2, "previous": "p00331", "previousEnd": 73.22488200000001, "next": "p00347", "nextTime": 75.663838, "knots": [[73.803, 0, 0, 0, 0], [73.873, 25, -30, 0, 0], [73.91, 25, -30, 0, 0], [74.003, 0, 0, 0, 0]] }, { "hi": 1, "fi": 3, "previous": "p00327", "previousEnd": 72.210155, "next": "p00359", "nextTime": 77.76975, "knots": [[73.803, 0, 0, 0, 0], [73.873, 25, -30, 0, 0], [73.91, 25, -30, 0, 0], [74.003, 0, 0, 0, 0]] }, { "hi": 1, "fi": 4, "previous": "p00324", "previousEnd": 71.86124600000001, "next": "p00340", "nextTime": 74.284528, "knots": [[73.803, 0, 0, 0, 0], [73.873, 25, -30, 0, 0], [73.91, 25, -30, 0, 0], [74.003, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00216", "previousEnd": 49.883542, "next": "p00225", "nextTime": 51.325059, "knots": [[49.883542, 0, 0, 0, 0], [49.916, 30, 10, 0, 0], [50.025, 30, 10, 0, 0], [50.1, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00216", "previousEnd": 49.883542, "next": "p00225", "nextTime": 51.325059, "knots": [[51.035, 0, 0, 0, 0], [51.1, 30, 10, 0, 0], [51.255, 30, 10, 0, 0], [51.325059, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00196", "previousEnd": 45.364676, "next": "p00208", "nextTime": 47.864754, "phase": "arrival", "knots": [[47.574695, 0, 0, 0, 0], [47.639694999999996, 30, 10, 0, 0], [47.794695, 30, 10, 0, 0], [47.864754, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00210", "previousEnd": 48.878265, "next": "p00216", "nextTime": 49.591921, "phase": "arrival", "knots": [[49.301862, 0, 0, 0, 0], [49.366862, 30, 10, 0, 0], [49.521862, 30, 10, 0, 0], [49.591921, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00225", "previousEnd": 51.636886000000004, "next": "p00238", "nextTime": 53.753909, "phase": "release", "knots": [[51.636886000000004, 0, 0, 0, 0], [51.669344, 30, 10, 0, 0], [51.778344000000004, 30, 10, 0, 0], [51.85334400000001, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00225", "previousEnd": 51.636886000000004, "next": "p00238", "nextTime": 53.753909, "phase": "arrival", "knots": [[53.46385, 0, 0, 0, 0], [53.52885, 30, 10, 0, 0], [53.68385, 30, 10, 0, 0], [53.753909, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00243", "previousEnd": 55.112269, "next": "p00248", "nextTime": 55.906367, "phase": "release", "knots": [[55.112269, 0, 0, 0, 0], [55.144726999999996, 30, 10, 0, 0], [55.253727, 30, 10, 0, 0], [55.328727, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00243", "previousEnd": 55.112269, "next": "p00248", "nextTime": 55.906367, "phase": "arrival", "knots": [[55.616308000000004, 0, 0, 0, 0], [55.681308, 30, 10, 0, 0], [55.836308, 30, 10, 0, 0], [55.906367, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00248", "previousEnd": 56.226813, "next": "p00253", "nextTime": 57.34665, "phase": "release", "knots": [[56.226813, 0, 0, 0, 0], [56.259271, 30, 10, 0, 0], [56.368271, 30, 10, 0, 0], [56.443271, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00238", "previousEnd": 54.427584, "next": "p00243", "nextTime": 54.82203, "phase": "short", "knots": [[54.427584, 0, 0, 0, 0], [54.460042, 32, 10, 0, 0], [54.751971, 32, 10, 0, 0], [54.82203, 0, 0, 0, 0]] }, { "hi": 1, "fi": 2, "previous": "p00159", "previousEnd": 38.307160999999994, "next": "p00193", "nextTime": 44.322339, "mode": "blend-neutral", "neutralQuaternions": [[-0.2762930395446723, 0.1365210712106369, 0.12026087606524592, 0.9436956774952034], [0.06361965835094452, -0.11735854297876358, -0.004792043007910252, 0.9910381436347961], [0.060644280165433884, -0.1304895579814911, 0.02646058425307274, 0.9892394542694092]], "knots": [[42.8, 0, 0, 0, 0], [42.95, 1, 0, 0, 0], [43.14, 1, 0, 0, 0], [43.22, 0, 0, 0, 0]] }, { "hi": 1, "fi": 3, "previous": "p00181", "previousEnd": 42.498327, "next": "p00203", "nextTime": 46.809242, "mode": "blend-neutral", "neutralQuaternions": [[-0.2060403938413461, -0.009142301903174645, 0.23557759268265066, 0.9497194584301932], [0.07044843584299088, -0.12179498374462128, -0.032598771154880524, 0.9895151853561401], [0.05818096548318863, 0.04452133551239967, 0.03224598243832588, 0.9967913627624512]], "knots": [[42.8, 0, 0, 0, 0], [42.95, 1, 0, 0, 0], [43.14, 1, 0, 0, 0], [43.22, 0, 0, 0, 0]] }, { "hi": 1, "fi": 4, "previous": "p00177", "previousEnd": 41.800653, "next": "p00187", "nextTime": 43.220001, "mode": "blend-neutral", "neutralQuaternions": [[-0.08311336992970998, -0.04568482241115004, 0.30048948478678583, 0.9490580303152146], [0.08494481444358826, 0.0019918798934668303, -0.020155522972345352, 0.9961798191070557], [-0.0011939916294068098, -0.09410761296749115, 0.012900157831609249, 0.9954777359962463]], "knots": [[42.8, 0, 0, 0, 0], [42.95, 1, 0, 0, 0], [43.14, 1, 0, 0, 0], [43.22, 0, 0, 0, 0]] }, { "hi": 1, "fi": 3, "previous": "p00401", "previousEnd": 86.658911, "next": "p00423", "nextTime": 89.480345, "knots": [[89.2, 0, 0, 0, 0], [89.25, 6, 0, 0, 0], [89.32, 13, 0, 0, 0], [89.35, 15, 0, 0, 0], [89.4, 25, 0, 0, 0], [89.43, 32, 0, 0, 0], [89.44, 30, 0, 0, 0], [89.45, 30.5, -0.5, 0.25, 0], [89.46, 29, 0, 0, 0], [89.47, 19, 0, 0, 0], [89.480345, 0, 0, 0, 0]], "mode": "hermite-controls" }, { "hi": 1, "fi": 1, "previous": "p00421", "previousEnd": 89.455345, "next": "p00436", "nextTime": 91.884804, "knots": [[90.77, 0, 0, 0, 0], [90.81, 0, 7, 0, 0], [90.845, 0, 7, 0, 0], [90.88, 0, 0, 0, 0]], "mode": "hermite-controls" }, { "hi": 1, "fi": 4, "previous": "p00415", "previousEnd": 88.357021, "next": "p00418", "nextTime": 88.407021, "knots": [[88.357021, 0, 0, 0, 0], [88.369521, -7, -2.5, 30, 5.75], [88.38202100000001, -17, -5.25, 32.75, 13], [88.394521, -6, 18.5, 5, 7.75], [88.407021, 0, 0, 0, 0]], "mode": "hermite-controls" }, { "hi": 1, "fi": 2, "previous": "p00014", "previousEnd": 4.596909999999999, "next": "p00020", "nextTime": 6.909129, "knots": [[6.045, 0, 0, 0, 0], [6.09, 7, 2, 0, 0], [6.14, 7, 2, 0, 0], [6.2, 0, 2, 0, 0], [6.25, 0, 0, 0, 0]] }, { "hi": 1, "fi": 2, "previous": "p00014", "previousEnd": 4.596909999999999, "next": "p00020", "nextTime": 6.909129, "knots": [[6.62, 0, 0, 0, 0], [6.65, 0, 1.5, 0, 0], [6.68, 0, 1.5, 0, 0], [6.72, 0, 0, 0, 0]] }, { "hi": 1, "fi": 2, "previous": "p00020", "previousEnd": 7.277744, "next": "p00025", "nextTime": 8.44759, "knots": [[7.3, 0, 0, 0, 0], [7.39, 0, 1.5, 0, 0], [8.24, 0, 1.5, 0, 0], [8.36, 0, 0, 0, 0]] }, { "hi": 1, "fi": 2, "previous": "p00029", "previousEnd": 9.992821, "next": "p00035", "nextTime": 10.816821, "knots": [[10.52, 0, 0, 0, 0], [10.55, 0, 1.5, 0, 0], [10.59, 0, 1.5, 0, 0], [10.63, 0, 0, 0, 0]] }, { "hi": 1, "fi": 2, "previous": "p00035", "previousEnd": 11.600821, "next": "p00048", "nextTime": 14.170007, "knots": [[11.600821, 0, 0, 0, 0], [11.623, 16, 6, 0, 0], [11.64, 16, 6, 0, 0], [11.665, 10, 3, 0, 0], [11.7, 3, 0.5, 0, 0], [11.75, 3, 0.5, 0, 0], [11.8, 0, 0, 0, 0]] }, { "hi": 1, "fi": 2, "previous": "p00035", "previousEnd": 11.600821, "next": "p00048", "nextTime": 14.170007, "knots": [[11.78, 0, 0, 0, 0], [11.94, 39, 19, 0, 0], [12.55, 39, 19, 0, 0], [12.67, 0, 0, 0, 0]] }, { "hi": 1, "fi": 1, "previous": "p00032", "previousEnd": 10.400821, "next": "p00039", "nextTime": 12.416821, "knots": [[12.27, 0, 0, 0, 0], [12.335, 5, 9, 0, 0], [12.39, 5, 9, 0, 0], [12.4, 5.8, 12, 0, 0], [12.416821, 0, 0, 0, 0]] }, { "hi": 1, "fi": 3, "previous": "p00037", "previousEnd": 12.392821000000001, "next": "p00055", "nextTime": 15.561346, "knots": [[12.392821, 0, 0, 0, 0], [12.407, 14, 0, 0, 0], [12.46, 14, 0, 0, 0], [12.55, 0, 0, 0, 0]] }] };
const idleSmooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
function matches(c, hi, fi, previous, next) {
    return c.hi === hi && c.fi === fi && c.previous === previous?.id && c.next === next?.id &&
        Math.abs(c.previousEnd - (previous ? previous.time + previous.duration : 0)) < 1e-7 &&
        (!next || Math.abs(c.nextTime - next.time) < 1e-7);
}
function rotate(bone, axis, degrees) {
    if (!degrees)
        return;
    const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    const world = new THREE.Quaternion().setFromAxisAngle(axis, degrees * Math.PI / 180);
    bone.quaternion.premultiply(parent.clone().invert().multiply(world).multiply(parent));
    bone.updateWorldMatrix(false, true);
}
// Call only from the inactive nonthumb branch, after its existing chain pose.
// Exact endpoint IDs/times bind each calibration to its measured idle interval.
function applyIdleNonthumb(time, side, fi, bones, wrist, base, previous, next) {
    const hi = side === 'L' ? 0 : 1;
    if (fi === 1) {
        const c = idleNonthumbData.supportedIndexGaps.find(c => matches(c, hi, fi, previous, next));
        if (c) {
            const amount = idleSmooth((base.y - KEY_TOP - .005) / .004) * idleSmooth((base.z - .244) / .008) * idleSmooth((time - c.previousEnd) / .25) * idleSmooth((c.nextTime - time) / .32);
            rotate(bones[0], new THREE.Vector3(1, 0, 0), 5 * amount);
        }
    }
    for (const c of idleNonthumbData.curves) {
        if (!matches(c, hi, fi, previous, next) || time <= c.knots[0][0] || time >= c.knots[c.knots.length - 1][0])
            continue;
        let index = 1;
        while (c.knots[index][0] < time)
            index++;
        const a = c.knots[index - 1], b = c.knots[index], dt = b[0] - a[0], u = (time - a[0]) / dt, weight = idleSmooth(u);
        if (c.mode === 'blend-neutral') {
            const amount = a[1] + (b[1] - a[1]) * weight;
            if (!c.neutralQuaternions || c.neutralQuaternions.length !== 3)
                throw new Error('Missing bound neutral joint triple');
            bones.forEach((bone, j) => { bone.quaternion.slerp(new THREE.Quaternion().fromArray(c.neutralQuaternions[j]), amount); bone.updateWorldMatrix(false, true); });
            continue;
        }
        const before = c.knots[Math.max(0, index - 2)], after = c.knots[Math.min(c.knots.length - 1, index + 1)];
        const v = a.slice(1).map((x, j) => {
            if (c.mode !== 'hermite-controls')
                return x + (b[j + 1] - x) * weight;
            const m0 = index === 1 ? (c.firstTangent?.[j] ?? 0) : (b[j + 1] - before[j + 1]) / (b[0] - before[0]);
            const m1 = index === c.knots.length - 1 ? (c.lastTangent?.[j] ?? 0) : (after[j + 1] - a[j + 1]) / (after[0] - a[0]);
            return (2 * u ** 3 - 3 * u * u + 1) * x + (u ** 3 - 2 * u * u + u) * dt * m0 + (-2 * u ** 3 + 3 * u * u) * b[j + 1] + (u ** 3 - u * u) * dt * m1;
        }), q = wrist.getWorldQuaternion(new THREE.Quaternion());
        const lift = new THREE.Vector3(-1, 0, 0).applyQuaternion(q), spread = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
        rotate(bones[0], lift, v[0]);
        rotate(bones[0], spread, v[1]);
        rotate(bones[1], lift, v[2]);
        rotate(bones[2], lift, v[3]);
    }
}
function releaseRepair(player,time){
 const envelope=smooth((time-106.65)/.13)*(1-smooth((time-107.35)/.20));if(envelope===0)return;
 const hand=player.hands[1];
 for(let fi=1;fi<5;fi++){
  if(hand.notes.some(n=>n.finger===fi+1&&n.time<=time&&n.time+n.duration>time))continue;
  const f=hand.fingers[fi],ns=hand.fingerNotes[fi];let previous,next;for(const n of ns){if(n.time+n.duration<=time)previous=n;else if(n.time>=time){next=n;break;}}
  const contact=(note,at)=>{const anchor=player.plannedPose(hand,at),origin=f.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position),z=note.contactZ??player.contactDepth(origin.z,isBlack(note.midi),fi),touch=v3(keyX(note.midi),keySurfaceY(note.midi,z,1)+(note.contactLift??.002),z),chain=player.fingerPoints(origin,touch,f,fi,anchor.q),points=[origin,chain.pip,chain.dip,chain.tip],world=f.bones.map((b,j)=>{const dir=points[j+1].clone().sub(points[j]).normalize(),normal=chain.normal;return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal,dir,normal.clone().cross(dir).normalize())).multiply(f.frameOffsets[j]);});return world.map((q,j)=>(j===0?anchor.q:world[j-1]).clone().invert().multiply(q));};
  let rotations=f.rest.map(q=>q.clone());
  if(fi===1&&previous&&next&&['p00519','p00524'].includes(previous.id)){
   const end=previous.time+previous.duration,gap=next.time-end,u=(time-end)/gap,a=contact(previous,end),b=contact(next,next.time);rotations=a.map((q,j)=>q.slerp(b[j],smooth(u)));rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(-1,0,0),Math.sin(u*Math.PI)**2*(45)*Math.PI/180));
   rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(0,0,-1),Math.sin(u*Math.PI)**2*(30)*Math.PI/180));
  }else{
   const since=previous?time-previous.time-previous.duration:100,before=next?next.time-time:100;
   const w=smooth(since/.19)*smooth(before/.27);const neutral=f.rest.map(q=>q.clone());neutral[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(-1,0,0),(40)*Math.PI/180));rotations.forEach((q,j)=>q.copy(f.bones[j].quaternion).slerp(neutral[j],w));
  }
  f.bones.forEach((b,j)=>{b.quaternion.slerp(rotations[j],envelope);b.updateWorldMatrix(false,true);});
 }
}
export class Pianist extends OriginalPianist {update(...args){super.update(...args);releaseRepair(this,args[0]);}}
