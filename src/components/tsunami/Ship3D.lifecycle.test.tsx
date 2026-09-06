// @vitest-environment jsdom

import { StrictMode, Suspense } from 'react';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useShipModel } from './Ship3D';
import { warmShipModel } from './ship-preparation';

type Tier = 1 | 2 | 3 | 4 | 5;
type OwnedModel = {
  tier: Tier;
  root: THREE.Group;
  update: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
};
const ownership = vi.hoisted(() => ({ models: [] as OwnedModel[] }));

// Exercise real React commit/replay/unmount and Three attachment semantics,
// without spending time constructing the already-tested authored meshes.
vi.mock('@react-three/fiber', () => ({ useFrame: vi.fn() }));
vi.mock('./naval-models', () => ({ createNavalModel: (tier: Tier) => makeModel(tier) }));
vi.mock('./cosmic-models', () => ({ createCosmicModel: (tier: Tier) => makeModel(tier) }));

function makeModel(tier: Tier) {
  const root = new THREE.Group();
  root.name = `test-tier-${tier}`;
  const model = { tier, root, update: vi.fn(), dispose: vi.fn() };
  ownership.models.push(model);
  return model;
}

beforeEach(() => { ownership.models = []; });
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function idleQueue() {
  let nextId = 0;
  const pending = new Map<number, IdleRequestCallback>();
  const request = vi.fn((callback: IdleRequestCallback) => {
    const id = ++nextId;
    pending.set(id, callback);
    return id;
  });
  const cancel = vi.fn((id: number) => { pending.delete(id); });
  vi.stubGlobal('requestIdleCallback', request);
  vi.stubGlobal('cancelIdleCallback', cancel);
  const invoke = (callback: IdleRequestCallback) => {
    act(() => callback({ didTimeout: false, timeRemaining: () => 50 }));
  };
  return {
    pending, request, cancel, invoke,
    runNext() {
      const next = pending.entries().next().value;
      if (!next) throw new Error('Expected one pending idle callback');
      pending.delete(next[0]);
      invoke(next[1]);
    },
  };
}

function preparationScene(withEnvironment = true) {
  const scene = new THREE.Scene();
  if (withEnvironment) scene.environment = new THREE.Texture();
  const parent = { current: new THREE.Group() };
  scene.add(parent.current, new THREE.PointLight());
  const camera = new THREE.PerspectiveCamera();
  const compile = vi.fn<THREE.WebGLRenderer['compile']>(() => new Set<THREE.Material>());
  const container = document.createElement('div');
  container.className = 'storm-canvas-container';
  const canvas = document.createElement('canvas');
  container.append(canvas);
  const state = {
    target: new THREE.WebGLCubeRenderTarget(8) as THREE.WebGLRenderTarget | null,
    cubeFace: 4,
    mipLevel: 2,
    viewport: new THREE.Vector4(1, 2, 320, 200),
    scissor: new THREE.Vector4(3, 4, 12, 14),
    scissorTest: false,
  };
  const renderer = {
    compile,
    domElement: canvas,
    render: vi.fn<THREE.WebGLRenderer['render']>(),
    getRenderTarget: () => state.target,
    getActiveCubeFace: () => state.cubeFace,
    getActiveMipmapLevel: () => state.mipLevel,
    getViewport: (target: THREE.Vector4) => target.copy(state.viewport),
    getScissor: (target: THREE.Vector4) => target.copy(state.scissor),
    getScissorTest: () => state.scissorTest,
    setRenderTarget: (target: THREE.WebGLRenderTarget | null, cubeFace = 0, mipLevel = 0) => {
      Object.assign(state, { target, cubeFace, mipLevel });
    },
    setViewport: (x: number | THREE.Vector4, y?: number, width?: number, height?: number) => {
      if (x instanceof THREE.Vector4) state.viewport.copy(x);
      else state.viewport.set(x, y!, width!, height!);
    },
    setScissor: (x: number | THREE.Vector4, y?: number, width?: number, height?: number) => {
      if (x instanceof THREE.Vector4) state.scissor.copy(x);
      else state.scissor.set(x, y!, width!, height!);
    },
    setScissorTest: (enabled: boolean) => { state.scissorTest = enabled; },
    shadowMap: { needsUpdate: false, autoUpdate: false },
    info: { autoReset: true, render: { frame: 50, calls: 31, triangles: 900, points: 40, lines: 9 } },
  };
  return { parent, compile, state, preparation: { renderer, camera, scene } };
}

describe('scene-owned ship resource lifetime', () => {
  it('retains exactly five lazy models through repeated previews and attaches only the selected tier', () => {
    const parent = { current: new THREE.Group() };
    const { result, rerender, unmount } = renderHook(({ tier }: { tier: Tier }) => useShipModel(tier, parent), {
      initialProps: { tier: 1 },
    });
    expect(ownership.models).toHaveLength(1);
    const first = result.current.current;
    for (const tier of [2, 3, 4, 5, 1, 2, 3, 4, 5, 1] as const) {
      rerender({ tier });
      expect(parent.current.children).toEqual([result.current.current!.root]);
      expect(result.current.current!.root.name).toBe(`test-tier-${tier}`);
      for (const model of ownership.models) {
        expect(model.dispose).not.toHaveBeenCalled();
        expect(model.root.parent).toBe(model === result.current.current ? parent.current : null);
      }
    }
    expect(ownership.models).toHaveLength(5);
    expect(result.current.current).toBe(first);
    unmount();
    expect(parent.current.children).toHaveLength(0);
    expect(result.current.current).toBeNull();
    for (const model of ownership.models) expect(model.dispose).toHaveBeenCalledTimes(1);
  });

  it('clears disposed models before Strict Mode effect replay and releases each lifetime once', () => {
    const parent = { current: new THREE.Group() };
    const { result, rerender, unmount } = renderHook(({ tier }: { tier: Tier }) => useShipModel(tier, parent), {
      initialProps: { tier: 2 },
      wrapper: StrictMode,
    });
    // The development replay must construct a fresh committed model after
    // disposing its first effect lifetime; it must not reattach disposed data.
    expect(ownership.models).toHaveLength(2);
    expect(ownership.models[0].dispose).toHaveBeenCalledTimes(1);
    expect(ownership.models[1].dispose).not.toHaveBeenCalled();
    expect(result.current.current).toBe(ownership.models[1]);
    const retained = result.current.current;
    rerender({ tier: 4 });
    rerender({ tier: 2 });
    expect(result.current.current).toBe(retained);
    expect(parent.current.children).toEqual([retained!.root]);
    expect(ownership.models).toHaveLength(3);
    unmount();
    for (const model of ownership.models) expect(model.dispose).toHaveBeenCalledTimes(1);
    expect(parent.current.children).toHaveLength(0);
  });

  it('allocates no models for a suspended render that never commits', () => {
    const parent = { current: new THREE.Group() };
    const pending = new Promise<never>(() => {});
    function AbandonedPreview(): never {
      useShipModel(5, parent);
      throw pending;
    }
    const { unmount } = render(<Suspense fallback={<span>Pending preview</span>}><AbandonedPreview /></Suspense>);
    expect(ownership.models).toHaveLength(0);
    expect(parent.current.children).toHaveLength(0);
    unmount();
    expect(ownership.models).toHaveLength(0);
  });

  it('splits preparation phases, defers pending work after selections, and reports ready only after warming', () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const idle = idleQueue();
    const { parent, compile, preparation } = preparationScene(false);
    const preparationStatus = () => JSON.parse(preparation.renderer.domElement.parentElement!.dataset.shipPreparation!);
    const { result, rerender, unmount } = renderHook(({ tier }: { tier: Tier }) => useShipModel(tier, parent, preparation), {
      initialProps: { tier: 3 },
    });
    const original = result.current.current;
    expect(ownership.models.map(model => model.tier)).toEqual([3]);
    idle.runNext();
    expect(compile).not.toHaveBeenCalled();
    expect(idle.pending.size).toBe(0);
    expect(ownership.models).toHaveLength(1);

    preparation.scene.environment = new THREE.Texture();
    act(() => { vi.advanceTimersByTime(100); });
    const prepared4 = ownership.models.find(model => model.tier === 4)!;
    expect(ownership.models.map(model => model.tier)).toEqual([3, 4]);
    expect(prepared4.root.parent).toBeNull();
    expect(compile).toHaveBeenLastCalledWith(prepared4.root, preparation.camera, preparation.scene);
    expect(result.current.current).toBe(original);
    expect(parent.current.children).toEqual([original!.root]);
    expect(idle.pending.size).toBe(1);
    expect(preparation.renderer.render).not.toHaveBeenCalled();
    expect(preparationStatus()).toMatchObject({ status: 'queued', pendingWarmTier: 4 });

    // A constructed tier is reused immediately, even before its render phase.
    rerender({ tier: 4 });
    expect(result.current.current).toBe(prepared4);
    expect(parent.current.children).toEqual([prepared4.root]);
    expect(ownership.models).toHaveLength(2);
    expect(compile).toHaveBeenCalledTimes(1);
    idle.runNext();
    expect(compile).toHaveBeenCalledTimes(1);
    expect(idle.pending.size).toBe(0);
    act(() => { vi.advanceTimersByTime(299); });
    expect(ownership.models.map(model => model.tier)).toEqual([3, 4]);
    expect(preparation.renderer.render).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    // The active tier's ordinary renderer owns its uploads: background warming
    // skips that root, then creates the next tier in a separate queued job.
    expect(preparation.renderer.render).not.toHaveBeenCalled();
    expect(ownership.models.map(model => model.tier)).toEqual([3, 4]);
    expect(preparationStatus().measurements[0].selectedBeforeWarm).toBe(true);
    idle.runNext();
    expect(ownership.models.map(model => model.tier)).toEqual([3, 4, 5]);
    expect(preparation.renderer.render).not.toHaveBeenCalled();
    expect(preparationStatus()).toMatchObject({ status: 'queued', pendingWarmTier: 5 });
    idle.runNext();
    expect(preparation.renderer.render).toHaveBeenCalledTimes(1);
    expect(ownership.models).toHaveLength(3);

    // Selecting an as-yet unprepared tier must not wait for the idle queue.
    rerender({ tier: 2 });
    const selected2 = result.current.current;
    expect(selected2!.root.name).toBe('test-tier-2');
    expect(parent.current.children).toEqual([selected2!.root]);
    expect(compile).toHaveBeenCalledTimes(2);
    idle.runNext();
    expect(ownership.models).toHaveLength(4);
    act(() => { vi.advanceTimersByTime(150); });
    // A further preview restarts the quiet period but still attaches immediately.
    rerender({ tier: 5 });
    expect(result.current.current!.root.name).toBe('test-tier-5');
    rerender({ tier: 2 });
    expect(result.current.current).toBe(selected2);
    act(() => { vi.advanceTimersByTime(299); });
    expect(ownership.models).toHaveLength(4);
    expect(compile).toHaveBeenCalledTimes(2);
    act(() => { vi.advanceTimersByTime(1); });
    expect(ownership.models).toHaveLength(5);
    expect(compile.mock.calls.map(([root]) => root.name)).toEqual(['test-tier-4', 'test-tier-5', 'test-tier-1']);
    expect(preparation.renderer.render).toHaveBeenCalledTimes(1);
    expect(preparationStatus()).toMatchObject({ status: 'queued', pendingWarmTier: 1 });
    expect(idle.pending.size).toBe(1);
    idle.runNext();
    expect(preparation.renderer.render).toHaveBeenCalledTimes(2);
    expect(preparationStatus()).toMatchObject({ status: 'ready', pendingWarmTier: null });
    expect(idle.pending.size).toBe(0);
    expect(result.current.current).toBe(selected2);
    for (const model of ownership.models) {
      expect(model.dispose).not.toHaveBeenCalled();
      expect(model.root.parent).toBe(model === selected2 ? parent.current : null);
    }
    unmount();
    expect(parent.current.children).toHaveLength(0);
    for (const model of ownership.models) expect(model.dispose).toHaveBeenCalledTimes(1);
  });

  it('cancels hidden and unmounted work and rejects stale callbacks after Strict Mode replay', () => {
    let hidden = false;
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    const idle = idleQueue();
    const { parent, compile, preparation } = preparationScene();
    const { result, unmount } = renderHook(() => useShipModel(2, parent, preparation), { wrapper: StrictMode });
    expect(ownership.models).toHaveLength(2);
    expect(ownership.models[0].dispose).toHaveBeenCalledTimes(1);
    const selected = result.current.current;
    const replayedCallback = idle.request.mock.calls[0][0];
    idle.invoke(replayedCallback);
    expect(ownership.models).toHaveLength(2);
    expect(compile).not.toHaveBeenCalled();

    const queuedBeforeHide = [...idle.pending.values()][0];
    hidden = true;
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(idle.pending.size).toBe(0);
    idle.invoke(queuedBeforeHide);
    expect(ownership.models).toHaveLength(2);
    hidden = false;
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    idle.runNext();
    expect(compile).toHaveBeenCalledTimes(1);
    expect(result.current.current).toBe(selected);
    expect(parent.current.children).toEqual([selected!.root]);
    const queuedBeforeUnmount = [...idle.pending.values()][0];
    unmount();
    expect(idle.pending.size).toBe(0);
    const requestCount = idle.request.mock.calls.length;
    const modelCount = ownership.models.length;
    idle.invoke(queuedBeforeUnmount);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(idle.request).toHaveBeenCalledTimes(requestCount);
    expect(ownership.models).toHaveLength(modelCount);
    expect(compile).toHaveBeenCalledTimes(1);
    for (const model of ownership.models) expect(model.dispose).toHaveBeenCalledTimes(1);
  });

  it('uses one cancelable timer per job when idle callbacks are unavailable', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.stubGlobal('cancelIdleCallback', undefined);
    let hidden = false;
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    const { parent, compile, preparation } = preparationScene();
    const { unmount } = renderHook(() => useShipModel(1, parent, preparation));
    act(() => { vi.advanceTimersByTime(99); });
    expect(ownership.models).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(1); });
    expect(ownership.models.map(model => model.tier)).toEqual([1, 4]);
    expect(compile).toHaveBeenCalledTimes(1);
    hidden = true;
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    act(() => { vi.advanceTimersByTime(500); });
    expect(compile).toHaveBeenCalledTimes(1);
    hidden = false;
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    act(() => { vi.advanceTimersByTime(100); });
    expect(ownership.models.map(model => model.tier)).toEqual([1, 4]);
    expect(compile).toHaveBeenCalledTimes(1);
    expect(preparation.renderer.render).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(100); });
    expect(ownership.models.map(model => model.tier)).toEqual([1, 4, 5]);
    unmount();
    act(() => { vi.runAllTimers(); });
    expect(compile).toHaveBeenCalledTimes(2);
    expect(preparation.renderer.render).toHaveBeenCalledTimes(1);
    for (const model of ownership.models) expect(model.dispose).toHaveBeenCalledTimes(1);
  });

  it('schedules no preparation for an abandoned suspended render', () => {
    const idle = idleQueue();
    const { parent, compile, preparation } = preparationScene();
    const pending = new Promise<never>(() => {});
    function AbandonedPreview(): never {
      useShipModel(5, parent, preparation);
      throw pending;
    }
    const { unmount } = render(<Suspense fallback={null}><AbandonedPreview /></Suspense>);
    expect(idle.request).not.toHaveBeenCalled();
    expect(ownership.models).toHaveLength(0);
    expect(compile).not.toHaveBeenCalled();
    unmount();
    expect(idle.pending.size).toBe(0);
  });

  it.each([false, true])('restores renderer and selection after a warm render, including a thrown render: %s', throws => {
    const { parent, state, preparation: { renderer, scene, camera } } = preparationScene();
    const active = new THREE.Group();
    active.visible = !throws;
    parent.current.add(active);
    const warm = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
    const points = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial());
    points.frustumCulled = false;
    warm.add(mesh, points);
    const light = new THREE.DirectionalLight();
    light.castShadow = true;
    light.shadow.autoUpdate = false;
    scene.add(light);
    const target = state.target;
    const viewport = state.viewport.clone();
    const scissor = state.scissor.clone();
    const failure = new Error('driver preparation failed');
    renderer.render.mockImplementation((renderScene, renderCamera) => {
      expect(renderScene).toBe(scene);
      expect(renderCamera).toBe(camera);
      expect(parent.current.children).toEqual([active, warm]);
      expect(active.visible).toBe(false);
      expect(warm.visible).toBe(true);
      expect(mesh.frustumCulled).toBe(false);
      expect(points.frustumCulled).toBe(false);
      expect(state.target).toBeNull();
      expect(state.scissor.toArray()).toEqual([0, 0, 0, 0]);
      expect(state.scissorTest).toBe(true);
      expect(renderer.shadowMap.needsUpdate).toBe(true);
      expect(light.shadow.needsUpdate).toBe(true);
      expect(renderer.info.autoReset).toBe(false);
      expect(renderer.info.render.calls).toBe(0);
      Object.assign(renderer.info.render, { frame: 51, calls: 23, triangles: 600, points: 18, lines: 2 });
      // Shadow rendering consumes its dirty flags; cleanup must invalidate them.
      renderer.shadowMap.needsUpdate = false;
      light.shadow.needsUpdate = false;
      if (throws) throw failure;
    });
    const run = () => warmShipModel(renderer, scene, camera, parent.current, warm, active);
    if (throws) expect(run).toThrow(failure);
    else expect(run()).toEqual({ calls: 23, triangles: 600 });
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(parent.current.children).toEqual([active]);
    expect(active.visible).toBe(!throws);
    expect(warm.parent).toBeNull();
    expect(mesh.frustumCulled).toBe(true);
    expect(points.frustumCulled).toBe(false);
    expect(state.target).toBe(target);
    expect(state.cubeFace).toBe(4);
    expect(state.mipLevel).toBe(2);
    expect(state.viewport).toEqual(viewport);
    expect(state.scissor).toEqual(scissor);
    expect(state.scissorTest).toBe(false);
    expect(renderer.shadowMap.autoUpdate).toBe(false);
    expect(light.shadow.autoUpdate).toBe(false);
    expect(renderer.shadowMap.needsUpdate).toBe(true);
    expect(light.shadow.needsUpdate).toBe(true);
    expect(renderer.info.autoReset).toBe(true);
    expect(renderer.info.render).toEqual({ frame: 51, calls: 31, triangles: 900, points: 40, lines: 9 });
    mesh.geometry.dispose();
    mesh.material.dispose();
    points.geometry.dispose();
    points.material.dispose();
    target?.dispose();
  });
});
