import { Suspense, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TOUCH } from 'three';
import { Ocean3D } from './Ocean3D';
import { Ship3D } from './Ship3D';
import { WaterContact } from './WaterContact';
import { SceneEnvironment } from './SceneEnvironment';
import { Storm3D } from './Storm3D';
import { LightningHeadlines } from './LightningHeadlines';
import { useSceneCaptureOptions, usePageVisible, useReducedMotion } from './scene-utils';

/*
 * Known ship extents per tier (at 1.8x group scale).
 * Used to auto-fit the camera so ships are never cropped.
 */
const TIER_BOUNDS: Record<number, { yMin: number; yMax: number; radius: number }> = {
  1: { yMin: -2.6, yMax: 3.4, radius: 2.8 },
  2: { yMin: -2.6, yMax: 5.0, radius: 1.8 },
  3: { yMin: -1.5, yMax: 7.8, radius: 5.2 },
  4: { yMin: -3.5, yMax: 8.5, radius: 6.5 },
  5: { yMin: -1.0, yMax: 14.3, radius: 8.5 },
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
 * Auto-fit on tier/viewport changes, then leave orbit and zoom to OrbitControls.
 * Development capture angles use the same fitted camera and its target.
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
  const capture = useSceneCaptureOptions();
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3(0, 0.5, 0));
  const prevTier = useRef(tier);

  // On tier change or resize, recompute camera
  useEffect(() => {
    const fov = (camera as THREE.PerspectiveCamera).fov;
    const aspect = size.width / size.height;
    const { position, lookAt } = computeCameraForTier(tier, fov, aspect);
    if (capture.time !== undefined) {
      const offset = position.clone().sub(lookAt).multiplyScalar(1 / capture.zoom);
      if (capture.angle !== undefined) offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), capture.angle);
      if (capture.polar !== undefined) {
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.phi = capture.polar;
        offset.setFromSpherical(spherical);
      }
      position.copy(lookAt).add(offset);
    }

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
  }, [tier, size.width, size.height, camera, isMobile, controlsRef, capture]);

  return null;
}

function SceneTime({ timeUniform, captureTime, reducedMotion }: {
  timeUniform: THREE.IUniform<number>; captureTime?: number; reducedMotion: boolean;
}) {
  useFrame((_state, delta) => {
    timeUniform.value = captureTime ?? timeUniform.value + Math.min(delta, 0.05) * (reducedMotion ? 0.25 : 1);
  }, -2);
  return null;
}

function SceneTelemetry({
  tier,
  controlsRef,
  wavePercent,
  quality,
  reducedMotion,
}: {
  tier: number;
  wavePercent: number;
  quality: string;
  reducedMotion: boolean;
  controlsRef: React.RefObject<any>;
}) {
  const sample = useRef({ elapsed: 0, frames: 0 });
  const history = useRef<number[]>([]);
  const lastTier = useRef(tier);
  type Resources = { calls: number; triangles: number; geometries: number; textures: number; programs: number };
  type Entry = {
    id: number;
    tier: number;
    entryDeltaMs: number;
    startedAt: number;
    samples: number[];
    resources: { first: Resources; last: Resources; peak: Resources } | null;
  };
  const entries = useRef<Entry[]>([]);
  const activeEntry = useRef<Entry | null>(null);
  const pendingRender = useRef<Entry | null>(null);
  const nextEntryId = useRef(1);
  const lastCallbackTime = useRef<number | null>(null);

  useFrame(({ gl, camera }, initialDelta) => {
    if (!import.meta.env.DEV) return;
    // Measure callback cadence independently of consumers of Three's clock.
    // getElapsedTime() also resets Clock.oldTime and can shorten R3F's delta.
    const callbackTime = performance.now();
    const delta = lastCallbackTime.current === null ? initialDelta : (callbackTime - lastCallbackTime.current) / 1000;
    lastCallbackTime.current = callbackTime;
    // Count every pass, including selective model shadows.
    const rendered = { ...gl.info.render };
    gl.info.reset();

    const resources: Resources = {
      calls: rendered.calls,
      triangles: rendered.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
    };
    // useFrame runs before rendering. Attribute the incoming delta and pass
    // counts to the entry rendered after the previous callback, so the first
    // shader-compilation stall is retained on the next frame of its own tier.
    const completedRender = pendingRender.current;
    let entryCompleted = false;
    if (completedRender && completedRender.samples.length < 120) {
      completedRender.samples.push(delta * 1000);
      if (!completedRender.resources) {
        completedRender.resources = { first: { ...resources }, last: { ...resources }, peak: { ...resources } };
      } else {
        completedRender.resources.last = { ...resources };
        for (const key of Object.keys(resources) as Array<keyof Resources>) {
          completedRender.resources.peak[key] = Math.max(completedRender.resources.peak[key], resources[key]);
        }
      }
      entryCompleted = completedRender.samples.length === 120;
    }

    const enteredTier = activeEntry.current === null || lastTier.current !== tier;
    if (enteredTier) {
      history.current = [];
      sample.current = { elapsed: 0, frames: 0 };
      lastTier.current = tier;
      activeEntry.current = { id: nextEntryId.current++, tier, entryDeltaMs: delta * 1000, startedAt: performance.now(), samples: [], resources: null };
      entries.current.push(activeEntry.current);
      if (entries.current.length > 12) entries.current.shift();
    }
    pendingRender.current = activeEntry.current;
    history.current.push(delta * 1000);
    if (history.current.length > 480) history.current.shift();
    sample.current.elapsed += delta;
    sample.current.frames += 1;
    if (sample.current.elapsed < 0.5 && !enteredTier && !entryCompleted) return;

    const frameMs = (sample.current.elapsed / sample.current.frames) * 1000;
    const target = controlsRef.current?.target as THREE.Vector3 | undefined;
    const metrics = {
      tier,
      sampledAt: new Date().toISOString(),
      sampleClock: 'performance.now callback intervals',
      userAgent: navigator.userAgent,
      quality, wavePercent, stormIntensity: 0.5+wavePercent*0.015, reducedMotion,
      entryAgeMs: performance.now()-(activeEntry.current?.startedAt ?? performance.now()),
      viewport: [window.innerWidth, window.innerHeight],
      rect: (() => { const r=document.querySelector('.storm-canvas-container')?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,width:r.width,height:r.height} : null; })(),
      samples: history.current.slice(),
      entries: entries.current,
      renderedTier: completedRender?.tier ?? null,
      dpr: gl.getPixelRatio(),
      renderer: (() => { const context=gl.getContext(); const ext=context.getExtension('WEBGL_debug_renderer_info'); return ext ? context.getParameter(ext.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER); })(),
      fps: 1000 / frameMs,
      frameMs,
      calls: rendered.calls,
      triangles: rendered.triangles,
      points: rendered.points,
      lines: rendered.lines,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
      camera: camera.position.toArray(),
      target: target?.toArray() ?? null,
    };

    const container = document.querySelector<HTMLElement>('.storm-canvas-container');
    if (container) { container.dataset.sceneMetrics = JSON.stringify(metrics); container.dataset.captureReady = history.current.length >= 60 ? String(tier) : ''; }
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
  const sceneContainerRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useReducedMotion();
  const isPageVisible = usePageVisible();
  const capture = useSceneCaptureOptions();
  const captureTime = capture.time;
  const timeUniform = useMemo<THREE.IUniform<number>>(() => ({ value: capture.time ?? 0 }), [capture.time]);
  const sceneWavePercent = capture.wavePercent ?? wavePercent;
  const stormIntensity = 0.5 + sceneWavePercent * 0.015;
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

  useEffect(() => () => clearTimeout(hintTimeout.current), []);

  useEffect(() => {
    if (!isMobile) return;
    const viewport = sceneContainerRef.current?.querySelector<HTMLElement>('.storm-interaction-viewport');
    if (!viewport) return;
    // Native non-passive listeners reserve only multi-touch for OrbitControls.
    // One finger keeps browser scrolling; React's passive touch listeners cannot
    // cancel the browser's two-finger pan once the scene owns that gesture.
    const reserveSceneGesture = (event: TouchEvent) => {
      if (event.touches.length >= 2 && event.cancelable) event.preventDefault();
    };
    viewport.addEventListener('touchstart', reserveSceneGesture, { passive: false });
    viewport.addEventListener('touchmove', reserveSceneGesture, { passive: false });
    return () => {
      viewport.removeEventListener('touchstart', reserveSceneGesture);
      viewport.removeEventListener('touchmove', reserveSceneGesture);
    };
  }, [isMobile]);

  return (
    <div
      ref={sceneContainerRef}
      className="storm-canvas-container"
      data-tier={tier}
      data-capture-mode={import.meta.env.DEV && captureTime !== undefined ? 'true' : undefined}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-touch-input={isMobile ? 'true' : 'false'}
      onTouchStart={handleTouchStart}
    >
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        className="storm-interaction-viewport"
        camera={{ position: [-3, 2.5, 8], fov: isMobile ? 60 : 55, near: 0.1, far: 1000 }}
        dpr={capture.lowQuality ? 1 : [1, 1.75]}
        frameloop={isPageVisible ? 'always' : 'never'}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          if (import.meta.env.DEV) gl.info.autoReset = false;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{ touchAction: isMobile ? 'pan-y' : 'none' }}
      >
        <color attach="background" args={['#071426']} />
        <fog attach="fog" args={['#172c3a', 30, 90]} />
        
        {/* Auto-fit camera to ship bounds on tier change */}
        <SceneEnvironment />
        <SceneTime timeUniform={timeUniform} captureTime={captureTime} reducedMotion={reducedMotion} />
        <CameraController tier={tier} isMobile={isMobile} controlsRef={controlsRef} />
        {import.meta.env.DEV && <SceneTelemetry tier={tier} controlsRef={controlsRef} wavePercent={sceneWavePercent} quality={capture.lowQuality ? 'low' : 'default'} reducedMotion={reducedMotion} />}
        
        <ambientLight intensity={capture.lighting === 'neutral' ? 1.1 : 0.30} />
        <hemisphereLight args={['#637da3', '#020914', 0.72]} />
        <directionalLight position={[8, 14, 6]} intensity={1.9} color="#d4e0e8"
          castShadow={!capture.lowQuality} shadow-mapSize={[1024,1024]}
          shadow-camera-left={-7.5} shadow-camera-right={7.5}
          shadow-camera-top={9} shadow-camera-bottom={-6}
          shadow-camera-near={0.5} shadow-camera-far={40}
          shadow-bias={-0.0002} shadow-normalBias={0.018}/>
        <directionalLight position={[-10, 7, -8]} intensity={1.15} color="#82b8c9" />
        <pointLight position={[0, 4, 5]} intensity={3.5} color="#84b7d8" distance={26} />
        
        <Suspense fallback={null}>
          <Ocean3D
            wavePercent={sceneWavePercent}
            tier={tier}
            calmRadius={tier === 5 ? 11 : tier === 4 ? 5 : undefined}
            lowQuality={capture.lowQuality}
            lightningUniform={lightningUniform}
            captureTime={captureTime}
            timeUniform={timeUniform}
            reducedMotion={reducedMotion}
          />
          <WaterContact tier={tier} timeUniform={timeUniform} lightningUniform={lightningUniform} stormIntensity={stormIntensity}/>
          <Ship3D
            tier={tier as 1 | 2 | 3 | 4 | 5}
            score={score}
            wavePercent={sceneWavePercent}
            stormIntensity={stormIntensity}
            captureTime={captureTime}
            timeUniform={timeUniform}
            reducedMotion={reducedMotion}
          />
          <Storm3D
            daysSinceStart={capture.daysSinceStart ?? daysSinceStart}
            stormIntensity={stormIntensity}
            lighting={capture.lighting}
            tier={tier}
            lightningUniform={lightningUniform}
            captureTime={captureTime}
            timeUniform={timeUniform}
            reducedMotion={reducedMotion}
          />
        </Suspense>
        
        <OrbitControls
          ref={controlsRef}
          autoRotate={captureTime === undefined && isPageVisible}
          autoRotateSpeed={0.3}
          enableZoom
          enableRotate
          enablePan={false}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 6}
          enableDamping
          dampingFactor={0.05}
          /* Mobile: two-finger rotate+zoom; single-finger scroll handled by CSS touch-action: pan-y */
          touches={{ ONE: undefined, TWO: TOUCH.DOLLY_ROTATE }}
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
