import { Suspense, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TOUCH } from 'three';
import { Ocean3D } from './Ocean3D';
import { Ship3D } from './Ship3D';
import { Storm3D } from './Storm3D';
import { LightningHeadlines } from './LightningHeadlines';
import { getCaptureTime, usePageVisible, useReducedMotion } from './scene-utils';

/*
 * Known ship extents per tier (at 1.8x group scale).
 * Used to auto-fit the camera so ships are never cropped.
 */
const TIER_BOUNDS: Record<number, { yMin: number; yMax: number; radius: number }> = {
  1: { yMin: -1.2, yMax: 1.4, radius: 1.7 },
  2: { yMin: -1.0, yMax: 4.2, radius: 1.8 },
  3: { yMin: -1.5, yMax: 7.8, radius: 5.2 },
  4: { yMin: -3.5, yMax: 8.5, radius: 6.5 },
  5: { yMin: -4.5, yMax: 11.5, radius: 8.5 },
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

    // Snap camera and update OrbitControls target
    camera.position.copy(position);
    currentLookAt.current.copy(lookAt);
    camera.lookAt(lookAt);

    if (controlsRef.current) {
      controlsRef.current.target.copy(lookAt);
      controlsRef.current.object.position.copy(position);
      controlsRef.current.update();
    }

    prevTier.current = tier;
  }, [tier, size.width, size.height, camera, isMobile, controlsRef]);

  return null;
}

function SceneTelemetry({
  tier,
  controlsRef,
}: {
  tier: number;
  controlsRef: React.RefObject<any>;
}) {
  const sample = useRef({ elapsed: 0, frames: 0 });

  useFrame(({ gl, camera }, delta) => {
    if (!import.meta.env.DEV) return;

    sample.current.elapsed += delta;
    sample.current.frames += 1;
    if (sample.current.elapsed < 0.5) return;

    const frameMs = (sample.current.elapsed / sample.current.frames) * 1000;
    const target = controlsRef.current?.target as THREE.Vector3 | undefined;
    const metrics = {
      tier,
      fps: 1000 / frameMs,
      frameMs,
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      points: gl.info.render.points,
      lines: gl.info.render.lines,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
      camera: camera.position.toArray(),
      target: target?.toArray() ?? null,
    };

    const container = document.querySelector<HTMLElement>('.storm-canvas-container');
    if (container) container.dataset.sceneMetrics = JSON.stringify(metrics);
    sample.current = { elapsed: 0, frames: 0 };
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
  const reducedMotion = useReducedMotion();
  const isPageVisible = usePageVisible();
  const captureTime = useMemo(() => getCaptureTime(), []);
  const lightningUniform = useMemo<THREE.IUniform<number>>(() => ({ value: 0 }), []);
  const [showHint, setShowHint] = useState(false);
  const hintTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Show "use two fingers" hint on single-finger touch on canvas
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isMobile && e.touches.length === 1) {
      setShowHint(true);
      clearTimeout(hintTimeout.current);
      hintTimeout.current = setTimeout(() => setShowHint(false), 2000);
    } else {
      setShowHint(false);
    }
  }, [isMobile]);

  return (
    <div
      className="storm-canvas-container"
      data-tier={tier}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      onTouchStart={handleTouchStart}
    >
      <Canvas
        camera={{ position: [-3, 2.5, 8], fov: isMobile ? 60 : 55, near: 0.1, far: 1000 }}
        dpr={[1, 1.75]}
        frameloop={isPageVisible || captureTime !== undefined ? 'always' : 'demand'}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{ touchAction: isMobile ? 'pan-y' : 'none' }}
      >
        <color attach="background" args={['#071426']} />
        <fog attach="fog" args={['#0a1b31', 24, 78]} />
        
        {/* Auto-fit camera to ship bounds on tier change */}
        <CameraController tier={tier} isMobile={isMobile} controlsRef={controlsRef} />
        {import.meta.env.DEV && <SceneTelemetry tier={tier} controlsRef={controlsRef} />}
        
        <ambientLight intensity={0.22} />
        <hemisphereLight args={['#637da3', '#020914', 0.72]} />
        <directionalLight position={[8, 14, 6]} intensity={2.1} color="#b7c9e5" />
        <directionalLight position={[-10, 7, -8]} intensity={0.45} color="#4c7fa5" />
        <pointLight position={[0, 4, 5]} intensity={3.5} color="#84b7d8" distance={26} />
        
        <Suspense fallback={null}>
          <Ocean3D
            wavePercent={wavePercent}
            tier={tier}
            calmRadius={tier === 5 ? 7 : tier === 4 ? 5 : undefined}
            lightningUniform={lightningUniform}
            captureTime={captureTime}
            reducedMotion={reducedMotion}
          />
          <Ship3D
            tier={tier as 1 | 2 | 3 | 4 | 5}
            score={score}
            wavePercent={wavePercent}
            stormIntensity={stormIntensity}
            captureTime={captureTime}
            reducedMotion={reducedMotion}
          />
          <Storm3D
            daysSinceStart={daysSinceStart}
            tier={tier}
            lightningUniform={lightningUniform}
            captureTime={captureTime}
            reducedMotion={reducedMotion}
          />
        </Suspense>
        
        <OrbitControls
          ref={controlsRef}
          autoRotate={captureTime === undefined}
          autoRotateSpeed={0.3}
          enableZoom
          enableRotate
          enablePan={false}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 6}
          enableDamping
          dampingFactor={0.05}
          /* Mobile: two-finger rotate+zoom; single-finger scroll handled by CSS touch-action: pan-y */
          touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_ROTATE }}
        />
      </Canvas>
      <div key={`vignette-${tier}`} className="storm-cinematic-vignette" aria-hidden="true" />
      <div className="storm-horizon-haze" aria-hidden="true" />
      <LightningHeadlines />
      {/* Mobile hint overlay */}
      {showHint && (
        <div className="storm-touch-hint">
          Use two fingers to rotate &amp; zoom
        </div>
      )}
    </div>
  );
}
