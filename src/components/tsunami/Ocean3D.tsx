import { useRef, useMemo } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

extend({ Water });

// TypeScript declaration for the Water JSX element
declare module '@react-three/fiber' {
  interface ThreeElements {
    water: any;
  }
}

interface Ocean3DProps {
  wavePercent: number;
}

export function Ocean3D({ wavePercent }: Ocean3DProps) {
  const ref = useRef<any>(null);
  const { scene } = useThree();
  
  const waterNormals = useTexture('/assets/waternormals.jpg');
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  
  // Wave intensity scales with tsunami progress
  const distortionScale = 2 + (wavePercent / 100) * 6; // 2-8 range
  
  const config = useMemo(() => ({
    textureWidth: 512,
    textureHeight: 512,
    waterNormals,
    sunDirection: new THREE.Vector3(0.3, 0.5, 0.2),
    sunColor: 0x222233,
    waterColor: 0x001020,
    distortionScale,
    fog: scene.fog !== undefined,
  }), [waterNormals, scene.fog, distortionScale]);
  
  const geom = useMemo(() => new THREE.PlaneGeometry(200, 200), []);
  
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.material.uniforms['time'].value += delta * 0.5;
    }
  });
  
  return (
    <water
      ref={ref}
      args={[geom, config]}
      rotation-x={-Math.PI / 2}
      position={[0, 0, 0]}
    />
  );
}
