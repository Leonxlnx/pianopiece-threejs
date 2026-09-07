import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, smooth, mix, v3, lowerBound } from './math.mjs';
import { keyX, isBlack, KEY_TOP, keySurfaceY } from './piano.mjs';
import { wristMotionSampler } from './wrist-motion.mjs';
import { ponytailMotion } from './ponytail-motion.mjs';
import { createWristVolumeCorrector } from './wrist-volume.mjs';
const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const TIP_LENGTH = [.027, .0243, .023, .0244, .0188];
const PALM_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(v3(-1, 0, 0), v3(0, 0, -1), v3(0, -1, 0)));
// Seat-to-keyboard distance is shared with the bench. World-space hand and
// pedal anchors stay fixed when the pelvis is moved back.
const SEAT_Z = .75;
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
export class Pianist {
    score;
    wristMotion;
    hairMotion;
    skinVolume;
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
        this.model.position.set(0, -.344, SEAT_Z);
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
                if (m.name === 'Human' && m.isSkinnedMesh)
                    this.skinVolume = createWristVolumeCorrector(THREE, m, { rollForearm: true, smoothWeights: 8 });
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
        this.model.position.set(clamp(reach * .048, -.020, .020), -.344, SEAT_Z);
        for (const n of ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'RightShoulder', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'])
            this.resetBone(n);
        const spine = this.bones.get('Spine'), spine1 = this.bones.get('Spine1'), head = this.bones.get('Head');
        spine.rotateX(.13 + (.043 * breath + .020 * impulse) * energy * ending);
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
    fingerPoints(base, target, f, fi, palmQ, opposition = 0, planeRoll = 0) {
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
        }
        if (fi === 0 && opposition !== 0)
            normal.applyAxisAngle(e, opposition);
        // A bounded idle route may roll the entire bend plane about its base-to-tip
        // axis. Segment lengths, endpoint reach, and calibrated skin frames stay fixed.
        if (fi > 0 && planeRoll !== 0)
            normal.applyAxisAngle(e, planeRoll);
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
        const params = [initialX, black ? .792 : .784, black ? .383 : .418, sign * .055, .035, 0];
        const bounds = [[-.61, .61], [.773, .811], [.305, .457], [-.19, .19], [-.09, .15], [-.15, .15]];
        const initial = [...params];
        const shoulder = wp(hand.upper);
        const quaternion = (p) => new THREE.Quaternion().setFromEuler(new THREE.Euler(p[4], p[5], p[3], 'YXZ')).multiply(PALM_Q);
        const cost = (p) => {
            const q = quaternion(p), w = v3(p[0], p[1], p[2]);
            let cost = 0;
            // Support the entire metacarpal arch, including fingers resting beside a
            // played thumb. A correct fingertip alone cannot keep a low palm out of keys.
            for (const f of hand.fingers.slice(1)) {
                const base = f.bones[0].position.clone().applyQuaternion(q).add(w);
                cost += Math.pow(Math.max(0, .7765 - base.y), 2) * 600;
            }
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
                cost += Math.pow(d - length * .88, 2) * 18 + Math.pow(Math.max(0, target.y + (fi === 0 ? .017 : .031) - base.y), 2) * 1800;
                if (fi > 0) {
                    const forward = shape.pip.clone().sub(base).normalize();
                    cost += Math.pow(Math.max(0, forward.z + .24), 2) * .015 + Math.pow(Math.max(0, Math.abs(forward.x) - .48), 2) * .03;
                }
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
            const current = hand.notes.filter(n => n.time <= time && n.time + n.duration > time);
            const pose = this.plannedPose(hand, time), x = pose.position.x;
            const wrist = pose.position.clone();
            // Small arm weight follows articulation; the fingertips themselves remain contact constrained.
            const word = hand.side === 'L' ? 'Left' : 'Right';
            for (const name of [word + 'Arm', word + 'ForeArm', word + 'Hand'])
                this.resetBone(name);
            let pressure = 0;
            for (const note of hand.notes) {
                const age = time - note.time;
                if (age < -.065 || age > .40)
                    continue;
                pressure += note.velocity * (age < 0 ? smooth((age + .065) / .065) : Math.exp(-age * 16));
            }
            const shoulder = wp(hand.upper);
            const elbow = this.supportedElbow(hand, shoulder, wrist, pose.q, pressure);
            aim(hand.upper, hand.lower, elbow);
            aim(hand.lower, hand.wrist, wrist);
            setWorldQ(hand.wrist, pose.q);
            // Per-transition clearance moves only a fully resting neighboring digit.
            // The source route supplies the same smooth lift/cruise/land envelope.
            const restClearance = Array.from({ length: 5 }, () => ({ offset: v3(), roll: 0 }));
            for (let moving = 1; moving < 5; moving++) {
                const notes = hand.fingerNotes[moving];
                for (let index = 0; index < notes.length; index++)
                    for (const kind of ['approachTravel', 'releaseTravel']) {
                        const note = notes[index], profile = note[kind];
                        if (!profile?.clearance)
                            continue;
                        const previous = notes[index - 1], next = notes[index + 1], noteEnd = note.time + note.duration;
                        if (kind === 'releaseTravel' && next && next.time - noteEnd < .50)
                            continue;
                        const begin = kind === 'releaseTravel' ? noteEnd : previous && note.time - previous.time - previous.duration < .50 ? previous.time + previous.duration : note.time - (profile.duration ?? .20), end = kind === 'releaseTravel' ? begin + (profile.duration ?? .16) : note.time;
                        const hold = clamp(profile.clearanceHold ?? .040, 0, .080), fade = clamp(profile.clearanceFade ?? .080, .060, .120);
                        if (time < begin || time > end + hold + fade)
                            continue;
                        const liftEnd = clamp(profile.liftEnd ?? 1 / 3, .05, .8), weight = smooth((time - begin) / ((end - begin) * liftEnd)) * smooth((end + hold + fade - time) / fade);
                        for (const clear of profile.clearance) {
                            const neighbor = clear.finger - 1;
                            if (neighbor < 1 || neighbor > 4 || neighbor === moving)
                                continue;
                            const offset = v3(clear.x ?? 0, clear.y ?? 0, clear.z ?? 0).clampLength(0, .025);
                            restClearance[neighbor].offset.addScaledVector(offset, weight);
                            restClearance[neighbor].roll += clamp(clear.roll ?? 0, -.25, .25) * weight;
                        }
                    }
            }
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
                    // A compact authored rest transports the thumb with the palm without
                    // rebuilding its web from a moving world target. Preserve the original
                    // MCP/IP rest frames and lift at the carpometacarpal joint.
                    const idlePose = finger.rest.map(q => q.clone());
                    idlePose[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(1, 0, 0), -.90))
                        .premultiply(new THREE.Quaternion().setFromAxisAngle(v3(0, 1, 0), hand.side === 'L' ? -.75 : .75))
                        .premultiply(new THREE.Quaternion().setFromAxisAngle(v3(0, 0, 1), hand.side === 'L' ? .55 : -.55));
                    idlePose[1].multiply(new THREE.Quaternion().setFromAxisAngle(v3(1, 0, 0), -.45));
                    idlePose[2].multiply(new THREE.Quaternion().setFromAxisAngle(v3(1, 0, 0), .20));
                    // The anchor wrist frame stays fixed, but its key height follows the
                    // actual hinged key during approach and release (including pre-travel).
                    const contactPose = (note, at) => { const anchor = this.plannedPose(hand, at), origin = finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position), z = note.contactZ ?? this.contactDepth(origin.z, isBlack(note.midi), fi), touch = piano.contact(note.midi, z).add(v3(0, note.contactLift ?? .002, 0)); return localPose(anchor.position, anchor.q, touch, note.thumbOpposition ?? 0); };
                    const previous = prev && prev.time + prev.duration <= time ? prev : undefined, next = nxt && nxt.time >= time ? nxt : undefined;
                    const end = previous ? previous.time + previous.duration : -10, start = next?.time ?? 1e6, gap = start - end;
                    let rotations = idlePose.map(q => q.clone());
                    if (previous && next && gap < .50) {
                        const u = clamp((time - end) / Math.max(.001, gap)), s = smooth(u), a = contactPose(previous, end), b = contactPose(next, start), restWeight = smooth((time - end) / Math.min(.032, gap * .5)) * smooth((start - time) / Math.min(.029, gap * .5)) * .90;
                        rotations = a.map((q, j) => q.slerp(b[j], s).slerp(idlePose[j], restWeight));
                    }
                    else {
                        if (previous) {
                            const a = contactPose(previous, end), weight = 1 - smooth((time - end) / .080);
                            rotations.forEach((q, j) => q.slerp(a[j], weight));
                        }
                        if (next) {
                            const b = contactPose(next, start), weight = smooth(1 - (start - time) / .100);
                            rotations.forEach((q, j) => q.slerp(b[j], weight));
                        }
                    }
                    finger.bones.forEach((bone, j) => { bone.quaternion.copy(rotations[j]); bone.updateWorldMatrix(false, true); });
                    continue;
                }
                const desired = target.clone();
                const shape = this.fingerPoints(base, target, finger, fi, undefined, n?.thumbOpposition ?? 0);
                const points = [base, shape.pip, shape.dip, shape.tip];
                if (!n && fi > 0) {
                    // Preserve the existing clear settled rest, and transport complete joint
                    // poses through travel. Intermediate world tips near MCP can force a claw.
                    const localPose = (wristPosition, wristQ, touch, opposition = 0, planeRoll = 0) => {
                        const origin = finger.bones[0].position.clone().applyQuaternion(wristQ).add(wristPosition), chain = this.fingerPoints(origin, touch, finger, fi, wristQ, opposition, planeRoll), p = [origin, chain.pip, chain.dip, chain.tip];
                        const world = finger.bones.map((bone, j) => { const dir = p[j + 1].clone().sub(p[j]).normalize(), normal = chain.normal; return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal, dir, normal.clone().cross(dir).normalize())).multiply(finger.frameOffsets[j]); });
                        return world.map((q, j) => (j === 0 ? wristQ : world[j - 1]).clone().invert().multiply(q));
                    };
                    const settings = this.jointTransport ?? {};
                    const restTouch = idle.clone().setY(Math.max(idle.y, KEY_TOP + .057));
                    const ownEnd = prev && prev.time + prev.duration <= time ? prev.time + prev.duration : -100, ownStart = nxt && nxt.time >= time ? nxt.time : 1e6;
                    const clearanceWeight = smooth((time - ownEnd - (prev?.releaseTravel?.duration ?? .16)) / .080) * smooth((ownStart - time - (nxt?.approachTravel?.duration ?? .20)) / .080);
                    restTouch.addScaledVector(restClearance[fi].offset.clone().clampLength(0, .025), clearanceWeight);
                    const natural = localPose(wp(hand.wrist), pose.q, restTouch, 0, clamp(restClearance[fi].roll, -.25, .25) * clearanceWeight);
                    const contactPose = (note, at) => { const anchor = this.plannedPose(hand, at), origin = finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position), z = note.contactZ ?? this.contactDepth(origin.z, isBlack(note.midi), fi), touch = piano.contact(note.midi, z).add(v3(0, note.contactLift ?? .002, 0)); return localPose(anchor.position, anchor.q, touch, note.thumbOpposition ?? 0); };
                    const previous = prev && prev.time + prev.duration <= time ? prev : undefined, next = nxt && nxt.time >= time ? nxt : undefined;
                    const end = previous ? previous.time + previous.duration : -10, start = next?.time ?? 1e6, gap = start - end;
                    const release = Math.min(previous?.releasePose?.duration ?? settings.release ?? .080, gap * .5), approach = Math.min(next?.approachPose?.duration ?? settings.approach ?? .100, gap * .5);
                    // Only expressly reviewed long releases use a world-space waypoint.
                    // Held notes and every unflagged joint-transport route retain V7 exactly.
                    const route = previous?.releaseWaypoint;
                    if (route?.enabled && gap >= .50 && route.duration > 0 && route.duration <= gap - approach && time - end < route.duration) {
                        const anchor = this.plannedPose(hand, end), origin = finger.bones[0].position.clone().applyQuaternion(anchor.q).add(anchor.position), z = previous.contactZ ?? this.contactDepth(origin.z, isBlack(previous.midi), fi);
                        const contact = piano.contact(previous.midi, z).add(v3(0, previous.contactLift ?? .002, 0));
                        const u = clamp((time - end) / route.duration), liftEnd = clamp(route.liftEnd, .05, .45), landStart = clamp(route.landStart, liftEnd + .05, .95);
                        const lift = smooth(u / liftEnd), land = smooth((u - landStart) / (1 - landStart)), cruise = smooth((u - liftEnd) / (landStart - liftEnd)), envelope = lift * (1 - land);
                        const touch = contact.clone().lerp(restTouch, cruise);
                        touch.x += route.x * envelope;
                        touch.z += route.z * envelope;
                        touch.y = mix(mix(contact.y, route.height, lift), restTouch.y, land);
                        const rotations = localPose(wp(hand.wrist), pose.q, touch, 0, route.roll * envelope);
                        finger.bones.forEach((bone, j) => { bone.quaternion.copy(rotations[j]); bone.updateWorldMatrix(false, true); });
                        continue;
                    }
                    let rotations = natural.map(q => q.clone());
                    if (previous && time - end < release) {
                        const contact = contactPose(previous, end), weight = 1 - smooth((time - end) / Math.max(.001, release));
                        const distal = previous.releasePose?.distalDuration;
                        const distalWeight = distal === undefined ? weight : 1 - smooth((time - end) / clamp(distal, Math.min(.010, release), release));
                        rotations.forEach((q, j) => q.slerp(contact[j], j > 0 ? distalWeight : weight));
                    }
                    if (next && start - time < approach) {
                        const contact = contactPose(next, start), weight = 1 - smooth((start - time) / Math.max(.001, approach));
                        const distal = next.approachPose?.distalDuration;
                        const distalWeight = distal === undefined ? weight : 1 - smooth((start - time) / clamp(distal, Math.min(.010, approach), approach));
                        rotations.forEach((q, j) => q.slerp(contact[j], j > 0 ? distalWeight : weight));
                    }
                    // Lift the complete chain during each departure/arrival blend. Relative
                    // phalanx rotations remain fixed; the settled rest and contacts are exact.
                    let liftWeight = 0, liftDegrees = settings.arc ?? 20, sweepDegrees = 0, rollDegrees = 0;
                    if (previous && time - end < release) {
                        const u = smooth((time - end) / Math.max(.001, release));
                        liftWeight = 4 * u * (1 - u);
                        liftDegrees = previous.releasePose?.liftDegrees ?? liftDegrees;
                        sweepDegrees = previous.releasePose?.sweepDegrees ?? 0;
                        const path = previous.releasePose?.jointPath;
                        if (path && path.length >= 2) {
                            const progress = clamp((time - end) / Math.max(.001, release));
                            const index = Math.max(1, path.findIndex(p => p.at >= progress));
                            const a = path[index - 1], b = path[index], weight = smooth((progress - a.at) / (b.at - a.at));
                            liftWeight = 1;
                            liftDegrees = mix(a.lift, b.lift, weight);
                            sweepDegrees = mix(a.sweep, b.sweep, weight);
                            rollDegrees = mix(a.roll ?? 0, b.roll ?? 0, weight);
                        }
                    }
                    if (next && start - time < approach) {
                        const u = smooth((start - time) / Math.max(.001, approach));
                        liftWeight = Math.max(liftWeight, 4 * u * (1 - u));
                        liftDegrees = next.approachPose?.liftDegrees ?? liftDegrees;
                        sweepDegrees = next.approachPose?.sweepDegrees ?? 0;
                    }
                    if (liftWeight > 0) {
                        const proximal = finger.bones[1].position.clone().applyQuaternion(rotations[0]).normalize().applyQuaternion(pose.q), dorsal = v3(0, 0, -1).applyQuaternion(pose.q), axis = proximal.clone().cross(v3(0, 1, 0));
                        const elevation = Math.asin(clamp(proximal.dot(dorsal), -1, 1)), available = Math.max(0, 55 * Math.PI / 180 - elevation), angle = Math.min(liftDegrees * Math.PI / 180 * liftWeight, available);
                        if (axis.lengthSq() > 1e-8 && angle > 0)
                            rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(axis.normalize().applyQuaternion(pose.q.clone().invert()), angle));
                        // A small joint-space sweep clears a neighboring digit without altering
                        // relative PIP/DIP rotations. The envelope is zero at contact and rest.
                        if (sweepDegrees !== 0)
                            rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(0, 0, -1), sweepDegrees * Math.PI / 180 * liftWeight));
                        if (rollDegrees !== 0) {
                            const axial = finger.bones[1].position.clone().applyQuaternion(rotations[0]).normalize();
                            rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(axial, rollDegrees * Math.PI / 180));
                        }
                    }
                    finger.bones.forEach((bone, j) => { bone.quaternion.copy(rotations[j]); bone.updateWorldMatrix(false, true); });
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
        this.skinVolume?.update();
    }
    supportedElbow(hand, shoulder, wrist, palmQ, pressure) {
        const side = hand.side === 'L' ? -1 : 1, a = hand.lower.position.length(), b = hand.wrist.position.length();
        const axis = wrist.clone().sub(shoulder), distance = clamp(axis.length(), .0001, a + b - .00001);
        axis.normalize();
        const along = (a * a - b * b + distance * distance) / (2 * distance), radius = Math.sqrt(Math.max(1e-8, a * a - along * along));
        const center = shoulder.clone().addScaledVector(axis, along);
        // Choose the elbow on the exact two-link circle that most nearly continues
        // the palm. A fixed outward pole made the forearm meet the wrist sideways.
        const forward = hand.fingers.slice(1, 4).reduce((sum, f) => sum.add(f.bones[0].position), v3()).normalize().applyQuaternion(palmQ);
        const desired = wrist.clone().addScaledVector(forward, -b).sub(center);
        desired.addScaledVector(axis, -desired.dot(axis));
        const outward = v3(side, 0, 0).addScaledVector(axis, -side * axis.x).normalize();
        const around = axis.clone().cross(outward).normalize();
        let angle = Math.atan2(desired.dot(around), desired.dot(outward));
        // The outer blouse occupies the central corridor. Restrict the circle's
        // outward projection rather than blending elbow positions (which shortens
        // bones). This remains an absolute-time, continuous geometric constraint.
        const clearance = .183 + .008 * (1 - Math.exp(-pressure * .7));
        const extent = Math.max(1e-7, radius * Math.hypot(outward.x, around.x));
        const required = clamp((clearance - side * center.x) / extent, -1, 1);
        const boundary = Math.acos(required);
        // acos has an unbounded slope as the outward-clearance circle collapses.
        // Taper the angular allowance before that limit so elbow motion remains
        // smooth; a smaller angle stays farther outward on the exact same circle.
        const roundedBoundary = boundary * smooth(boundary / .65);
        angle = clamp(angle, -roundedBoundary, roundedBoundary);
        return center.addScaledVector(outward, radius * Math.cos(angle)).addScaledVector(around, radius * Math.sin(angle));
    }
}
