import { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Ocean3D } from './Ocean3D';
import { Ship3D } from './Ship3D';
import { Storm3D } from './Storm3D';
import { LightningHeadlines } from './LightningHeadlines';

/*
 * Known ship extents per tier (at 1.8x group scale).
 * Used to auto-fit the camera so ships are never cropped.
 */
const TIER_BOUNDS: Record<number, { yMin: number; yMax: number; radius: number }> = {
  1: { yMin: -1.0, yMax: 1.0, radius: 2.5 },
  2: { yMin: -0.5, yMax: 3.5, radius: 2.0 },
  3: { yMin: -1.0, yMax: 6.5, radius: 4.0 },
  4: { yMin: -3.5, yMax: 9.0, radius: 7.0 },
  5: { yMin: -4.5, yMax: 12.0, radius: 9.0 },
};

/** Compute the ideal camera position + lookAt target for a given tier */
function computeCameraForTier(
  tier: number,
  fovDeg: number,
  aspect: number
): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
  const bounds = TIER_BOUNDS[tier] || TIER_BOUNDS[1];
  const fovRad = (fovDeg * Math.PI) / 180;

  const centerY = (bounds.yMin + bounds.yMax) / 2;
  const shipHeight = bounds.yMax - bounds.yMin;
  const shipWidth = bounds.radius * 2;

  // 30% padding so ship doesn't touch edges
  const padding = 1.3;

  const distForHeight = (shipHeight * padding) / (2 * Math.tan(fovRad / 2));
  const distForWidth = (shipWidth * padding) / (2 * Math.tan(fovRad / 2) * aspect);
  const dist = Math.max(distForHeight, distForWidth, 6);

  // Angled view: slight left, elevated, mostly front
  const angle = -0.35;
  return {
    position: new THREE.Vector3(
      Math.sin(angle) * dist * 0.3,
      centerY + dist * 0.25,
      dist * 0.92
    ),
    lookAt: new THREE.Vector3(0, centerY, 0),
  };
}

/**
 * CameraController — smoothly moves camera to frame each tier's ship.
 * Fixes the core bug: Canvas camera prop only applies on mount.
 * On mobile: continuously controls camera (no OrbitControls).
 * On desktop: snaps camera + OrbitControls target on tier change,
 * then lets OrbitControls handle user interaction.
 */
function CameraController({
  tier,
  isMobile,
  controlsRef,
}: {
  tier: number;
  isMobile: boolean;
  controlsRef: React.RefObject<any>;
}) {
  const { camera, size } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3(0, 0.5, 0));
  const prevTier = useRef(tier);

  // On tier change or resize, recompute camera
  useEffect(() => {
    const fov = (camera as THREE.PerspectiveCamera).fov;
    const aspect = size.width / size.height;
    const { position, lookAt } = computeCameraForTier(tier, fov, aspect);

    targetPos.current.copy(position);
    targetLookAt.current.copy(lookAt);

    if (!isMobile) {
      // Desktop: snap camera and update OrbitControls target immediately
      camera.position.copy(position);
      currentLookAt.current.copy(lookAt);
      camera.lookAt(lookAt);

      // Update OrbitControls target so it orbits around the ship center
      if (controlsRef.current) {
        controlsRef.current.target.copy(lookAt);
        controlsRef.current.object.position.copy(position);
        controlsRef.current.update();
      }
    }

    prevTier.current = tier;
  }, [tier, size.width, size.height, camera, isMobile, controlsRef]);

  // On mobile: continuously lerp camera to target (smooth tier transitions)
  useFrame(() => {
    if (!isMobile) return;

    camera.position.lerp(targetPos.current, 0.06);
    currentLookAt.current.lerp(targetLookAt.current, 0.06);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

interface StormSceneProps {
  score: number;
  wavePercent: number;
  daysSinceStart: number;
  tier: number;
}

export function StormScene({ score, wavePercent, daysSinceStart, tier }: StormSceneProps) {
  const isMobile = useMemo(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0, []);
  const controlsRef = useRef<any>(null);
  const stormIntensity = 0.5 + (wavePercent / 100) * 1.5;

  return (
    <div className="storm-canvas-container">
      <Canvas
        camera={{ position: [-3, 2.5, 8], fov: isMobile ? 60 : 55, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
        style={{ touchAction: 'pan-y' }}
      >
        <color attach="background" args={['#0c1e35']} />
        <fog attach="fog" args={['#0c1e35', 18, 65]} />
        
        {/* Auto-fit camera to ship bounds on tier change */}
        <CameraController tier={tier} isMobile={isMobile} controlsRef={controlsRef} />
        
        <ambientLight intensity={0.4} />
        <hemisphereLight args={['#2a3a5e', '#0a1525', 0.5]} />
        <directionalLight position={[5, 12, 5]} intensity={0.6} color="#8899bb" />
        <pointLight position={[0, 5, 0]} intensity={1.2} color="#8899bb" distance={18} />
        <pointLight position={[-4, 3, -3]} intensity={0.5} color="#667799" distance={20} />
        
        <Suspense fallback={null}>
          <Ocean3D wavePercent={wavePercent} calmRadius={tier === 5 ? 7 : tier === 4 ? 5 : undefined} />
          <Ship3D tier={tier as 1 | 2 | 3 | 4 | 5} score={score} wavePercent={wavePercent} stormIntensity={stormIntensity} />
          <Storm3D daysSinceStart={daysSinceStart} />
        </Suspense>
        
        {/* Desktop: orbit controls for manual exploration */}
        {!isMobile && (
          <OrbitControls
            ref={controlsRef}
            autoRotate
            autoRotateSpeed={0.3}
            enableZoom
            enableRotate
            enablePan={false}
            maxPolarAngle={Math.PI / 2.05}
            minPolarAngle={Math.PI / 6}
            enableDamping
            dampingFactor={0.05}
          />
        )}
      </Canvas>
      <LightningHeadlines />
    </div>
  );
}
