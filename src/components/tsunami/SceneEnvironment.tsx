import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/** Small, repository-owned radiance field for rough metal and wet timber.
 * Broad cloud openings follow the key and rim lights; no baked surface lighting.
 * PMREM is generated once on mount, not in the animation loop. */
export function SceneEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const width = 256, height = 128;
    const pixels = new Float32Array(width * height * 4);
    const key = new THREE.Vector3(8, 14, 6).normalize();
    const rim = new THREE.Vector3(-10, 7, -8).normalize();
    const direction = new THREE.Vector3();
    for (let y = 0; y < height; y++) {
      const theta = Math.PI * (y + 0.5) / height;
      for (let x = 0; x < width; x++) {
        const phi = (x + 0.5) / width * Math.PI * 2;
        direction.set(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
        const sky = Math.max(0, direction.y);
        const horizon = Math.exp(-direction.y * direction.y * 15);
        const opening = Math.pow(Math.max(0, direction.dot(key)), 18) * 3.2;
        const edge = Math.pow(Math.max(0, direction.dot(rim)), 12) * 1.1;
        const cloud = 0.85 + 0.15 * Math.sin(phi * 5 + theta * 7) * Math.sin(theta * 13);
        const i = (y * width + x) * 4;
        pixels[i] = (0.025 + sky * 0.12 + horizon * 0.09) * cloud + opening * 0.86 + edge * 0.37;
        pixels[i + 1] = (0.048 + sky * 0.18 + horizon * 0.13) * cloud + opening * 0.94 + edge * 0.69;
        pixels[i + 2] = (0.061 + sky * 0.28 + horizon * 0.17) * cloud + opening + edge * 0.88;
        pixels[i + 3] = 1;
      }
    }
    const source = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
    source.mapping = THREE.EquirectangularReflectionMapping;
    source.needsUpdate = true;
    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromEquirectangular(source);
    const previous = scene.environment;
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.7;
    source.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = previous;
      environment.dispose();
    };
  }, [gl, scene]);
  return null;
}
