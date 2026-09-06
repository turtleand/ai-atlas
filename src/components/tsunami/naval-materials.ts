import * as THREE from 'three';

/** Small, deterministic surface maps, without painted light or external assets. */
function surfaceMaps(kind: 'wood' | 'end' | 'cloth') {
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
      const fiberPhase = v * Math.PI * 84 + Math.sin(v * Math.PI * 10) * 1.6
        + Math.sin(u * Math.PI * 2 + Math.sin(v * Math.PI * 4)) * 1.1;
      const fiber = Math.sin(fiberPhase) * 0.8 + Math.sin(fiberPhase * 2 + 0.7) * 0.2;
      const thread = ((x % 4 < 2) === (y % 4 < 2) ? 1 : -1);
      const rings = Math.sin(Math.hypot(u - 0.5, v - 0.5) * 132 + Math.sin(v * 19) * 0.4);
      const patch = Math.sin(u * Math.PI * 2 + Math.sin(v * Math.PI * 2) * 0.7)
        * Math.sin(v * Math.PI * 2 - 0.8);
      const value = kind === 'cloth' ? 239 + thread * 4 + fine * 2 + patch * 3
        : kind === 'end' ? 193 + rings * 17 + fine * 6
          : 225 + fiber * 7 + fine * 2 + patch * 8;
      const offset = (y * size + x) * 4;
      color[offset] = color[offset + 1] = color[offset + 2] = value;
      color[offset + 3] = 255;
      height[y * size + x] = kind === 'cloth' ? thread * 0.11 + fine * 0.025
        : kind === 'end' ? rings * 0.12 : fiber * 0.20 + fine * 0.015;
      const finish = kind === 'cloth' ? 246 + patch * 7
        : kind === 'end' ? 246 + patch * 6 : 228 + patch * 18 + fiber * 4;
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
    if (kind === 'cloth') result.repeat.set(4, 4);
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
    normalScale: new THREE.Vector2(0.26, 0.26),
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
        diffuseColor.rgb *= mix(1.0, 0.78, timberWetness);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= mix(1.0, 0.78, timberWetness);');
  };
  material.customProgramCacheKey = () => 'naval-timber-splash-v1';
  return material;
}

export function navalMaterials() {
  const wood = surfaceMaps('wood');
  const end = surfaceMaps('end');
  const cloth = surfaceMaps('cloth');
  const make = (name: string, options: THREE.MeshStandardMaterialParameters) => {
    const material = new THREE.MeshStandardMaterial(options);
    material.name = name;
    return material;
  };
  return {
    wood: splashStain(make('weathered-oak', { color: '#a87b4f', ...wood, roughness: 0.74, metalness: 0 })),
    trim: splashStain(make('oiled-teak', { color: '#be9163', ...wood, roughness: 0.63, metalness: 0 })),
    dark: splashStain(make('wet-timber', { color: '#674934', ...wood, roughness: 0.63, metalness: 0 })),
    end: make('exposed-endgrain', { color: '#bd9669', ...end, roughness: 0.88, metalness: 0 }),
    cloth: make('woven-canvas', { color: '#d5c9ad', ...cloth, roughness: 0.96, metalness: 0, side: THREE.DoubleSide }),
    techCloth: make('laminated-canvas', { color: '#9caead', ...cloth, roughness: 0.76, metalness: 0.06, side: THREE.DoubleSide }),
    rope: make('hemp-and-seams', { color: '#8f8066', roughness: 1, metalness: 0 }),
    chrome: make('brushed-nickel', { color: '#8fa6b0', roughnessMap: wood.roughnessMap, roughness: 0.32, metalness: 0.94 }),
    frame: make('graphite-structure', { color: '#405865', roughness: 0.48, metalness: 0.6 }),
    glass: make('storm-glass', { color: '#365f68', roughness: 0.26, metalness: 0.32 }),
    energy: make('inset-circuit', { color: '#348f91', emissive: '#36ded3', emissiveIntensity: 0.9, roughness: 0.45, metalness: 0.24 }),
    lamp: make('lantern-glass', { color: '#e2ae61', emissive: '#ffb955', emissiveIntensity: 1.3, roughness: 0.5 }),
  };
}

export type NavalMaterials = ReturnType<typeof navalMaterials>;
