import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createNavalModel } from './naval-models';

function modelState(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const values: number[] = [];
  root.traverse((object) => {
    values.push(...object.matrixWorld.elements);
    if (object instanceof THREE.Mesh) values.push(...object.geometry.getAttribute('position').array);
  });
  return values;
}

describe('authored naval model contracts', () => {
  for (const tier of [1, 2, 3] as const) {
    it(`keeps T${tier} geometry finite, bounded and reproducible after arbitrary motion history`, () => {
      const model = createNavalModel(tier);
      let draws = 0;
      let triangles = 0;
      model.root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        draws++;
        const geometry = object.geometry;
        const position = geometry.getAttribute('position');
        triangles += (geometry.index?.count ?? position.count) / 3;
        for (const attribute of ['position', 'normal', 'uv']) {
          expect(Array.from(geometry.getAttribute(attribute).array).every(Number.isFinite)).toBe(true);
        }
      });
      expect(draws, `T${tier} draw calls`).toBeLessThanOrEqual(22);
      expect(triangles, `T${tier} triangles`).toBeLessThanOrEqual(8500);
      model.update(6.75);
      const first = modelState(model.root);
      model.update(800);
      model.update(0);
      model.update(6.75);
      expect(modelState(model.root)).toEqual(first);
      const fresh = createNavalModel(tier);
      fresh.update(6.75);
      expect(modelState(fresh.root)).toEqual(first);
      expect(model.root.position.toArray()).toEqual([0, 0, 0]);
      expect(model.root.rotation.toArray().slice(0, 3)).toEqual([0, 0, 0]);
      fresh.dispose();
      model.dispose();
    });
  }

  it('exports actual sloop gunwale/deck and keel locations for world-space flotation', () => {
    const model = createNavalModel(2);
    const samples = model.flotation;
    expect(samples).toBeDefined();
    expect(samples!.deckSamples.length).toBeGreaterThanOrEqual(16);
    expect(Math.min(...samples!.deckSamples.map((p) => p[2]))).toBe(-1.35);
    expect(Math.max(...samples!.deckSamples.map((p) => p[2]))).toBe(1.3);
    expect(samples!.deckSamples.every((p) => p[1] >= 0.25 && p[1] <= 0.37)).toBe(true);
    expect(samples!.keelSamples.every((p) => p[1] === -0.4)).toBe(true);
    const vertices: number[][] = [];
    model.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const position = object.geometry.getAttribute('position');
      for (let i = 0; i < position.count; i++) vertices.push([position.getX(i), position.getY(i), position.getZ(i)]);
    });
    // Flotation metadata must correspond to the actual authored hull, not a separate box proxy.
    for (const sample of samples!.deckSamples.filter((p) => p[2] === -1.35)) {
      const nearest = Math.min(...vertices.map((vertex) => Math.hypot(...vertex.map((component, i) => component - sample[i]))));
      expect(nearest).toBeLessThan(0.005);
    }
    model.dispose();
  });

  it('keeps the three cruiser drones spatially separated through a full survey cycle', () => {
    const model = createNavalModel(3);
    const drones = [1, 2, 3].map((index) => model.root.getObjectByName(`survey-drone-${index}`)!);
    for (let time = 0; time <= 30; time += 0.125) {
      model.update(time);
      for (let i = 0; i < drones.length; i++) {
        for (let j = i + 1; j < drones.length; j++) {
          expect(drones[i].position.distanceTo(drones[j].position)).toBeGreaterThan(1.5);
        }
      }
    }
    model.dispose();
  });

  it('releases shared surface maps once when a naval model is replaced', () => {
    for (const tier of [1, 2, 3] as const) {
      const model = createNavalModel(tier);
      const textures = new Set<THREE.Texture>();
      const geometries = new Set<THREE.BufferGeometry>();
      model.root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials as THREE.MeshStandardMaterial[]) {
          if (material.map) textures.add(material.map);
          if (material.normalMap) {
            expect(material.normalMap.colorSpace).toBe(THREE.NoColorSpace);
            textures.add(material.normalMap);
          }
          if (material.roughnessMap) {
            expect(material.roughnessMap.colorSpace).toBe(THREE.NoColorSpace);
            textures.add(material.roughnessMap);
          }
        }
      });
      expect(textures.size).toBeGreaterThanOrEqual(6);
      const disposalCounts = new Map([...textures, ...geometries].map((resource) => [resource, 0]));
      for (const resource of disposalCounts.keys()) {
        resource.addEventListener('dispose', () => disposalCounts.set(resource, disposalCounts.get(resource)! + 1));
      }
      model.dispose();
      expect([...disposalCounts.values()].every((count) => count === 1)).toBe(true);
    }
  });
});
