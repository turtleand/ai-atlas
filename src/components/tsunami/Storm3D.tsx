import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createSeededRandom, getLightningEnvelope } from './scene-utils';
import type { SceneCaptureOptions } from './scene-utils';
import { atmosphereGLSL } from './atmosphere';
import { getWaveHeight } from './wave-field';

interface Storm3DProps {
  daysSinceStart: number;
  tier: number;
  stormIntensity: number;
  lightningUniform: THREE.IUniform<number>;
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
      horizontal.x - aTip * 0.16,
      top - aTip * aLength,
      horizontal.y
    );
    vAlpha = calm * (0.35 + aLength * 0.12) * smoothstep(-2.0, -0.8, top) * (1.0-smoothstep(26.0,29.0,top));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
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

  varying float vAlpha;

  void main() {
    vec3 transformed = position;
    transformed.x = mod(position.x - uTime * aSpeed + 36.0, 72.0) - 36.0;
    transformed.y += sin(uTime * 2.4 + aPhase) * 0.35;
    transformed.z += sin(uTime * 0.7 + aPhase) * 0.6;
    float distanceFromCore = length(transformed.xz);
    float calm = uCalmRadius > 0.0
      ? smoothstep(uCalmRadius * 0.5, uCalmRadius * 1.2, distanceFromCore)
      : 1.0;
    vAlpha = calm * (1.0 - smoothstep(26.0,36.0,abs(transformed.x)));

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_PointSize = clamp(uPixelRatio * 24.0 / max(-mvPosition.z, 1.0), 1.2, 4.2);
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
    float softParticle = 1.0 - smoothstep(0.12, 0.5, length(point));
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
    float horizon = 1.0 - smoothstep(-0.12, 0.62, direction.y);
    vec2 cloudUv = direction.xz / max(0.18, direction.y + 0.82);
    cloudUv += vec2(uTime * 0.008, -uTime * 0.003);
    float broadCloud = fbm(cloudUv * 2.1);
    float detailCloud = fbm(cloudUv * 5.6 - uTime * 0.006);
    float cloud = smoothstep(0.4, 0.78, broadCloud * 0.72 + detailCloud * 0.42);
    cloud *= smoothstep(-0.35, 0.35, direction.y) * 0.75 + horizon * 0.62;

    vec3 zenith = vec3(0.003, 0.009, 0.021);
    vec3 horizonColor = vec3(0.012, 0.030, 0.047);
    vec3 color = mix(horizonColor, zenith, smoothstep(-0.2, 0.8, direction.y));
    color = mix(color, vec3(0.060, 0.088, 0.12), cloud * 0.78);
    float underside = smoothstep(0.50,0.75,broadCloud) * smoothstep(0.25,0.8,direction.y);
    color *= 1.0 - underside * 0.42;

    float command = smoothstep(3.5, 5.0, uTier);
    vec3 commandColor = mix(vec3(0.02, 0.22, 0.28), vec3(0.28, 0.17, 0.04), smoothstep(4.4, 5.0, uTier));
    color += commandColor * command * (0.08 + horizon * 0.1);
    color += vec3(0.12, 0.19, 0.29) * uLightning * (0.38 + cloud * 0.8);
    if (uTier > 4.5) {
      float azimuth = atan(direction.z, direction.x);
      float curtain = sin(azimuth * 3.0 + uTime * 0.045) * 0.04;
      float aurora = exp(-pow((direction.y - 0.18 - curtain) * 19.0, 2.0));
      float filaments = 0.62 + 0.38 * sin(azimuth * 26.0 + direction.y * 4.0 + uTime * 0.15);
      // Whole longitude harmonics meet continuously at atan's -PI / PI wrap.
      color += mix(vec3(0.032,0.16,0.12), vec3(0.15,0.10,0.025), smoothstep(-0.4,0.65,sin(azimuth))) * aurora * filaments;
    }

    color=mix(stormHorizon(uTier,uLightning),color,smoothstep(0.0,0.24,abs(direction.y)));
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
    position[index * 3 + 1] = random() * 4.8 - 0.4;
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
  const points: THREE.Vector3[] = [];
  let previous = new THREE.Vector3(0, 22, 0);

  for (let segment = 1; segment <= 12; segment++) {
    const next = new THREE.Vector3(
      (random() - 0.5) * (1.2 + segment * 0.22),
      22 - segment * 1.55,
      (random() - 0.5) * 1.3,
    );
    points.push(previous, next);
    previous = next;
  }

  return new THREE.BufferGeometry().setFromPoints(points);
}

export function Storm3D({
  daysSinceStart,
  tier,
  stormIntensity,
  lightningUniform,
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
          uTier: { value: 1 },
          uSubmersion: { value: 0 },
        },
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: true,
      }),
    [lightningUniform],
  );

  const boltMaterials = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.LineBasicMaterial({
            color: '#d9e8ff',
            transparent: true,
            opacity: 0,
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
  useEffect(() => {
    boltMaterials.forEach(material => material.color.set(tier === 5 ? '#ffe5a3' : '#d9e8ff'));
  }, [boltMaterials, tier]);

  useFrame(({ clock, camera, gl }) => {
    const time = timeUniform?.value ?? captureTime ?? clock.getElapsedTime() * (reducedMotion ? 0.25 : 1);
    const waterDepth = getWaveHeight(camera.position.x, camera.position.z, time, stormIntensity, calmRadius) - camera.position.y;
    // A short waterline transition, driven by the same geometric swell as the
    // ocean. Camera bounds stay unchanged when a wave briefly covers the eye.
    const submersion = THREE.MathUtils.smoothstep(waterDepth, -0.035, 0.015);
    const airVisibility = 1 - submersion;
    const flash = reducedMotion || lighting === 'ambient' || lighting === 'neutral' ? 0 : lighting === 'flash' ? 0.8 : getLightningEnvelope(time);
    const activeBolt = Math.floor(time / 8.5) % 3;
    lightningUniform.value = flash;

    rainMaterial.uniforms.uTime.value = time;
    rainMaterial.uniforms.uCalmRadius.value = calmRadius;
    rainMaterial.uniforms.uOpacity.value = (reducedMotion ? 0.18 : 0.46) * airVisibility;
    sprayMaterial.uniforms.uTime.value = time;
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
    });

    if (lightningLight.current) {
      const positions = [[8,18,-10],[-13,20,4],[4,17,14]];
      lightningLight.current.position.set(...positions[activeBolt] as [number,number,number]);
      lightningLight.current.intensity = flash * 3.8 * (1 - submersion * 0.85);
      lightningLight.current.color.set(tier === 5 ? '#ffe1a0' : '#d5e5ff');
    }
  });

  return (
    <>
      <mesh material={skyMaterial}>
        <sphereGeometry args={[500, 24, 16]} />
      </mesh>

      <lineSegments geometry={rainGeometry} material={rainMaterial} frustumCulled={false} />
      <points geometry={sprayGeometry} material={sprayMaterial} />

      <group position={[8, 0, -12]}>
        <lineSegments geometry={boltGeometries[0]} material={boltMaterials[0]} />
      </group>
      <group position={[-13, 2, 2]} rotation={[0, 0, -0.08]}>
        <lineSegments geometry={boltGeometries[1]} material={boltMaterials[1]} />
      </group>
      <group position={[4, 0, 12]} rotation={[0, 0, 0.06]}>
        <lineSegments geometry={boltGeometries[2]} material={boltMaterials[2]} />
      </group>

      <directionalLight ref={lightningLight} position={[8,18,-10]} intensity={0} color="#d5e5ff" />
    </>
  );
}
