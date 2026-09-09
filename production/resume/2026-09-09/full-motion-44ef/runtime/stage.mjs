import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { v3, rand, mix, smooth } from './math.mjs';
function surfaceMap(url, x, y, pending) {
    let texture;
    if (typeof Image === 'undefined')
        texture = new THREE.Texture();
    else {
        let complete, failed;
        const ready = new Promise((resolve, reject) => { complete = resolve; failed = reject; });
        texture = new THREE.TextureLoader().load(url, () => complete(), undefined, failed);
        pending.push(ready);
    }
    texture.userData.sourcePath = 'public' + url;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(x, y);
    texture.anisotropy = 8;
    return texture;
}
function block(parent, name, size, position, mat, r = .008) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 2, r), mat);
    mesh.name = name;
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}
function instances(parent, name, geometry, material, poses) {
    const mesh = new THREE.InstancedMesh(geometry, material, poses.length), dummy = new THREE.Object3D();
    mesh.name = name;
    poses.forEach((pose, i) => { dummy.position.set(...pose.p); dummy.scale.set(...(pose.s ?? [1, 1, 1])); dummy.rotation.set(0, pose.r ?? 0, 0); if (pose.q)
        dummy.quaternion.fromArray(pose.q); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); if (pose.c)
        mesh.setColorAt(i, pose.c); });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}
export class Stage {
    pendingTextures = [];
    group = new THREE.Group();
    reflector;
    dust;
    beams = [];
    lights = [];
    sky;
    ribs = [];
    accent;
    constructor(scene, mobile) {
        const map = (url, x, y) => surfaceMap(url, x, y, this.pendingTextures);
        this.group.name = 'Daybreak recital pavilion';
        scene.add(this.group);
        const walnut = map('/assets/materials/walnut.png', 1, 1), limestone = map('/assets/materials/limestone.png', 1.5, 1.5);
        const wood = new THREE.MeshPhysicalMaterial({ name: 'Satin walnut', color: 0xb09b86, map: walnut, roughness: .46, metalness: 0, clearcoat: .20, clearcoatRoughness: .39 });
        const stone = new THREE.MeshStandardMaterial({ name: 'Honed limestone', color: 0xb7b6af, map: limestone, roughness: .81 });
        const dark = new THREE.MeshStandardMaterial({ name: 'Shadow joints', color: 0x242529, roughness: .87 });
        const bronze = new THREE.MeshStandardMaterial({ name: 'Brushed bronze frames', color: 0x4d4539, metalness: .80, roughness: .35 });
        const plaster = new THREE.MeshStandardMaterial({ name: 'Acoustic plaster', color: 0xc8c5bb, roughness: .92 });
        const glazing = new THREE.MeshPhysicalMaterial({ name: 'Window glass', color: 0xc2d3d1, roughness: .07, metalness: 0, transparent: true, opacity: .10, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
        const glow = new THREE.MeshBasicMaterial({ name: 'Warm concealed lighting', color: new THREE.Color(1.3, .95, .61), toneMapped: true });
        // Grounded room geometry and a continuous walking surface: no floating stage.
        block(this.group, 'Floor structure', [15.5, .24, 13.5], [0, -.142, -1.2], dark, .008);
        const boards = [];
        for (let row = 0; row < 50; row++)
            for (let col = 0; col < 8; col++) {
                const z = -7.55 + row * .27, x = -7.6 + col * 1.9 + (row % 2) * .95;
                if (x > 7.1)
                    continue;
                const c = new THREE.Color().setRGB(.79 + rand(row * 39 + col) * .15, .77 + rand(row * 39 + col) * .13, .72 + rand(row * 39 + col) * .12);
                boards.push({ p: [x + .948, -.014, z + .134], c });
            }
        instances(this.group, 'Individual walnut floorboards', new RoundedBoxGeometry(1.8985, .030, .2685, 1, .0007), wood, boards);
        // The broad reflection stays very weak: varnished wood is not a polished mirror.
        this.reflector = new Reflector(new THREE.PlaneGeometry(5.4, 5.4), { textureWidth: mobile ? 512 : 1024, textureHeight: mobile ? 512 : 1024, color: 0x1d1711, clipBias: .006, multisample: 0 });
        this.reflector.name = 'Subtle floor sheen';
        this.reflector.rotation.x = -Math.PI / 2;
        this.reflector.position.set(0, .0025, -.55); // Clear the .001 m board tops to avoid depth ties.
        const rm = this.reflector.material;
        rm.transparent = true;
        rm.depthWrite = false;
        rm.fragmentShader = rm.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );', `vec4 base=texture2DProj(tDiffuse,vUv);vec2 d=vec2(.003,.003)*vUv.w;base+=texture2DProj(tDiffuse,vUv+vec4(d,0.,0.));base+=texture2DProj(tDiffuse,vUv-vec4(d,0.,0.));base/=3.;`);
        rm.fragmentShader = rm.fragmentShader.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );', 'gl_FragColor = vec4( blendOverlay( base.rgb, color ), 0.085 );');
        this.group.add(this.reflector);
        // Limestone piers support the rear window wall; every opening has a sill,
        // jamb, bronze frame, glazing gasket and an overhead structure.
        block(this.group, 'Rear foundation', [15.4, .40, .65], [0, .12, -7.05], stone, .012);
        block(this.group, 'Rear lintel', [15.4, .60, .68], [0, 4.65, -7.05], stone, .02);
        for (let i = 0; i < 7; i++) {
            const x = -7.2 + i * 2.4;
            block(this.group, 'Window pier ' + i, [.31, 4.3, .70], [x, 2.2, -7.02], stone, .018);
            if (i < 6) {
                const center = x + 1.2;
                block(this.group, 'Window sill ' + i, [2.12, .055, .82], [center, .335, -7.02], stone, .01);
                block(this.group, 'Window head ' + i, [2.08, .035, .10], [center, 4.32, -6.98], bronze, .003);
                const pane = block(this.group, 'Glazing ' + i, [2.04, 3.95, .014], [center, 2.33, -7.00], glazing, .001);
                pane.castShadow = false;
                for (const sx of [-1.027, 1.027])
                    block(this.group, 'Bronze jamb ' + i, [.035, 3.96, .10], [center + sx, 2.33, -6.98], bronze, .003);
                block(this.group, 'Window transom ' + i, [2.06, .024, .08], [center, 3.35, -6.96], bronze, .002);
            }
        }
        // Side walls stay outside the intimate camera orbit and ground the room.
        for (const side of [-1, 1]) {
            block(this.group, 'Limestone side return', [.45, 4.75, 11.8], [side * 7.47, 2.23, -1.02], stone, .016);
            block(this.group, 'Low walnut acoustic lining', [.048, 1.10, 10.6], [side * 7.225, .65, -1.35], wood, .006);
            block(this.group, 'Bronze baseboard', [.035, .055, 11.8], [side * 7.22, .063, -1.02], bronze, .003);
            block(this.group, 'Upper wall reveal', [.12, .08, 11.8], [side * 7.20, 4.18, -1.02], dark, .002);
            block(this.group, 'Concealed wall light', [.014, .018, 11.65], [side * 7.13, 4.17, -1.02], glow, .001);
        }
        // The camera-facing end of the pavilion is an actual enclosed entrance,
        // so portrait views look into architecture rather than an unbounded sky.
        for (const side of [-1, 1]) {
            block(this.group, 'Entrance wall', [6.06, 4.72, .35], [side * 4.54, 2.24, 5.48], stone, .014);
            block(this.group, 'Entrance acoustic panel', [4.80, 2.18, .045], [side * 4.43, 1.38, 5.283], wood, .006);
            block(this.group, 'Entrance panel lower reveal', [4.80, .020, .025], [side * 4.43, .281, 5.25], bronze, .002);
        }
        block(this.group, 'Door lintel', [3.02, 1.86, .35], [0, 3.67, 5.48], stone, .013);
        const doorMap = map('/assets/materials/walnut.png', .65, 1.65), doorWood = new THREE.MeshStandardMaterial({ name: 'Walnut entrance joinery', color: 0x92806b, map: doorMap, roughness: .54 });
        for (const side of [-1, 1]) {
            block(this.group, 'Solid entrance door', [1.42, 2.60, .065], [side * .728, 1.337, 5.43], doorWood, .004);
            block(this.group, 'Entrance door stile', [.026, 2.61, .09], [side * 1.464, 1.337, 5.38], bronze, .002);
            block(this.group, 'Bronze door pull', [.013, .35, .045], [side * .122, 1.18, 5.361], bronze, .004);
        }
        block(this.group, 'Entrance threshold', [2.95, .026, .30], [0, .004, 5.36], stone, .004);
        block(this.group, 'Ceiling slab', [15.45, .25, 13.35], [0, 4.98, -1.17], plaster, .02);
        const slats = [];
        for (let i = 0; i < 42; i++)
            slats.push({ p: [-7.21 + i * .351, 4.69, -1.17] });
        instances(this.group, 'Timber acoustic ceiling battens', new RoundedBoxGeometry(.13, .22, 13.05, 1, .004), wood, slats);
        for (const z of [-5.8, -2.3, 1.2, 4.25])
            block(this.group, 'Ceiling cross beam', [14.7, .20, .18], [0, 4.50, z], wood, .008);
        for (const x of [-4.8, 4.8])
            block(this.group, 'Ceiling slot light', [.035, .008, 10.9], [x, 4.563, -1.45], glow, .001);
        // Outside the windows: a shallow court, a limestone walk and a layered
        // grove. Planting covers the terrain rather than stopping at a flat edge.
        const gardenHeight = (x, z) => -.165 + smooth((-z - 12.8) / 8) * (.18 * Math.sin(x * .13 + z * .11) + .11 * Math.cos(x * .29 - z * .10)) + smooth((-z - 26) / 24) * 1.8;
        const earth = new THREE.MeshStandardMaterial({ name: 'Planted garden terrain', color: 0x89916e, roughness: 1, vertexColors: true });
        const groundGeometry = new THREE.PlaneGeometry(90, 77, mobile ? 38 : 70, mobile ? 34 : 60);
        groundGeometry.rotateX(-Math.PI / 2);
        groundGeometry.translate(0, 0, -43.5);
        const groundPos = groundGeometry.attributes.position, groundColors = new Float32Array(groundPos.count * 3);
        for (let i = 0; i < groundPos.count; i++) {
            const x = groundPos.getX(i), z = groundPos.getZ(i);
            groundPos.setY(i, gardenHeight(x, z));
            const shade = .78 + .12 * Math.sin(x * .61 + z * .38) + .09 * Math.sin(x * 1.62 - z * .43) + rand(i + 401) * .07;
            groundColors.set([shade * .96, shade, shade * .83], i * 3);
        }
        groundGeometry.setAttribute('color', new THREE.BufferAttribute(groundColors, 3));
        groundGeometry.computeVertexNormals();
        const ground = new THREE.Mesh(groundGeometry, earth);
        ground.name = 'Continuous planted garden';
        ground.receiveShadow = true;
        this.group.add(ground);
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(24, 3.5), new THREE.MeshPhysicalMaterial({ name: 'Courtyard water', color: 0x607572, metalness: .18, roughness: .19, clearcoat: 1 }));
        pool.name = 'Shallow reflecting pool';
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(0, -.115, -9.8);
        this.group.add(pool);
        const paving = [], curbs = [];
        // The pavers run behind the water and return at each end, leaving the
        // central view quiet. Small joints and low edging give the court a scale.
        for (let row = 0; row < 2; row++)
            for (let col = 0; col < 42; col++) {
                const shade = .80 + rand(row * 89 + col + 806) * .17;
                paving.push({ p: [-12.3 + col * .60, -.095, -12.02 - row * .60], s: [.592, .10, .592], c: new THREE.Color(shade, shade * .99, shade * .96) });
            }
        for (const side of [-1, 1])
            for (let row = 0; row < 9; row++)
                for (let col = 0; col < 2; col++) {
                    const shade = .83 + rand(row * 39 + col + side + 880) * .13;
                    paving.push({ p: [side * (12.64 + col * .60), -.095, -7.62 - row * .60], s: [.592, .10, .592], c: new THREE.Color(shade, shade * .99, shade * .97) });
                }
        for (let col = 0; col < 42; col++)
            paving.push({ p: [-12.3 + col * .60, -.095, -7.62], s: [.592, .10, .592], c: new THREE.Color(.88, .87, .84) });
        for (const z of [-8, -11.6])
            curbs.push({ p: [0, -.08, z], s: [24.9, .16, .24] });
        for (const side of [-1, 1])
            curbs.push({ p: [side * 12.34, -.08, -9.8], s: [.24, .16, 3.72] });
        curbs.push({ p: [0, -.08, -12.99], s: [25.25, .16, .11] });
        instances(this.group, 'Limestone garden paving', new THREE.BoxGeometry(1, 1, 1), stone, paving);
        instances(this.group, 'Low pool and planting curbs', new RoundedBoxGeometry(1, 1, 1, 1, .015), stone, curbs);
        const branches = [], leaves = [];
        const up = v3(0, 1, 0);
        const branch = (a, b, r) => { const d = b.clone().sub(a); branches.push({ p: a.clone().add(b).multiplyScalar(.5).toArray(), s: [r, d.length(), r], q: new THREE.Quaternion().setFromUnitVectors(up, d.normalize()).toArray() }); };
        const leafCloud = (center, seed, count, radius, height, size, shade) => {
            for (let k = 0; k < count; k++) {
                const j = seed + k * 11, a = rand(j) * Math.PI * 2, r = Math.sqrt(rand(j + 1)) * radius, yy = (rand(j + 2) - .5) * height;
                const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rand(j + 3) - .5) * 2.8, rand(j + 4) * Math.PI * 2, (rand(j + 5) - .5) * 2.2));
                const scale = size * (.72 + rand(j + 6) * .68), tone = shade * (.74 + rand(j + 7) * .38);
                leaves.push({ p: center.clone().add(v3(Math.cos(a) * r, yy, Math.sin(a) * r)).toArray(), s: [scale, scale, scale], q: q.toArray(), c: new THREE.Color().setRGB(.67 * tone, .78 * tone, .45 * tone) });
            }
        };
        for (let i = 0; i < 18; i++) {
            const x = -22.5 + i * 2.65 + (rand(i + 906) - .5) * 2.25, z = -15 - rand(i + 933) * 17, h = 4.1 + rand(i + 918) * 4.0;
            const base = v3(x, gardenHeight(x, z) - .035, z), bend = v3((rand(i + 210) - .5) * 1.2, 0, (rand(i + 212) - .5) * .85), joints = [base];
            for (let j = 1; j <= 4; j++) {
                const t = j / 4, p = base.clone().add(v3(bend.x * t * t, h * t, bend.z * t * t));
                branch(joints[j - 1], p, (.115 + rand(i + 920) * .055) * (1 - t * .65));
                joints.push(p);
            }
            const limbCount = 11 + Math.floor(rand(i + 960) * 5);
            for (let n = 0; n < limbCount; n++) {
                const t = .30 + n / limbCount * .62, angle = n * 2.399 + i * .71 + (rand(i * 55 + n) - .5) * .8;
                const height = h * t, start = base.clone().add(v3(bend.x * t * t, height, bend.z * t * t));
                const spread = (.9 + rand(i * 33 + n) * 1.55) * (1.30 - t * .56);
                const end = start.clone().add(v3(Math.cos(angle) * spread, .45 + rand(i * 17 + n) * .95, Math.sin(angle) * spread));
                const elbow = start.clone().lerp(end, .53).add(v3(0, -.08 - rand(i * 31 + n) * .21, 0));
                branch(start, elbow, .028 + rand(i * 29 + n) * .018);
                branch(elbow, end, .016 + rand(i * 49 + n) * .008);
                for (let twig = 0; twig < 3; twig++) {
                    const end2 = end.clone().add(v3((rand(i * 137 + n * 5 + twig) - .5) * 1.15, .08 + rand(n * 8 + twig) * .53, (rand(i * 97 + n * 7 + twig) - .5) * 1.15));
                    branch(end.clone().lerp(elbow, .18), end2, .0055);
                    leafCloud(end2, i * 9001 + n * 311 + twig * 71, mobile ? 20 : 42, .50, .56, 1, .88 + rand(i + 71) * .25);
                }
            }
        }
        // Loose drifts of low shrubs interrupt the trunks; their leaves and
        // stems share the tree batches rather than adding a draw call per plant.
        for (let i = 0; i < 44; i++) {
            const x = -18 + rand(i * 13 + 3301) * 36, z = -13.65 - rand(i * 19 + 3302) * 10.5, base = v3(x, gardenHeight(x, z) - .025, z), h = .36 + rand(i * 7 + 3303) * .62;
            for (let stem = 0; stem < 5; stem++) {
                const a = stem * 2.399 + rand(i + 58), r = .18 + rand(i * 51 + stem) * .40, end = base.clone().add(v3(Math.cos(a) * r, h * (.60 + rand(i * 29 + stem) * .40), Math.sin(a) * r));
                branch(base, end, .0048);
                leafCloud(end, i * 5003 + stem * 631 + 73001, mobile ? 30 : 48, .34, .38, .80, .91 + rand(i + 441) * .12);
            }
        }
        const bark = new THREE.MeshStandardMaterial({ name: 'Garden bark', color: 0x7a7260, roughness: 1 });
        instances(this.group, 'Branched courtyard trees and shrubs', new THREE.CylinderGeometry(.62, 1, 1, 7), bark, branches);
        const leafGeometry = new THREE.BufferGeometry();
        leafGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -.029, .064, 0, 0, .15, -.003, .029, .064, 0, 0, .062, .012], 3));
        leafGeometry.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]);
        leafGeometry.computeVertexNormals();
        const foliage = new THREE.MeshStandardMaterial({ name: 'Individual garden leaves', color: 0x8a9a65, roughness: .94, side: THREE.DoubleSide });
        instances(this.group, 'Individual courtyard leaves', leafGeometry, foliage, leaves);
        const grassPos = [], grassIndices = [];
        for (let b = 0; b < 5; b++) {
            const a = b * 2.399, c = Math.cos(a), s = Math.sin(a), lean = .09 + rand(b + 620) * .09, h = .27 + rand(b + 621) * .24, k = grassPos.length / 3;
            grassPos.push(-s * .014, 0, c * .014, s * .014, 0, -c * .014, c * lean * .35 - s * .008, h * .52, s * lean * .35 + c * .008, c * lean * .35 + s * .008, h * .52, s * lean * .35 - c * .008, c * lean, h, s * lean);
            grassIndices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2, k + 2, k + 3, k + 4);
        }
        const grassGeometry = new THREE.BufferGeometry();
        grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(grassPos, 3));
        grassGeometry.setIndex(grassIndices);
        grassGeometry.computeVertexNormals();
        const grass = [];
        for (let i = 0; i < (mobile ? 550 : 1100); i++) {
            const x = -25 + rand(i * 7 + 12401) * 50, z = -13.25 - rand(i * 11 + 12402) * 27;
            const scale = .48 + rand(i * 13 + 12403) * .80, tone = .71 + rand(i * 17 + 12404) * .34;
            grass.push({ p: [x, gardenHeight(x, z) - .018, z], s: [scale, scale, scale], r: rand(i + 12405) * Math.PI * 2, c: new THREE.Color(tone * .84, tone, tone * .66) });
        }
        instances(this.group, 'Meadow grass drifts', grassGeometry, new THREE.MeshStandardMaterial({ name: 'Fine garden grasses', color: 0x859166, roughness: 1, side: THREE.DoubleSide }), grass);
        const rocks = [];
        for (let i = 0; i < 26; i++) {
            const x = -18 + rand(i * 31 + 14501) * 36, z = -13.7 - rand(i * 23 + 14502) * 11, scale = .12 + rand(i * 17 + 14503) * .26, tone = .66 + rand(i * 43 + 14504) * .24;
            rocks.push({ p: [x, gardenHeight(x, z) + scale * .12, z], s: [scale * (1 + rand(i + 14505)), scale * .56, scale * (.75 + rand(i + 14506) * .60)], r: rand(i + 14507) * 6.28, c: new THREE.Color(tone, tone * .99, tone * .92) });
        }
        instances(this.group, 'Weathered planting stones', new THREE.IcosahedronGeometry(1, 1), stone, rocks);
        this.sky = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { uLift: { value: 0 }, uTime: { value: 0 } }, vertexShader: 'varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: `varying vec3 vPosition;uniform float uLift;void main(){vec3 p=normalize(vPosition);float h=smoothstep(-.06,.75,p.y);vec3 horizon=mix(vec3(.38,.46,.50),vec3(.66,.64,.57),uLift);vec3 zenith=mix(vec3(.13,.25,.37),vec3(.24,.39,.51),uLift);vec3 c=mix(horizon,zenith,h);float sun=pow(max(0.,dot(p,normalize(vec3(-.63,.25,-.74)))),52.);c+=vec3(.25,.18,.09)*sun;gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}` });
        this.group.add(new THREE.Mesh(new THREE.SphereGeometry(90, 32, 20), this.sky));
        scene.add(new THREE.HemisphereLight(0xc2d5e2, 0x5f4934, .56));
        const key = new THREE.SpotLight(0xffead4, 112, 25, .75, .86, 2);
        key.position.set(-3.4, 4.25, -2.2);
        key.target.position.set(0, .92, .42);
        key.castShadow = true;
        key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
        key.shadow.bias = -.00018;
        key.shadow.normalBias = .004;
        key.shadow.radius = 4;
        scene.add(key, key.target);
        this.lights.push(key);
        const fill = new THREE.SpotLight(0xc6dcf1, 62, 24, .85, .95, 2);
        fill.position.set(4.3, 3.5, 1.3);
        fill.target.position.set(0, .85, .2);
        scene.add(fill, fill.target);
        this.lights.push(fill);
        const sun = new THREE.SpotLight(0xffdbad, 330, 40, .64, .73, 2);
        sun.position.set(-5.5, 4.8, -12);
        sun.target.position.set(0, .5, .4);
        sun.castShadow = true;
        sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
        sun.shadow.bias = -.0002;
        sun.shadow.normalBias = .006;
        sun.shadow.radius = 3;
        scene.add(sun, sun.target);
        this.lights.push(sun);
        this.accent = new THREE.PointLight(0xffe1bd, .20, 4, 2);
        this.accent.position.set(0, 1.6, 1.7);
        scene.add(this.accent);
        const count = mobile ? 90 : 190, positions = new Float32Array(count * 3), seeds = new Float32Array(count), sizes = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            positions.set([(rand(i + 4) - .5) * 9, .2 + rand(i + 21) * 4, (rand(i + 66) - .5) * 8 - 1], i * 3);
            seeds[i] = rand(i + 55) * 6.28;
            sizes[i] = .8 + rand(i + 43) * 1.3;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
        const material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uLift: { value: 0 }, uPixel: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.7) : 1 } }, vertexShader: `attribute float aSize;attribute float aSeed;uniform float uTime;uniform float uPixel;varying float alpha;void main(){vec3 p=position;p.x+=sin(uTime*.07+aSeed)*.11;p.y+=sin(uTime*.06+aSeed*2.)*.09;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uPixel*8./(-mv.z),.6,2.2);alpha=.10+.12*pow(sin(aSeed+uTime*.11),2.);}`, fragmentShader: `varying float alpha;uniform float uLift;void main(){float a=smoothstep(.5,.07,length(gl_PointCoord-.5))*alpha;gl_FragColor=vec4(vec3(.93,.86,.70),a);}` });
        this.dust = new THREE.Points(geometry, material);
        this.group.add(this.dust);
    }
    update(time, energy, pulse) {
        const lift = smooth((energy - .2) / .72);
        this.sky.uniforms.uLift.value = lift;
        this.sky.uniforms.uTime.value = time;
        const m = this.dust.material;
        m.uniforms.uTime.value = time;
        m.uniforms.uLift.value = lift;
        this.lights[0].intensity = mix(108, 121, lift);
        this.lights[2].intensity = mix(300, 400, lift);
        this.accent.intensity = .16 + pulse * .07;
    }
    whenReady() { return Promise.all(this.pendingTextures); }
    dispose() { this.reflector.dispose(); }
}
