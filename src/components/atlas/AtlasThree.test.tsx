// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AtlasThree, type AtlasThreeProps } from "./AtlasThree";
import { createScene } from "./atlas-model";
import { createJourney } from "./journey";
import type { RenderOutput } from "./atlas-renderer";
class FakeWorker {
  static instances: FakeWorker[] = [];
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: ((event: { data: RenderOutput }) => void) | null = null;
  onerror:
    | ((event: { message: string; preventDefault: () => void }) => void)
    | null = null;
  constructor() {
    FakeWorker.instances.push(this);
  }
  emit(data: RenderOutput) {
    act(() => this.onmessage?.({ data }));
  }
}
beforeEach(() => {
  vi.useFakeTimers();
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) =>
    window.setTimeout(() => fn(16), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  HTMLCanvasElement.prototype.transferControlToOffscreen = vi.fn(
    () => ({}) as OffscreenCanvas,
  );
});
afterEach(() => {
  cleanup();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function props(): AtlasThreeProps {
  const scene = createScene([]);
  return {
    scene,
    view: { center: { x: 0, y: 0 }, zoom: 1, width: 800, height: 600 },
    driver: {
      ref: { current: createJourney(scene) },
      subscribe: () => () => {},
    },
    active: false,
    selected: null,
    onReady: vi.fn(),
    onFail: vi.fn(),
    onSlow: vi.fn(),
  };
}
describe("optional worker renderer lifecycle", () => {
  it("initializes from the existing scene and pose, reuses one worker on resize, and cancels setup", () => {
    const p = props(),
      view = render(
        <StrictMode>
          <AtlasThree {...p} />
        </StrictMode>,
      );
    act(() => vi.advanceTimersByTime(16));
    const worker = FakeWorker.instances[0];
    expect(worker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "init",
        scene: p.scene,
        journey: p.driver.ref.current,
      }),
      expect.any(Array),
    );
    view.rerender(
      <StrictMode>
        <AtlasThree {...p} view={{ ...p.view, width: 390 }} />
      </StrictMode>,
    );
    expect(FakeWorker.instances).toHaveLength(1);
    expect(worker.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: "config",
        config: expect.objectContaining({
          view: expect.objectContaining({ width: 390 }),
        }),
      }),
    );
    view.unmount();
    expect(worker.postMessage).toHaveBeenLastCalledWith(
      { type: "dispose" },
      [],
    );
    act(() => vi.advanceTimersByTime(100));
    expect(worker.terminate).toHaveBeenCalled();
    worker.emit({ type: "ready" });
    expect(p.onReady).not.toHaveBeenCalled();
  });
  it("reports worker initialization errors and acknowledges disposal", () => {
    const p = props(),
      view = render(
        <StrictMode>
          <AtlasThree {...p} />
        </StrictMode>,
      );
    act(() => vi.advanceTimersByTime(16));
    const worker = FakeWorker.instances[0];
    worker.emit({ type: "error", message: "WebGL unavailable" });
    expect(p.onFail).toHaveBeenCalledWith(
      expect.objectContaining({ message: "WebGL unavailable" }),
    );
    view.unmount();
    worker.emit({ type: "disposed" });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  it("bounds the pose message queue while a frame is being prepared", () => {
    const p = props();
    let tick = () => {};
    p.driver.subscribe = (fn) => {
      tick = fn;
      return () => {};
    };
    render(<AtlasThree {...p} />);
    act(() => vi.advanceTimersByTime(16));
    const worker = FakeWorker.instances[0];
    worker.emit({ type: "ready" });
    const before = worker.postMessage.mock.calls.length;
    for (let n = 0; n < 100; n++) {
      p.driver.ref.current.position = { x: n, y: 0 };
      tick();
    }
    expect(worker.postMessage.mock.calls).toHaveLength(before);
    worker.emit({ type: "frame" });
    expect(worker.postMessage.mock.calls).toHaveLength(before + 1);
    expect(worker.postMessage.mock.calls.at(-1)?.[0].journey.position.x).toBe(
      99,
    );
  });
  it("stops requesting animation frames when motion becomes inactive", () => {
    const p = props();
    p.active = true;
    const view = render(<AtlasThree {...p} />);
    act(() => vi.advanceTimersByTime(16));
    const worker = FakeWorker.instances[0];
    worker.emit({ type: "ready" });
    worker.emit({ type: "frame" });
    view.rerender(<AtlasThree {...p} active={false} />);
    const before = worker.postMessage.mock.calls.length;
    worker.emit({ type: "frame" });
    expect(worker.postMessage.mock.calls).toHaveLength(before);
  });
  it("falls back after stalled preparation but never times out a ready renderer", () => {
    const p = props();
    const view = render(<AtlasThree {...p} />);
    act(() => vi.advanceTimersByTime(15016));
    expect(p.onFail).toHaveBeenCalledWith(
      expect.objectContaining({ message: "3D preparation timed out" }),
    );
    view.unmount();
    p.onFail = vi.fn();
    render(<AtlasThree {...p} />);
    act(() => vi.advanceTimersByTime(16));
    FakeWorker.instances.at(-1)!.emit({ type: "ready" });
    act(() => vi.advanceTimersByTime(20000));
    expect(p.onFail).not.toHaveBeenCalled();
  });
});
