import * as THREE from 'three';
import { lowerBound } from './math.mjs';
/** Offline-constrained trajectory; every pose is reconstructed from score time. */
export function wristMotionSampler(data) {
    const hands = new Map(data.hands.map(hand => [hand.side, hand.knots.map(k => ({
            ...k,
            p: new THREE.Vector3().fromArray(k.position),
            q: new THREE.Quaternion().fromArray(k.quaternion),
        }))]));
    return (side, time) => {
        const knots = hands.get(side);
        if (!knots?.length)
            throw new Error(`Missing ${side} wrist trajectory.`);
        const index = lowerBound(knots, time, k => k.time);
        const a = knots[Math.max(0, index - 1)];
        const b = knots[Math.min(index, knots.length - 1)];
        if (a === b)
            return { position: a.p.clone(), q: a.q.clone() };
        const begin = b.moveStart ?? a.time;
        const end = b.moveEnd ?? b.time;
        const t = Math.max(0, Math.min(1, (time - begin) / Math.max(.000001, end - begin)));
        const u = t * t * t * (10 + t * (-15 + 6 * t));
        const position = a.p.clone().lerp(b.p, u);
        if (b.arcLift)
            position.y += b.arcLift * 16 * u * u * (1 - u) * (1 - u);
        return { position, q: a.q.clone().slerp(b.q, u) };
    };
}
