import * as T from 'three';

/** Select the dorsal palm from the actual skin, then measure its posed normal.
 * Call after the initial pose and skeleton matrices have been updated.
 * Geometry stays internal; callers should publish angles and counts only.
 */
export function createDorsalPalmSampler(body, hands) {
  const {skinIndex, skinWeight} = body.geometry.attributes;
  const index = body.geometry.index?.array;
  if (!index) throw new Error('Dorsal-palm review requires indexed skin geometry.');
  const selections = new Map();
  for (const hand of hands) {
    const boneIndex = body.skeleton.bones.indexOf(hand.wrist);
    if (boneIndex < 0) throw new Error(`Missing ${hand.side} wrist in skin skeleton.`);
    const inverse = hand.wrist.matrixWorld.clone().invert();
    const span = hand.fingers.slice(1).reduce((sum, finger) => sum + finger.bones[0].position.y, 0) / 4;
    const vertices = new Map();
    for (let id = 0; id < skinIndex.count; id++) {
      let weight = 0;
      for (let component = 0; component < 4; component++) {
        if (skinIndex.getComponent(id, component) === boneIndex) weight += skinWeight.getComponent(id, component);
      }
      if (weight >= .90) vertices.set(id, body.getVertexPosition(id, new T.Vector3()).applyMatrix4(body.matrixWorld).applyMatrix4(inverse));
    }
    const triangles = [];
    for (let i = 0; i < index.length; i += 3) {
      const ids = [index[i], index[i + 1], index[i + 2]];
      if (!ids.every(id => vertices.has(id))) continue;
      const [a, b, c] = ids.map(id => vertices.get(id));
      const centerY = (a.y + b.y + c.y) / 3;
      if (centerY < span * .25 || centerY > span * .80) continue;
      const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      if (-normal.z >= .5) triangles.push(ids);
    }
    if (!triangles.length) throw new Error(`No dorsal palm surface for ${hand.side}.`);
    selections.set(hand.side, {triangles, vertexIds: [...new Set(triangles.flat())]});
  }
  return {
    triangleCounts: Object.fromEntries([...selections].map(([side, entry]) => [side, entry.triangles.length])),
    normal(side) {
      const entry = selections.get(side);
      if (!entry) throw new Error(`Unknown hand ${side}.`);
      const vertices = new Map(entry.vertexIds.map(id => [id, body.getVertexPosition(id, new T.Vector3()).applyMatrix4(body.matrixWorld)]));
      const normal = new T.Vector3();
      for (const ids of entry.triangles) {
        const [a, b, c] = ids.map(id => vertices.get(id));
        normal.add(b.clone().sub(a).cross(c.clone().sub(a)));
      }
      if (!Number.isFinite(normal.lengthSq()) || normal.lengthSq() < 1e-20) throw new Error(`Invalid ${side} dorsal palm normal.`);
      return normal.normalize();
    },
  };
}

export const dorsalElevationDegrees = (proximal, normal) => Math.asin(T.MathUtils.clamp(proximal.dot(normal), -1, 1)) * 180 / Math.PI;
