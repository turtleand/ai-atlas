import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSeededRandom } from './scene-utils';

interface Storm3DProps {
  daysSinceStart: number;
  tier: number;
  lightningUniform: THREE.IUniform<number>;
  captureTime?: number;
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
      horizontal += normalize(horizontal + vec2(0.001)) * (1.0 - calm) * 2.8;
    }

    vec3 transformed = vec3(
      horizontal.x - aTip * 0.16,
      top - aTip * aLength,
      horizontal.y
    );
    vAlpha = calm * (0.45 + aLength * 0.16);
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
    vAlpha = calm;

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
  varying vec3 vDirection;

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
    for (int octave = 0; octave < 5; octave++) {
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

    vec3 zenith = vec3(0.015, 0.045, 0.09);
    vec3 horizonColor = vec3(0.06, 0.14, 0.22);
    vec3 color = mix(horizonColor, zenith, smoothstep(-0.2, 0.8, direction.y));
    color = mix(color, vec3(0.12, 0.18, 0.25), cloud * 0.58);

    float command = smoothstep(3.5, 5.0, uTier);
    vec3 commandColor = mix(vec3(0.02, 0.22, 0.28), vec3(0.28, 0.17, 0.04), smoothstep(4.4, 5.0, uTier));
    color += commandColor * command * (0.08 + horizon * 0.1);
    color += vec3(0.52, 0.67, 0.92) * uLightning * (0.38 + cloud * 0.8);

    gl_FragColor = vec4(color, 1.0);
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

function lightningEnvelope(time: number) {
  const phase = time % 6.7;
  if (phase < 0.07) return 1 - phase / 0.07;
  if (phase > 0.15 && phase < 0.23) return 0.58 * (1 - (phase - 0.15) / 0.08);
  return 0;
}

export function Storm3D({
  daysSinceStart,
  tier,
  lightningUniform,
  captureTime,
  reducedMotion,
}: Storm3DProps) {
  const lightningLights = useRef<THREE.PointLight[]>([]);
  const rainCount = reducedMotion ? 480 : 1500;
  const sprayCount = reducedMotion ? 180 : 720;
  const calmRadius = tier === 5 ? 7 : tier === 4 ? 5 : 0;
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
          uTime: { value: captureTime ?? 0 },
          uCalmRadius: { value: calmRadius },
          uColor: { value: new THREE.Color('#8fa9c4') },
          uOpacity: { value: reducedMotion ? 0.18 : 0.46 },
          uLightning: lightningUniform,
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        toneMapped: true,
      }),
    [calmRadius, captureTime, lightningUniform, reducedMotion],
  );

  const sprayMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sprayVertexShader,
        fragmentShader: sprayFragmentShader,
        uniforms: {
          uTime: { value: captureTime ?? 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
          uCalmRadius: { value: calmRadius },
          uColor: { value: new THREE.Color('#abc8d5') },
          uOpacity: { value: reducedMotion ? 0.12 : 0.34 },
          uLightning: lightningUniform,
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: true,
      }),
    [calmRadius, captureTime, lightningUniform, reducedMotion],
  );

  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertexShader,
        fragmentShader: skyFragmentShader,
        uniforms: {
          uTime: { value: captureTime ?? 0 },
          uLightning: lightningUniform,
          uTier: { value: tier },
        },
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: true,
      }),
    [captureTime, lightningUniform, tier],
  );

  const boltMaterials = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.LineBasicMaterial({
            color: tier === 5 ? '#ffe5a3' : '#d9e8ff',
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: true,
          }),
      ),
    [tier],
  );

  useEffect(
    () => () => {
      rainGeometry.dispose();
      sprayGeometry.dispose();
      rainMaterial.dispose();
      sprayMaterial.dispose();
      skyMaterial.dispose();
      boltGeometries.forEach((geometry) => geometry.dispose());
      boltMaterials.forEach((material) => material.dispose());
      lightningUniform.value = 0;
    },
    [
      boltGeometries,
      boltMaterials,
      lightningUniform,
      rainGeometry,
      rainMaterial,
      skyMaterial,
      sprayGeometry,
      sprayMaterial,
    ],
  );

  useFrame(({ clock }) => {
    const time = captureTime ?? clock.getElapsedTime() * (reducedMotion ? 0.28 : 1);
    const flash = reducedMotion ? lightningEnvelope(time) * 0.22 : lightningEnvelope(time);
    const activeBolt = Math.floor(time / 6.7) % 3;
    lightningUniform.value = flash;

    rainMaterial.uniforms.uTime.value = time;
    rainMaterial.uniforms.uCalmRadius.value = calmRadius;
    sprayMaterial.uniforms.uTime.value = time;
    sprayMaterial.uniforms.uCalmRadius.value = calmRadius;
    skyMaterial.uniforms.uTime.value = time;
    skyMaterial.uniforms.uTier.value = tier;

    boltMaterials.forEach((material, index) => {
      material.opacity = index === activeBolt ? flash * 0.9 : 0;
    });

    lightningLights.current.forEach((light, index) => {
      light.intensity = index === activeBolt ? flash * (tier >= 4 ? 14 : 11) : 0;
      light.color.set(tier === 5 ? '#ffe1a0' : '#d5e5ff');
    });
  });

  return (
    <>
      <mesh material={skyMaterial}>
        <sphereGeometry args={[88, 48, 32]} />
      </mesh>

      <lineSegments geometry={rainGeometry} material={rainMaterial} />
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

      <pointLight
        ref={(light) => {
          if (light) lightningLights.current[0] = light;
        }}
        position={[8, 18, -10]}
        intensity={0}
        color="#d5e5ff"
        distance={105}
      />
      <pointLight
        ref={(light) => {
          if (light) lightningLights.current[1] = light;
        }}
        position={[-13, 20, 4]}
        intensity={0}
        color="#d5e5ff"
        distance={95}
      />
      <pointLight
        ref={(light) => {
          if (light) lightningLights.current[2] = light;
        }}
        position={[4, 17, 14]}
        intensity={0}
        color="#d5e5ff"
        distance={90}
      />
    </>
  );
}
