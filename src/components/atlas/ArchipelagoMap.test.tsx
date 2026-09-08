// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ArchipelagoMap } from "../ArchipelagoMap";
import { createScene } from "./atlas-model";
import { AtlasLabels } from "./AtlasLabels";
import { parseToolsYaml } from "../../utils/parseTools";
import catalog from "../../data/ai-tools.yaml?raw";
import { useAtlasView, useJourney, useMotionPolicy } from "./useAtlas";
import type { AtlasThreeProps } from "./AtlasThree";
const loader = vi.hoisted(() => ({
  calls: 0,
  props: null as AtlasThreeProps | null,
}));
vi.mock("./AtlasThree", () => {
  loader.calls++;
  return {
    AtlasThree: (props: AtlasThreeProps) => {
      loader.props = props;
      return <div data-testid="three-scene" />;
    },
  };
});
const categories = [
  {
    id: "chatbot",
    name: "Chatbot",
    tools: [
      {
        id: "tool-a",
        name: "Tool A",
        url: "https://example.com/a",
        description: "First tool",
      },
    ],
  },
  {
    id: "code",
    name: "Code",
    tools: [
      {
        id: "tool-b",
        name: "Tool B",
        url: "https://example.com/b",
        description: "Second tool",
      },
    ],
  },
];
const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      cb: ResizeObserverCallback;
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb;
      }
      observe(el: Element) {
        this.cb(
          [
            {
              contentRect: { width: 1000, height: 650 },
              target: el,
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        );
      }
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((fn: FrameRequestCallback) => {
      frames.set(++frameId, fn);
      return frameId;
    }),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => frames.delete(id)),
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  frames.clear();
  loader.props = null;
});
const mount = () =>
  render(
    <MemoryRouter>
      <ArchipelagoMap categories={categories} />
    </MemoryRouter>,
  );
describe("shared home interaction contract", () => {
  it("starts in SVG without loading 3D and opens details immediately", () => {
    mount();
    expect(loader.calls).toBe(0);
    expect(document.querySelector(".atlas-svg")).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: "AI categories" });
    fireEvent.click(within(nav).getByRole("button", { name: /Code/ }));
    const list = screen.getByRole("region", { name: "Code tools" });
    fireEvent.click(within(list).getByRole("button", { name: /Tool B/ }));
    expect(screen.getByRole("dialog", { name: "Tool B" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Visit Tool →" }).getAttribute("href"),
    ).toBe("https://example.com/b");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("keeps 2D usable during preparation, cancels cleanly, and preserves category across switches", async () => {
    mount();
    const nav = screen.getByRole("navigation", { name: "AI categories" });
    fireEvent.click(within(nav).getByRole("button", { name: /Code/ }));
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    await waitFor(() => expect(loader.props).not.toBeNull());
    expect(document.querySelector(".atlas-svg")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("three-scene")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    await waitFor(() => expect(screen.getByTestId("three-scene")).toBeTruthy());
    act(() => loader.props!.onReady());
    expect(document.querySelector(".atlas-svg")).toBeNull();
    expect(
      within(nav)
        .getByRole("button", { name: /Code/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    expect(document.querySelector(".atlas-svg")).toBeTruthy();
    expect(screen.queryByTestId("three-scene")).toBeNull();
  });
  it("falls back on failure and retains the selected category", async () => {
    mount();
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "AI categories" }),
      ).getByRole("button", { name: /Chatbot/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    await waitFor(() => expect(loader.props).not.toBeNull());
    act(() => loader.props!.onFail(new Error("test context loss")));
    expect(document.querySelector(".atlas-svg")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(
      "3D is unavailable",
    );
    expect(screen.getByRole("region", { name: "Chatbot tools" })).toBeTruthy();
  });
});
describe("motion scheduling", () => {
  it("cancels frames when paused and resumes without a catch-up jump", () => {
    const scene = createScene(categories);
    const { result, rerender, unmount } = renderHook(
      ({ paused }) => useJourney(scene, paused, false),
      { initialProps: { paused: false } },
    );
    act(() => result.current.select("code"));
    function tick(t: number) {
      const pending = [...frames.values()];
      frames.clear();
      act(() => pending.forEach((fn) => fn(t)));
    }
    tick(100);
    tick(117);
    const before = { ...result.current.ref.current.position };
    rerender({ paused: true });
    expect(frames.size).toBe(0);
    rerender({ paused: false });
    tick(30000);
    expect(result.current.ref.current.position).toEqual(before);
    tick(30017);
    expect(result.current.ref.current.position).not.toEqual(before);
    unmount();
    expect(frames.size).toBe(0);
  });
  it("never animates reduced motion but still supports immediate destination selection", () => {
    const scene = createScene(categories);
    const { result } = renderHook(() => useJourney(scene, false, true));
    expect(frames.size).toBe(0);
    act(() => result.current.select("code"));
    expect(result.current.ref.current.position).toEqual(scene.islands[1].dock);
  });
  it("tracks native page visibility", () => {
    const { result } = renderHook(useMotionPolicy);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current.visible).toBe(false);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current.visible).toBe(true);
  });
});

it("pans and pinches the shared view, releases cancelled touches, and ignores navigation buttons", () => {
  const scene = createScene(categories);
  const { result } = renderHook(() => useAtlasView(scene, null));
  const target = document.createElement("div");
  const event = (
    pointerId: number,
    clientX: number,
    clientY: number,
    element: Element = target,
  ) =>
    ({
      pointerId,
      clientX,
      clientY,
      button: 0,
      target: element,
      currentTarget: { setPointerCapture: vi.fn() },
    }) as unknown as React.PointerEvent;
  const before = result.current.view;
  act(() => result.current.handlers.onPointerDown(event(1, 100, 100)));
  act(() => result.current.handlers.onPointerMove(event(1, 120, 100)));
  expect(result.current.view.center.x).toBe(before.center.x - 40);
  act(() => result.current.handlers.onPointerDown(event(2, 200, 100)));
  act(() => result.current.handlers.onPointerMove(event(2, 210, 100)));
  act(() => result.current.handlers.onPointerMove(event(2, 240, 100)));
  expect(result.current.view.zoom).toBeGreaterThan(before.zoom);
  act(() => result.current.handlers.onPointerCancel(event(1, 120, 100)));
  act(() => result.current.handlers.onPointerUp(event(2, 240, 100)));
  const released = result.current.view;
  act(() => result.current.handlers.onPointerMove(event(1, 500, 100)));
  expect(result.current.view).toEqual(released);
  act(() =>
    result.current.handlers.onPointerDown(
      event(3, 100, 100, document.createElement("button")),
    ),
  );
  act(() => result.current.handlers.onPointerMove(event(3, 200, 100)));
  expect(result.current.view).toEqual(released);
});

it("keeps all overview categories readable in portrait and tablet framing", () => {
  const scene = createScene(parseToolsYaml(catalog));
  for (const [width, height] of [
    [382, 500],
    [772, 470],
    [1158, 610],
  ]) {
    const { unmount } = render(
      <AtlasLabels
        scene={scene}
        selected={null}
        depth={false}
        view={{
          width,
          height,
          center: { x: scene.width / 2 - 20, y: scene.height / 2 - 10 },
          zoom: Math.min(width / scene.width, height / scene.height) * 0.96,
        }}
        onSelect={() => {}}
        onTool={() => {}}
      />,
    );
    for (const island of scene.islands)
      expect(
        screen.getByRole("button", {
          name: new RegExp(
            island.category.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          ),
        }),
      ).toBeTruthy();
    unmount();
  }
});
