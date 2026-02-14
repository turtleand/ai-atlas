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
        camera={{ position: [-4, 3, 9], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0c1e35']} />
        <fog attach="fog" args={['#0c1e35', 20, 80]} />
        
        {/* Ambient light — enough to see shapes */}
        <ambientLight intensity={0.4} />
        
        {/* Hemisphere: stormy sky above, dark water reflection below */}
        <hemisphereLight args={['#2a3a5e', '#0a1525', 0.5]} />
        
        {/* Main directional (moonlight breaking through clouds) */}
        <directionalLight position={[5, 12, 5]} intensity={0.6} color="#8899bb" />
        
        {/* Ship spotlight — key light for visibility */}
        <spotLight
          position={[3, 8, 3]}
          intensity={1.2}
          angle={0.4}
          penumbra={0.8}
          color="#aabbdd"
          castShadow={false}
        />
        
        {/* Fill light from opposite side */}
        <pointLight position={[-5, 4, -3]} intensity={0.4} color="#667799" distance={25} />
        
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
