import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export interface CosmicModel {
  root: THREE.Group;
  update: (time: number, entryAge?: number) => void;
  dispose: () => void;
}

type Point = [number, number, number];
type Material = THREE.MeshStandardMaterial;

const TAU = Math.PI * 2;
const CYAN = '#76e7e7';
const GOLD = '#efd59c';

function surface(color: string, metalness: number, roughness: number, emission?: string, intensity = 0) {
  return new THREE.MeshStandardMaterial({
    color, metalness, roughness,
    emissive: emission ?? '#000000', emissiveIntensity: intensity,
  });
}

/** Local radiance varies across the real inner solid, never a surrounding shell. */
function energyCore(tier: 4 | 5) {
  const clock = { value: 0 };
  const cold = { value: new THREE.Color(tier === 4 ? '#062c47' : '#372513') };
  const warm = { value: new THREE.Color(tier === 4 ? '#0ca3ab' : '#c57f25') };
  const hot = { value: new THREE.Color(tier === 4 ? '#74dfd2' : '#f4d08a') };
  const material = surface(tier === 4 ? '#145568' : '#75552b', 0.22, 0.31, '#ffffff', 1);
  material.name = 'nested energy core with bounded local radiance';
  material.onBeforeCompile = shader => {
    shader.uniforms.uCoreTime = clock;
    shader.uniforms.uCoreCold = cold;
    shader.uniforms.uCoreWarm = warm;
    shader.uniforms.uCoreHot = hot;
    shader.vertexShader = `varying vec3 vCorePoint;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nvCorePoint = position;',
    );
    shader.fragmentShader = `
      varying vec3 vCorePoint;
      uniform float uCoreTime;
      uniform vec3 uCoreCold;
      uniform vec3 uCoreWarm;
      uniform vec3 uCoreHot;
      ${shader.fragmentShader}
    `.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      vec3 corePoint = vCorePoint / vec3(${tier === 4 ? '0.54, 0.6102, 0.54' : '0.43, 0.86, 0.43'});
      float coreLongitude = atan(corePoint.z, corePoint.x);
      float coreBand = exp(-corePoint.y * corePoint.y * 5.5);
      float coreFlow = 0.5 + 0.5 * sin(coreLongitude * 3.0 + corePoint.y * 4.5 - uCoreTime * 0.11);
      float coreVein = pow(coreFlow, 7.0);
      float coreFront = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
      float coreDepth = 0.22 + 0.78 * pow(coreFront, 0.75);
      vec3 coreRadiance = mix(uCoreCold, uCoreWarm, 0.25 + 0.55 * coreBand);
      coreRadiance = mix(coreRadiance, uCoreHot, coreVein * 0.72);
      totalEmissiveRadiance = coreRadiance * coreDepth;
      diffuseColor.rgb *= 0.5 + 0.35 * coreFlow;
    `);
  };
  material.customProgramCacheKey = () => `cosmic-local-radiance-v1-${tier}`;
  return { material, update: (time: number) => { clock.value = time; } };
}

/** A small material batch keeps authored attachments from adding a draw call each. */
class Batch {
  private parts = new Map<Material, THREE.BufferGeometry[]>();

  add(geometry: THREE.BufferGeometry, material: Material) {
    const plain = geometry.index ? geometry.toNonIndexed() : geometry;
    if (plain !== geometry) geometry.dispose();
    // All procedural parts deliberately share just these attributes.
    plain.deleteAttribute('uv');
    const list = this.parts.get(material) ?? [];
    list.push(plain);
    this.parts.set(material, list);
  }

  build(parent: THREE.Group, label: string) {
    for (const [material, parts] of this.parts) {
      const geometry = mergeGeometries(parts)!;
      parts.forEach(part => part.dispose());
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = label;
      parent.add(mesh);
    }
    this.parts.clear();
  }
}

function rod(from: Point, to: Point, radius: number, sides = 6, endRadius = radius) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const delta = b.clone().sub(a);
  const geometry = new THREE.CylinderGeometry(endRadius, radius, delta.length(), sides, 1);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...a.add(b).multiplyScalar(0.5).toArray());
  return geometry;
}

function bevelBlock(width: number, height: number, depth: number, bevelFaces = false) {
  const cut = Math.min(width, height) * 0.19;
  const w = width / 2;
  const h = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w + cut, -h); shape.lineTo(w - cut, -h);
  shape.lineTo(w, -h + cut); shape.lineTo(w, h - cut);
  shape.lineTo(w - cut, h); shape.lineTo(-w + cut, h);
  shape.lineTo(-w, h - cut); shape.lineTo(-w, -h + cut);
  shape.closePath();
  const bevel = Math.min(cut * 0.35, depth * 0.15);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: bevelFaces ? depth - bevel * 2 : depth, bevelEnabled: bevelFaces, bevelSegments: 1,
    bevelSize: bevel, bevelThickness: bevel, steps: 1, curveSegments: 1,
  });
  geometry.translate(0, 0, -depth / 2 + (bevelFaces ? bevel : 0));
  return geometry;
}

/** Solid, beveled rail rather than a thin luminous wire. Local plane is XY. */
function rail(radius: number, halfWidth: number, depth: number, segments: number) {
  const bevel = Math.min(halfWidth, depth) * 0.38;
  const profile = [
    [-halfWidth + bevel, -depth], [halfWidth - bevel, -depth],
    [halfWidth, 0],
    [halfWidth - bevel, depth], [-halfWidth + bevel, depth],
    [-halfWidth, 0],
  ];
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = i / segments * TAU;
    for (const [radial, z] of profile) {
      vertices.push(Math.cos(theta) * (radius + radial), Math.sin(theta) * (radius + radial), z);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < profile.length; j++) {
      const a = i * profile.length + j;
      const b = i * profile.length + (j + 1) % profile.length;
      const c = b + profile.length;
      const d = a + profile.length;
      indices.push(a, d, b, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Paired inset faces leave the metal rail visible from both sides. */
function channel(radius: number, width: number, depth: number, segments: number, interrupted: boolean) {
  const positions: number[] = [];
  const normals: number[] = [];
  const push = (theta: number, r: number, z: number) => {
    positions.push(Math.cos(theta) * r, Math.sin(theta) * r, z);
    normals.push(0, 0, Math.sign(z));
  };
  for (const side of [-1, 1]) {
    for (let i = 0; i < segments; i++) {
      if (interrupted && i % 8 === 7) continue;
      const a = i / segments * TAU;
      const b = (i + 1) / segments * TAU;
      const inner = radius - width;
      const outer = radius + width;
      if (side > 0) {
        push(a, inner, depth); push(a, outer, depth); push(b, outer, depth);
        push(a, inner, depth); push(b, outer, depth); push(b, inner, depth);
      } else {
        push(a, inner, -depth); push(b, outer, -depth); push(a, outer, -depth);
        push(a, inner, -depth); push(b, inner, -depth); push(b, outer, -depth);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return geometry;
}

function createRing(radius: number, wide: boolean, body: Material, luminous: Material, trim: Material) {
  const group = new THREE.Group();
  const batch = new Batch();
  const halfWidth = wide ? 0.065 : 0.057;
  const depth = wide ? 0.037 : 0.044;
  const segments = wide ? 48 : 64;
  batch.add(rail(radius, halfWidth, depth, segments), body);
  batch.add(channel(radius, halfWidth * 0.28, depth + 0.0015, segments, true), luminous);
  // Eight purposeful clamps describe how the rail is assembled. They are merged
  // with the body material; no individual fastener objects or subpixel bolts.
  for (let i = 0; i < 8; i++) {
    const theta = (i + 0.5) / 8 * TAU;
    const clamp = bevelBlock(halfWidth * 2.5, 0.082, depth * 2.3);
    clamp.rotateZ(theta);
    clamp.translate(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
    batch.add(clamp, body);
  }
  // One index plate supplies a stable orientation cue during rotation.
  const plate = bevelBlock(halfWidth * 3.3, 0.18, depth * 2.6);
  plate.translate(radius, 0, 0);
  batch.add(plate, trim);
  batch.build(group, 'gyro rail, inset energy channel and index plate');
  return group;
}

function polyhedronArmor(radius: number, axialScale: number, panels: Material, edges: Material, batch: Batch, recessed: Material) {
  const shell = new THREE.IcosahedronGeometry(radius, 0);
  const coordinates = shell.getAttribute('position');
  for (let i = 0; i < coordinates.count; i += 3) {
    const points = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(coordinates, i + j));
    const center = points.reduce((sum, p) => sum.add(p), new THREE.Vector3()).multiplyScalar(1 / 3);
    const normal = center.clone().normalize();
    const perimeter = points.map(p => p.clone().sub(center).multiplyScalar(0.82).add(center));
    const top = perimeter.map(p => p.clone().sub(center).multiplyScalar(0.91).add(center).addScaledVector(normal, 0.025));
    const bottom = perimeter.map(p => p.clone().addScaledVector(normal, -0.06));
    const opening = top.map(p => p.clone().sub(center).multiplyScalar(0.66).add(center));
    const ringPoints: THREE.Vector3[] = [];
    for (let edge = 0; edge < 3; edge++) {
      const next = (edge + 1) % 3;
      ringPoints.push(top[edge], top[next], opening[next], top[edge], opening[next], opening[edge]);
    }
    const frame = new THREE.BufferGeometry().setFromPoints(ringPoints.map(p => p.clone().setY(p.y * axialScale)));
    frame.computeVertexNormals();
    batch.add(frame, i % 6 === 0 ? panels : edges);
    // Alternating apertures expose a real inner volume. The remaining faces have
    // recessed panels, breaking up the broad unarticulated triangle silhouette.
    if (i % 6 !== 0) {
      const inset = opening.map(p => p.clone().addScaledVector(normal, -0.034));
      const face = new THREE.BufferGeometry().setFromPoints(inset.map(p => p.clone().setY(p.y * axialScale)));
      face.computeVertexNormals();
      batch.add(face, recessed);
    }
    const sidePoints: THREE.Vector3[] = [];
    for (let edge = 0; edge < 3; edge++) {
      const next = (edge + 1) % 3;
      sidePoints.push(top[edge], perimeter[edge], perimeter[next], top[edge], perimeter[next], top[next]);
      sidePoints.push(perimeter[edge], bottom[edge], bottom[next], perimeter[edge], bottom[next], perimeter[next]);
    }
    const bevel = new THREE.BufferGeometry().setFromPoints(sidePoints.map(p => p.clone().setY(p.y * axialScale)));
    bevel.computeVertexNormals();
    batch.add(bevel, edges);
  }
  shell.dispose();
}

/** Curved structural vanes with real apertures and softly beveled edges. */
function petal(angle: number, upper: boolean) {
  const outline = new THREE.Shape();
  outline.moveTo(0.27, -0.06);
  outline.quadraticCurveTo(0.66, -0.08, 0.73, 0.34);
  outline.bezierCurveTo(0.76, 0.72, 0.45, 1.08, 0.36, 1.62);
  outline.lineTo(0.28, 1.62);
  outline.bezierCurveTo(0.3, 1.04, 0.39, 0.76, 0.29, 0.47);
  outline.closePath();
  const aperture = new THREE.Path();
  aperture.moveTo(0.4, 0.16);
  aperture.quadraticCurveTo(0.59, 0.17, 0.6, 0.37);
  aperture.quadraticCurveTo(0.62, 0.58, 0.43, 0.98);
  aperture.quadraticCurveTo(0.45, 0.51, 0.4, 0.16);
  outline.holes.push(aperture);
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.09, steps: 1, bevelEnabled: true,
    bevelSegments: 1, bevelThickness: 0.014, bevelSize: 0.014, curveSegments: 3,
  });
  geometry.translate(0, 0, -0.045);
  if (!upper) {
    geometry.scale(1, -0.75, 1);
    // A baked reflection reverses winding, unlike a negative Object3D scale
    // which the renderer handles itself. Preserve outward faces on lower vanes.
    const indices: number[] = [];
    for (let i = 0; i < geometry.attributes.position.count; i += 3) indices.push(i, i + 2, i + 1);
    geometry.setIndex(indices);
  }
  geometry.rotateY(angle);
  return geometry;
}

function satellite(position: Point, angle: number, scale: number, batch: Batch, body: Material, trim: Material, energy: Material) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.04, -0.24); shape.lineTo(0.04, -0.24);
  shape.lineTo(0.13, -0.07); shape.lineTo(0.11, 0.15);
  shape.lineTo(0.035, 0.27); shape.lineTo(-0.035, 0.27);
  shape.lineTo(-0.11, 0.15); shape.lineTo(-0.13, -0.07); shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-0.045, -0.1); hole.lineTo(0.045, -0.1);
  hole.lineTo(0.05, 0.1); hole.lineTo(0, 0.18); hole.lineTo(-0.05, 0.1); hole.closePath();
  shape.holes.push(hole);
  const housing = new THREE.ExtrudeGeometry(shape, {
    depth: 0.09, bevelEnabled: true, bevelSegments: 1,
    bevelSize: 0.017, bevelThickness: 0.018, steps: 1, curveSegments: 1,
  });
  housing.translate(0, 0, -0.045);
  const transform = new THREE.Matrix4().compose(
    new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, angle, -0.18)),
    new THREE.Vector3(scale, scale, scale),
  );
  batch.add(housing.applyMatrix4(transform), body);
  const cap = bevelBlock(0.19, 0.052, 0.13);
  cap.translate(0, -0.1, 0);
  batch.add(cap.applyMatrix4(transform), trim);
  batch.add(rod([0, -0.025, 0], [0, 0.13, 0], 0.022, 6).applyMatrix4(transform), energy);
}

function flowPoints(count: number, height: number, radius: number, color: string) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    color, size: 0.032, transparent: true, opacity: 0.55,
    depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.name = 'sparse ascending data with smooth birth and fade';
  function update(time: number) {
    for (let i = 0; i < count; i++) {
      const phase = (i * 0.61803398875 + time * 0.055) % 1;
      const theta = i * 2.399963 + time * 0.06;
      const r = radius * (0.45 + (i % 7) / 12);
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = phase * height - 1.0;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      const envelope = Math.pow(Math.sin(phase * Math.PI), 2) * 0.8;
      colors[i * 3] = envelope; colors[i * 3 + 1] = envelope; colors[i * 3 + 2] = envelope;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }
  return { points, update };
}

export function createCosmicModel(tier: 4 | 5): CosmicModel {
  const root = new THREE.Group();
  root.name = tier === 4 ? 'AI Flagship: mechanical gyroscope' : 'The Singularity: celestial architecture';
  const metal = surface('#526976', 0.7, 0.34);
  const ceramic = surface('#9aafb1', 0.2, 0.39);
  const bronze = surface('#c1a66b', 0.72, 0.35);
  const dark = surface('#17343f', 0.5, 0.43);
  const cyan = surface(CYAN, 0.15, 0.3, CYAN, 0.85);
  const gold = surface(GOLD, 0.25, 0.34, GOLD, 0.7);
  const energy = energyCore(tier);
  const inner = energy.material;
  const materials = [metal, ceramic, bronze, dark, cyan, gold, inner];
  const movements: Array<(time: number, entryAge: number) => void> = [energy.update];

  if (tier === 4) {
    const core = new THREE.Group();
    core.position.y = 0.68;
    const coreBatch = new Batch();
    polyhedronArmor(0.69, 1.08, ceramic, metal, coreBatch, dark);
    const crystal = new THREE.IcosahedronGeometry(0.54, 2);
    crystal.scale(1, 1.13, 1);
    coreBatch.add(crystal, inner);
    // A spindle and collars tie the floating armor into a manufactured instrument.
    coreBatch.add(rod([0, -0.9, 0], [0, 0.95, 0], 0.085, 8), metal);
    for (const y of [-0.79, 0.81]) {
      const collar = new THREE.CylinderGeometry(0.19, 0.14, 0.1, 8);
      collar.translate(0, y, 0);
      coreBatch.add(collar, ceramic);
    }
    coreBatch.build(core, 'segmented ceramic core and dark machined bevels');
    root.add(core);
    movements.push(time => { core.rotation.y = time * 0.075; });

    const rings = [1.02, 1.33, 1.66].map((radius, i) => {
      const group = createRing(radius, false, i === 1 ? bronze : metal, i === 1 ? gold : cyan, i === 1 ? metal : bronze);
      group.position.y = 0.78;
      // Slightly flattened vertical span keeps a coherent hovering silhouette.
      group.scale.y = 0.8;
      root.add(group);
      return group;
    });
    rings.forEach((ring, i) => { ring.name = `command gyro ${i + 1}`; });
    const lockAngles: Point[] = [[0.38, 0, 0.28], [1.22, 0.6, -0.32], [0.78, -0.4, 0.16]];
    const lockOrientations = lockAngles.map(angles => new THREE.Quaternion().setFromEuler(new THREE.Euler(...angles)));
    const targetOrientation = new THREE.Quaternion();
    const targetAngles = [new THREE.Euler(), new THREE.Euler(), new THREE.Euler()];
    movements.push((time, entryAge) => {
      const release = THREE.MathUtils.smoothstep(entryAge, 0.25, 1.25);
      targetAngles[0].set(0.38 + Math.sin(time * 0.16) * 0.48, time * 0.055, 0.28);
      targetAngles[1].set(1.22 + Math.sin(time * 0.12 + 1) * 0.32, 0.6 + time * 0.045, -0.32);
      targetAngles[2].set(0.78 + Math.sin(time * 0.1 + 2) * 0.3, -0.4 - time * 0.04, 0.16);
      rings.forEach((ring, i) => {
        targetOrientation.setFromEuler(targetAngles[i]);
        // Slerp chooses the shortest equivalent rotation even after the scene
        // clock accumulates many turns. Entry never resets any shared clock.
        ring.quaternion.copy(lockOrientations[i]).slerp(targetOrientation, release);
      });
    });

    const fragments = new THREE.Group();
    const fragmentBatch = new Batch();
    for (let i = 0; i < 6; i++) {
      const theta = i / 6 * TAU;
      const r = 2.02;
      satellite([Math.cos(theta) * r, 0.85 + Math.sin(theta * 2) * 0.32, Math.sin(theta) * r], theta, 0.92,
        fragmentBatch, metal, ceramic, cyan);
    }
    fragmentBatch.build(fragments, 'six ordered ceramic satellites');
    root.add(fragments);
    movements.push(time => { fragments.rotation.y = time * 0.105; });

    const tendrils = new Batch();
    for (let i = 0; i < 3; i++) {
      const angle = i / 3 * TAU + 0.3;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle) * 0.23, 0.25, Math.sin(angle) * 0.23),
        new THREE.Vector3(Math.cos(angle + 0.25) * 0.45, -0.42, Math.sin(angle + 0.25) * 0.45),
        new THREE.Vector3(Math.cos(angle) * 0.72, -1.49, Math.sin(angle) * 0.72),
      ]);
      tendrils.add(new THREE.TubeGeometry(curve, 12, 0.014, 4, false), cyan);
    }
    tendrils.build(root, 'three focused command tendrils');
    const data = flowPoints(42, 3.9, 0.5, CYAN);
    root.add(data.points);
    movements.push(data.update);
  } else {
    const core = new THREE.Group();
    core.position.y = 0.55;
    const batch = new Batch();
    // Open petals reveal successive layers through deliberate architectural gaps.
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * TAU;
      batch.add(petal(angle, true), i % 2 ? metal : bronze);
      batch.add(petal(angle + Math.PI / 6, false), i % 2 ? bronze : metal);
      // Small pale shoulder plates establish a secondary material scale.
      for (const upper of [true, false]) {
        const panel = bevelBlock(0.18, 0.24, 0.065, true);
        panel.translate(0.51, upper ? 0.33 : -0.24, 0);
        panel.rotateY(angle + (upper ? 0 : Math.PI / 6));
        batch.add(panel, ceramic);
      }
      const rib = rod([Math.cos(angle) * 0.36, 0.55, -Math.sin(angle) * 0.36],
        [Math.cos(angle) * 0.25, 1.53, -Math.sin(angle) * 0.25], 0.015, 4);
      batch.add(rib, gold);
    }
    polyhedronArmor(0.56, 1.6, ceramic, bronze, batch, dark);
    const kernel = new THREE.IcosahedronGeometry(0.43, 2);
    kernel.scale(1, 2, 1);
    batch.add(kernel, inner);
    batch.build(core, 'open celestial petals around a nested luminous kernel');
    root.add(core);
    movements.push(time => { core.rotation.y = time * 0.035; });

    // Five rings have architectural roles: equator, two meridians, crown and base.
    // Their coherent phase gives T5 a spatial order unlike T4's independent gyros.
    const cage = new THREE.Group();
    cage.position.y = 0.65;
    const ringBatch = new Batch();
    const ringDefinitions = [
      { r: 2.75, scale: [1, 1, 1] as Point, rotation: [Math.PI / 2, 0, 0] as Point, y: 0 },
      { r: 2.48, scale: [1, 0.89, 1] as Point, rotation: [0, 0.3, 0] as Point, y: 0 },
      { r: 2.48, scale: [1, 0.89, 1] as Point, rotation: [0, Math.PI / 2 + 0.3, 0] as Point, y: 0 },
      { r: 1.45, scale: [1, 1, 1] as Point, rotation: [Math.PI / 2, 0, 0] as Point, y: 1.77 },
      { r: 1.72, scale: [1, 1, 1] as Point, rotation: [Math.PI / 2, 0, 0] as Point, y: -1.62 },
    ];
    ringDefinitions.forEach(({ r, scale, rotation, y }, index) => {
      const transform = new THREE.Matrix4().compose(
        new THREE.Vector3(0, y, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...scale),
      );
      ringBatch.add(rail(r, 0.062, 0.042, 48).applyMatrix4(transform), index === 0 || index === 3 ? bronze : metal);
      ringBatch.add(channel(r, 0.019, 0.044, 48, true).applyMatrix4(transform), index % 2 ? cyan : gold);
      for (let j = 0; j < 4; j++) {
        const angle = j / 4 * TAU;
        const key = bevelBlock(0.16, 0.1, 0.11);
        key.rotateZ(angle);
        key.translate(Math.cos(angle) * r, Math.sin(angle) * r, 0);
        key.applyMatrix4(transform);
        ringBatch.add(key, index % 2 ? bronze : metal);
      }
    });
    ringBatch.build(cage, 'five indexed cage rings with inset channels');
    root.add(cage);
    movements.push(time => { cage.rotation.y = time * 0.023; });

    const constellation = new THREE.Group();
    constellation.position.y = 0.65;
    const nodes = new Batch();
    const nodePositions: Point[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * TAU;
      const radius = i % 3 === 0 ? 3.47 : 3.15;
      const y = Math.sin(angle * 2 + 0.4) * 0.66;
      const position: Point = [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
      nodePositions.push(position);
      satellite(position, angle, i % 3 === 0 ? 1.05 : 0.68, nodes, bronze, ceramic, gold);
    }
    // Sparse four-node constellations, rather than a complete decorative net.
    for (let group = 0; group < 4; group++) {
      const i = group * 3;
      nodes.add(rod(nodePositions[i], nodePositions[i + 1], 0.009, 4), dark);
      nodes.add(rod(nodePositions[i + 1], nodePositions[(i + 2) % 12], 0.009, 4), dark);
    }
    nodes.build(constellation, 'four connected three-node constellations');
    root.add(constellation);
    movements.push(time => { constellation.rotation.y = -time * 0.015; });

    const anchors = new Batch();
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * TAU;
      const x = Math.cos(angle) * 1.42;
      const z = Math.sin(angle) * 1.42;
      anchors.add(rod([x, -2.465, z], [x, 0.12, z], 0.012, 6, 0.034), i % 2 ? cyan : gold);
      const capital = new THREE.CylinderGeometry(0.085, 0.135, 0.2, 6);
      capital.translate(x, 0.05, z);
      anchors.add(capital, bronze);
      const link = rod([x, 0.16, z], [x * 0.47, 0.55, z * 0.47], 0.025, 6);
      anchors.add(link, bronze);
    }
    anchors.add(rod([0, 1.98, 0], [0, 5.7, 0], 0.044, 6, 0.005), gold);
    // Two offset filaments provide depth without a transparent cylinder shell.
    for (const sign of [-1, 1]) {
      anchors.add(rod([sign * 0.11, 2.08, 0], [sign * 0.035, 4.4, 0], 0.009, 4), cyan);
    }
    anchors.build(root, 'six ocean pillars and an ascending sky connection');
    const data = flowPoints(68, 6.5, 0.71, GOLD);
    root.add(data.points);
    movements.push(data.update);
  }

  function update(time: number, entryAge = Infinity) {
    const safeTime = Math.max(0, Number.isFinite(time) ? time : 0);
    const safeEntryAge = Number.isFinite(entryAge) ? Math.max(0, entryAge) : Infinity;
    movements.forEach(move => move(safeTime, safeEntryAge));
  }
  function dispose() {
    const geometries = new Set<THREE.BufferGeometry>();
    const ownedMaterials = new Set<THREE.Material>(materials);
    root.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => ownedMaterials.add(material));
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    ownedMaterials.forEach(material => material.dispose());
  }
  update(0);
  return { root, update, dispose };
}
