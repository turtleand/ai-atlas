import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";
import type { Category, Tool } from "../utils/parseTools";
import { atlasCapture } from "./atlas/capture";
import { createScene, inside } from "./atlas/atlas-model";
import { AtlasSvg } from "./atlas/AtlasSvg";
import { AtlasNavigation } from "./atlas/AtlasNavigation";
import { AtlasTsunamiLink } from "./atlas/AtlasTsunamiLink";
import { AtlasDiscovery, type ToolPreview } from "./atlas/AtlasDiscovery";
import { AtlasGlyph } from "./atlas/AtlasLandmark";
import { toolNote } from "./atlas/tool-notes";
import "../styles/atlas-guided.css";
import { useAtlasView, useJourney, useMotionPolicy } from "./atlas/useAtlas";
import { JournalPanel } from "./JournalPanel";
import { TurtleandHubLink } from "./TurtleandHubLink";

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
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const directoryTrigger = useRef<HTMLButtonElement>(null);
  const directory = useRef<HTMLElement>(null);
  const { reduced, visible } = useMotionPolicy();
  const {
    ref: containerRef,
    view,
    focus,
    reset: resetView,
    handlers,
    reveal,
  } = useAtlasView(scene, reduced);
  const journey = useJourney(scene, !!journal || !visible, reduced);
  const driver = useMemo(
    () => ({ ref: journey.ref, subscribe: journey.subscribe }),
    [journey.ref, journey.subscribe],
  );
  const selectedIsland = scene.islands.find((i) => i.id === selected);
  const sidebarIsland = selectedIsland ?? defaultIsland;
  const journalIsland = scene.islands.find((i) => i.id === journal?.categoryId);
  const historicalJournal = journal?.tool.id === "openclaw";
  const origin = useRef<HTMLElement | null>(null);
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

    setDirectoryOpen(false);
    setPreview(null);
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
    setPreview(null);
    setDirectoryOpen(true);
    requestAnimationFrame(() => directory.current?.focus());
  };
  const closeDirectory = useCallback(() => {
    setDirectoryOpen(false);
    requestAnimationFrame(() => directoryTrigger.current?.focus());
  }, []);
  useEffect(() => {
    if (directory.current) directory.current.scrollTop = 0;
  }, [directoryOpen]);
  useEffect(() => {
    if (!directoryOpen || journal) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDirectory();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [closeDirectory, directoryOpen, journal]);

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
      y: view.center.y + (clientY - rect.top - view.height / 2) / view.zoom,
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
      data-reduced-motion={reduced || undefined}
      data-motion={
        reduced || !visible || journal || atlasCapture() ? "paused" : "running"
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
          <button
            type="button"
            className="atlas-all-collection"
            ref={directoryTrigger}
            aria-expanded={directoryOpen}
            aria-controls="atlas-directory"
            onClick={directoryOpen ? closeDirectory : openDirectory}
          >
            <span aria-hidden="true">▤</span> All tools
          </button>
          <TurtleandHubLink />
        </div>
      </header>
      <div className="atlas-workspace">
        <section className="atlas-map-area" aria-label="Interactive island map">
          <div className="atlas-map-heading">
            <div className="atlas-intro">
              <h1>Explore the islands</h1>
              <p>Choose a tool or explore an island to see how Turtleand used AI.</p>
            </div>
            <AtlasTsunamiLink placement="chart" />
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
            <AtlasSvg
              scene={scene}
              view={view}
              selected={activeId}
              driver={driver}
            />
            {view.width > 1 && (
              <AtlasDiscovery
                scene={scene}
                view={view}
                selected={selected}
                activeId={activeId}
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
        </section>
        <aside
          ref={directory}
          id="atlas-directory"
          className="atlas-directory"
          aria-label={directoryOpen ? "Tool directory" : "Selected island tools"}
          tabIndex={-1}
        >
          {directoryOpen ? (
            <>
              <div className="atlas-shore-header">
                <div>
                  <p>AI Atlas</p>
                  <h2>All tools</h2>
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
                        aria-current={selected === shore.id || undefined}
                        onClick={() => {
                          select(shore.id);
                          requestAnimationFrame(() => directory.current?.focus());
                        }}
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
