import * as THREE from 'three';
import {
  block, CRUISER, hullPoint, hullSection, hullSkin, NavalBatch,
  polygon, SLOOP, spar, surface, tube,
} from './naval-geometry';
import type { HullDimensions, Point } from './naval-geometry';
import { navalMaterials } from './naval-materials';
import type { NavalMaterials } from './naval-materials';

export interface NavalModel {
  root: THREE.Group;
  update(time: number): void;
  dispose(): void;
  flotation?: { deckSamples: Point[]; keelSamples: Point[] };
}

type Animation = (time: number) => void;

function range(start: number, end: number, count: number) {
  return Array.from({ length: count }, (_, i) => start + (end - start) * i / (count - 1));
}

function translate(geometry: THREE.BufferGeometry, position: Point) {
  return geometry.translate(...position);
}

function addFairHull(batch: NavalBatch, materials: NavalMaterials, dimensions: HullDimensions) {
  batch.add(materials.wood, hullSkin(dimensions));
  batch.add(materials.dark, hullSkin(dimensions, 0.032));
  const half = dimensions.length / 2;
  // A solid transom, stem, and gunwale cap close the construction at every edge.
  for (const z of [-half, half]) {
    const points = range(0, Math.PI, 15).map((angle) => hullPoint(z, angle, dimensions));
    batch.add(materials.wood, polygon(z < 0 ? points.reverse() : points));
  }
  for (const side of [-1, 1]) {
    const edge: Point[] = range(-half, half, 29).map((z) => {
      const section = hullSection(z, dimensions);
      return [side * section.width, section.sheer + 0.006, z];
    });
    batch.add(materials.trim, tube(edge, dimensions === SLOOP ? 0.024 : 0.037, 6));
    batch.add(materials.trim, surface((u, v) => {
      const z = -half + u * dimensions.length;
      const section = hullSection(z, dimensions);
      return [side * Math.max(0, section.width - 0.037 * v), section.sheer, z];
    }, 28, 1, side < 0));
  }
  // Narrow caulk lines follow the planking; no unconnected strips or cracks.
  for (const angle of [0.28, 0.62, 0.94, Math.PI - 0.94, Math.PI - 0.62, Math.PI - 0.28]) {
    batch.add(materials.dark, surface((u, v) => hullPoint(
      -half + 0.025 + u * (dimensions.length - 0.06),
      angle + (v - 0.5) * 0.009, dimensions, -0.0015,
    ), 22, 1));
  }
}

function deckSurface(dimensions: HullDimensions, z0: number, z1: number, side = 0, innerWidth = 0) {
  return surface((u, v) => {
    const z = z0 + (z1 - z0) * u;
    const { width, sheer } = hullSection(z, dimensions);
    const x = side === 0 ? (v * 2 - 1) * Math.max(0, width - 0.022)
      : side * (innerWidth + v * Math.max(0, width - 0.022 - innerWidth));
    return [x, sheer - 0.022, z];
  }, Math.max(3, Math.ceil((z1 - z0) * 10)), 1, side >= 0);
}

function addDeckSeams(batch: NavalBatch, materials: NavalMaterials, dimensions: HullDimensions) {
  for (const x of range(-dimensions.width * 0.39, dimensions.width * 0.39, dimensions === SLOOP ? 7 : 11)) {
    let start: number | undefined;
    const runs: Point[][] = [];
    let points: Point[] = [];
    for (const z of range(-dimensions.length * 0.485, dimensions.length * 0.485, 44)) {
      const section = hullSection(z, dimensions);
      const inCockpit = dimensions === SLOOP && z > -1.035 && z < 0.22 && Math.abs(x) < 0.285;
      if (Math.abs(x) < section.width - 0.045 && !inCockpit) {
        start ??= z;
        points.push([x, section.sheer - 0.019, z]);
      } else if (start !== undefined) {
        if (points.length > 1) runs.push(points);
        points = [];
        start = undefined;
      }
    }
    if (points.length > 1) runs.push(points);
    runs.forEach((run) => batch.add(materials.dark, surface((u, v) => {
      const sample = u * (run.length - 1);
      const index = Math.min(run.length - 2, Math.floor(sample));
      const first = run[index];
      const second = run[index + 1];
      return [first[0] + (v - 0.5) * 0.0035, THREE.MathUtils.lerp(first[1], second[1], sample - index), THREE.MathUtils.lerp(first[2], second[2], sample - index)];
    }, run.length - 1, 1, true)));
  }
}

function createSail(
  root: THREE.Group,
  batch: NavalBatch,
  materials: NavalMaterials,
  corners: [Point, Point, Point],
  camber: number,
  phase: number,
  technological = false,
): Animation {
  const [a, b, c] = corners;
  const point = (u: number, v: number, time: number): Point => {
    const wa = 1 - u;
    const wb = u * (1 - v);
    const wc = u * v;
    const load = 27 * wa * wb * wc;
    return [
      a[0] * wa + b[0] * wb + c[0] * wc - camber * load * (1 + Math.sin(time * 0.85 + phase) * 0.13),
      a[1] * wa + b[1] * wb + c[1] * wc,
      a[2] * wa + b[2] * wb + c[2] * wc,
    ];
  };
  const geometry = surface((u, v) => point(u, v, 0), 12, 10);
  const material = technological ? materials.techCloth : materials.cloth;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = technological ? 'tensioned-laminate-sail' : 'tensioned-canvas-sail';
  root.add(mesh);
  // Thick sewn hems are solid geometry and remain attached during billowing.
  batch.add(material, ...[[a, b], [b, c], [c, a]].map((edge) => spar(edge[0], edge[1], 0.0055, 0.0055, 5)));
  const tape = material.clone();
  tape.name = 'reinforced-sail-seams';
  tape.color.multiplyScalar(0.79);
  const seamGeometries = [0.31, 0.64].map((v) => surface((u, offset) => {
    const p = point(u, v + (offset - 0.5) * 0.007, 0);
    p[0] -= 0.0012;
    return p;
  }, 10, 1));
  const seamBatch = new NavalBatch();
  seamBatch.add(tape, ...seamGeometries);
  const seamRoot = seamBatch.build('sewn-panels');
  root.add(seamRoot);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  const seamMesh = seamRoot.children[0] as THREE.Mesh;
  const seamPosition = seamMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const seamOriginal = Float32Array.from(seamPosition.array);
  // The seams receive the same wind deformation; no detached overlay at inspection distance.
  return (time) => {
    for (let i = 0; i < position.count; i++) position.setXYZ(i, ...point(uv.getX(i), uv.getY(i), time));
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    for (let i = 0; i < seamPosition.count; i++) {
      const baseX = seamOriginal[i * 3];
      const load = camber === 0 ? 0 : (a[0] - baseX - 0.0012) / (camber * (1 + Math.sin(phase) * 0.13));
      seamPosition.setX(i, a[0] - camber * load * (1 + Math.sin(time * 0.85 + phase) * 0.13) - 0.0012);
    }
    seamPosition.needsUpdate = true;
  };
}

function createSloop(root: THREE.Group, materials: NavalMaterials, animations: Animation[]) {
  const batch = new NavalBatch();
  addFairHull(batch, materials, SLOOP);
  batch.add(materials.wood,
    deckSurface(SLOOP, -1.35, -1.035),
    deckSurface(SLOOP, 0.22, 1.35),
    deckSurface(SLOOP, -1.035, 0.22, -1, 0.285),
    deckSurface(SLOOP, -1.035, 0.22, 1, 0.285),
  );
  addDeckSeams(batch, materials, SLOOP);
  // Recessed cockpit has a proper sole, coamings, end walls and two simple seats.
  batch.add(materials.dark, block(0.55, 0.045, 1.22, [0, 0.063, -0.405]));
  for (const side of [-1, 1]) {
    batch.add(materials.wood, surface((u, v) => {
      const z = -1.035 + u * 1.255;
      return [side * 0.285, THREE.MathUtils.lerp(0.08, hullSection(z).sheer - 0.016, v), z];
    }, 14, 1, side > 0));
    batch.add(materials.trim, tube(range(-1.035, 0.22, 15).map((z) => [side * 0.285, hullSection(z).sheer - 0.009, z]), 0.014, 5));
  }
  batch.add(materials.wood,
    block(0.57, 0.22, 0.035, [0, 0.185, -1.035]),
    block(0.57, 0.19, 0.035, [0, 0.172, 0.22]),
    block(0.565, 0.045, 0.145, [0, 0.225, -0.79]),
    block(0.565, 0.045, 0.14, [0, 0.225, -0.19]),
  );
  batch.add(materials.dark, block(0.055, 0.16, 1.1, [0, -0.32, -0.04]));
  batch.add(materials.wood,
    block(0.047, 0.34, 0.23, [0, -0.09, -1.41]),
    spar([0, 0.12, -1.41], [0, 0.38, -1.35], 0.021),
    spar([0, 0.36, -1.35], [0, 0.365, -0.86], 0.016, 0.012),
  );
  const mastBase: Point = [0, 0.29, 0.12];
  const mastTop: Point = [0, 2.08, 0.12];
  batch.add(materials.trim,
    spar(mastBase, mastTop, 0.031, 0.021, 9),
    spar([0, 1.015, 0.12], [0, 1.015, -0.97], 0.019, 0.013, 7),
  );
  batch.add(materials.rope,
    spar(mastTop, [0, 0.365, 1.30], 0.005, 0.005, 4),
    spar(mastTop, [-0.38, 0.30, -0.6], 0.0045, 0.0045, 4),
    spar(mastTop, [0.38, 0.30, -0.6], 0.0045, 0.0045, 4),
    tube([[0, 1.02, -0.93], [0.015, 0.57, -0.64], [0, 0.23, -0.79]], 0.005, 4),
  );
  animations.push(createSail(root, batch, materials, [[0.022, 1.035, 0.09], [0.022, 2.035, 0.09], [0.022, 1.055, -0.94]], 0.095, 0.3));
  animations.push(createSail(root, batch, materials, [[0.018, 0.415, 1.265], [0.018, 1.81, 0.305], [0.018, 0.75, 0.56]], 0.07, 0.7));
  // One modest lantern: framed glass with a handle, no extra protective equipment.
  const lantern: Point = [-0.23, 0.40, -1.10];
  batch.add(materials.lamp, block(0.054, 0.075, 0.054, lantern, 0.004));
  batch.add(materials.dark,
    block(0.072, 0.015, 0.072, [-0.23, 0.354, -1.10], 0.003),
    block(0.07, 0.018, 0.07, [-0.23, 0.449, -1.10], 0.003),
    tube([[-0.257, 0.453, -1.10], [-0.25, 0.49, -1.10], [-0.21, 0.49, -1.10], [-0.203, 0.453, -1.10]], 0.004, 4),
  );
  root.add(batch.build('continuous-sloop-construction'));
  const deckSamples: Point[] = [];
  for (const z of [-1.35, -1.05, -0.65, -0.20, 0.22, 0.65, 1.0, 1.3]) {
    const section = hullSection(z);
    deckSamples.push([-section.width, section.sheer, z], [section.width, section.sheer, z]);
  }
  deckSamples.push([0, hullSection(-1.30).sheer - 0.022, -1.30], [0, hullSection(1.30).sheer - 0.022, 1.30]);
  return { deckSamples, keelSamples: [[0, -0.4, -0.59], [0, -0.4, -0.04], [0, -0.4, 0.51]] as Point[] };
}

function fracturedTimber(length: number, width: number, thickness: number, seed: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -length / 2);
  shape.lineTo(width * 0.12, -length / 2 + 0.018);
  shape.lineTo(width / 2, -length / 2 + 0.065);
  for (let i = 1; i <= 4; i++) {
    const chip = (Math.sin(seed + i * 8.4) * 0.5 + 0.5) * width * 0.07;
    shape.lineTo(width / 2 - chip, THREE.MathUtils.lerp(-length / 2 + 0.065, length / 2 - 0.14, i / 4));
  }
  const fractures = [0.10, 0.032, 0.155, 0.06, 0.018, 0.095, 0.045];
  for (let i = 0; i < 7; i++) {
    shape.lineTo(width / 2 - i * width / 6, length / 2 - fractures[(i + seed) % fractures.length] - Math.sin(i * 4.2 + seed) * 0.016);
  }
  for (let i = 1; i <= 4; i++) {
    const chip = (Math.sin(seed + i * 5.1) * 0.5 + 0.5) * width * 0.10;
    shape.lineTo(-width / 2 + chip, THREE.MathUtils.lerp(length / 2 - 0.15, -length / 2, i / 4));
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.004, bevelSegments: 1, steps: 1 });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, thickness / 2, 0);
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, position.getZ(i) / length, position.getX(i) / width);
  }
  return geometry;
}

function createWreck(root: THREE.Group, materials: NavalMaterials, animations: Animation[]) {
  const batch = new NavalBatch();
  const exposedAssembly = new THREE.Group();
  exposedAssembly.name = 'capsized-broken-hull-quarter';
  exposedAssembly.position.y = 0.15;
  exposedAssembly.rotation.z = -0.66;
  root.add(exposedAssembly);
  // A recognisable broken hull quarter, with an irregular fracture rim and thickness.
  const wreckPoint = (u: number, v: number, inset = 0): Point => {
    const angle = 0.13 + v * 2.22;
    const fracturedStart = -0.77 + Math.sin(v * 39) * 0.062 + Math.sin(v * 17) * 0.04;
    const z = THREE.MathUtils.lerp(fracturedStart, 0.96, u);
    const p = hullPoint(z, angle, { ...SLOOP, width: 1.0 }, inset);
    p[1] -= 0.08;
    return p;
  };
  batch.add(materials.wood, surface((u, v) => wreckPoint(u, v), 18, 12));
  batch.add(materials.dark, surface((u, v) => wreckPoint(u, v, 0.055), 18, 12, true));
  batch.add(materials.end, surface((u, v) => {
    const outside = wreckPoint(0, v);
    const inside = wreckPoint(0, v, 0.055);
    return [THREE.MathUtils.lerp(outside[0], inside[0], u), THREE.MathUtils.lerp(outside[1], inside[1], u), outside[2]];
  }, 1, 12));
  // Broad surviving inner planks give the quarter a continuous timber mass.
  // The darker backing remains visible between them and at the fracture.
  for (const [index, angle] of [0.22, 0.64, 1.06, 1.48].entries()) {
    batch.add(materials.wood, surface((u, v) => {
      const profile = angle + v * 0.38;
      const start = -0.71 + Math.sin(v * 17 + index * 3) * 0.03;
      const p = hullPoint(THREE.MathUtils.lerp(start, 0.91 - index * 0.025, u), profile, { ...SLOOP, width: 1.0 }, 0.061);
      p[1] -= 0.08;
      return p;
    }, 16, 2, true));
  }
  // Broken frame lengths vary with the fracture instead of repeating a cage.
  for (const [z, endAngle] of [[-0.56, 2.05], [-0.16, 2.38], [0.28, 2.17], [0.67, 1.92]]) {
    const points = range(0.23, endAngle, 11).map((angle) => {
      const p = hullPoint(z, angle, { ...SLOOP, width: 1.0 }, 0.075);
      p[1] -= 0.055;
      return p;
    });
    batch.add(materials.trim, tube(points, 0.031, 5));
  }
  batch.add(materials.trim, tube(range(-0.71, 0.91, 17).map((z) => {
    const p = hullPoint(z, 0.13, { ...SLOOP, width: 1.0 });
    p[1] -= 0.06;
    return p;
  }), 0.033, 5));
  // Two adjacent remnants preserve a recognisable section of the former deck.
  batch.add(materials.wood,
    translate(fracturedTimber(1.07, 0.18, 0.045, 17), [-0.26, 0.15, -0.11]),
    translate(fracturedTimber(0.80, 0.16, 0.045, 29), [-0.08, 0.145, 0.10]),
  );
  batch.add(materials.dark, translate(fracturedTimber(2.05, 0.17, 0.1, 2), [0, -0.2, -0.1]));
  batch.add(materials.wood, spar([-0.20, 0.03, 0.45], [0.33, 0.65, -0.73], 0.045, 0.025, 8));
  batch.add(materials.rope, tube([[-0.2, 0.04, 0.42], [-0.42, -0.04, 0.17], [-0.65, 0.06, -0.31]], 0.011, 5));
  // Gravity is expressed in the rolled quarter's local coordinates. Local -Y
  // alone would make this remnant lie flat after the broken hull's roll.
  const gravity: Point = [Math.sin(0.66), -Math.cos(0.66), 0];
  const across: Point = [-Math.cos(0.66), -Math.sin(0.66), 0];
  const clothPoint = (u: number, v: number, time: number): Point => {
    const span = Math.pow(Math.sin(u * Math.PI), 0.85);
    const edge = 0.065 + span * 0.34 + Math.sin(u * 23) * 0.014 + Math.sin(u * 47) * 0.005;
    const fold = Math.sin(u * Math.PI * 2.4 + v * 0.6) * Math.sin(v * Math.PI * 0.5) * span;
    const reach = edge * v + Math.sin(v * Math.PI) * Math.sin(u * Math.PI * 2 + 0.7) * 0.055;
    const sag = Math.pow(v, 0.86) * (0.07 + span * 0.34) + Math.sin(v * Math.PI) * 0.03;
    const wind = Math.sin(time * 1.65 + u * 3.2) * 0.026 * v * span;
    return [
      -0.2 + u * 0.53 + across[0] * reach + gravity[0] * sag,
      0.075 + u * 0.57 + across[1] * reach + gravity[1] * sag + wind,
      0.43 - u * 1.16 + fold * 0.105,
    ];
  };
  const cloth = surface((u, v) => clothPoint(u, v, 0), 22, 10);
  const tornCanvas = materials.cloth.clone();
  tornCanvas.name = 'salt-stained-torn-canvas';
  tornCanvas.color.set('#b6a68b');
  const clothMesh = new THREE.Mesh(cloth, tornCanvas);
  clothMesh.name = 'tethered-torn-canvas';
  exposedAssembly.add(clothMesh);
  const seamMaterial = tornCanvas.clone();
  seamMaterial.name = 'torn-canvas-panel-reinforcement';
  seamMaterial.color.multiplyScalar(0.77);
  const seamPoint = (u: number, v: number, time: number): Point => {
    const p = clothPoint(u, 0.39 + (v - 0.5) * 0.018, time);
    p[1] += 0.0015;
    return p;
  };
  const seam = surface((u, v) => seamPoint(u, v, 0), 22, 1);
  const seamMesh = new THREE.Mesh(seam, seamMaterial);
  seamMesh.name = 'surviving-sail-panel-seam';
  exposedAssembly.add(seamMesh);
  batch.add(tornCanvas, spar(clothPoint(0, 0, 0), clothPoint(1, 0, 0), 0.0035, 0.003, 5));
  const positions = cloth.getAttribute('position') as THREE.BufferAttribute;
  const uv = cloth.getAttribute('uv') as THREE.BufferAttribute;
  const seamPositions = seam.getAttribute('position') as THREE.BufferAttribute;
  const seamUv = seam.getAttribute('uv') as THREE.BufferAttribute;
  animations.push((time) => {
    for (let i = 0; i < positions.count; i++) {
      positions.setXYZ(i, ...clothPoint(uv.getX(i), uv.getY(i), time));
    }
    positions.needsUpdate = true;
    cloth.computeVertexNormals();
    for (let i = 0; i < seamPositions.count; i++) seamPositions.setXYZ(i, ...seamPoint(seamUv.getX(i), seamUv.getY(i), time));
    seamPositions.needsUpdate = true;
    seam.computeVertexNormals();
  });
  exposedAssembly.add(batch.build('broken-hull-and-exposed-frames'));
  const debris: Array<{ position: Point; length: number; width: number; angle: number }> = [
    { position: [0.72, 0.035, -0.23], length: 1.22, width: 0.23, angle: -0.62 },
    { position: [-0.68, -0.035, -0.88], length: 0.69, width: 0.14, angle: 0.59 },
    { position: [0.70, -0.10, 0.73], length: 0.5, width: 0.17, angle: -0.95 },
  ];
  debris.forEach((fragment, index) => {
    const fragmentBatch = new NavalBatch();
    fragmentBatch.add(index === 0 ? materials.wood : materials.dark, fracturedTimber(fragment.length, fragment.width, 0.07, index + 9));
    if (index === 0) fragmentBatch.add(materials.end, block(fragment.width * 0.9, 0.073, 0.012, [0, 0, -fragment.length / 2], 0.002));
    const group = fragmentBatch.build(`lagging-wreck-fragment-${index}`);
    root.add(group);
    animations.push((time) => {
      group.position.set(fragment.position[0] + Math.sin(time * 0.27 + index * 2) * 0.035, fragment.position[1] + Math.sin(time * (0.72 - index * 0.09) + index * 1.8) * 0.045, fragment.position[2]);
      group.rotation.set(Math.sin(time * 0.44 + index) * 0.07, fragment.angle + Math.sin(time * 0.19 + index) * 0.03, Math.sin(time * 0.58 + index * 2.1) * 0.09);
    });
  });
}

function cruiserCabin(batch: NavalBatch, materials: NavalMaterials) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.47, 0.55);
  shape.lineTo(0.47, 0.55);
  shape.lineTo(0.37, 0.99);
  shape.quadraticCurveTo(0.35, 1.09, 0.27, 1.1);
  shape.lineTo(-0.27, 1.1);
  shape.quadraticCurveTo(-0.35, 1.09, -0.37, 0.99);
  shape.closePath();
  const cabin = new THREE.ExtrudeGeometry(shape, { depth: 0.79, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 1, steps: 1, curveSegments: 3 });
  cabin.translate(0, 0, -1.91);
  batch.add(materials.frame, cabin);
  // A framed timber kick panel keeps the upgraded wheelhouse connected to its hull.
  batch.add(materials.wood, block(0.66, 0.18, 0.026, [0,0.745,-1.075],0.008));
  for(const y of [0.714,0.77])batch.add(materials.dark,spar([-0.30,y,-1.059],[0.30,y,-1.059],0.0025,0.0025,4));
  batch.add(materials.glass, polygon([[0.355, 0.86, -1.087], [0.26, 1.055, -1.087], [-0.26, 1.055, -1.087], [-0.355, 0.86, -1.087]]));
  batch.add(materials.chrome,
    spar([0, 0.85, -1.071], [0, 1.075, -1.075], 0.012, 0.012, 5),
    spar([-0.355, 0.86, -1.072], [-0.26, 1.055, -1.076], 0.011, 0.011, 4),
    spar([0.355, 0.86, -1.072], [0.26, 1.055, -1.076], 0.011, 0.011, 4),
    spar([-0.355, 0.851, -1.073], [0.355, 0.851, -1.073], 0.014, 0.014, 4),
  );
  for (const side of [-1, 1]) {
    const window: Point[] = [
      [side * 0.391, 0.89, -1.77], [side * 0.346, 1.025, -1.77],
      [side * 0.346, 1.025, -1.29], [side * 0.391, 0.89, -1.29],
    ];
    batch.add(materials.glass, polygon(side < 0 ? window.reverse() : window));
    // Continuous sill separates the glazed wheelhouse from its solid lower wall.
    batch.add(materials.chrome, spar([side * 0.407, 0.873, -1.80], [side * 0.407, 0.873, -1.25], 0.014, 0.014, 4));
  }
  batch.add(materials.frame, block(0.70, 0.04, 0.85, [0, 1.12, -1.51], 0.015));
  batch.add(materials.chrome, spar([-0.34, 1.133, -1.075], [0.34, 1.133, -1.075], 0.012, 0.012, 4));
}

function createRadar(root: THREE.Group, materials: NavalMaterials, animations: Animation[]) {
  const radar = new NavalBatch();
  radar.add(materials.chrome, spar([0, 0, 0], [0, 0.18, 0], 0.04, 0.028, 7));
  // Shallow parabolic scanner with a solid rim and a visible feed arm.
  radar.add(materials.chrome, surface((u, v) => {
    const angle = u * Math.PI * 2;
    const radius = v * 0.245;
    return [Math.cos(angle) * radius, 0.25 + Math.sin(angle) * radius, radius * radius * 1.35];
  }, 20, 4));
  radar.add(materials.chrome, surface((u, v) => {
    const angle = u * Math.PI * 2;
    const radius = v * 0.245;
    return [Math.cos(angle) * radius, 0.25 + Math.sin(angle) * radius, radius * radius * 1.35 - 0.012];
  }, 20, 4, true));
  radar.add(materials.chrome,
    tube(range(0, Math.PI * 2, 25).map((angle) => [Math.cos(angle) * 0.245, 0.25 + Math.sin(angle) * 0.245, 0.081]), 0.014, 5),
    spar([0, 0.15, 0.07], [0, 0.25, 0.24], 0.012, 0.009, 5),
  );
  radar.add(materials.energy, block(0.065, 0.035, 0.035, [0, 0.25, 0.245], 0.004));
  const group = radar.build('mechanical-radar-scan');
  group.position.set(0, 1.15, -1.50);
  root.add(group);
  animations.push((time) => { group.rotation.y = time * 0.7; });
}

function createDrones(root: THREE.Group, materials: NavalMaterials, animations: Animation[]) {
  const batch = new NavalBatch();
  // Each drone has a flattened fuselage, four short arms and enclosed rotor hoops.
  const body = block(0.17, 0.065, 0.27, [0, 0, 0], 0.014);
  batch.add(materials.chrome, body);
  for (const x of [-0.105, 0.105]) {
    for (const z of [-0.092, 0.092]) {
      batch.add(materials.chrome, spar([0, 0, 0], [x, 0, z], 0.012, 0.009, 5));
      const hoop = new THREE.TorusGeometry(0.071, 0.007, 3, 10);
      hoop.rotateX(Math.PI / 2);
      hoop.translate(x, 0.009, z);
      batch.add(materials.chrome, hoop);
    }
  }
  batch.add(materials.energy, block(0.065, 0.016, 0.018, [0, -0.009, 0.141], 0.003));
  const template = batch.build('navigation-drone');
  for (let index = 0; index < 3; index++) {
    const drone = template.clone();
    drone.name = `survey-drone-${index + 1}`;
    root.add(drone);
    animations.push((time) => {
      const angle = time * 0.22 + index * Math.PI * 2 / 3;
      drone.position.set(Math.cos(angle) * (1.46 + index * 0.17), 1.85 + index * 0.39 + Math.sin(time * 0.47 + index * 1.9) * 0.08, Math.sin(angle) * 1.65);
      drone.rotation.set(0.04 * Math.sin(angle * 1.4), -angle + Math.PI / 2, -0.08 * Math.cos(angle));
    });
  }
}

function createCruiser(root: THREE.Group, materials: NavalMaterials, animations: Animation[]) {
  const batch = new NavalBatch();
  addFairHull(batch, materials, CRUISER);
  batch.add(materials.wood, deckSurface(CRUISER, -2.2, 2.2));
  addDeckSeams(batch, materials, CRUISER);
  // Separate structural plates conform to the fair hull and leave its timber lineage exposed.
  for (const side of [-1, 1]) {
    for (const [z0, z1] of [[-1.96, -1.13], [-1.08, -0.21], [-0.16, 0.73], [0.78, 1.59]]) {
      batch.add(materials.chrome, surface((u, v) => {
        const angle = side < 0 ? 0.27 + v * 0.54 : Math.PI - 0.27 - v * 0.54;
        return hullPoint(THREE.MathUtils.lerp(z0, z1, u), angle, CRUISER, -0.014);
      }, 7, 3, side > 0));
      const line = range(z0 + 0.035, z1 - 0.035, 6).map((z) => hullPoint(z, side < 0 ? 0.36 : Math.PI - 0.36, CRUISER, -0.022));
      batch.add(materials.energy, tube(line, 0.008, 4));
    }
    const rail: Point[] = range(-1.8, 1.65, 24).map((z) => {
      const section = hullSection(z, CRUISER);
      return [side * (section.width - 0.025), section.sheer + 0.18, z];
    });
    batch.add(materials.chrome, tube(rail, 0.013, 5));
    for (const z of [-1.8, -0.94, 0, 0.83, 1.65]) {
      const section = hullSection(z, CRUISER);
      batch.add(materials.frame, spar([side * (section.width - 0.025), section.sheer, z], [side * (section.width - 0.025), section.sheer + 0.18, z], 0.012, 0.01, 5));
    }
  }
  cruiserCabin(batch, materials);
  batch.add(materials.chrome,
    spar([0, 0.56, 0.23], [0, 3.15, 0.23], 0.047, 0.027, 9),
    spar([0, 0.60, 1.23], [0, 2.50, 1.23], 0.039, 0.025, 8),
    spar([0, 1.29, 0.23], [0, 1.29, -1.00], 0.025, 0.018, 7),
  );
  batch.add(materials.rope,
    spar([0, 3.13, 0.23], [-0.60, 0.6, -0.84], 0.007, 0.007, 4),
    spar([0, 3.13, 0.23], [0.60, 0.6, -0.84], 0.007, 0.007, 4),
    spar([0, 2.5, 1.23], [0, 0.63, 2.05], 0.006, 0.006, 4),
  );
  animations.push(createSail(root, batch, materials, [[0.022, 1.32, 0.19], [0.022, 3.08, 0.19], [0.022, 1.34, -0.97]], 0.15, 1.2, true));
  animations.push(createSail(root, batch, materials, [[0.019, 0.74, 2.01], [0.019, 2.445, 1.23], [0.019, 0.95, 0.58]], 0.11, 1.7, true));
  // Small embedded navigation nodes, with their light separated from structural metal.
  for (const side of [-1, 1]) {
    const p: Point = [side * 0.49, 0.64, 1.18];
    batch.add(materials.frame, block(0.1, 0.085, 0.13, p, 0.01));
    batch.add(materials.lamp, block(0.065, 0.028, 0.08, [p[0], p[1] + 0.044, p[2]], 0.005));
  }
  root.add(batch.build('adaptive-cruiser-construction'));
  createRadar(root, materials, animations);
  createDrones(root, materials, animations);
}

/** Model-local units only. The scene owns heading, flotation, weather and water contact. */
export function createNavalModel(tier: 1 | 2 | 3): NavalModel {
  const root = new THREE.Group();
  root.name = ['wreckage-hero', 'unprotected-sloop-hero', 'hybrid-cruiser-hero'][tier - 1];
  const materials = navalMaterials();
  const animations: Animation[] = [];
  let flotation: NavalModel['flotation'];
  if (tier === 1) createWreck(root, materials, animations);
  if (tier === 2) flotation = createSloop(root, materials, animations);
  if (tier === 3) createCruiser(root, materials, animations);
  const update = (time: number) => animations.forEach((animate) => animate(time));
  update(0);
  return {
    root, update, flotation,
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const ownedMaterials = new Set<THREE.Material>(Object.values(materials));
      const textures = new Set<THREE.Texture>();
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => ownedMaterials.add(material));
      });
      ownedMaterials.forEach((material) => {
        const standard = material as THREE.MeshStandardMaterial;
        for (const texture of [standard.map, standard.normalMap, standard.roughnessMap]) {
          if (texture) textures.add(texture);
        }
        material.dispose();
      });
      geometries.forEach((geometry) => geometry.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
