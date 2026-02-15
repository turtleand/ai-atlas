import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { fractalNoise } from './noise';
import { industryRegions, WATER_LEVEL } from '../../data/impact-map-data';

const GRID = 128;
const SIZE = 20;
const HEIGHT_SCALE = 4.5;

/**
 * Compute height at normalized (0-1) coordinates on the continent.
 * Combines a continent mask (elliptical falloff) with fractal noise
 * and industry-specific elevation bumps.
 */
function continentHeight(nx: number, nz: number): number {
  // Continent mask: elliptical shape centered at (0.5, 0.5)
  const cx = (nx - 0.5) * 2;
  const cz = (nz - 0.5) * 2;
  const dist = Math.sqrt(cx * cx * 1.1 + cz * cz * 0.9);
  // Smooth falloff from center
  const mask = Math.max(0, 1 - dist * 1.05);
  const smoothMask = mask * mask * (3 - 2 * mask); // smoothstep

  // Base fractal noise for natural variation
  const baseNoise = fractalNoise(nx + 3.7, nz + 1.2, 5, 0.5, 2.0, 6.0);

  // Industry elevation bumps
  let industryBump = 0;
  for (const region of industryRegions) {
    const dx = nx - region.position[0];
    const dz = nz - region.position[1];
    const d = Math.sqrt(dx * dx + dz * dz);
    const radius = 0.12;
    if (d < radius) {
      const influence = 1 - d / radius;
      const smooth = influence * influence * (3 - 2 * influence);
      industryBump = Math.max(industryBump, region.elevation * smooth * 0.6);
    }
  }

  const height = smoothMask * (baseNoise * 0.5 + 0.15 + industryBump);
  return Math.max(0, height);
}

/** Map elevation to terrain color */
function elevationColor(h: number, waterLevel: number): THREE.Color {
  const wl = waterLevel;
  if (h < wl * 0.4) return new THREE.Color(0x1a3a5c); // deep ocean
  if (h < wl * 0.7) return new THREE.Color(0x2a5a7c); // mid ocean
  if (h < wl) return new THREE.Color(0x3a7a9c); // shallow
  if (h < wl + 0.03) return new THREE.Color(0xc2b280); // beach/sand
  if (h < wl + 0.12) return new THREE.Color(0x4a8c4a); // low green
  if (h < wl + 0.25) return new THREE.Color(0x3a7a3a); // green
  if (h < wl + 0.4) return new THREE.Color(0x6b5a3a); // brown
  if (h < wl + 0.55) return new THREE.Color(0x8a7a5a); // light brown
  return new THREE.Color(0xe8e0d8); // snow/peak
}

export function Continent3D() {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, GRID, GRID);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const waterLevelWorld = WATER_LEVEL * HEIGHT_SCALE;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Normalized 0-1 coordinates
      const nx = (x + SIZE / 2) / SIZE;
      const nz = (z + SIZE / 2) / SIZE;

      const h = continentHeight(nx, nz);
      pos.setY(i, h * HEIGHT_SCALE);

      const color = elevationColor(h, WATER_LEVEL);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // Make normals smoother for a more natural look
    void waterLevelWorld;

    return { geometry: geo };
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading={false} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

/**
 * Get world-space position for a normalized (0-1) coordinate + elevation
 */
export function getWorldPos(nx: number, nz: number, elevation: number): [number, number, number] {
  const x = (nx - 0.5) * SIZE;
  const z = (nz - 0.5) * SIZE;
  const y = elevation * HEIGHT_SCALE;
  return [x, y, z];
}
