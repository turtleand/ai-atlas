/** Linear radiance shared by the sky horizon, distant water and reflections. */
export const atmosphereGLSL = /* glsl */ `
  vec3 stormHorizon(float tier, float flash) {
    float command=smoothstep(3.5,5.0,tier);
    vec3 influence=mix(vec3(0.02,0.22,0.28),vec3(0.28,0.17,0.04),smoothstep(4.4,5.0,tier));
    return vec3(0.016,0.036,0.055)+influence*command*0.18+vec3(0.12,0.19,0.29)*flash*0.5;
  }
`;
