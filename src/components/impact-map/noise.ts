// Simple 2D Simplex-like noise (value noise with smooth interpolation)
// Good enough for terrain generation without external dependencies

function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return h;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);

  const v00 = (hash(ix, iy) & 0xffff) / 0xffff;
  const v10 = (hash(ix + 1, iy) & 0xffff) / 0xffff;
  const v01 = (hash(ix, iy + 1) & 0xffff) / 0xffff;
  const v11 = (hash(ix + 1, iy + 1) & 0xffff) / 0xffff;

  const top = v00 + (v10 - v00) * fx;
  const bottom = v01 + (v11 - v01) * fx;
  return top + (bottom - top) * fy;
}

/**
 * Fractal noise with octaves for natural terrain variation
 */
export function fractalNoise(
  x: number,
  y: number,
  octaves = 5,
  persistence = 0.5,
  lacunarity = 2.0,
  scale = 1.0,
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return value / maxValue;
}
