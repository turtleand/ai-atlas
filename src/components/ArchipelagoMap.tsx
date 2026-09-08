import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import type { Category, Tool } from "../utils/parseTools";
import { atlasCapture } from "./atlas/capture";
import { createScene } from "./atlas/atlas-model";
import { AtlasSvg } from "./atlas/AtlasSvg";
import { AtlasLabels } from "./atlas/AtlasLabels";
import { useAtlasView, useJourney, useMotionPolicy } from "./atlas/useAtlas";
import type { AtlasThreeProps } from "./atlas/AtlasThree";
import { JournalPanel } from "./JournalPanel";

class SceneBoundary extends Component<
  { children: ReactNode; onFail: (error?: unknown) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onFail(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function ArchipelagoMap({ categories }: { categories: Category[] }) {
  const scene = useMemo(() => createScene(categories), [categories]);
  const [selected, setSelected] = useState<string | null>(
    () =>
      scene.islands.find((i) => i.id === atlasCapture()?.selection)?.id ?? null,
  );
  const [journal, setJournal] = useState<{
    tool: Tool;
    categoryId: string;
  } | null>(() => {
    const capture = atlasCapture();
    const island = scene.islands.find((i) => i.id === capture?.selection);
    const tool = island?.category.tools.find((t) => t.id === capture?.tool);
    return island && tool ? { tool, categoryId: island.id } : null;
  });
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [ready, setReady] = useState(false);
  const [Three, setThree] = useState<ComponentType<AtlasThreeProps> | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const [staticQuality, setStaticQuality] = useState(false);
  const { reduced, visible } = useMotionPolicy();
  const {
    ref: containerRef,
    view,
    focus,
    reset: resetView,
    zoom,
    handlers,
    depthRef,
  } = useAtlasView(scene, selected);
  const journey = useJourney(
    scene,
    paused || !!journal || !visible || staticQuality,
    reduced,
  );
  const driver = useMemo(
    () => ({ ref: journey.ref, subscribe: journey.subscribe }),
    [journey.ref, journey.subscribe],
  );
  const island = scene.islands.find((i) => i.id === selected);
  const journalIsland = scene.islands.find((i) => i.id === journal?.categoryId);
  const origin = useRef<HTMLElement | null>(null);
  const depth = mode === "3d" && ready;
  useEffect(() => {
    depthRef.current = depth;
  }, [depth, depthRef]);
  const onFail = useCallback((error?: unknown) => {
    if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1")
      document.documentElement.dataset.atlasError = String(error);
    setMode("2d");
    setReady(false);
    setStaticQuality(false);
    setNotice("3D is unavailable. You can keep exploring in 2D.");
  }, []);
  const activationStart = useRef(0);
  const onReady = useCallback(() => {
    setReady(true);
    if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1")
      document.documentElement.dataset.atlas3dActivationMs = String(
        performance.now() - activationStart.current,
      );
  }, []);
  const onSlow = useCallback(() => {
    setStaticQuality(true);
    setNotice("Motion paused to keep the map responsive.");
  }, []);
  useEffect(() => {
    if (mode !== "3d" || Three) return;
    let cancelled = false;
    import("./atlas/AtlasThree")
      .then((module) => {
        if (!cancelled) setThree(() => module.AtlasThree);
      })
      .catch((error) => {
        if (!cancelled) onFail(error);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, Three, onFail]);
  useEffect(() => {
    if (!(import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1")) return;
    let last = -1;
    let lastState = "";
    const update = () => {
      const j = driver.ref.current;
      const state = `${j.destination}:${j.phase}`;
      if (j.time - last < 0.25 && state === lastState) return;
      last = j.time;
      lastState = state;
      document.documentElement.dataset.atlasJourney = JSON.stringify({
        position: j.position,
        heading: j.heading,
        phase: j.phase,
        destination: j.destination,
        time: j.time,
      });
    };
    update();
    return driver.subscribe(update);
  }, [driver]);
  useEffect(() => {
    if (expanded && selected && window.innerWidth <= 760)
      document
        .querySelector(".atlas-tools")
        ?.scrollIntoView({ block: "nearest" });
  }, [expanded, selected]);
  const select = (id: string) => {
    const start = performance.now();

    setSelected(id);
    focus(id);
    journey.select(id);
    if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1")
      requestAnimationFrame(() => {
        document.documentElement.dataset.atlasSelectionMs = String(
          performance.now() - start,
        );
      });
    setExpanded(false);
  };
  const openTool = (tool: Tool, categoryId: string) => {
    origin.current = document.activeElement as HTMLElement;
    setJournal({ tool, categoryId });
  };
  const closeTool = useCallback(() => {
    setJournal(null);
    requestAnimationFrame(() => origin.current?.focus());
  }, []);
  const reset = () => {
    setSelected(null);
    resetView();
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !journal) {
        setExpanded(false);
        setSelected(null);
        resetView();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [journal, resetView]);
  return (
    <main
      className="living-atlas"
      data-mode={depth ? "3d" : "2d"}
      data-motion={
        paused || reduced || !visible || journal || staticQuality
          ? "paused"
          : "running"
      }
    >
      <a className="atlas-skip" href="#atlas-directory">
        Explore the tool directory
      </a>
      <header className="atlas-header">
        <Link
          className="atlas-brand"
          to="/"
          onClick={reset}
          aria-label="AI Atlas overview"
        >
          <svg viewBox="0 0 48 40" aria-hidden="true">
            <path
              d="M9 11 3 5M9 28 3 34M34 11 41 5M34 28 41 34"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <ellipse
              cx="23"
              cy="20"
              rx="16"
              ry="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m23 9 9 6v10l-9 6-9-6V15Z"
              fill="none"
              stroke="currentColor"
            />
            <ellipse cx="43" cy="20" rx="4" ry="5" fill="currentColor" />
          </svg>
          <span>
            Turtleand’s <strong>AI Atlas</strong>
          </span>
        </Link>
        <p className="atlas-header-note">A field guide to the AI landscape</p>
        <a className="atlas-hub" href="https://turtleand.com/">
          Turtleand ↗
        </a>
      </header>
      <div className="atlas-workspace">
        <aside
          id="atlas-directory"
          className={`atlas-directory ${expanded ? "is-expanded" : ""}`}
          tabIndex={-1}
        >
          <button
            className="atlas-directory-toggle"
            aria-expanded={expanded}
            aria-controls="atlas-directory-content"
            onClick={() => setExpanded((v) => !v)}
          >
            <span>
              {island
                ? island.category.name
                : `${scene.islands.length} islands to explore`}
            </span>
            <span aria-hidden="true">{expanded ? "−" : "+"}</span>
          </button>
          <div id="atlas-directory-content" className="atlas-directory-content">
            <div className="atlas-intro">
              <span className="atlas-eyebrow">THE ARCHIPELAGO</span>
              <h1>
                Find your
                <br />
                next shore.
              </h1>
              <p>
                Tools I’ve charted on my journey. Choose an island to explore.
              </p>
            </div>
            <div className="atlas-directory-heading">
              <span>AI SPACES</span>
              <span>
                {categories.reduce((n, c) => n + c.tools.length, 0)} tools
              </span>
            </div>
            <nav aria-label="AI categories">
              {scene.islands.map((i, n) => (
                <button
                  key={i.id}
                  className="atlas-category"
                  aria-pressed={selected === i.id}
                  onClick={() => select(i.id)}
                >
                  <span className="atlas-category-number">
                    {String(n + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="atlas-category-dot"
                    style={{ background: i.accent }}
                  />
                  <span>{i.category.name}</span>
                  <small>{i.category.tools.length}</small>
                </button>
              ))}
            </nav>
            {island && (
              <section
                className="atlas-tools"
                aria-label={`${island.category.name} tools`}
              >
                <div className="atlas-directory-heading">
                  <span>{island.category.name}</span>
                  <button onClick={reset} aria-label="Show all islands">
                    ↗
                  </button>
                </div>
                {island.category.tools.map((tool) => (
                  <button
                    className="atlas-tool-row"
                    key={tool.id}
                    onClick={() => openTool(tool, island.id)}
                  >
                    <span>{tool.name}</span>
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </section>
            )}
            <p className="atlas-directory-foot">
              A map for orientation.
              <br />
              Your judgment sets the course.
            </p>
          </div>
        </aside>
        <section className="atlas-map-area" aria-label="Interactive island map">
          <div className="atlas-map-heading">
            <span className="atlas-eyebrow">
              {island ? island.category.name : "THE KNOWN SHORES"}
            </span>
            <span>
              {island
                ? "Select a tool or explore another island"
                : "Choose an island. Follow your curiosity."}
            </span>
          </div>
          <div className="atlas-controls" aria-label="Map controls">
            <div
              className="atlas-mode-switch"
              role="group"
              aria-label="Map view"
            >
              <button
                aria-pressed={mode === "2d"}
                onClick={() => {
                  setMode("2d");
                  setReady(false);
                  setStaticQuality(false);
                  setNotice("");
                }}
              >
                2D
              </button>
              <button
                aria-pressed={mode === "3d"}
                onClick={() => {
                  activationStart.current = performance.now();
                  setMode("3d");
                  setNotice("");
                }}
              >
                3D
              </button>
            </div>
            <button
              className="atlas-motion-button"
              aria-pressed={paused || reduced || staticQuality}
              disabled={reduced}
              onClick={() => {
                setPaused((v) => (staticQuality ? false : !v));
                setStaticQuality(false);
                setNotice("");
              }}
              aria-label={
                paused || staticQuality ? "Resume motion" : "Pause motion"
              }
            >
              {paused || reduced || staticQuality ? "▷" : "Ⅱ"}
              <span>
                {reduced
                  ? "Reduced motion"
                  : paused || staticQuality
                    ? "Resume"
                    : "Pause"}
              </span>
            </button>
            <button
              onClick={reset}
              className="atlas-reset"
              aria-label="Reset map view"
            >
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <circle
                  cx="20"
                  cy="20"
                  r="15"
                  fill="none"
                  stroke="currentColor"
                />
                <path
                  d="m20 6 5 14-5 14-5-14Z"
                  fill="none"
                  stroke="currentColor"
                />
                <path d="m20 6 5 14h-5Z" fill="currentColor" />
              </svg>
            </button>
          </div>
          <div ref={containerRef} className="atlas-viewport" {...handlers}>
            {!depth && (
              <AtlasSvg
                scene={scene}
                view={view}
                selected={selected}
                driver={driver}
              />
            )}
            {mode === "3d" && Three && (
              <SceneBoundary onFail={onFail}>
                <div className={`atlas-three ${ready ? "is-ready" : ""}`}>
                  <Three
                    scene={scene}
                    view={view}
                    driver={driver}
                    active={
                      ready &&
                      visible &&
                      !paused &&
                      !reduced &&
                      !journal &&
                      !staticQuality &&
                      !atlasCapture()
                    }
                    selected={selected}
                    onReady={onReady}
                    onFail={onFail}
                    onSlow={onSlow}
                  />
                </div>
              </SceneBoundary>
            )}
            <AtlasLabels
              scene={scene}
              view={view}
              selected={selected}
              depth={depth}
              onSelect={select}
              onTool={openTool}
            />
            {!scene.islands.length && (
              <p className="atlas-empty">New shores are being charted.</p>
            )}
          </div>
          <div className="atlas-map-footer">
            <span>
              <i />{" "}
              {paused || reduced || staticQuality
                ? "A moment at the shore"
                : "A turtle, a little curiosity, an open sea"}
            </span>
            <div>
              <button aria-label="Zoom out" onClick={() => zoom(1 / 1.2)}>
                −
              </button>
              <button aria-label="Zoom in" onClick={() => zoom(1.2)}>
                +
              </button>
            </div>
          </div>
          {((mode === "3d" && !ready) || notice) && (
            <div role="status" className="atlas-notice">
              {notice || (
                <>
                  Preparing 3D. Keep exploring.
                  <button
                    onClick={() => {
                      setMode("2d");
                      setReady(false);
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
          {island && (
            <div className="atlas-mobile-tools">
              <button onClick={() => setExpanded(true)}>
                Explore {island.category.tools.length} tools in{" "}
                {island.category.name} <span>↑</span>
              </button>
            </div>
          )}
        </section>
      </div>
      <nav className="atlas-navigation" aria-label="Atlas and Turtleand">
        <a href="https://lab.turtleand.com/">
          AI Lab <span>↗</span>
        </a>
        <Link to="/ai-impact-map/">
          Impact Map <span>↗</span>
        </Link>
        <Link to="/productivity-loop/">
          Compass <span>↗</span>
        </Link>
        <Link to="/tsunami/">
          Tsunami <span>↗</span>
        </Link>
      </nav>
      {journal && journalIsland && (
        <JournalPanel
          toolName={journal.tool.name}
          toolDescription={journal.tool.description}
          toolUrl={journal.tool.url}
          toolUsage={journal.tool.usage}
          toolRelated={journal.tool.related}
          toolTags={journal.tool.tags}
          categoryName={journalIsland.category.name}
          categoryColor={journalIsland.accent}
          onClose={closeTool}
        />
      )}
    </main>
  );
}
