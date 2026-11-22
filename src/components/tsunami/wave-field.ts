/** Long Surge spectrum shared by water geometry and hull support. */
export const WAVES = [
  { amp: 1.03, freq: 0.137, speed: 0.72, x: 0.28, z: -0.96, phase: 0.30 },
  // A phase-locked second harmonic sharpens the traveling face smoothly.
  { amp: 0.17, freq: 0.274, speed: 1.44, x: 0.28, z: -0.96, phase: 0.60 - Math.PI / 2 },
  { amp: 0.35, freq: 0.094, speed: 0.49, x: -0.81, z: -0.59, phase: 1.05 },
  { amp: 0.105, freq: 0.37, speed: 1.24, x: 0.84, z: 0.54, phase: -0.55 },
] as const;

// The largest crests build beyond the default orbit. The hull footprints
// stay within the central zone where the scale is constant.
const CENTRAL_WAVE_RADIUS = 7.2;
const OPEN_WAVE_RADIUS = 23;
const CENTRAL_WAVE_SCALE = 0.70;
const OPEN_WAVE_SCALE = 1.26;

function smoothWaveStep(start: number, end: number, value: number) {
  const fraction = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return fraction * fraction * (3 - 2 * fraction);
}

export function getWaveHeight(x: number, z: number, time: number, intensity = 1, calmRadius = 0): number {
  let height = 0;
  for (const wave of WAVES) {
    height += wave.amp * Math.sin((wave.x * x + wave.z * z) * wave.freq + time * wave.speed + wave.phase);
  }
  const radius = Math.hypot(x, z);
  height *= CENTRAL_WAVE_SCALE + (OPEN_WAVE_SCALE - CENTRAL_WAVE_SCALE)
    * smoothWaveStep(CENTRAL_WAVE_RADIUS, OPEN_WAVE_RADIUS, radius);
  if (calmRadius > 0) {
    const fraction = Math.min(1, radius / calmRadius);
    height *= 0.08 + 0.92 * fraction * fraction * (3 - 2 * fraction);
  }
  return height * intensity;
}

const glslFloat = (value: number) => Number.isInteger(value) ? value.toFixed(1) : String(value);
const shaderSpectrum = WAVES.map(wave => (
  `height += ${glslFloat(wave.amp)} * sin(dot(point, vec2(${glslFloat(wave.x)}, ${glslFloat(wave.z)})) * ${glslFloat(wave.freq)} + uTime * ${glslFloat(wave.speed)} + (${glslFloat(wave.phase)}));`
)).join('\n  ');

/** Generated from the CPU spectrum so displacement cannot drift from buoyancy. */
export const waveHeightGLSL = `
float waveHeight(vec2 point) {
  float height = 0.0;
  ${shaderSpectrum}
  float radius = length(point);
  height *= mix(${glslFloat(CENTRAL_WAVE_SCALE)}, ${glslFloat(OPEN_WAVE_SCALE)}, smoothstep(${glslFloat(CENTRAL_WAVE_RADIUS)}, ${glslFloat(OPEN_WAVE_RADIUS)}, radius));
  float attenuation = uCalmRadius > 0.0 ? mix(0.08, 1.0, smoothstep(0.0, uCalmRadius, radius)) : 1.0;
  return height * uStormIntensity * attenuation;
}
`;

export const SLOOP_SCALE = 1.224;
export const SLOOP_HEADING = 0.6;
export const SLOOP_ROLL_LIMIT = Math.PI / 30;
export const SLOOP_PITCH_LIMIT = Math.PI * 8 / 180;

const SLOOP_RESPONSE_RATE = 8;

function supportResponse(heading: number, halfWidth: number, halfLength: number, rate: number) {
  const cosine = Math.cos(heading);
  const sine = Math.sin(heading);
  return WAVES.map((wave) => {
    // Project world-space wave vectors onto the scaled hull's transverse and
    // longitudinal sample axes to measure each component over the footprint.
    const transverseWaveNumber = wave.freq * (wave.x * cosine - wave.z * sine);
    const longitudinalWaveNumber = wave.freq * (wave.x * sine + wave.z * cosine);
    const denominator = rate ** 2 + wave.speed ** 2;
    return {
      speed: wave.speed,
      phase: wave.phase,
      transverse: CENTRAL_WAVE_SCALE * wave.amp * Math.sin(transverseWaveNumber * halfWidth) / halfWidth,
      longitudinal: CENTRAL_WAVE_SCALE * wave.amp * Math.sin(longitudinalWaveNumber * halfLength) / halfLength,
      cosineResponse: rate ** 2 / denominator,
      sineResponse: rate * wave.speed / denominator,
    };
  });
}

const WRECK_HEADING = -0.4;
const CRUISER_HEADING = -0.52;
const sloopResponse = supportResponse(SLOOP_HEADING, 0.43 * SLOOP_SCALE, 1.15 * SLOOP_SCALE, SLOOP_RESPONSE_RATE);
const navalResponse = {
  1: supportResponse(WRECK_HEADING, 0.85, 1.3, 4.8),
  3: supportResponse(CRUISER_HEADING, 0.9, 3.35, 4.2),
};

/**
 * The analytic steady-state response of the five-point water support plane.
 * Capture time determines the tilt independently of earlier rendered frames.
 * The caller applies the angles in YXZ order (heading, local pitch/roll).
 */
function supportSlopes(waves: ReturnType<typeof supportResponse>, time: number, intensity: number) {
  let transverseSlope = 0;
  let longitudinalSlope = 0;
  for (const wave of waves) {
    const phase = time * wave.speed + wave.phase;
    const response = intensity * (
      wave.cosineResponse * Math.cos(phase) + wave.sineResponse * Math.sin(phase)
    );
    transverseSlope += wave.transverse * response;
    longitudinalSlope += wave.longitudinal * response;
  }
  return { transverseSlope, longitudinalSlope };
}

function limitSloopAngle(angle: number, limit: number) {
  // Ease into the limit so steep water cannot stop a tilt abruptly.
  return angle / (1 + (angle / limit) ** 8) ** (1 / 8);
}

export function getSloopPose(time: number, intensity: number) {
  const { transverseSlope, longitudinalSlope } = supportSlopes(sloopResponse, time, intensity);
  const pitch = limitSloopAngle(-Math.atan(longitudinalSlope), SLOOP_PITCH_LIMIT);
  const roll = limitSloopAngle(Math.atan(transverseSlope * Math.cos(pitch)), SLOOP_ROLL_LIMIT);
  // Follow the center sample without a heave delay to keep the deck clear.
  return { x: pitch, y: SLOOP_HEADING, z: roll, height: getWaveHeight(0, 0, time, intensity) + 0.14 };
}

/** A heavy cruiser averages a longer footprint. The wreck briefly lags a passing crest. */
export function getNavalPose(tier: 1 | 3, time: number, intensity: number) {
  const heading = tier === 1 ? WRECK_HEADING : CRUISER_HEADING;
  const wave = getWaveHeight(0, 0, time, intensity);
  const { transverseSlope, longitudinalSlope } = supportSlopes(navalResponse[tier], time, intensity);
  const leverage = tier === 1 ? 1.18 : 0.83;
  const pitchLimit = tier === 1 ? 0.28 : 0.205;
  const rollLimit = tier === 1 ? 0.25 : 0.19;
  const pitch = pitchLimit * Math.tanh(-Math.atan(longitudinalSlope) * leverage / pitchLimit);
  const roll = rollLimit * Math.tanh(Math.atan(transverseSlope * Math.cos(pitch)) * leverage / rollLimit);
  const lagged = tier === 1 ? getWaveHeight(0, 0, time - 0.40, intensity) : wave;
  const height = tier === 1 ? wave - 0.10 + 0.19 * Math.tanh((lagged - wave) / 0.19) : wave + 0.18;
  return { height, x: pitch, y: heading, z: roll };
}
