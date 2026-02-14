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

  return (
    <div className="storm-canvas-container">
      <Canvas
        camera={{ position: [0, 3, 8], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#040810']} />
        <fog attach="fog" args={['#040810', 10, 50]} />
        
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 10, 5]} intensity={0.3} color="#8899aa" />
        
        <Suspense fallback={null}>
          <Ocean3D wavePercent={wavePercent} />
          <Ship3D tier={tier} score={score} wavePercent={wavePercent} />
          <Storm3D daysSinceStart={daysSinceStart} />
        </Suspense>
        
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.3}
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 4}
          target={[0, 1, 0]}
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
