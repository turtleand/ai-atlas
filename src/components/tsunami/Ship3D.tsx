import { useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createNavalModel } from './naval-models';
import { createCosmicModel } from './cosmic-models';
import { getSloopPose, getWaveHeight, SLOOP_SCALE } from './wave-field';
import { warmShipModel } from './ship-preparation';
import type { ShipPreparationRenderer } from './ship-preparation';

type ShipTier = 1 | 2 | 3 | 4 | 5;
type ShipModel = ReturnType<typeof createCosmicModel>;

interface ShipPreparation {
  renderer: ShipPreparationRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
}

const PREPARATION_ORDER: ShipTier[] = [4, 5, 1, 2, 3];

interface Ship3DProps {
  tier: ShipTier;
  score: number;
  wavePercent: number;
  stormIntensity: number;
  timeUniform: THREE.IUniform<number>;
  captureTime?: number;
  reducedMotion: boolean;
}

function createShipModel(tier: ShipTier): ShipModel {
  const model=tier<=3?createNavalModel(tier as 1|2|3):createCosmicModel(tier as 4|5);
  // A few major opaque masses cast the key light. Rigging and small ornaments
  // do not add shadow passes or unstable subpixel silhouettes.
  const casters=new Set(['weathered-oak','salt-stained-torn-canvas','woven-canvas','laminated-canvas','graphite-structure','brushed-nickel']);
  model.root.traverse(object=>{
    if(object instanceof THREE.Mesh){
      const materials=Array.isArray(object.material)?object.material:[object.material];
      object.castShadow=tier<=3 && !object.parent?.name.startsWith('survey-drone') && materials.some(material=>casters.has(material.name));
      object.receiveShadow=tier<=3;
    }
  });
  return model;
}

/** At most five scene-owned models retain their GPU programs across previews. */
export function useShipModel(tier: ShipTier, group: RefObject<THREE.Group | null>, preparation?: ShipPreparation) {
  const cache = useRef(new Map<ShipTier, ShipModel>());
  const activeModel = useRef<ShipModel | null>(null);
  const preparationGeneration = useRef({ generation: 0, lastTier: tier, resumeNotBefore: 0 });

  useLayoutEffect(()=>{
    const owned = cache.current;
    const ownership = preparationGeneration.current;
    return ()=>{
      ownership.generation++;
      activeModel.current=null;
      owned.forEach(model=>{
        model.root.removeFromParent();
        model.dispose();
      });
      owned.clear();
    };
  },[]);

  useLayoutEffect(()=>{
    const parent=group.current;
    if(!parent)return;
    const ownership = preparationGeneration.current;
    if (ownership.lastTier !== tier) {
      ownership.lastTier = tier;
      // Give the newly selected ship's first frames priority over background work.
      ownership.resumeNotBefore = performance.now() + 300;
    }
    let model=cache.current.get(tier);
    if(!model){
      // Allocate only after commit. Abandoned renders own no geometry/materials;
      // Strict Mode's effect replay disposes and clears the previous ownership.
      model=createShipModel(tier);
      cache.current.set(tier,model);
    }
    activeModel.current=model;
    parent.add(model.root);
    return ()=>{
      parent.remove(model.root);
      if(activeModel.current===model)activeModel.current=null;
    };
  },[tier,group]);

  const renderer = preparation?.renderer;
  const scene = preparation?.scene;
  const camera = preparation?.camera;
  useEffect(() => {
    if (!renderer || !scene || !camera) return;
    const ownership = preparationGeneration.current;
    const generation = ++ownership.generation;
    const owned = cache.current;
    let stopped = false;
    let pending: { kind: 'idle' | 'timer'; id: number } | null = null;
    let pendingWarm: { tier: ShipTier; model: ShipModel; startedAt: number; factoryMs: number; compileMs: number } | null = null;
    const measurements: Array<{ tier: ShipTier; startedAt: number; factoryMs: number; compileMs: number; renderStartedAt: number; renderMs: number; renderCalls: number; renderTriangles: number; selectedBeforeWarm: boolean; completedAt: number }> = [];

    const isCurrent = () => !stopped && generation === ownership.generation;
    const report = (status: 'queued' | 'waiting-environment' | 'paused' | 'ready' | 'failed') => {
      if (import.meta.env.DEV) {
        const container = renderer.domElement.closest<HTMLElement>('.storm-canvas-container');
        if (container) container.dataset.shipPreparation = JSON.stringify({ status, cachedTiers: [...owned.keys()], pendingWarmTier: pendingWarm?.tier ?? null, measurements });
      }
    };
    const cancelPending = () => {
      if (pending?.kind === 'idle') window.cancelIdleCallback(pending.id);
      if (pending?.kind === 'timer') window.clearTimeout(pending.id);
      pending = null;
    };
    const schedule = (waitingForEnvironment = false) => {
      if (!isCurrent() || pending) return;
      if (document.hidden) {
        report('paused');
        return;
      }
      const quietFor = ownership.resumeNotBefore - performance.now();
      if (quietFor > 0) {
        pending = { kind: 'timer', id: window.setTimeout(prepareNext, Math.ceil(quietFor)) };
        return;
      }
      // Poll an environment that has not committed yet without spinning idle jobs.
      // The timer fallback also yields between construction and warm rendering.
      if (!waitingForEnvironment && typeof window.requestIdleCallback === 'function' && typeof window.cancelIdleCallback === 'function') {
        pending = { kind: 'idle', id: window.requestIdleCallback(prepareNext) };
      } else {
        pending = { kind: 'timer', id: window.setTimeout(prepareNext, 100) };
      }
    };
    function prepareNext() {
      if (!isCurrent()) return;
      pending = null;
      if (document.hidden) {
        report('paused');
        return;
      }
      // A callback already queued before a tier commit must also yield. Further
      // commits extend this deadline without delaying selection or entry motion.
      if (performance.now() < ownership.resumeNotBefore) {
        schedule();
        return;
      }
      // Prepare against the final environment and the real scene's stable lights.
      // Roots stay detached between synchronous jobs; warming discards all pixels.
      if (!scene!.environment) {
        report('waiting-environment');
        schedule(true);
        return;
      }
      const parent = group.current;
      if (!parent) {
        schedule(true);
        return;
      }
      try {
        if (pendingWarm) {
          const { tier: warmTier, model, startedAt, factoryMs, compileMs } = pendingWarm;
          const renderStartedAt = import.meta.env.DEV ? performance.now() : 0;
          // Selection may have used the cache between phases. Its ordinary render
          // already owns the uploads; never hide and warm that same active root.
          const selectedBeforeWarm = activeModel.current === model;
          const rendered = selectedBeforeWarm ? { calls: 0, triangles: 0 }
            : warmShipModel(renderer!, scene!, camera!, parent, model.root, activeModel.current?.root);
          if (import.meta.env.DEV) {
            const completedAt = performance.now();
            measurements.push({ tier: warmTier, startedAt, factoryMs, compileMs, renderStartedAt, renderMs: completedAt - renderStartedAt, renderCalls: rendered.calls, renderTriangles: rendered.triangles, selectedBeforeWarm, completedAt });
          }
          pendingWarm = null;
        } else {
          const nextTier = PREPARATION_ORDER.find(candidate => !owned.has(candidate));
          if (nextTier === undefined) {
            report('ready');
            return;
          }
          const startedAt = import.meta.env.DEV ? performance.now() : 0;
          const model = createShipModel(nextTier);
          owned.set(nextTier, model);
          const createdAt = import.meta.env.DEV ? performance.now() : 0;
          // Compilation and upload rendering occupy separate cancelable jobs.
          // Selection never awaits either phase and can always use the same cache.
          renderer!.compile(model.root, camera!, scene!);
          const compiledAt = import.meta.env.DEV ? performance.now() : 0;
          pendingWarm = { tier: nextTier, model, startedAt, factoryMs: createdAt - startedAt, compileMs: compiledAt - createdAt };
        }
        const ready = !pendingWarm && PREPARATION_ORDER.every(candidate => owned.has(candidate));
        report(ready ? 'ready' : 'queued');
        if (!ready) schedule();
      } catch (error) {
        stopped = true;
        report('failed');
        console.error('Ship preparation failed', error);
      }
    }
    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelPending();
        if (isCurrent()) report('paused');
      } else {
        schedule();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    report('queued');
    schedule();
    return () => {
      stopped = true;
      ownership.generation++;
      cancelPending();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (import.meta.env.DEV) {
        const container = renderer.domElement.closest<HTMLElement>('.storm-canvas-container');
        if (container) delete container.dataset.shipPreparation;
      }
    };
  }, [renderer, scene, camera, group]);

  return activeModel;
}

/** The scene owns motion and water support; the model factories own authored construction. */
export function Ship3D({tier,stormIntensity,timeUniform,captureTime,reducedMotion}:Ship3DProps) {
  const group = useRef<THREE.Group>(null);
  const { gl, scene, camera } = useThree();
  const model = useShipModel(tier,group,{ renderer: gl, scene, camera });
  const entryTime = useRef<number | null>(null);
  useLayoutEffect(()=>{
    entryTime.current=null;
  },[tier]);
  useFrame(()=>{
    if(!group.current || !model.current)return;
    const time=timeUniform.value;
    entryTime.current??=time;
    const entryAge = captureTime !== undefined || reducedMotion ? Infinity : time - entryTime.current;
    model.current.update(time, entryAge);
    const pose=group.current;
    if(tier===2) {
      const sloop=getSloopPose(time,stormIntensity);
      pose.position.set(0,sloop.height,0);
      pose.rotation.set(sloop.x,sloop.y,sloop.z,'YXZ');
      // Keep the waterline fixed during entry. No scale or sinking reveal on the sloop.
      pose.scale.setScalar(SLOOP_SCALE);
    } else if(tier<=3) {
      const wave=getWaveHeight(0,0,time,stormIntensity);
      const dx=getWaveHeight(0.65,0,time,stormIntensity)-getWaveHeight(-0.65,0,time,stormIntensity);
      const dz=getWaveHeight(0,0.8,time,stormIntensity)-getWaveHeight(0,-0.8,time,stormIntensity);
      // The broken mass responds late to swell, exposing and swallowing timber.
      // Its supporting fragments retain their independent authored motion.
      const heave=tier===1?getWaveHeight(0,0,time-0.75,stormIntensity)*0.86-0.10:wave+0.18;
      pose.position.set(0,heave,0);
      pose.rotation.set(-Math.atan2(dz,1.6)*(tier===1?1.2:0.45),tier===1?-0.4:-0.52,Math.atan2(dx,1.3)*(tier===1?1.2:0.45),'YXZ');
      pose.scale.setScalar(tier===1?2.016:1.8);
    } else {
      pose.position.set(0,(tier===4?2:3.5)+Math.sin(time*(tier===4?0.25:0.15))*(tier===4?0.08:0.04),0);
      pose.rotation.set(0,0,0);
      const entry=captureTime!==undefined||reducedMotion?1:Math.min(1,(time-entryTime.current)/0.6);
      pose.scale.setScalar(1.8*(0.975+0.025*(1-Math.pow(1-entry,3))));
    }
    if(import.meta.env.DEV) {
      const data={tier,time,position:pose.position.toArray(),rotation:[pose.rotation.x,pose.rotation.y,pose.rotation.z],scale:pose.scale.x};
      const container=document.querySelector<HTMLElement>('.storm-canvas-container');
      if(container)container.dataset.shipPose=JSON.stringify(data);
    }
  });
  return <group ref={group} dispose={null}>
    {/* Keep the light count stable so tier previews reuse the same shader variants. */}
    <pointLight
      position={tier===2?[-0.23,0.4,-1.10]:[0,0.7,0]}
      intensity={tier===2?0.35:tier===4?3:tier===5?4:0}
      color={tier===2?'#ffc579':tier===4?'#75e8e0':'#ffe1a1'}
      distance={tier===2?2.3:12}
    />
  </group>;
}
