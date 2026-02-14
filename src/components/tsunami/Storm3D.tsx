import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Storm3DProps {
  daysSinceStart: number;
}

export function Storm3D(_props: Storm3DProps) {
  const rainRef = useRef<THREE.Points>(null);
  const sprayRef = useRef<THREE.Points>(null);
  const lights = useRef<THREE.PointLight[]>([]);
  const flashTimers = useRef([
    Math.random() * 3 + 1,
    Math.random() * 4 + 2,
    Math.random() * 5 + 3,
  ]);
  const cameraShakeOffset = useRef({ x: 0, y: 0 });
  
  // Rain particles — 6000 particles
  const rainCount = 6000;
  const rainPositions = useMemo(() => {
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return positions;
  }, []);
  
  const rainGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    return geom;
  }, [rainPositions]);
  
  // Wind/spray particles — 2000 particles
  const sprayCount = 2000;
  const sprayPositions = useMemo(() => {
    const positions = new Float32Array(sprayCount * 3);
    for (let i = 0; i < sprayCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 5; // Close to water
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return positions;
  }, []);
  
  const sprayGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));
    return geom;
  }, [sprayPositions]);
  
  useFrame(({ clock, camera }, delta) => {
    const t = clock.getElapsedTime();
    
    // Animate rain falling
    if (rainRef.current) {
      const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < rainCount; i++) {
        positions[i * 3 + 1] -= delta * 18; // Faster fall
        positions[i * 3] -= delta * 2.5; // Wind
        
        if (positions[i * 3 + 1] < -1) {
          positions[i * 3 + 1] = 25 + Math.random() * 5;
          positions[i * 3] = (Math.random() - 0.5) * 60;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Animate wind/spray particles (horizontal movement)
    if (sprayRef.current) {
      const positions = sprayRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < sprayCount; i++) {
        positions[i * 3] -= delta * 20; // Fast horizontal
        positions[i * 3 + 1] -= delta * 0.5; // Slight downward
        
        if (positions[i * 3] < -30) {
          positions[i * 3] = 30 + Math.random() * 10;
          positions[i * 3 + 1] = Math.random() * 5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
      }
      sprayRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Lightning flashes (3 independent sources)
    flashTimers.current.forEach((nextFlash, i) => {
      if (t > nextFlash && lights.current[i]) {
        lights.current[i].intensity = 6 + Math.random() * 4;
        
        // Camera shake
        cameraShakeOffset.current.x = (Math.random() - 0.5) * 0.03;
        cameraShakeOffset.current.y = (Math.random() - 0.5) * 0.02;
        camera.position.x += cameraShakeOffset.current.x;
        camera.position.y += cameraShakeOffset.current.y;
        
        setTimeout(() => {
          if (lights.current[i]) lights.current[i].intensity = 0;
          // Reset camera shake
          camera.position.x -= cameraShakeOffset.current.x;
          camera.position.y -= cameraShakeOffset.current.y;
        }, 80 + Math.random() * 40);
        
        // Double flash 60% of the time
        if (Math.random() > 0.4) {
          setTimeout(() => {
            if (lights.current[i]) {
              lights.current[i].intensity = 4 + Math.random() * 3;
              setTimeout(() => {
                if (lights.current[i]) lights.current[i].intensity = 0;
              }, 60);
            }
          }, 150 + Math.random() * 100);
        }
        
        flashTimers.current[i] = t + 2 + Math.random() * 4;
      }
    });
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
      
      {/* Wind/spray particles */}
      <points ref={sprayRef} geometry={sprayGeometry}>
        <pointsMaterial
          color="#aabbcc"
          size={0.04}
          transparent
          opacity={0.3}
          sizeAttenuation
        />
      </points>
      
      {/* Lightning lights — 3 sources */}
      <pointLight
        ref={(el) => { if (el) lights.current[0] = el; }}
        position={[10, 20, -5]}
        intensity={0}
        color="#ccddff"
        distance={100}
      />
      <pointLight
        ref={(el) => { if (el) lights.current[1] = el; }}
        position={[-15, 25, 10]}
        intensity={0}
        color="#aabbdd"
        distance={80}
      />
      <pointLight
        ref={(el) => { if (el) lights.current[2] = el; }}
        position={[5, 18, 15]}
        intensity={0}
        color="#ddeeff"
        distance={90}
      />
      
      {/* Dark stormy sky sphere */}
      <mesh>
        <sphereGeometry args={[80, 32, 32]} />
        <meshBasicMaterial color="#030508" side={THREE.BackSide} />
      </mesh>
    </>
  );
}
