import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Ocean3DProps {
  wavePercent: number;
}

// Gerstner wave parameters — 4 waves summed together
const WAVES = [
  { amp: 1.2, freq: 0.15, speed: 0.8, dir: [1, 0.3] },
  { amp: 0.8, freq: 0.25, speed: 1.2, dir: [-0.7, 1] },
  { amp: 0.5, freq: 0.4, speed: 1.5, dir: [0.3, -0.8] },
  { amp: 0.3, freq: 0.6, speed: 2.0, dir: [-0.5, -0.6] },
];

// Calculate wave height at any (x, z) position and time
export function getWaveHeight(x: number, z: number, time: number, stormIntensity: number = 1): number {
  let y = 0;
  for (const wave of WAVES) {
    const dot = wave.dir[0] * x + wave.dir[1] * z;
    y += wave.amp * stormIntensity * Math.sin(dot * wave.freq + time * wave.speed);
  }
  return y;
}

export function Ocean3D({ wavePercent }: Ocean3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Storm intensity scales with wavePercent (daily tsunami progress)
  const stormIntensity = 0.5 + (wavePercent / 100) * 1.5; // 0.5 to 2.0
  
  const { geometry, originalPositions } = useMemo(() => {
    const geom = new THREE.PlaneGeometry(120, 120, 80, 80);
    geom.rotateX(-Math.PI / 2);
    // Store original flat positions for reference
    const origPos = new Float32Array(geom.attributes.position.array);
    // Add color attribute for foam
    const colors = new Float32Array(geom.attributes.position.count * 3);
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { geometry: geom, originalPositions: origPos };
  }, []);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();
    const positions = geometry.attributes.position.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = originalPositions[i];
      const z = originalPositions[i + 2];
      
      // Calculate wave height
      const y = getWaveHeight(x, z, time, stormIntensity);
      positions[i + 1] = y;
      
      // Foam on wave crests (white where height > threshold)
      const foamThreshold = 0.5 * stormIntensity;
      const foamAmount = Math.max(0, (y - foamThreshold) / (stormIntensity * 0.8));
      const clampedFoam = Math.min(1, foamAmount);
      
      // Base water color: very dark blue-green
      const baseR = 0.01, baseG = 0.04, baseB = 0.08;
      // Foam: white
      colors[i] = baseR + clampedFoam * 0.9;     // R
      colors[i + 1] = baseG + clampedFoam * 0.9;  // G
      colors[i + 2] = baseB + clampedFoam * 0.85;  // B
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.computeVertexNormals();
  });
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.3}
        metalness={0.1}
        envMapIntensity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
