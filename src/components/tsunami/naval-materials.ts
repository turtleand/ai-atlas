import * as THREE from 'three';

function grainNoise(u: number, v: number, columns: number, rows: number) {
  const x = (u - Math.floor(u)) * columns;
  const y = (v - Math.floor(v)) * rows;
  const column = Math.floor(x);
  const row = Math.floor(y);
  const hash = (i: number, j: number) => {
    const seed = Math.imul(i % columns + 53, 178379) ^ Math.imul(j % rows + 13, 48397);
    return ((Math.imul(seed ^ (seed >>> 15), 1597334677) >>> 16) & 65535) / 65535;
  };
  const dx = x - column;
  const dy = y - row;
  const blendX = dx * dx * (3 - 2 * dx);
  const blendY = dy * dy * (3 - 2 * dy);
  const lower = THREE.MathUtils.lerp(hash(column, row), hash(column + 1, row), blendX);
  const upper = THREE.MathUtils.lerp(hash(column, row + 1), hash(column + 1, row + 1), blendX);
  return THREE.MathUtils.lerp(lower, upper, blendY);
}

/** Small, deterministic surface maps, without painted light or external assets. */
function surfaceMaps(kind: 'wood' | 'end' | 'cloth' | 'metal') {
  const size = 128;
  const color = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(size * size * 4);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const fine = Math.sin(x * 32.71 + y * 19.31) * Math.sin(x * 17.17 - y * 5.79);
      const weather = grainNoise(u, v, 5, 7) - 0.5;
      const grain = kind === 'wood' ? grainNoise(u, v + weather * 0.08, 4, 23) - 0.5 : 0;
      const fiberPhase = v * Math.PI * 84 + Math.sin(v * Math.PI * 10) * 1.6
        + Math.sin(u * Math.PI * 2 + Math.sin(v * Math.PI * 4)) * 0.9 + weather * 3.7;
      const fiber = Math.sin(fiberPhase) * 0.8 + Math.sin(fiberPhase * 2 + 0.7) * 0.2;
      const pore = Math.pow(Math.max(0, -Math.sin(fiberPhase + weather * 0.8)), 5);
      const thread = ((x % 4 < 2) === (y % 4 < 2) ? 1 : -1);
      const rings = Math.sin(Math.hypot((u - 0.46) * 0.8, v - 0.3) * 108 + Math.sin(v * 19) * 0.5);
      const brush = Math.sin(v * Math.PI * 96 + Math.sin(u * Math.PI * 2) * 0.65);
      const patch = Math.sin(u * Math.PI * 2 + Math.sin(v * Math.PI * 2) * 0.7)
        * Math.sin(v * Math.PI * 2 - 0.8);
      const value = kind === 'cloth' ? 231 + thread * 4 + fine * 3 + patch * 9 + weather * 15
        : kind === 'end' ? 224 + rings * 19 + fine * 7
          : kind === 'metal' ? 224 + brush * 10 + fine * 4 + patch * 7
            : 212 + grain * 40 + weather * 27 + fiber * 6 - pore * 15 + fine * 3;
      const offset = (y * size + x) * 4;
      const tint = kind === 'wood' ? (weather + 0.5) * 9 : 0;
      color[offset] = value;
      color[offset + 1] = value - tint * 0.4;
      color[offset + 2] = value - tint;
      color[offset + 3] = 255;
      height[y * size + x] = kind === 'cloth' ? thread * 0.12 + fine * 0.025
        : kind === 'end' ? rings * 0.18
          : kind === 'metal' ? brush * 0.05 + fine * 0.01
            : grain * 0.20 + fiber * 0.17 - pore * 0.06;
      const finish = kind === 'cloth' ? 232 + patch * 15
        : kind === 'end' ? 246 + patch * 6
          : kind === 'metal' ? 226 + brush * 14 + patch * 12
            : 213 + weather * 29 + grain * 22 + fiber * 6;
      roughness[offset] = roughness[offset + 1] = roughness[offset + 2] = finish;
      roughness[offset + 3] = 255;
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = height[y * size + (x + 1) % size] - height[y * size + (x + size - 1) % size];
      const dy = height[((y + 1) % size) * size + x] - height[((y + size - 1) % size) * size + x];
      const inverseLength = 1 / Math.hypot(dx, dy, 1);
      const offset = (y * size + x) * 4;
      normal[offset] = 128 - dx * inverseLength * 127;
      normal[offset + 1] = 128 - dy * inverseLength * 127;
      normal[offset + 2] = 128 + inverseLength * 127;
      normal[offset + 3] = 255;
    }
  }
  const texture = (bytes: Uint8Array, channel: string, isColor = false) => {
    const result = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat);
    result.name = `naval-procedural-${kind}-${channel}-128`;
    result.wrapS = result.wrapT = THREE.RepeatWrapping;
    if (kind === 'cloth') result.repeat.set(2, 2);
    result.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    result.magFilter = THREE.LinearFilter;
    result.minFilter = THREE.LinearMipmapLinearFilter;
    result.generateMipmaps = true;
    result.anisotropy = 4;
    result.needsUpdate = true;
    return result;
  };
  return {
    map: texture(color, 'color', true),
    normalMap: texture(normal, 'normal'),
    normalScale: new THREE.Vector2(0.44, 0.44),
    roughnessMap: texture(roughness, 'roughness'),
  };
}

/** The lower timbers retain a soft splash stain as the hull moves through waves. */
function splashStain(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTimberPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTimberPosition = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTimberPosition;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float splashHeight = 0.11 + sin(vTimberPosition.z * 5.3) * 0.025;
        float timberWetness = 1.0 - smoothstep(splashHeight - 0.16, splashHeight + 0.15, vTimberPosition.y);
        diffuseColor.rgb *= mix(1.0, 0.58, timberWetness);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= mix(1.0, 0.78, timberWetness);');
  };
  material.customProgramCacheKey = () => 'naval-timber-splash-v2';
  return material;
}

/** Only the hull plates store their panel UVs in the third texture tile. */
function fittedNickel(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vNickelUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvNickelUv = uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vNickelUv;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 panelUv = vNickelUv - vec2(2.0, 0.0);
        vec2 corner = abs(panelUv - 0.5);
        float bevel = min(0.5 - corner.x, 0.5 - corner.y);
        float edge = 1.0 - smoothstep(0.018, 0.073, bevel);
        float topBevel = smoothstep(0.01, 0.035, panelUv.y) * (1.0 - smoothstep(0.049, 0.096, panelUv.y));
        float boltDistance = length((corner - vec2(0.404, 0.30)) * vec2(1.3, 0.75));
        float fastener = 1.0 - smoothstep(0.025, 0.055, boltDistance);
        float stud = 1.0 - smoothstep(0.009, 0.022, boltDistance);
        float face = 0.90 - 0.35 * edge + 0.34 * topBevel - 0.38 * fastener + 0.74 * stud;
        diffuseColor.rgb *= mix(1.0, face, step(2.0, vNickelUv.x));`);
  };
  material.customProgramCacheKey = () => 'naval-fitted-nickel';
  return material;
}

const finishes = {
  1: { planks: '#998877', trim: '#af875f', dark: '#584536', roughness: 0.72 },
  2: { planks: '#3e3830', trim: '#81756a', dark: '#292925', roughness: 0.45 },
  3: { planks: '#996b42', trim: '#ae8259', dark: '#544033', roughness: 0.58 },
};

export function navalMaterials(tier: 1 | 2 | 3) {
  const wood = surfaceMaps('wood');
  const end = surfaceMaps('end');
  const cloth = surfaceMaps('cloth');
  const nickel = tier === 3 ? surfaceMaps('metal') : {};
  const finish = finishes[tier];
  const make = (name: string, options: THREE.MeshStandardMaterialParameters) => {
    const material = new THREE.MeshStandardMaterial(options);
    material.name = name;
    return material;
  };
  return {
    wood: splashStain(make('weathered-oak', { color: finish.planks, ...wood, roughness: finish.roughness, metalness: 0 })),
    trim: splashStain(make('oiled-teak', { color: finish.trim, ...wood, roughness: tier === 1 ? 0.67 : 0.51, metalness: 0 })),
    dark: splashStain(make('wet-timber', { color: finish.dark, ...wood, roughness: 0.52, metalness: 0 })),
    end: make('exposed-endgrain', {
      color: '#eec28b', ...end, emissive: '#784b25', emissiveIntensity: 0.18, roughness: 0.87, metalness: 0,
    }),
    cloth: make('woven-canvas', { color: '#dbd9cf', ...cloth, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }),
    techCloth: make('laminated-canvas', { color: '#c3c6c4', ...cloth, roughness: 0.87, metalness: 0.04, side: THREE.DoubleSide }),
    rope: make('hemp-and-seams', { color: '#8f8066', roughness: 1, metalness: 0 }),
    chrome: fittedNickel(make('brushed-nickel', { color: '#929fa3', ...nickel, roughness: 0.51, metalness: 0.72 })),
    frame: make('graphite-structure', { color: '#405865', roughness: 0.48, metalness: 0.6 }),
    glass: make('storm-glass', { color: '#3f606a', roughness: 0.16, metalness: 0.36 }),
    energy: make('inset-circuit', { color: '#407a7d', emissive: '#43cbbe', emissiveIntensity: 0.64, roughness: 0.45, metalness: 0.24 }),
    lamp: make('lantern-glass', { color: '#e2ae61', emissive: '#ffb955', emissiveIntensity: 1.3, roughness: 0.5 }),
  };
}

export type NavalMaterials = ReturnType<typeof navalMaterials>;
