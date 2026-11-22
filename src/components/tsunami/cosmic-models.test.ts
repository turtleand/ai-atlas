import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCosmicModel } from './cosmic-models';
import { getWaveHeight } from './wave-field';

function motionState(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const values: number[] = [];
  root.traverse(object => {
    values.push(...object.matrixWorld.elements);
    if (object instanceof THREE.Points) {
      values.push(...object.geometry.getAttribute('position').array, ...object.geometry.getAttribute('color').array);
    }
  });
  return values;
}

function gyros(root: THREE.Group) {
  return [1, 2, 3].map(index => root.getObjectByName(`command gyro ${index}`)!);
}

describe('cosmic scene construction and motion contracts', () => {
  for (const tier of [4, 5] as const) {
    it(`keeps T${tier} finite, within its geometry budget and independent of previous updates`, () => {
      const model = createCosmicModel(tier);
      const fresh = createCosmicModel(tier);
      try {
        let calls = 0;
        let triangles = 0;
        model.root.traverse(object => {
          if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
          calls++;
          for (const attribute of Object.values(object.geometry.attributes) as THREE.BufferAttribute[]) {
            expect(Array.from(attribute.array).every(Number.isFinite)).toBe(true);
          }
          if (object instanceof THREE.Mesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
        });
        expect(calls).toBeLessThanOrEqual(23);
        expect(triangles).toBeLessThanOrEqual(11500);
        model.update(1234.5, 0.65);
        const first = motionState(model.root);
        model.update(9000, 0.1);
        model.update(0);
        model.update(1234.5, 0.65);
        expect(motionState(model.root)).toEqual(first);
        fresh.update(1234.5, 0.65);
        expect(motionState(fresh.root)).toEqual(first);
        expect(model.root.position.toArray()).toEqual([0, 0, 0]);
        expect(model.root.scale.toArray()).toEqual([1, 1, 1]);
      } finally {
        model.dispose(); fresh.dispose();
      }
    });

    it(`releases every T${tier} geometry and shared visible material once`, () => {
      const model = createCosmicModel(tier);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      model.root.traverse(object => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      });
      const releases = new Map<object, number>();
      for (const resource of [...geometries, ...materials]) {
        releases.set(resource, 0);
        resource.addEventListener('dispose', () => releases.set(resource, releases.get(resource)! + 1));
      }
      model.dispose();
      expect([...releases.values()].every(count => count === 1)).toBe(true);
    });
  }

  it('locks on every T4 entry regardless of scene age and releases along the shortest rotation', () => {
    const model = createCosmicModel(4);
    try {
      const rings = gyros(model.root);
      model.update(2000, 0);
      const locked = rings.map(ring => ring.quaternion.clone());
      model.update(20000, 0.2);
      rings.forEach((ring, i) => expect(ring.quaternion.angleTo(locked[i])).toBeLessThan(1e-7));
      for (const entryTime of [0, 100, 2000, 20000]) {
        model.update(entryTime + 1.25);
        const targets = rings.map(ring => ring.quaternion.clone());
        model.update(entryTime + 0.75, 0.75);
        rings.forEach((ring, i) => {
          const wholeArc = locked[i].angleTo(targets[i]);
          expect(wholeArc).toBeLessThanOrEqual(Math.PI);
          expect(locked[i].angleTo(ring.quaternion)).toBeCloseTo(wholeArc / 2, 6);
          expect(ring.quaternion.angleTo(targets[i])).toBeCloseTo(wholeArc / 2, 6);
        });
        model.update(entryTime + 1.25, 1.25);
        rings.forEach((ring, i) => expect(ring.quaternion.angleTo(targets[i])).toBeLessThan(1e-7));
      }
    } finally {
      model.dispose();
    }
  });

  it('does not restart the T5 system when an entry age is supplied', () => {
    const model = createCosmicModel(5);
    try {
      model.update(9876);
      const ordinary = motionState(model.root);
      model.update(9876, 0);
      expect(motionState(model.root)).toEqual(ordinary);
      model.update(9876, 0.6);
      expect(motionState(model.root)).toEqual(ordinary);
    } finally {
      model.dispose();
    }
  });

  it('keeps all three T4 gyros moving after a deterministic entry lock', () => {
    const model = createCosmicModel(4);
    try {
      const rings = gyros(model.root);
      model.update(4.25, 0);
      const locked = rings.map(ring => ring.quaternion.clone());
      model.update(7300, 0.15);
      rings.forEach((ring, i) => expect(ring.quaternion.angleTo(locked[i])).toBeLessThan(1e-7));
      model.update(4.25);
      const start = rings.map(ring => ring.quaternion.clone());
      const state = motionState(model.root);
      model.update(5.45);
      rings.forEach((ring, i) => expect(ring.quaternion.angleTo(start[i])).toBeGreaterThan(0.1));
      model.update(7);
      model.update(4.25);
      expect(motionState(model.root)).toEqual(state);
      // Late entries may approach the antipode of the locked orientation.
      for (const entryTime of [20, 105, 731, 4201, 12799]) {
        model.update(entryTime, 0);
        const previous = rings.map(ring => ring.quaternion.clone());
        for (let frame = 1; frame <= 120; frame++) {
          const age = frame / 60;
          model.update(entryTime + age, age);
          rings.forEach((ring, i) => {
            expect(ring.quaternion.angleTo(previous[i])).toBeLessThan(0.1);
            previous[i].copy(ring.quaternion);
          });
        }
      }
    } finally {
      model.dispose();
    }
  });

  it('counter-rotates the T5 constellation and cage without moving the water attachments', () => {
    const model = createCosmicModel(5);
    try {
      const cage = model.root.getObjectByName('five indexed cage rings with inset channels')!.parent!;
      const constellation = model.root.getObjectByName('four connected three-node constellations')!.parent!;
      const anchors = model.root.getObjectByName('six ocean pillars and an ascending sky connection')!;
      model.update(4.25);
      const initial = motionState(model.root);
      const anchored = anchors.matrixWorld.elements.slice();
      const cageYaw = cage.rotation.y;
      const constellationYaw = constellation.rotation.y;
      model.update(6.8, 0);
      const next = motionState(model.root);
      expect(anchors.matrixWorld.elements).toEqual(anchored);
      expect(cage.rotation.y).toBeGreaterThan(cageYaw + 0.3);
      expect(constellation.rotation.y).toBeLessThan(constellationYaw - 0.2);
      expect(next).not.toEqual(initial);
      model.update(4.25);
      expect(motionState(model.root)).toEqual(initial);
    } finally {
      model.dispose();
    }
  });

  it('keeps actual T4 tendril and T5 pillar endpoints submerged through a full water cycle, hover and entry scale', () => {
    for (const [tier, hover, name] of [
      [4, 2, 'three focused command tendrils'],
      [5, 3.5, 'six ocean pillars and an ascending sky connection'],
    ] as const) {
      const model = createCosmicModel(tier);
      try {
        const vertices: THREE.Vector3[] = [];
        model.root.traverse(object => {
          if (!(object instanceof THREE.Mesh) || object.name !== name) return;
          const positions = object.geometry.getAttribute('position');
          for (let index = 0; index < positions.count; index++) {
            vertices.push(new THREE.Vector3().fromBufferAttribute(positions, index));
          }
        });
        const lowest = Math.min(...vertices.map(point => point.y));
        const contactVertices = vertices.filter(point => point.y < lowest + 0.025);
        // Cluster real mesh end rings rather than validating independent metadata.
        const clusters: THREE.Vector3[][] = [];
        for (const point of contactVertices) {
          const cluster = clusters.find(group => group[0].distanceTo(point) < 0.15);
          if (cluster) cluster.push(point); else clusters.push([point]);
        }
        expect(clusters.length).toBe(tier === 4 ? 3 : 6);
        for (const cluster of clusters) {
          const center = cluster.reduce((sum, point) => sum.add(point), new THREE.Vector3()).divideScalar(cluster.length);
          expect(Math.hypot(center.x, center.z)).toBeGreaterThan(tier === 4 ? 0.65 : 1.35);
        }
        // Unique end-ring vertices include the tube's upper edge, not just its
        // nominal center, and protect against a visible gap under deep troughs.
        const unique = [...new Map(contactVertices.map(point => [point.toArray().map(value => value.toFixed(5)).join(','), point])).values()];
        let maximumClearance = -Infinity;
        for (const scaleFraction of [0.975, 0.9875, 1]) {
          const scale = 1.8 * scaleFraction;
          for (const intensity of [0.5, 1.25, 2]) {
            for (let time = 0; time <= 200 * Math.PI; time += 0.125) {
              const rootY = hover + Math.sin(time * (tier === 4 ? 0.25 : 0.15)) * (tier === 4 ? 0.08 : 0.04);
              for (const point of unique) {
                const water = getWaveHeight(point.x * scale, point.z * scale, time, intensity, tier === 4 ? 5 : 7);
                maximumClearance = Math.max(maximumClearance, point.y * scale + rootY - water);
              }
            }
          }
        }
        expect(maximumClearance, `T${tier} highest endpoint relative to actual water`).toBeLessThan(-0.01);
        console.info('Cosmic water contact sweep', { tier, maximumClearance, endpointVertices: unique.length });
      } finally {
        model.dispose();
      }
    }
  });
});
