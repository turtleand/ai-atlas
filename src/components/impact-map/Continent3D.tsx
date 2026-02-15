import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { fractalNoise } from './noise';
import { industryRegions, WATER_LEVEL } from '../../data/impact-map-data';

const GRID = 128;
const SIZE = 20;
const HEIGHT_SCALE = 4.5;

/**
 * Compute height at normalized (0-1) coordinates.
 * Creates 4 distinct landmasses using per-region elliptical masks.
 */
function continentHeight(nx: number, nz: number): number {
  let landHeight = 0;

  for (const region of industryRegions) {
    const dx = nx - region.position[0];
    const dz = nz - region.position[1];
    const r = region.radius;

    // Elliptical distance with slight asymmetry for natural look
    const dist = Math.sqrt((dx * dx) / (r * r * 1.2) + (dz * dz) / (r * r * 0.9));
    if (dist > 1.5) continue;

    const mask = Math.max(0, 1 - dist);
    const smoothMask = mask * mask * (3 - 2 * mask);

    // Per-island noise offset for unique shapes
    const noiseOffset = region.position[0] * 7.3 + region.position[1] * 3.1;
    const localNoise = fractalNoise(nx + noiseOffset, nz + noiseOffset + 2.5, 5, 0.5, 2.0, 8.0);

    // Role elevation bumps
    let roleBump = 0;
    for (const role of region.roles) {
      const rnx = region.position[0] + role.offset[0];
      const rnz = region.position[1] + role.offset[1];
      const rdx = nx - rnx;
      const rdz = nz - rnz;
      const rd = Math.sqrt(rdx * rdx + rdz * rdz);
      const roleRadius = 0.04;
      if (rd < roleRadius) {
        const influence = 1 - rd / roleRadius;
        const smooth = influence * influence * (3 - 2 * influence);
        roleBump = Math.max(roleBump, role.elevation * smooth * 0.3);
      }
    }

    const height = smoothMask * (localNoise * 0.3 + region.elevation * 0.5 + roleBump);
    landHeight = Math.max(landHeight, height);
  }

  // Add subtle global ocean floor noise
  const oceanNoise = fractalNoise(nx + 10, nz + 10, 3, 0.4, 2.0, 4.0) * 0.02;
  return Math.max(oceanNoise, landHeight);
}

/** Map elevation to terrain color */
function elevationColor(h: number, waterLevel: number): THREE.Color {
  const wl = waterLevel;
  if (h < wl * 0.3) return new THREE.Color(0x0d1f3c); // deep ocean
  if (h < wl * 0.6) return new THREE.Color(0x1a3a5c); // mid ocean
  if (h < wl) return new THREE.Color(0x2a5a7c); // shallow
  if (h < wl + 0.02) return new THREE.Color(0xc2b280); // beach/sand
  if (h < wl + 0.10) return new THREE.Color(0x4a8c4a); // low green
  if (h < wl + 0.22) return new THREE.Color(0x3a7a3a); // green
  if (h < wl + 0.35) return new THREE.Color(0x6b5a3a); // brown
  if (h < wl + 0.50) return new THREE.Color(0x8a7a5a); // light brown
  return new THREE.Color(0xe8e0d8); // snow/peak
}

export function Continent3D() {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, GRID, GRID);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

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
