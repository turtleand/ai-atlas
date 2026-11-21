import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";
import turtleandMark from "../assets/turtleand-mark.svg";
import type { Category, Tool } from "../utils/parseTools";
import { atlasCapture } from "./atlas/capture";
import { createScene, inside } from "./atlas/atlas-model";
import { AtlasSvg } from "./atlas/AtlasSvg";
import { AtlasNavigation } from "./atlas/AtlasNavigation";
import { AtlasDiscovery, type ToolPreview } from "./atlas/AtlasDiscovery";
import { AtlasGlyph } from "./atlas/AtlasLandmark";
import { toolNote } from "./atlas/tool-notes";
import "../styles/atlas-guided.css";
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
  const [preview, setPreview] = useState<ToolPreview>(null);
  const defaultIsland =
    scene.islands.find((island) => island.id === "images") ?? scene.islands[0];
  const [selected, setSelected] = useState<string | null>(
    () =>
      scene.islands.find((island) => island.id === atlasCapture()?.selection)
        ?.id ??
      defaultIsland?.id ??
      null,
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
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const activeId = hovered ?? focused ?? selected;
  const tap = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const collection = useRef<HTMLDivElement>(null);
  const collectionTrigger = useRef<HTMLButtonElement>(null);
  const directory = useRef<HTMLElement>(null);
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
    reveal,
  } = useAtlasView(scene, selected, reduced);
  const journey = useJourney(
    scene,
    !!journal || !visible || staticQuality,
    reduced,
  );
  const driver = useMemo(
    () => ({ ref: journey.ref, subscribe: journey.subscribe }),
    [journey.ref, journey.subscribe],
  );
  const selectedIsland = scene.islands.find((i) => i.id === selected);
  const sidebarIsland = selectedIsland ?? defaultIsland;
  const toolCount = categories.reduce(
    (total, category) => total + category.tools.length,
    0,
  );
  const journalIsland = scene.islands.find((i) => i.id === journal?.categoryId);
  const historicalJournal = journal?.tool.id === "openclaw";
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
  };
  const openTool = (tool: Tool, categoryId: string, trigger?: HTMLElement) => {
    const start = performance.now();
    origin.current = trigger ?? (document.activeElement as HTMLElement);
    setPreview(null);
    setSelected(categoryId);
    journey.select(categoryId);
    setJournal({ tool, categoryId });
    if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1")
      requestAnimationFrame(() => {
        document.documentElement.dataset.atlasToolMs = String(
          performance.now() - start,
        );
      });
  };
  const closeTool = useCallback(() => {
    setJournal(null);
    requestAnimationFrame(() => origin.current?.focus());
  }, []);
  const reset = () => {
    setHovered(null);
    setFocused(null);
    resetView();
  };
  const openDirectory = () => {
    setCollectionOpen(false);
    setExpanded(true);
    requestAnimationFrame(() => directory.current?.focus());
  };
  const closeDirectory = () => {
    setExpanded(false);
    requestAnimationFrame(() => collectionTrigger.current?.focus());
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || journal) return;
      if (collectionOpen) {
        setCollectionOpen(false);
        collectionTrigger.current?.focus();
      } else if (expanded) {
        setExpanded(false);
        collectionTrigger.current?.focus();
      }
    };
    const dismiss = (event: PointerEvent) => {
      if (
        collectionOpen &&
        event.target instanceof Node &&
        !collection.current?.contains(event.target)
      )
        setCollectionOpen(false);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", dismiss);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", dismiss);
    };
  }, [collectionOpen, expanded, journal]);

  const toolRow = (tool: Tool, categoryId: string) => (
    <button
      type="button"
      className="atlas-tool-row"
      key={tool.id}
      onClick={(event) => openTool(tool, categoryId, event.currentTarget)}
    >
      <span>
        {tool.name}
        <small>{toolNote(tool)}</small>
      </span>
      <span aria-hidden="true">↗</span>
    </button>
  );
  const islandAt = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const p = {
      x: view.center.x + (clientX - rect.left - view.width / 2) / view.zoom,
      y:
        view.center.y +
        (clientY - rect.top - view.height / 2) / view.zoom / (depth ? 0.72 : 1),
    };
    return (
      scene.islands.find((i) =>
        inside(
          {
            x: i.center.x + (p.x - i.center.x) / 1.12,
            y: i.center.y + (p.y - i.center.y) / 1.12,
          },
          i.coast,
        ),
      )?.id ?? null
    );
  };
  return (
    <main
      onPointerMove={(event) => {
        if (event.pointerType === "touch" || event.buttons) return;
        const el = event.target as Element;
        setHovered(
          el.closest<HTMLElement>("[data-island]")?.dataset.island ??
            (el.closest(".atlas-viewport")
              ? islandAt(event.clientX, event.clientY)
              : null),
        );
      }}
      onPointerLeave={() => setHovered(null)}
      onPointerDownCapture={() => {
        setFocused(null);
        setHovered(null);
      }}
      onFocusCapture={(event) => {
        if (event.target.matches(":focus-visible")) {
          setHovered(null);
          setFocused(
            event.target.closest<HTMLElement>("[data-island]")?.dataset
              .island ?? null,
          );
        }
      }}
      onBlurCapture={() => setFocused(null)}
      className="living-atlas"
      data-variant="signposts"
      data-mode={depth ? "3d" : "2d"}
      data-reduced-motion={reduced || undefined}
      data-motion={
        reduced ||
        !visible ||
        journal ||
        staticQuality ||
        atlasCapture()
          ? "paused"
          : "running"
      }
    >
      <a
        className="atlas-skip"
        href="#atlas-directory"
        onClick={openDirectory}
      >
        Explore the tool directory
      </a>
      <header className="atlas-header">
        <Link
          className="atlas-brand"
          to="/"
          onClick={(event) => {
            event.preventDefault();
            reset();
          }}
          aria-label="AI Atlas overview"
        >
          AI Atlas
        </Link>
        <p className="atlas-header-note">Tools explored by Turtleand</p>
        <div className="atlas-header-actions">
          <div className="atlas-collection-control" ref={collection}>
            <button
              type="button"
              className="atlas-all-collection"
              ref={collectionTrigger}
              aria-expanded={collectionOpen}
              aria-controls="atlas-collection"
              onClick={() => setCollectionOpen((open) => !open)}
            >
              <span aria-hidden="true">▤</span> All {toolCount} tools
            </button>
            <div
              id="atlas-collection"
              className="atlas-collection"
              hidden={!collectionOpen}
            >
              <h2>All {toolCount} tools</h2>
              <div className="atlas-collection-actions">
                <button type="button" onClick={openDirectory}>
                  <strong>Browse the directory</strong>
                  <small>Tool names and notes by island.</small>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAllTools((show) => !show);
                    setCollectionOpen(false);
                    setPreview(null);
                    collectionTrigger.current?.focus();
                  }}
                >
                  <strong>
                    {showAllTools
                      ? "Show featured tools on the map"
                      : "Show all tools on the map"}
                  </strong>
                  <small>
                    {showAllTools
                      ? "Return to a few examples per island."
                      : "Display the complete tool collection on the map."}
                  </small>
                </button>
              </div>
            </div>
          </div>
          <a
            className="atlas-hub"
            href="https://turtleand.com/"
            rel="home"
            aria-label="Turtleand home"
          >
            <img
              className="atlas-hub-mark"
              src={turtleandMark}
              alt=""
              width="37"
              height="37"
            />
            <span>Turtleand <span aria-hidden="true">↗</span></span>
          </a>
        </div>
      </header>
      <div className="atlas-workspace">
        <section className="atlas-map-area" aria-label="Interactive island map">
          <div className="atlas-map-heading">
            <div className="atlas-intro">
              <h1>Explore the islands</h1>
              <p>
                {showAllTools
                  ? "Showing all tools. Drag the map to explore."
                  : "Choose a tool or explore an island to see how Turtleand used AI."}
              </p>
            </div>
            <svg
              className="atlas-chart-compass"
              viewBox="0 0 48 68"
              aria-hidden="true"
            >
              <text x="24" y="10" textAnchor="middle">
                N
              </text>
              <circle cx="24" cy="39" r="15" />
              <path d="M24 17 28 35 46 39 28 43 24 61 20 43 2 39 20 35Z" />
              <path d="M24 17v22l4-4ZM2 39h22l-4 4Z" fill="currentColor" />
            </svg>
          </div>
          <div
            ref={containerRef}
            className="atlas-viewport"
            {...handlers}
            onPointerDown={(event) => {
              handlers.onPointerDown(event);
              if (
                event.button !== 0 ||
                (event.target as Element).closest("button,a")
              )
                return;
              if (tap.current) tap.current.moved = true;
              else
                tap.current = {
                  id: event.pointerId,
                  x: event.clientX,
                  y: event.clientY,
                  moved: false,
                };
            }}
            onPointerMove={(event) => {
              handlers.onPointerMove(event);
              if (
                tap.current &&
                Math.hypot(
                  event.clientX - tap.current.x,
                  event.clientY - tap.current.y,
                ) > 8
              )
                tap.current.moved = true;
            }}
            onPointerUp={(event) => {
              handlers.onPointerUp(event);
              const touch = tap.current;
              tap.current = null;
              if (!touch || touch.moved || touch.id !== event.pointerId) return;
              const id = islandAt(event.clientX, event.clientY);
              if (id) select(id);
              else {
                setSelected(null);
                setHovered(null);
                setFocused(null);
              }
            }}
            onPointerCancel={(event) => {
              handlers.onPointerCancel(event);
              tap.current = null;
            }}
          >
            {!depth && (
              <AtlasSvg
                scene={scene}
                view={view}
                selected={activeId}
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
                      !reduced &&
                      !journal &&
                      !staticQuality &&
                      !atlasCapture()
                    }
                    selected={activeId}
                    onReady={onReady}
                    onFail={onFail}
                    onSlow={onSlow}
                  />
                </div>
              </SceneBoundary>
            )}
            {view.width > 1 && (
              <AtlasDiscovery
                scene={scene}
                view={view}
                selected={selected}
                depth={depth}
                activeId={activeId}
                display={showAllTools ? "all" : "featured"}
                onSelect={select}
                onTool={openTool}
                onReveal={reveal}
                preview={preview}
                onPreview={setPreview}
              />
            )}
            {!scene.islands.length && (
              <p className="atlas-empty">New shores are being charted.</p>
            )}
          </div>
          <div className="atlas-map-footer">
            <button className="atlas-overview" onClick={reset}>
              Show all islands
            </button>
            <div className="atlas-zoom">
              <button aria-label="Zoom out" onClick={() => zoom(1 / 1.2)}>
                −
              </button>
              <button aria-label="Zoom in" onClick={() => zoom(1.2)}>
                +
              </button>
            </div>
            <div className="atlas-controls">
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
        </section>
        <aside
          ref={directory}
          id="atlas-directory"
          className={`atlas-directory ${expanded ? "is-expanded" : ""}`}
          aria-label={expanded ? "Tool directory" : "Selected island tools"}
          tabIndex={-1}
        >
          {expanded ? (
            <>
              <div className="atlas-shore-header">
                <div>
                  <p>AI Atlas</p>
                  <h2>All {toolCount} tools</h2>
                </div>
                <button
                  type="button"
                  className="atlas-collection-close"
                  aria-label="Close tool directory"
                  onClick={closeDirectory}
                >
                  ×
                </button>
              </div>
              <div className="atlas-collection-tools">
                {scene.islands.map((shore) => (
                  <section
                    className="atlas-collection-section"
                    key={shore.id}
                    aria-label={`${shore.category.name} tools`}
                    data-island={shore.id}
                    style={{ "--island-accent": shore.accent } as CSSProperties}
                  >
                    <h3>
                      <button
                        type="button"
                        aria-pressed={selected === shore.id}
                        onClick={() => select(shore.id)}
                      >
                        <AtlasGlyph kind={shore.landmark} />
                        {shore.category.name}
                      </button>
                    </h3>
                    {shore.category.tools.map((tool) => toolRow(tool, shore.id))}
                  </section>
                ))}
              </div>
            </>
          ) : (
            sidebarIsland && (
              <div
                data-island={sidebarIsland.id}
                style={{ "--island-accent": sidebarIsland.accent } as CSSProperties}
              >
                <div className="atlas-shore-header">
                  <div className="atlas-shore-icon">
                    <AtlasGlyph kind={sidebarIsland.landmark} />
                  </div>
                  <div>
                    <p>{selectedIsland ? "Selected island" : "From the collection"}</p>
                    <h2 aria-live="polite">{sidebarIsland.category.name}</h2>
                    <small>
                      {sidebarIsland.category.tools.length}{" "}
                      {sidebarIsland.category.tools.length === 1 ? "tool" : "tools"} explored
                    </small>
                  </div>
                </div>
                <div className="atlas-shore-tools">
                  {sidebarIsland.category.tools.map((tool) =>
                    toolRow(tool, sidebarIsland.id),
                  )}
                </div>
              </div>
            )
          )}
        </aside>
      </div>
      <AtlasNavigation />
      {preview && !journal && (
        <div
          id="atlas-tool-preview"
          role="tooltip"
          className="atlas-tool-preview"
          style={{ left: preview.x, top: preview.y }}
        >
          <strong>{preview.tool.name}</strong>
          <p>{toolNote(preview.tool)}</p>
        </div>
      )}
      {journal && journalIsland && (
        <JournalPanel
          toolName={journal.tool.name}
          toolDescription={
            historicalJournal
              ? "Historical entry. Turtleand’s OpenClaw Lab is archived."
              : journal.tool.description
          }
          toolUrl={journal.tool.url}
          toolUsage={historicalJournal ? undefined : journal.tool.usage}
          toolRelated={journal.tool.related}
          toolTags={historicalJournal ? undefined : journal.tool.tags}
          categoryName={journalIsland.category.name}
          categoryColor={journalIsland.accent}
          onClose={closeTool}
        />
      )}
    </main>
  );
}
