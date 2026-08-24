import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Ocean3DProps {
  wavePercent: number;
  tier: number;
  calmRadius?: number;
  lightningUniform: THREE.IUniform<number>;
  captureTime?: number;
  reducedMotion: boolean;
}

const WAVES = [
  { amp: 1.2, freq: 0.15, speed: 0.8, dir: [1, 0.3] },
  { amp: 0.8, freq: 0.25, speed: 1.2, dir: [-0.7, 1] },
  { amp: 0.5, freq: 0.4, speed: 1.5, dir: [0.3, -0.8] },
  { amp: 0.3, freq: 0.6, speed: 2.0, dir: [-0.5, -0.6] },
];

export function getWaveHeight(
  x: number,
  z: number,
  time: number,
  stormIntensity = 1,
): number {
  let y = 0;
  for (const wave of WAVES) {
    const dot = wave.dir[0] * x + wave.dir[1] * z;
    y += wave.amp * stormIntensity * Math.sin(dot * wave.freq + time * wave.speed);
  }
  return y;
}

const vertexShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uStormIntensity;
  uniform float uCalmRadius;

  varying vec3 vWorldPosition;
  varying vec3 vWaveNormal;
  varying float vFoam;
  varying float vCalm;

  float calmFactor(vec2 point) {
    if (uCalmRadius <= 0.0) return 1.0;
    float distanceFromCore = length(point);
    return mix(0.08, 1.0, smoothstep(0.0, uCalmRadius, distanceFromCore));
  }

  float waveHeight(vec2 point) {
    float height = 0.0;
    height += 1.2 * sin(dot(point, vec2(1.0, 0.3)) * 0.15 + uTime * 0.8);
    height += 0.8 * sin(dot(point, vec2(-0.7, 1.0)) * 0.25 + uTime * 1.2);
    height += 0.5 * sin(dot(point, vec2(0.3, -0.8)) * 0.4 + uTime * 1.5);
    height += 0.3 * sin(dot(point, vec2(-0.5, -0.6)) * 0.6 + uTime * 2.0);
    return height * uStormIntensity * calmFactor(point);
  }

  void main() {
    vec3 displaced = position;
    vec2 point = position.xz;
    float height = waveHeight(point);
    float offset = 0.18;
    float heightX = waveHeight(point + vec2(offset, 0.0));
    float heightZ = waveHeight(point + vec2(0.0, offset));
    vec3 tangentX = normalize(vec3(offset, heightX - height, 0.0));
    vec3 tangentZ = normalize(vec3(0.0, heightZ - height, offset));
    vec3 localNormal = normalize(cross(tangentZ, tangentX));

    displaced.y = height;
    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = world.xyz;
    vWaveNormal = normalize(normalMatrix * localNormal);
    float slope = 1.0 - clamp(localNormal.y, 0.0, 1.0);
    vFoam = smoothstep(1.02, 1.62, height / max(uStormIntensity, 0.01)) +
      smoothstep(0.4, 0.72, slope) * 0.06;
    vCalm = uCalmRadius > 0.0
      ? 1.0 - smoothstep(0.0, uCalmRadius, length(point))
      : 0.0;

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uStormIntensity;
  uniform float uLightning;
  uniform float uTier;
  uniform vec3 uFogColor;

  varying vec3 vWorldPosition;
  varying vec3 vWaveNormal;
  varying float vFoam;
  varying float vCalm;

  void main() {
    vec3 normal = normalize(vWaveNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.2);
    float facing = max(dot(normal, normalize(vec3(-0.35, 0.86, 0.28))), 0.0);
    float sparkle = pow(max(dot(reflect(-normalize(vec3(-0.35, 0.86, 0.28)), normal), viewDirection), 0.0), 72.0);

    vec3 abyss = vec3(0.008, 0.035, 0.075);
    vec3 body = vec3(0.018, 0.13, 0.22);
    vec3 crest = vec3(0.09, 0.34, 0.43);
    vec3 water = mix(abyss, body, 0.42 + facing * 0.42);
    water = mix(water, crest, fresnel * 0.56);

    float foamMask = clamp(vFoam, 0.0, 1.0);
    vec3 foam = mix(vec3(0.42, 0.63, 0.69), vec3(0.83, 0.94, 0.95), facing);
    water = mix(water, foam, foamMask * 0.38);

    float commandTier = smoothstep(3.5, 5.0, uTier);
    vec3 commandColor = mix(vec3(0.08, 0.75, 0.82), vec3(0.94, 0.72, 0.28), smoothstep(4.4, 5.0, uTier));
    water += commandColor * vCalm * (0.055 + commandTier * 0.11);
    water += vec3(0.42, 0.67, 0.92) * sparkle * (0.65 + uLightning * 1.8);
    water += vec3(0.66, 0.78, 1.0) * uLightning * (0.13 + fresnel * 0.32);

    float distanceToCamera = length(cameraPosition - vWorldPosition);
    float fogAmount = smoothstep(28.0, 78.0, distanceToCamera);
    water = mix(water, uFogColor, fogAmount);

    gl_FragColor = vec4(water, 1.0);
  }
`;

export function Ocean3D({
  wavePercent,
  tier,
  calmRadius,
  lightningUniform,
  captureTime,
  reducedMotion,
}: Ocean3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const stormIntensity = 0.5 + (wavePercent / 100) * 1.5;

  const geometry = useMemo(() => {
    const oceanGeometry = new THREE.PlaneGeometry(140, 140, 120, 120);
    oceanGeometry.rotateX(-Math.PI / 2);
    return oceanGeometry;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: captureTime ?? 0 },
          uStormIntensity: { value: stormIntensity },
          uCalmRadius: { value: calmRadius ?? 0 },
          uLightning: lightningUniform,
          uTier: { value: tier },
          uFogColor: { value: new THREE.Color('#0a1b31') },
        },
        side: THREE.DoubleSide,
        depthWrite: true,
        toneMapped: true,
      }),
    [calmRadius, captureTime, lightningUniform, stormIntensity, tier],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const time = captureTime ?? clock.getElapsedTime() * (reducedMotion ? 0.32 : 1);
    material.uniforms.uTime.value = time;
    material.uniforms.uStormIntensity.value = stormIntensity;
    material.uniforms.uCalmRadius.value = calmRadius ?? 0;
    material.uniforms.uTier.value = tier;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}
