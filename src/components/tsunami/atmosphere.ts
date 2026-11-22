export const STORM_STRIKE_SITES: [number, number, number][] = [
  [22, 0, -47],
  [-42, 0, -10],
  [15, 0, 47],
];

/** Linear radiance shared by the sky horizon and distant water. */
export const atmosphereGLSL = /* glsl */ `
  vec3 stormHorizon(float tier, float flash) {
    vec3 horizon = mix(vec3(0.038, 0.064, 0.079), vec3(0.033, 0.060, 0.091), 1.0 - clamp(abs(tier - 2.0), 0.0, 1.0));
    return horizon + vec3(0.007, 0.013, 0.023) * flash;
  }
`;
