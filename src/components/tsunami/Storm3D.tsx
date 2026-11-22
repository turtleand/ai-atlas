import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createSeededRandom, getLightningEnvelope } from './scene-utils';
import type { SceneCaptureOptions } from './scene-utils';
import { atmosphereGLSL, STORM_STRIKE_SITES } from './atmosphere';
import { getWaveHeight, waveHeightGLSL } from './wave-field';

interface Storm3DProps {
  daysSinceStart: number;
  tier: number;
  stormIntensity: number;
  lightningUniform: THREE.IUniform<number>;
  stormLightDirection: THREE.IUniform<THREE.Vector3>;
  captureTime?: number;
  timeUniform?: THREE.IUniform<number>;
  lighting?: SceneCaptureOptions['lighting'];
  reducedMotion: boolean;
}

const rainVertexShader = /* glsl */ `
  precision highp float;

  attribute vec3 aBase;
  attribute float aTip;
  attribute float aLength;
  attribute float aSpeed;

  uniform float uTime;
  uniform float uCalmRadius;

  varying float vAlpha;

  void main() {
    float top = mod(aBase.y - uTime * aSpeed + 3.0, 31.0) - 2.0;
    float windX = mod(aBase.x - uTime * 2.8 + 30.0, 60.0) - 30.0;
    vec2 horizontal = vec2(windX, aBase.z);
    float distanceFromCore = length(horizontal);
    float calm = uCalmRadius > 0.0
      ? smoothstep(uCalmRadius * 0.42, uCalmRadius * 1.15, distanceFromCore)
      : 1.0;

    if (uCalmRadius > 0.0 && distanceFromCore < uCalmRadius * 1.2) {
      vec2 radial=normalize(horizontal+vec2(0.001));
      horizontal += radial * (1.0-calm) * (uCalmRadius>8.0?4.2:2.8);
      // The singularity organizes the same wind into a slow, broad circulation.
      if(uCalmRadius>8.0) horizontal += vec2(-radial.y,radial.x)*(1.0-calm)*sin(top*0.12+uTime*0.06)*2.0;
    }

    vec3 transformed = vec3(
      horizontal.x - aTip * (0.08 + aLength * 0.21),
      top - aTip * aLength,
      horizontal.y
    );
    vec4 eye = modelViewMatrix * vec4(transformed, 1.0);
    float depth = -eye.z;
    float falloff = smoothstep(1.5, 5.0, depth) * (1.0 - smoothstep(17.0, 36.0, depth));
    vAlpha = calm * falloff * mix(0.50, 0.12, aTip) * smoothstep(-2.0, -0.8, top) * (1.0-smoothstep(26.0,29.0,top));
    gl_Position = projectionMatrix * eye;
  }
`;

const rainFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uLightning;
  varying float vAlpha;

  void main() {
    vec3 color = mix(uColor, vec3(0.84, 0.92, 1.0), uLightning * 0.75);
    gl_FragColor = vec4(color, uOpacity * vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const sprayVertexShader = /* glsl */ `
  precision highp float;

  attribute float aPhase;
  attribute float aSpeed;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uCalmRadius;
  uniform float uStormIntensity;

  varying float vAlpha;

  ${waveHeightGLSL}

  void main() {
    vec3 transformed = position;
    transformed.x = mod(position.x - uTime * aSpeed + 36.0, 72.0) - 36.0;
    transformed.z += sin(uTime * 0.7 + aPhase) * 0.6;
    float surface = waveHeight(transformed.xz);
    float blowing = 0.5 + 0.5 * sin(uTime * 2.2 + aPhase);
    transformed.y = surface + 0.06 + position.y * (0.25 + blowing * 0.75);
    float distanceFromCore = length(transformed.xz);
    float calm = uCalmRadius > 0.0
      ? smoothstep(uCalmRadius * 0.5, uCalmRadius * 1.2, distanceFromCore)
      : 1.0;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    float crest = smoothstep(0.38, 0.96, surface);
    float distanceFade = 1.0 - smoothstep(15.0, 32.0, -mvPosition.z);
    vAlpha = calm * crest * blowing * distanceFade;
    gl_PointSize = clamp(uPixelRatio * 24.0 / max(-mvPosition.z, 1.0), 1.2, 3.8);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const sprayFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uLightning;
  varying float vAlpha;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float softParticle = 1.0 - smoothstep(0.09, 0.5, length(point * vec2(1.0, 1.9)));
    vec3 color = mix(uColor, vec3(0.86, 0.95, 1.0), uLightning);
    gl_FragColor = vec4(color, softParticle * uOpacity * vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const skyVertexShader = /* glsl */ `
  precision highp float;
  varying vec3 vDirection;

  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uLightning;
  uniform vec3 uStormLightDirection;
  uniform float uTier;
  uniform float uSubmersion;
  varying vec3 vDirection;
  ${atmosphereGLSL}

  float hash(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), local.x),
      local.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      value += noise(point) * amplitude;
      point = point * 2.03 + 13.7;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 direction = normalize(vDirection);
    float elevation = max(direction.y, 0.0);
    vec2 wind = vec2(0.011, -0.004) * uTime;
    vec2 cloudUv = direction.xz * (1.65 / (elevation + 0.41));
    float shelf = fbm(cloudUv * vec2(0.87, 1.2) + wind);
    vec2 textureUv = cloudUv * 2.4 - vec2(shelf * 1.7, 0.8) + wind;
    float textureCloud = fbm(textureUv);
    float wisp = noise(textureUv * vec2(4.1, 6.8) + vec2(8.3, -2.6));
    float density = shelf * 0.60 + textureCloud * 0.32 + wisp * 0.08;
    float cloud = smoothstep(0.34, 0.71, density);
    float silverEdge = smoothstep(0.32, 0.46, density) * (1.0 - smoothstep(0.46, 0.56, density));
    float sloop = 1.0 - clamp(abs(uTier - 2.0), 0.0, 1.0);
    float eye = smoothstep(4.1, 5.0, uTier);
    vec3 openingDirection = normalize(mix(vec3(-0.26, 0.29, -1.0), vec3(0.06, 0.24, -1.0), eye));
    float opening = pow(max(dot(direction, openingDirection), 0.0), 14.0 + eye * 38.0);
    float gap = opening * (1.0 - smoothstep(0.28 + 0.17 * eye, 0.59, density));

    vec3 horizon = stormHorizon(uTier, uLightning);
    vec3 lightSlate = mix(vec3(0.075, 0.110, 0.132), vec3(0.059, 0.088, 0.122), sloop);
    vec3 darkSlate = mix(vec3(0.009, 0.022, 0.032), vec3(0.012, 0.022, 0.043), sloop);
    vec3 color = mix(lightSlate, darkSlate, cloud);
    color *= mix(0.94, 0.55, smoothstep(0.22, 0.82, elevation));
    vec3 light = mix(vec3(0.20, 0.27, 0.31), vec3(0.22, 0.35, 0.44), eye);
    color += light * (gap * (0.35 - sloop * 0.27 + eye * 0.35) + silverEdge * opening * (0.14 + 0.10 * wisp));
    color += lightSlate * textureCloud * silverEdge * smoothstep(0.03, 0.28, elevation) * 0.22;

    float rainBand = smoothstep(0.50, 0.74, noise(direction.xz * 17.0 + vec2(elevation * 2.4, 0.0) + wind * 0.6));
    float lowMist = (1.0 - smoothstep(0.015, 0.16, elevation)) * smoothstep(-0.018, 0.025, direction.y);
    color = mix(color, horizon * 1.12, lowMist * (0.56 + rainBand * 0.26));
    color = mix(horizon, color, smoothstep(-0.012, 0.044, direction.y));

    // Illuminate the same cloud bank seen behind the distant strike.
    float strike = max(dot(direction, uStormLightDirection), 0.0);
    float flashGlow = pow(strike, 30.0) * (0.14 + 0.64 * silverEdge + 0.38 * cloud) + pow(strike, 100.0) * 0.13;
    color += vec3(0.32, 0.47, 0.68) * uLightning * flashGlow * smoothstep(-0.035, 0.08, direction.y);
    vec3 aquatic=vec3(0.003,0.019,0.028)
      +vec3(0.003,0.010,0.012)*max(direction.y,0.0)
      +vec3(0.001,0.008,0.011)*min(direction.y,0.0)
      +vec3(0.003,0.007,0.009)*uLightning;
    color=mix(color,aquatic,uSubmersion);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function createRainGeometry(count: number) {
  const random = createSeededRandom(0x51a7e);
  const position = new Float32Array(count * 2 * 3);
  const base = new Float32Array(count * 2 * 3);
  const tip = new Float32Array(count * 2);
  const length = new Float32Array(count * 2);
  const speed = new Float32Array(count * 2);

  for (let index = 0; index < count; index++) {
    const x = (random() - 0.5) * 60;
    const y = random() * 30;
    const z = (random() - 0.5) * 60;
    const streakLength = 0.45 + random() * 1.25;
    const fallSpeed = 15 + random() * 8;

    for (let endpoint = 0; endpoint < 2; endpoint++) {
      const vertex = index * 2 + endpoint;
      base.set([x, y, z], vertex * 3);
      tip[vertex] = endpoint;
      length[vertex] = streakLength;
      speed[vertex] = fallSpeed;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aBase', new THREE.BufferAttribute(base, 3));
  geometry.setAttribute('aTip', new THREE.BufferAttribute(tip, 1));
  geometry.setAttribute('aLength', new THREE.BufferAttribute(length, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  return geometry;
}

function createSprayGeometry(count: number) {
  const random = createSeededRandom(0x5f0a9);
  const position = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const speed = new Float32Array(count);

  for (let index = 0; index < count; index++) {
    position[index * 3] = (random() - 0.5) * 72;
    position[index * 3 + 1] = random() * 0.60;
    position[index * 3 + 2] = (random() - 0.5) * 46;
    phase[index] = random() * Math.PI * 2;
    speed[index] = 10 + random() * 9;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  return geometry;
}

function createLightningGeometry(seed: number) {
  const random = createSeededRandom(seed);
  const positions: number[] = [];
  const colors: number[] = [];
  const path = [new THREE.Vector3(0, 12.0, 0)];
  function drawSegment(start: THREE.Vector3, end: THREE.Vector3, from: number, to: number) {
    positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
    colors.push(from, from, from, to, to, to);
  }
  for (let segment = 1; segment <= 22; segment++) {
    const previous = path[segment - 1];
    const next = new THREE.Vector3(
      previous.x * 0.82 + (random() - 0.5) * 1.1,
      12.0 - segment * 0.53,
      previous.z * 0.8 + (random() - 0.5) * 0.6,
    );
    drawSegment(previous, next, 0.88, 0.95);
    path.push(next);
  }
  for (const [joint, side, length] of [[4, -1, 8], [8, 1, 7], [12, -1, 5], [15, 1, 4]]) {
    let previous = path[joint];
    for (let segment = 0; segment < length; segment++) {
      const next = new THREE.Vector3(
        previous.x + side * (0.16 + random() * 0.42),
        previous.y - 0.25 - random() * 0.32,
        previous.z + (random() - 0.5) * 0.42,
      );
      drawSegment(previous, next, 0.64 * (1 - segment / length), 0.64 * (1 - (segment + 1) / length));
      previous = next;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

export function Storm3D({
  daysSinceStart,
  tier,
  stormIntensity,
  lightningUniform,
  stormLightDirection,
  captureTime,
  timeUniform,
  lighting = 'scene',
  reducedMotion,
}: Storm3DProps) {
  const { scene } = useThree();
  const lightningLight = useRef<THREE.DirectionalLight>(null);
  const fogState = useRef<{ fog: THREE.Fog; color: THREE.Color; near: number; far: number } | null>(null);
  const aquaticColor = useMemo(() => new THREE.Color().setRGB(0.003, 0.019, 0.028), []);
  const rainCount = reducedMotion ? 100 : 1100;
  const sprayCount = reducedMotion ? 30 : 380;
  const calmRadius = tier === 5 ? 11 : tier === 4 ? 5 : 0;
  const seedOffset = daysSinceStart % 97;

  const rainGeometry = useMemo(() => createRainGeometry(rainCount), [rainCount]);
  const sprayGeometry = useMemo(() => createSprayGeometry(sprayCount), [sprayCount]);
  const boltGeometries = useMemo(
    () => [
      createLightningGeometry(0x991 + seedOffset),
      createLightningGeometry(0x224 + seedOffset),
      createLightningGeometry(0x7ad + seedOffset),
    ],
    [seedOffset],
  );

  const rainMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: rainVertexShader,
        fragmentShader: rainFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uCalmRadius: { value: 0 },
          uColor: { value: new THREE.Color('#8fa9c4') },
          uOpacity: { value: 0.46 },
          uLightning: lightningUniform,
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        toneMapped: true,
      }),
    [lightningUniform],
  );

  const sprayMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sprayVertexShader,
        fragmentShader: sprayFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
          uCalmRadius: { value: 0 },
          uStormIntensity: { value: 1 },
          uColor: { value: new THREE.Color('#abc8d5') },
          uOpacity: { value: 0.34 },
          uLightning: lightningUniform,
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: true,
      }),
    [lightningUniform],
  );

  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertexShader,
        fragmentShader: skyFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uLightning: lightningUniform,
          uStormLightDirection: stormLightDirection,
          uTier: { value: 1 },
          uSubmersion: { value: 0 },
        },
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: true,
      }),
    [lightningUniform, stormLightDirection],
  );

  const boltMaterials = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.LineBasicMaterial({
            color: '#d9e8ff',
            transparent: true,
            opacity: 0,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: true,
          }),
      ),
    [],
  );

  // Resource lifetimes are independent: a tier material change must not
  // dispose an unchanged rain or bolt geometry that is still in use.
  useEffect(() => () => rainGeometry.dispose(), [rainGeometry]);
  useEffect(() => () => sprayGeometry.dispose(), [sprayGeometry]);
  useEffect(() => () => rainMaterial.dispose(), [rainMaterial]);
  useEffect(() => () => sprayMaterial.dispose(), [sprayMaterial]);
  useEffect(() => () => skyMaterial.dispose(), [skyMaterial]);
  useEffect(() => () => boltGeometries.forEach(geometry => geometry.dispose()), [boltGeometries]);
  useEffect(() => () => boltMaterials.forEach(material => material.dispose()), [boltMaterials]);
  useEffect(() => () => { lightningUniform.value = 0; }, [lightningUniform]);
  useEffect(() => {
    const fog = scene.fog;
    if (!(fog instanceof THREE.Fog)) return;
    const original = { fog, color: fog.color.clone(), near: fog.near, far: fog.far };
    fogState.current = original;
    return () => {
      if (scene.fog === fog) {
        fog.color.copy(original.color);
        fog.near = original.near;
        fog.far = original.far;
      }
      fogState.current = null;
    };
  }, [scene]);
  // Read the updated orbit camera before the ocean and ship sample this flash.
  useFrame(({ clock, camera, gl }) => {
    const time = timeUniform?.value ?? captureTime ?? clock.getElapsedTime() * (reducedMotion ? 0.25 : 1);
    const waterDepth = getWaveHeight(camera.position.x, camera.position.z, time, stormIntensity, calmRadius) - camera.position.y;
    // A short waterline transition, driven by the same geometric swell as the
    // ocean. Camera bounds stay unchanged when a wave briefly covers the eye.
    const submersion = THREE.MathUtils.smoothstep(waterDepth, -0.035, 0.015);
    const airVisibility = 1 - submersion;
    const flash = reducedMotion || lighting === 'ambient' || lighting === 'neutral' ? 0 : lighting === 'flash' ? 0.8 : getLightningEnvelope(time);
    const activeBolt = Math.floor(time / 8.5) % STORM_STRIKE_SITES.length;
    const [strikeX, , strikeZ] = STORM_STRIKE_SITES[activeBolt];
    lightningUniform.value = flash;
    stormLightDirection.value.set(strikeX, 8.0, strikeZ).normalize();

    rainMaterial.uniforms.uTime.value = time;
    rainMaterial.uniforms.uCalmRadius.value = calmRadius;
    rainMaterial.uniforms.uOpacity.value = (reducedMotion ? 0.18 : 0.46) * airVisibility;
    sprayMaterial.uniforms.uTime.value = time;
    sprayMaterial.uniforms.uStormIntensity.value = stormIntensity;
    sprayMaterial.uniforms.uCalmRadius.value = calmRadius;
    sprayMaterial.uniforms.uPixelRatio.value = gl.getPixelRatio();
    sprayMaterial.uniforms.uOpacity.value = (reducedMotion ? 0.12 : 0.34) * airVisibility;
    skyMaterial.uniforms.uTime.value = time;
    skyMaterial.uniforms.uTier.value = tier;
    skyMaterial.uniforms.uSubmersion.value = submersion;
    const baseline = fogState.current;
    if (baseline && scene.fog === baseline.fog) {
      baseline.fog.color.copy(baseline.color).lerp(aquaticColor, submersion);
      baseline.fog.near = THREE.MathUtils.lerp(baseline.near, 0.5, submersion);
      baseline.fog.far = THREE.MathUtils.lerp(baseline.far, 10, submersion);
    }

    boltMaterials.forEach((material, index) => {
      material.opacity = index === activeBolt ? flash * 0.9 * airVisibility : 0;
      material.visible = material.opacity > 0;
    });

    if (lightningLight.current) {
      lightningLight.current.position.set(strikeX, 14, strikeZ);
      // A distant strike lights the sky and water most strongly. Keep enough
      // fill on the ship to read wet material instead of clipping to white.
      lightningLight.current.intensity = flash * 0.78 * (1 - submersion * 0.85);
    }
  }, -0.5);

  return (
    <>
      <mesh material={skyMaterial}>
        <sphereGeometry args={[500, 24, 16]} />
      </mesh>

      <lineSegments geometry={rainGeometry} material={rainMaterial} frustumCulled={false} />
      <points geometry={sprayGeometry} material={sprayMaterial} />

      {STORM_STRIKE_SITES.map((site, index) => (
        <lineSegments key={site[0]} position={site} geometry={boltGeometries[index]} material={boltMaterials[index]} />
      ))}

      <directionalLight ref={lightningLight} position={[8,18,-10]} intensity={0} color="#d5e5ff" />
    </>
  );
}
