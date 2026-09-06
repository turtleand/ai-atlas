/** One spectrum for geometric water, hull support and surface effects. */
export const WAVES = [
  { amp: 0.65, freq: 0.07, speed: 0.42, x: 1, z: 0.3 },
  { amp: 0.32, freq: 0.1, speed: 0.65, x: -0.7, z: 1 },
  { amp: 0.12, freq: 0.2, speed: 0.85, x: 0.3, z: -0.8 },
  { amp: 0.055, freq: 0.3, speed: 1.1, x: -0.5, z: -0.6 },
] as const;

export function getWaveHeight(x: number, z: number, time: number, intensity = 1, calmRadius = 0): number {
  let height = 0;
  for (const wave of WAVES) {
    height += wave.amp * Math.sin((wave.x * x + wave.z * z) * wave.freq + time * wave.speed);
  }
  if (calmRadius > 0) {
    const f = Math.min(1, Math.hypot(x, z) / calmRadius);
    height *= 0.08 + 0.92 * f * f * (3 - 2 * f);
  }
  return height * intensity;
}

const glslFloat = (value: number) => Number.isInteger(value) ? value.toFixed(1) : String(value);

/** Generated from the CPU spectrum so displacement cannot silently drift from buoyancy. */
export const waveHeightGLSL = `
float waveHeight(vec2 point) {
  float height = 0.0;
  ${WAVES.map(w => `height += ${glslFloat(w.amp)} * sin(dot(point, vec2(${glslFloat(w.x)}, ${glslFloat(w.z)})) * ${glslFloat(w.freq)} + uTime * ${glslFloat(w.speed)});`).join('\n  ')}
  float attenuation = uCalmRadius > 0.0 ? mix(0.08, 1.0, smoothstep(0.0, uCalmRadius, length(point))) : 1.0;
  return height * uStormIntensity * attenuation;
}
`;

export const SLOOP_SCALE = 1.224;
export const SLOOP_HEADING = 0.6;
export const SLOOP_ROLL_LIMIT = Math.PI / 30;
export const SLOOP_PITCH_LIMIT = Math.PI * 8 / 180;

const SLOOP_RESPONSE_RATE = 8;
const sloopResponse = WAVES.map((wave) => {
  const cosine = Math.cos(SLOOP_HEADING);
  const sine = Math.sin(SLOOP_HEADING);
  // Project world-space wave vectors onto the scaled hull's transverse and
  // longitudinal sample axes. These are finite differences, not point normals.
  const transverseWaveNumber = wave.freq * (wave.x * cosine - wave.z * sine);
  const longitudinalWaveNumber = wave.freq * (wave.x * sine + wave.z * cosine);
  const halfWidth = 0.43 * SLOOP_SCALE;
  const halfLength = 1.15 * SLOOP_SCALE;
  const denominator = SLOOP_RESPONSE_RATE ** 2 + wave.speed ** 2;
  return {
    speed: wave.speed,
    transverse: wave.amp * Math.sin(transverseWaveNumber * halfWidth) / halfWidth,
    longitudinal: wave.amp * Math.sin(longitudinalWaveNumber * halfLength) / halfLength,
    cosineResponse: SLOOP_RESPONSE_RATE ** 2 / denominator,
    sineResponse: SLOOP_RESPONSE_RATE * wave.speed / denominator,
  };
});

/**
 * A steady-state first-order response to the five-point water support plane.
 * Solving each sinusoid's damping analytically keeps arbitrary captures, tier
 * returns and different frame rates on the same pose without a warm-up history.
 * The caller must apply these angles in YXZ order (heading, local pitch/roll).
 */
export function getSloopPose(time: number, intensity: number) {
  let transverseSlope = 0;
  let longitudinalSlope = 0;
  for (const wave of sloopResponse) {
    const phase = time * wave.speed;
    const response = intensity * (
      wave.cosineResponse * Math.cos(phase) + wave.sineResponse * Math.sin(phase)
    );
    transverseSlope += wave.transverse * response;
    longitudinalSlope += wave.longitudinal * response;
  }
  const pitch = Math.max(-SLOOP_PITCH_LIMIT, Math.min(SLOOP_PITCH_LIMIT, -Math.atan(longitudinalSlope)));
  const roll = Math.max(-SLOOP_ROLL_LIMIT, Math.min(SLOOP_ROLL_LIMIT, Math.atan(transverseSlope * Math.cos(pitch))));
  // The already-smooth heave follows the same water clock directly: filtering
  // the height would let the ocean rise through an otherwise correctly tilted hull.
  return { x: pitch, y: SLOOP_HEADING, z: roll, height: getWaveHeight(0, 0, time, intensity) + 0.14 };
}
