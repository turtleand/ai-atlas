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
  tier: number;
}

export function StormScene({ score, wavePercent, daysSinceStart, tier }: StormSceneProps) {
  // Storm intensity scales with wavePercent
  const stormIntensity = 0.5 + (wavePercent / 100) * 1.5;

  return (
    <div className="storm-canvas-container">
      <Canvas
        camera={{ position: [-3, 2.5, 6], fov: 55, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0c1e35']} />
        <fog attach="fog" args={['#0c1e35', 18, 65]} />
        
        {/* Ambient — enough to see all shapes */}
        <ambientLight intensity={0.4} />
        
        {/* Hemisphere: stormy sky above, dark ocean reflection below */}
        <hemisphereLight args={['#2a3a5e', '#0a1525', 0.5]} />
        
        {/* Moonlight breaking through clouds */}
        <directionalLight position={[5, 12, 5]} intensity={0.6} color="#8899bb" />
        
        {/* Ship area key light — ensures ship is always visible */}
        <pointLight position={[0, 5, 0]} intensity={1.2} color="#8899bb" distance={18} />
        
        {/* Fill light from opposite side */}
        <pointLight position={[-4, 3, -3]} intensity={0.5} color="#667799" distance={20} />
        
        <Suspense fallback={null}>
          <Ocean3D wavePercent={wavePercent} calmRadius={tier === 5 ? 7 : tier === 4 ? 5 : undefined} />
          <Ship3D tier={tier as 1 | 2 | 3 | 4 | 5} score={score} wavePercent={wavePercent} stormIntensity={stormIntensity} />
          <Storm3D daysSinceStart={daysSinceStart} />
        </Suspense>
        
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.3}
          enableZoom={true}
          minDistance={3}
          maxDistance={15}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 6}
          enableDamping
          dampingFactor={0.05}
          target={[0, tier >= 4 ? 1.5 : 0.5, 0]}
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
