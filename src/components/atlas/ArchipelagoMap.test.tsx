// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ArchipelagoMap } from "../ArchipelagoMap";
import { createScene } from "./atlas-model";
import { parseToolsYaml } from "../../utils/parseTools";
import catalog from "../../data/ai-tools.yaml?raw";
import { useAtlasView, useJourney, useMotionPolicy } from "./useAtlas";
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
});
const flushFrame = () => {
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach((fn) => fn(performance.now())));
};
const mount = () =>
  render(
    <MemoryRouter>
      <ArchipelagoMap categories={categories} />
    </MemoryRouter>,
  );
it("lets pointer exploration replace turtle-driven emphasis without changing the journey", () => {
  history.replaceState(null, "", "/?capture=1&destination=voice&time=1");
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
  expect(focus()).toBe("images");
  fireEvent.pointerMove(tool, { pointerType: "mouse", buttons: 0 });
  expect(focus()).toBe("code");
  expect(document.documentElement.dataset.atlasJourney).toBe(journey);
  expect(
    container.querySelectorAll('.atlas-island-art[data-emphasis="active"]'),
  ).toHaveLength(1);
  fireEvent.pointerLeave(container.querySelector("main")!);
  expect(focus()).toBe("images");
  fireEvent.pointerMove(
    within(map as HTMLElement).getByRole("button", { name: "ChatGPT Image" }),
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
  fireEvent.click(screen.getByRole("button", { name: /^Tools$/ }));
  fireEvent.pointerDown(viewport, event);
  fireEvent.pointerUp(viewport, event);
  expect(
    within(screen.getByRole("complementary", { name: "Selected island tools" }))
      .getByRole("heading", { name: "Code" }),
  ).toBeTruthy();
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

it("features Tsunami in the chart heading and footer while keeping the other destinations", () => {
  mount();
  const dock = screen.getByRole("navigation", { name: "Atlas and Turtleand" });
  const links = within(dock).getAllByRole("link");
  expect(links.map((a) => a.getAttribute("href"))).toEqual([
    "https://lab.turtleand.com/",
    "/ai-impact-map/",
    "/tsunami/",
    "/productivity-loop/",
  ]);
  const chart = screen.getByRole("region", { name: "Interactive island map" });
  for (const area of [chart, dock]) {
    expect(
      within(area).getByRole("link", { name: "Tsunami" }).getAttribute("href"),
    ).toBe("/tsunami/");
  }
  expect(
    [...dock.querySelectorAll("svg")].every(
      (svg) => svg.getAttribute("aria-hidden") === "true",
    ),
  ).toBe(true);
  expect(screen.queryByRole("button", { name: /pause|hide turtle/i })).toBeNull();
  expect(screen.getByRole("link", { name: "Turtleand home" }).getAttribute("href")).toBe(
    "https://turtleand.com/",
  );
});
describe("shared home interaction contract", () => {
  it("keeps the SVG map and direct tool access with the simplified controls", () => {
    mount();
    expect(document.querySelector(".atlas-svg")).toBeTruthy();
    const nav = screen.getByRole("region", { name: "Interactive island map" });
    expect(
      within(nav).queryByRole("button", {
        name: /^(?:2d|3d|zoom (?:in|out)|show all islands)$/i,
      }),
    ).toBeNull();
    fireEvent.click(within(nav).getByRole("button", { name: /Code/ }));
    fireEvent.click(within(nav).getByRole("button", { name: "Tool B" }));
    expect(screen.getByRole("dialog", { name: "Tool B" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Visit Tool →" }).getAttribute("href"),
    ).toBe("https://example.com/b");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
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
  const { result } = renderHook(() => useAtlasView(scene));
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
  expect(result.current.view.center.x).toBeCloseTo(before.center.x - 20 / before.zoom);
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

describe("Shore Signposts", () => {
  const mountCatalog = () =>
    render(
      <MemoryRouter>
        <ArchipelagoMap categories={parseToolsYaml(catalog)} />
      </MemoryRouter>,
    );
  const toolsButton = () => screen.getByRole("button", { name: /^Tools$/ });
  const toolDirectory = () =>
    within(screen.getByRole("complementary", { name: "Tool directory" }));
  const selectedPanel = () =>
    within(screen.getByRole("complementary", { name: "Selected island tools" }));

  it("starts with curated tools and opens a signpost’s notes immediately", () => {
    const { container } = mountCatalog();
    const map = container.querySelector<HTMLElement>(".atlas-discovery")!;
    const source = within(map);
    expect(source.getByRole("button", { name: "ChatGPT Image" })).toBeTruthy();
    expect(source.queryByRole("button", { name: "Nano Banana" })).toBeNull();
    expect(source.queryByRole("button", { name: "OpenCode" })).toBeNull();
    expect(source.queryByRole("button", { name: "Cursor" })).toBeNull();
    const tool = source.getByRole("button", { name: "Claude Code" });
    act(() => tool.focus());
    expect(screen.getByRole("tooltip").textContent).toContain("Claude Code");
    fireEvent.pointerLeave(tool);
    expect(screen.getByRole("tooltip").textContent).toContain("Claude Code");
    fireEvent.keyDown(tool, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.click(tool);
    expect(screen.getByRole("dialog", { name: "Claude Code" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    flushFrame();
    expect(document.activeElement).toBe(tool);
  });

  it("shows one named tool per island on phones", () => {
    const { container } = mountCatalog();
    act(() => resize!(390, 330));
    const map = container.querySelector<HTMLElement>(".atlas-discovery")!;
    const signposts = [...map.querySelectorAll(".atlas-signpost")];
    expect(signposts).toHaveLength(6);
    expect(signposts.map((signpost) => signpost.querySelectorAll(".is-tool").length))
      .toEqual([1, 1, 1, 1, 1, 1]);
    expect(within(map).getByRole("button", { name: "ChatGPT Image" })).toBeTruthy();
  });

  it("opens the Active directory and shows the merged categories", () => {
    mountCatalog();
    fireEvent.click(toolsButton());
    const directory = toolDirectory();
    expect(directory.getByRole("heading", { name: "Tools" })).toBeTruthy();
    expect(directory.getByRole("button", { name: "Active", pressed: true })).toBeTruthy();
    expect(toolsButton().getAttribute("aria-expanded")).toBe("true");
    const agentsAndCode = directory.getByRole("region", { name: "Agents and Code tools" });
    expect(within(agentsAndCode).getByRole("button", { name: /^Claude Code/ })).toBeTruthy();
    expect(within(agentsAndCode).getByRole("button", { name: /^ChatGPT Docs/ })).toBeTruthy();
    const researchAndEducation = directory.getByRole("region", { name: "Research and Education tools" });
    expect(within(researchAndEducation).getByRole("button", { name: /^NotebookLM/ })).toBeTruthy();
    expect(directory.queryByRole("region", { name: "Voice tools" })).toBeNull();
  });

  it("labels the Experimental fallback for Voice and switches directory scope without changing signposts", () => {
    mountCatalog();
    const map = within(screen.getByRole("region", { name: "Interactive island map" }));
    const voice = map.getByRole("button", { name: /^Voice,.*experimental/i });
    expect(map.getByText("Experimental", { exact: true })).toBeTruthy();
    expect(map.getByRole("button", { name: "ElevenLabs" })).toBeTruthy();
    fireEvent.click(voice);
    expect(selectedPanel().getByRole("heading", { name: "Voice" })).toBeTruthy();
    expect(selectedPanel().getByText(/1 experimental tool/i)).toBeTruthy();
    expect(selectedPanel().getByRole("button", { name: /^ElevenLabs/ })).toBeTruthy();
    expect(selectedPanel().queryByRole("button", { name: /^Sesame/ })).toBeNull();

    fireEvent.click(toolsButton());
    fireEvent.click(toolDirectory().getByRole("button", { name: "Experimental" }));
    expect(toolDirectory().getByRole("button", { name: "Experimental", pressed: true })).toBeTruthy();
    const voiceTools = toolDirectory().getByRole("region", { name: "Voice tools" });
    expect(within(voiceTools).getByRole("button", { name: /^ElevenLabs/ })).toBeTruthy();
    expect(toolDirectory().getByRole("button", { name: /^OpenCode/ })).toBeTruthy();
    expect(toolDirectory().queryByRole("button", { name: /^ChatGPT Image/ })).toBeNull();
    expect(map.getByRole("button", { name: "ChatGPT Image" })).toBeTruthy();
    expect(map.queryByRole("button", { name: "OpenCode" })).toBeNull();
    expect(voice.getAttribute("aria-pressed")).toBe("true");
  });

  it("opens Archive-only categories without moving the map and restores directory focus", () => {
    const { container } = mountCatalog();
    const map = within(screen.getByRole("region", { name: "Interactive island map" }));
    expect(container.querySelectorAll(".atlas-island-art")).toHaveLength(6);
    expect(map.queryByRole("button", { name: /^(Video Generation|Auxiliary Tools),/ })).toBeNull();
    const images = map.getByRole("button", { name: /^Images,/ });
    fireEvent.click(toolsButton());
    fireEvent.click(toolDirectory().getByRole("button", { name: "Experimental" }));
    const archiveButton = toolDirectory().getByRole("button", { name: "Archive" });
    fireEvent.click(archiveButton);
    const archive = within(screen.getByRole("complementary", { name: "Tool archive" }));
    const video = archive.getByRole("region", { name: "Video Generation tools" });
    const auxiliary = archive.getByRole("region", { name: "Auxiliary Tools tools" });
    expect(within(video).getByRole("heading", { name: "Video Generation" })).toBeTruthy();
    expect(within(video).getByRole("button", { name: /^Sora/ })).toBeTruthy();
    expect(archive.queryByRole("button", { name: /^ChatGPT Image/ })).toBeNull();
    const ntfy = within(auxiliary).getByRole("button", { name: /^ntfy/ });
    fireEvent.click(ntfy);
    const journal = within(screen.getByRole("dialog", { name: "ntfy" }));
    expect(journal.getByText("Auxiliary Tools", { exact: true })).toBeTruthy();
    expect(images.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(journal.getByRole("button", { name: "Close" }));
    flushFrame();
    expect(document.activeElement).toBe(ntfy);
    fireEvent.click(archive.getByRole("button", { name: "Close archive" }));
    flushFrame();
    expect(document.activeElement).toBe(toolDirectory().getByRole("button", { name: "Archive" }));
    expect(toolDirectory().getByRole("button", { name: "Experimental", pressed: true })).toBeTruthy();
    fireEvent.click(toolDirectory().getByRole("button", { name: "Close tool directory" }));
    flushFrame();
    expect(document.activeElement).toBe(toolsButton());
    expect(selectedPanel().getByRole("heading", { name: "Images" })).toBeTruthy();
  });

  it("returns to a single island from the map and directory, even for the current island", () => {
    mountCatalog();
    const map = screen.getByRole("region", { name: "Interactive island map" });
    fireEvent.click(toolsButton());
    fireEvent.click(within(map).getByRole("button", { name: /^Images,/ }));
    expect(selectedPanel().getByRole("heading", { name: "Images" })).toBeTruthy();
    expect(selectedPanel().queryByRole("button", { name: /Cursor/ })).toBeNull();
    expect(toolsButton().getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toolsButton());
    const code = toolDirectory().getByRole("region", { name: "Agents and Code tools" });
    fireEvent.click(within(code).getByRole("button", { name: /^Agents and Code$/ }));
    expect(selectedPanel().getByRole("heading", { name: "Agents and Code" })).toBeTruthy();
    expect(selectedPanel().getByRole("button", { name: /^Claude Code/ })).toBeTruthy();
    expect(selectedPanel().queryByRole("button", { name: /^Cursor/ })).toBeNull();
  });
});

it("interrupts camera travel and preserves manual center and scale through resize", () => {
  const scene = createScene(parseToolsYaml(catalog));
  let camera: ReturnType<typeof useAtlasView>;
  function Harness() {
    camera = useAtlasView(scene);
    return <div ref={camera.ref} />;
  }
  const { container } = render(<Harness />);
  const viewport = container.firstElementChild!;
  const zoomByWheel = (factor: number) =>
    fireEvent.wheel(viewport, {
      clientX: 500,
      clientY: 325,
      deltaY: -Math.log(factor) * 1000,
    });
  const overview = camera!.view;
  act(() => camera!.focus(scene.islands[0].id));
  expect(camera!.view).toEqual(overview);
  zoomByWheel(3);
  const zoom = camera!.view.zoom;
  const now = performance.now();
  act(() => camera!.focus(scene.islands[0].id));
  const pending = [...frames.values()];
  frames.clear();
  act(() => pending.forEach((fn) => fn(now + 100)));
  expect(camera!.view.zoom).toBe(zoom);
  expect(camera!.view.center).not.toEqual(overview.center);
  zoomByWheel(1.1);
  expect(frames.size).toBe(0);
  const manual = camera!.view;
  act(() => resize!(700, 450));
  expect(camera!.view.center).toEqual(manual.center);
  expect(camera!.view.zoom).toBe(manual.zoom);
  act(() => camera!.focus(scene.islands.at(-1)!.id));
  expect(frames.size).toBe(1);
  act(() => camera!.focus(scene.islands[2].id));
  expect(frames.size).toBe(1);
  act(() => camera!.reset());
  expect(frames.size).toBe(0);
  act(() => resize!(1200, 800));
  expect(camera!.view.zoom).not.toBe(manual.zoom);
});
