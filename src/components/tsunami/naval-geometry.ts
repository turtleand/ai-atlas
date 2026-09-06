import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Point = [number, number, number];
export type HullDimensions = { length: number; width: number; depth: number; lift: number };

const stations = [
  [-1.35, 0.26, 0.355, -0.08],
  [-1.05, 0.35, 0.305, -0.21],
  [-0.4, 0.425, 0.265, -0.30],
  [0.2, 0.42, 0.275, -0.285],
  [0.75, 0.31, 0.315, -0.20],
  [1.1, 0.16, 0.34, -0.12],
  [1.35, 0.006, 0.36, -0.045],
];

function interpolateStation(z: number, component: number) {
  const index = Math.min(stations.length - 2, Math.max(0, stations.findIndex((p, i) => i > 0 && p[0] >= z) - 1));
  const a = stations[index];
  const b = stations[index + 1];
  const previous = stations[Math.max(0, index - 1)];
  const next = stations[Math.min(stations.length - 1, index + 2)];
  const distance = b[0] - a[0];
  const t = THREE.MathUtils.clamp((z - a[0]) / distance, 0, 1);
  const slopeA = (b[component] - previous[component]) / (b[0] - previous[0]);
  const slopeB = (next[component] - a[component]) / (next[0] - a[0]);
  return (2 * t ** 3 - 3 * t ** 2 + 1) * a[component]
    + (t ** 3 - 2 * t ** 2 + t) * slopeA * distance
    + (-2 * t ** 3 + 3 * t ** 2) * b[component]
    + (t ** 3 - t ** 2) * slopeB * distance;
}

export const SLOOP: HullDimensions = { length: 2.7, width: 0.86, depth: 0.55, lift: 0 };
export const CRUISER: HullDimensions = { length: 4.4, width: 1.5, depth: 0.82, lift: 0.1 };

export function hullSection(z: number, dimensions: HullDimensions = SLOOP) {
  const referenceZ = THREE.MathUtils.clamp(z * 2.7 / dimensions.length, -1.35, 1.35);
  return {
    width: interpolateStation(referenceZ, 1) * dimensions.width / 0.86,
    sheer: interpolateStation(referenceZ, 2) * dimensions.depth / 0.55 + dimensions.lift,
    keel: interpolateStation(referenceZ, 3) * dimensions.depth / 0.55 + dimensions.lift,
  };
}

export function hullPoint(z: number, angle: number, dimensions: HullDimensions = SLOOP, inset = 0): Point {
  const { width, sheer, keel } = hullSection(z, dimensions);
  const depthFactor = Math.pow(Math.max(0, Math.sin(angle)), 0.82);
  const referenceZ = z * 2.7 / dimensions.length;
  // The cutwater sweeps back below the bow. A vertical cross-section at the
  // final station otherwise reads as a square slab in the normal scene view.
  const bowRake = THREE.MathUtils.smoothstep(referenceZ, 0.72, 1.35) * 0.17;
  const transomRake = (1 - THREE.MathUtils.smoothstep(referenceZ, -1.35, -0.92)) * 0.065;
  return [
    -Math.max(0.001, width - inset) * Math.cos(angle),
    sheer - (sheer - keel - inset) * depthFactor,
    z + (transomRake - bowRake) * depthFactor * dimensions.length / 2.7,
  ];
}

export function surface(
  fn: (u: number, v: number) => Point,
  uSegments: number,
  vSegments: number,
  reverse = false,
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let u = 0; u <= uSegments; u++) {
    for (let v = 0; v <= vSegments; v++) {
      positions.push(...fn(u / uSegments, v / vSegments));
      uvs.push(u / uSegments, v / vSegments);
    }
  }
  for (let u = 0; u < uSegments; u++) {
    for (let v = 0; v < vSegments; v++) {
      const a = u * (vSegments + 1) + v;
      const b = a + vSegments + 1;
      indices.push(...(reverse ? [a, b, a + 1, b, b + 1, a + 1] : [a, a + 1, b, b, a + 1, b + 1]));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function hullSkin(dimensions: HullDimensions, inset = 0) {
  const half = dimensions.length / 2;
  return surface((u, v) => hullPoint(-half + u * dimensions.length, v * Math.PI, dimensions, inset), 32, 14, inset > 0);
}

export function tube(points: Point[], radius: number, radialSegments = 5) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  return new THREE.TubeGeometry(curve, Math.max(points.length - 1, 2), radius, radialSegments, false);
}

export function spar(a: Point, b: Point, radius: number, tipRadius = radius, sides = 7) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = end.clone().sub(start);
  const geometry = new THREE.CylinderGeometry(tipRadius, radius, direction.length(), sides, 1);
  // Cylinder UVs ordinarily run V along its length. Wood grain runs along U
  // in the authored map, so swap the axes to avoid circumferential candy bands.
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
  geometry.translate(...start.add(end).multiplyScalar(0.5).toArray());
  return geometry;
}

export function block(width: number, height: number, length: number, center: Point, bevel = 0.008) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + bevel, -height / 2);
  shape.lineTo(width / 2 - bevel, -height / 2);
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + bevel);
  shape.lineTo(width / 2, height / 2 - bevel);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - bevel, height / 2);
  shape.lineTo(-width / 2 + bevel, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - bevel);
  shape.lineTo(-width / 2, -height / 2 + bevel);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + bevel, -height / 2);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.55, bevelSegments: 1, curveSegments: 1, steps: 1 });
  geometry.translate(center[0], center[1], center[2] - length / 2 + bevel);
  return geometry;
}

export function polygon(points: Point[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(points.flatMap((p) => [p[2], p[0]]), 2));
  const indices: number[] = [];
  for (let i = 1; i < points.length - 1; i++) indices.push(0, i, i + 1);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Static pieces become a single draw per material; authored joins stay in geometry. */
export class NavalBatch {
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();

  add(material: THREE.Material, ...geometries: THREE.BufferGeometry[]) {
    this.parts.set(material, [...(this.parts.get(material) ?? []), ...geometries]);
  }

  build(name: string) {
    const group = new THREE.Group();
    group.name = name;
    this.parts.forEach((geometries, material) => {
      const normalized = geometries.map((geometry) => {
        const result = geometry.index ? geometry.toNonIndexed() : geometry;
        if (!result.getAttribute('uv')) {
          result.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(result.getAttribute('position').count * 2), 2));
        }
        return result;
      });
      const merged = mergeGeometries(normalized, false);
      if (!merged) throw new Error('Naval geometry could not be merged');
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, material);
      mesh.name = `${name}-${material.name}`;
      group.add(mesh);
      new Set([...normalized, ...geometries]).forEach((geometry) => geometry.dispose());
    });
    this.parts.clear();
    return group;
  }
}
