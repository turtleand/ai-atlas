import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Ocean3D } from './Ocean3D';
import { Ship3D } from './Ship3D';
import { Storm3D } from './Storm3D';

interface StormSceneProps {
  score: number;
  wavePercent: number;
  daysSinceStart: number;
}

export function StormScene({ score, wavePercent, daysSinceStart }: StormSceneProps) {
  const tier = score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 45 ? 2 : 1;
  
  // Storm intensity scales with wavePercent
  const stormIntensity = 0.5 + (wavePercent / 100) * 1.5;

  return (
    <div className="storm-canvas-container">
      <Canvas
        camera={{ position: [-4, 2.5, 8], fov: 65, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#040810']} />
        <fog attach="fog" args={['#040810', 10, 50]} />
        
        {/* Very dim ambient for storm darkness */}
        <ambientLight intensity={0.1} />
        
        {/* Dim hemisphere light */}
        <hemisphereLight args={['#1a1a2e', '#000000', 0.15]} />
        
        {/* Subtle directional light */}
        <directionalLight position={[5, 10, 5]} intensity={0.2} color="#8899aa" />
        
        <Suspense fallback={null}>
          <Ocean3D wavePercent={wavePercent} />
          <Ship3D tier={tier} score={score} wavePercent={wavePercent} stormIntensity={stormIntensity} />
          <Storm3D daysSinceStart={daysSinceStart} />
        </Suspense>
        
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.2}
          enableZoom={true}
          minDistance={4}
          maxDistance={20}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 6}
          enableDamping
          dampingFactor={0.05}
          target={[0, 0.5, 0]}
        />
      </Canvas>
      
      {/* Overlay info */}
      <div className="wave-overlay-text">
        <span className="wave-day">Day {daysSinceStart}</span>
        <span className="wave-separator">·</span>
        <span className="wave-waterline">Waterline: {wavePercent.toFixed(1)}%</span>
      </div>
    </div>
  );
}
