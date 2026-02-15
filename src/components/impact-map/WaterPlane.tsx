import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WATER_LEVEL } from '../../data/impact-map-data';

const SIZE = 20;
const HEIGHT_SCALE = 4.5;

export function WaterPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const waterY = WATER_LEVEL * HEIGHT_SCALE;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Subtle bobbing animation
      meshRef.current.position.y = waterY + Math.sin(clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, waterY, 0]}>
      <planeGeometry args={[SIZE * 1.5, SIZE * 1.5, 1, 1]} />
      <meshStandardMaterial
        ref={materialRef}
        color={0x1a6faa}
        transparent
        opacity={0.42}
        roughness={0.2}
        metalness={0.1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
