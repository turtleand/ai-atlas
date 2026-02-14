import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Storm3DProps {
  daysSinceStart: number;
}

export function Storm3D(_props: Storm3DProps) {
  const rainRef = useRef<THREE.Points>(null);
  const lightningRef = useRef<THREE.PointLight>(null);
  const [nextFlash, setNextFlash] = useState(Math.random() * 5 + 3);
  
  // Rain particles
  const rainCount = 4000;
  const rainPositions = useMemo(() => {
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;      // x: spread
      positions[i * 3 + 1] = Math.random() * 30;            // y: height
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;   // z: spread
    }
    return positions;
  }, []);
  
  const rainGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    return geom;
  }, [rainPositions]);
  
  useFrame(({ clock }, delta) => {
    // Animate rain falling
    if (rainRef.current) {
      const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < rainCount; i++) {
        positions[i * 3 + 1] -= delta * 15; // Fall speed
        // Slight diagonal (wind)
        positions[i * 3] -= delta * 2;
        
        // Reset when below water
        if (positions[i * 3 + 1] < -1) {
          positions[i * 3 + 1] = 25 + Math.random() * 5;
          positions[i * 3] = (Math.random() - 0.5) * 60;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Lightning flashes
    if (lightningRef.current) {
      const t = clock.getElapsedTime();
      if (t > nextFlash) {
        // Flash!
        lightningRef.current.intensity = 8;
        // Quick fade
        setTimeout(() => {
          if (lightningRef.current) lightningRef.current.intensity = 0;
        }, 100);
        // Double flash sometimes
        if (Math.random() > 0.5) {
          setTimeout(() => {
            if (lightningRef.current) lightningRef.current.intensity = 5;
            setTimeout(() => {
              if (lightningRef.current) lightningRef.current.intensity = 0;
            }, 80);
          }, 200);
        }
        setNextFlash(t + 4 + Math.random() * 8); // Next flash in 4-12 seconds
      }
    }
  });
  
  return (
    <>
      {/* Rain particles */}
      <points ref={rainRef} geometry={rainGeometry}>
        <pointsMaterial
          color="#8899bb"
          size={0.08}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
      
      {/* Lightning light */}
      <pointLight
        ref={lightningRef}
        position={[10, 20, -5]}
        intensity={0}
        color="#ccddff"
        distance={100}
      />
      
      {/* Second lightning source (different position for variety) */}
      <pointLight
        position={[-15, 25, 10]}
        intensity={0}
        color="#aabbdd"
        distance={80}
      />
      
      {/* Dark cloudy sky sphere */}
      <mesh>
        <sphereGeometry args={[80, 32, 32]} />
        <meshBasicMaterial color="#050a15" side={THREE.BackSide} />
      </mesh>
    </>
  );
}
