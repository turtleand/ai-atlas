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
let resize: ((width: number, height: number) => void) | null = null;
beforeEach(() => {
  history.replaceState(null, "", "/");
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
        resize = (width, height) =>
          this.cb(
            [
              {
                contentRect: { width, height },
                target: el,
              } as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver,
          );
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
it("lets pointer exploration replace turtle-driven emphasis without changing the journey", () => {
  history.replaceState(null, "", "/?capture=1&destination=images&time=1");
  const { container } = render(
    <MemoryRouter>
      <ArchipelagoMap categories={parseToolsYaml(catalog)} />
    </MemoryRouter>,
  );
  const map = container.querySelector(".atlas-discovery")!;
  const tool = within(map as HTMLElement).getByRole("button", {
    name: "Claude Code",
  });
  const focus = () => map.getAttribute("data-active-islands");
  const journey = document.documentElement.dataset.atlasJourney;
  const positions = [...map.querySelectorAll<HTMLElement>("button")].map(
    (el) => el.style.cssText,
  );
  expect(focus()).toBe("");
  fireEvent.pointerMove(tool, { pointerType: "mouse", buttons: 0 });
  expect(focus()).toBe("code");
  expect(document.documentElement.dataset.atlasJourney).toBe(journey);
  expect(
    container.querySelectorAll('.atlas-island-art[data-emphasis="active"]'),
  ).toHaveLength(1);
  expect(map.querySelectorAll('.is-tool[data-emphasis="active"]')).toHaveLength(
    6,
  );
  fireEvent.pointerLeave(container.querySelector("main")!);
  expect(focus()).toBe("");
  fireEvent.pointerMove(
    within(map as HTMLElement).getByRole("button", { name: "Recraft" }),
    { pointerType: "mouse", buttons: 0 },
  );
  expect(focus()).toBe("images");
  act(() => tool.focus());
  expect(focus()).toBe("code");
  fireEvent.click(tool);
  expect(screen.getByRole("dialog", { name: "Claude Code" })).toBeTruthy();
  expect(focus()).toBe("code");
  expect(
    [...map.querySelectorAll<HTMLElement>("button")].map(
      (el) => el.style.cssText,
    ),
  ).toEqual(positions);
  expect(map.querySelectorAll(".is-tool.is-named")).toHaveLength(29);
});

it("supports shore taps and ignores drags and multi-touch as selections", () => {
  const { container } = mount();
  const viewport = container.querySelector<HTMLElement>(".atlas-viewport")!;
  viewport.setPointerCapture = vi.fn();
  const scene = createScene(categories);
  const view = JSON.parse(document.documentElement.dataset.atlasView!);
  const p = {
    clientX:
      view.width / 2 + (scene.islands[1].center.x - view.center.x) * view.zoom,
    clientY:
      view.height / 2 + (scene.islands[1].center.y - view.center.y) * view.zoom,
  };
  const event = { ...p, pointerType: "touch", pointerId: 1, button: 0 };
  fireEvent.pointerDown(viewport, event);
  fireEvent.pointerUp(viewport, event);
  expect(
    container
      .querySelector(".atlas-discovery")
      ?.getAttribute("data-active-islands"),
  ).toBe("code");
  const empty = {
    clientX: -100,
    clientY: -100,
    pointerType: "touch",
    pointerId: 2,
    button: 0,
  };
  fireEvent.pointerDown(viewport, empty);
  fireEvent.pointerUp(viewport, empty);
  expect(
    container
      .querySelector(".atlas-discovery")
      ?.getAttribute("data-active-islands"),
  ).toBe("");
  fireEvent.pointerDown(viewport, event);
  fireEvent.pointerMove(viewport, { ...event, clientX: p.clientX + 30 });
  fireEvent.pointerUp(viewport, event);
  expect(
    container
      .querySelector(".atlas-discovery")
      ?.getAttribute("data-active-islands"),
  ).toBe("");
  fireEvent.pointerDown(viewport, event);
  fireEvent.pointerDown(viewport, { ...event, pointerId: 2 });
  fireEvent.pointerUp(viewport, event);
  fireEvent.pointerUp(viewport, { ...event, pointerId: 2 });
  expect(
    container
      .querySelector(".atlas-discovery")
      ?.getAttribute("data-active-islands"),
  ).toBe("");
});

it("preserves navigation destinations and makes the wave a labelled central link", () => {
  mount();
  const dock = screen.getByRole("navigation", { name: "Atlas and Turtleand" });
  const links = within(dock).getAllByRole("link");
  expect(links.map((a) => a.getAttribute("href"))).toEqual([
    "https://lab.turtleand.com/",
    "/ai-impact-map/",
    "/tsunami/",
    "/productivity-loop/",
  ]);
  expect(
    within(dock)
      .getByRole("link", { name: "Tsunami" })
      .classList.contains("atlas-tsunami-link"),
  ).toBe(true);
  expect(
    [...dock.querySelectorAll("svg")].every(
      (svg) => svg.getAttribute("aria-hidden") === "true",
    ),
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Pause motion" }));
  expect(document.querySelector("main")?.getAttribute("data-motion")).toBe(
    "paused",
  );
});
describe("shared home interaction contract", () => {
  it("starts in SVG without loading 3D and opens details immediately", () => {
    mount();
    expect(loader.calls).toBe(0);
    expect(document.querySelector(".atlas-svg")).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: "AI categories" });
    fireEvent.click(within(nav).getByRole("button", { name: /Code/ }));
    fireEvent.click(screen.getByRole("button", { name: "Tool B" }));
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
    expect(
      screen
        .getByRole("button", { name: "Chatbot, 1 tools" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
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

describe("Guided atlas", () => {
  it.each(["", "rail"])("exposes every tool directly in %s", (variant) => {
    history.replaceState(null, "", `/?atlasVariant=${variant}`);
    const { container } = render(
      <MemoryRouter>
        <ArchipelagoMap categories={parseToolsYaml(catalog)} />
      </MemoryRouter>,
    );
    const map = container.querySelector(".atlas-discovery")!;
    expect(map.querySelectorAll(".is-tool")).toHaveLength(29);
    expect(map.querySelectorAll(".is-tool.is-named")).toHaveLength(29);
    const tool = within(map as HTMLElement).getByRole("button", {
      name: "Claude Code",
    });
    act(() => tool.focus());
    expect(screen.getByRole("tooltip").textContent).toContain("Claude Code");
    fireEvent.pointerLeave(
      within(map as HTMLElement).getByRole("button", { name: "Cursor" }),
    );
    fireEvent.pointerLeave(tool);
    expect(screen.getByRole("tooltip").textContent).toContain("Claude Code");
    fireEvent.keyDown(tool, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.click(tool);
    expect(screen.getByRole("dialog", { name: "Claude Code" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    const callbacks = [...frames.values()];
    frames.clear();
    act(() => callbacks.forEach((fn) => fn(performance.now())));
    expect(document.activeElement).toBe(tool);
  });
  it("uses the guided rail without comparison chrome and exposes the full directory", () => {
    mount();
    expect(
      screen.queryByRole("navigation", { name: "Compare atlas presentations" }),
    ).toBeNull();
    expect(
      screen.queryByText("A turtle, a little curiosity, an open sea"),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Browse every tool/ }));
    expect(screen.getByRole("region", { name: "Chatbot tools" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Code tools" })).toBeTruthy();
  });
});

it("interrupts camera travel and preserves manual center and scale through resize", () => {
  const scene = createScene(parseToolsYaml(catalog));
  let camera: ReturnType<typeof useAtlasView>;
  function Harness() {
    camera = useAtlasView(scene, null);
    return <div ref={camera.ref} />;
  }
  render(<Harness />);
  const overview = camera!.view;
  act(() => camera!.focus(scene.islands[0].id));
  expect(camera!.view).toEqual(overview);
  act(() => camera!.zoom(3));
  const zoom = camera!.view.zoom;
  const now = performance.now();
  act(() => camera!.focus(scene.islands[0].id));
  const pending = [...frames.values()];
  frames.clear();
  act(() => pending.forEach((fn) => fn(now + 100)));
  expect(camera!.view.zoom).toBe(zoom);
  expect(camera!.view.center).not.toEqual(overview.center);
  act(() => camera!.zoom(1.1));
  expect(frames.size).toBe(0);
  const manual = camera!.view;
  act(() => resize!(700, 450));
  expect(camera!.view.center).toEqual(manual.center);
  expect(camera!.view.zoom).toBe(manual.zoom);
  act(() => camera!.focus(scene.islands[8].id));
  expect(frames.size).toBe(1);
  act(() => camera!.focus(scene.islands[2].id));
  expect(frames.size).toBe(1);
  act(() => camera!.reset());
  expect(frames.size).toBe(0);
  act(() => resize!(1200, 800));
  expect(camera!.view.zoom).not.toBe(manual.zoom);
});
