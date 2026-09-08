import { Component, type ReactNode } from "react";
import { createRoot, type RootStore } from "@react-three/fiber";
import { AtlasWorld } from "./AtlasWorld";
import type { RenderInput, RenderOutput, RenderConfig } from "./atlas-renderer";
import type { AtlasScene } from "./atlas-model";
import type { Journey } from "./journey";
import type { JourneyDriver } from "./useAtlas";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<RenderInput>) => void) | null;
  postMessage: (message: RenderOutput) => void;
};
let root: ReturnType<typeof createRoot<OffscreenCanvas>> | null = null;
let store: RootStore | null = null;
let scene: AtlasScene;
let config: RenderConfig;
let low = false,
  initialized = false,
  disposed = false,
  revision = 0,
  lastStats = 0;
const listeners = new Set<() => void>();
const driver: JourneyDriver = {
  ref: { current: null as unknown as Journey },
  subscribe: (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
function post(message: RenderOutput) {
  if (!disposed) scope.postMessage(message);
}
const onReady = () => post({ type: "ready" });
const onFail = (error?: unknown) =>
  post({ type: "error", message: String(error) });
const onSlow = () => post({ type: "slow" });
const onFrame = () => post({ type: "frame" });
const onStats = (stats: Record<string, unknown>) => {
  if (!stats.calls || (lastStats && performance.now() - lastStats < 250))
    return;
  lastStats = performance.now();
  post({ type: "stats", stats: { ...stats, configView: config.view } });
};
const setLow = () => {
  low = true;
  void configure().catch(onFail);
};
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    onFail(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
async function configure() {
  if (!initialized || !root || disposed) return;
  const current = ++revision;
  low ||= config.initialLow;
  await root.configure({
    orthographic: true,
    frameloop: "demand",
    size: {
      width: config.view.width,
      height: config.view.height,
      top: 0,
      left: 0,
    },
    dpr: Math.min(config.maxDpr, low ? 1 : 1.5),
  });
  if (disposed || current !== revision) return;
  store = root.render(
    <Boundary>
      <AtlasWorld
        scene={scene}
        view={config.view}
        selected={config.selected}
        driver={driver}
        active={config.active}
        low={low}
        setLow={setLow}
        onReady={onReady}
        onFail={onFail}
        onSlow={onSlow}
        onFrame={onFrame}
        onStats={onStats}
      />
    </Boundary>,
  );
}
scope.onmessage = async ({ data }) => {
  try {
    if (disposed) return;
    if (data.type === "init") {
      scene = data.scene;
      config = data.config;
      low = config.initialLow;
      driver.ref.current = data.journey;
      root = createRoot(data.canvas);
      const started = performance.now();
      await root.configure({
        orthographic: true,
        frameloop: "demand",
        size: {
          width: config.view.width,
          height: config.view.height,
          top: 0,
          left: 0,
        },
        dpr: Math.min(config.maxDpr, low ? 1 : 1.5),
        camera: { near: 0.1, far: 5000 },
        gl: { alpha: true, antialias: true, powerPreference: "low-power" },
      });
      if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1")
        post({ type: "timing", contextMs: performance.now() - started });
      initialized = true;
      await configure();
    } else if (data.type === "config") {
      config = data.config;
      await configure();
    } else if (data.type === "pose") {
      Object.assign(driver.ref.current, data.journey);
      if (data.path) driver.ref.current.path = data.path;
      listeners.forEach((listener) => listener());
    } else if (data.type === "lose-context") {
      store
        ?.getState()
        .gl.getContext()
        .getExtension("WEBGL_lose_context")
        ?.loseContext();
    } else if (data.type === "dispose") {
      disposed = true;
      listeners.clear();
      const gl = store?.getState().gl;
      root?.unmount();
      gl?.dispose();
      gl?.forceContextLoss();
      scope.postMessage({ type: "disposed" });
    }
  } catch (error) {
    onFail(error);
  }
};
