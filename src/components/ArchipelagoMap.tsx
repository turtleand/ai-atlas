import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";
import { getToolStatus, type Category, type Tool } from "../utils/parseTools";
import { atlasCapture } from "./atlas/capture";
import { createAtlasCatalog } from "./atlas/atlas-catalog";
import { getAtlasIslandStyle, inside } from "./atlas/atlas-model";
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

const directoryStatuses = ["active", "experimental"] as const;
type DirectoryStatus = (typeof directoryStatuses)[number];
type SidebarView = "island" | "directory" | "archive";
const sidebarLabels: Record<SidebarView, string> = {
  island: "Selected island tools",
  directory: "Tool directory",
  archive: "Tool archive",
};

export function ArchipelagoMap({ categories }: { categories: Category[] }) {
  const { scene, collection, experimentalFallback } = useMemo(
    () => createAtlasCatalog(categories),
    [categories],
  );
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
    const category = categories.find((entry) => entry.id === capture?.selection);
    const tool = category?.tools.find(
      (entry) => entry.id === capture?.tool && getToolStatus(entry) !== "pending",
    );
    return category && tool ? { tool, categoryId: category.id } : null;
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
  const [sidebarView, setSidebarView] = useState<SidebarView>("island");
  const [directoryStatus, setDirectoryStatus] = useState<DirectoryStatus>("active");
  const directoryTrigger = useRef<HTMLButtonElement>(null);
  const archiveTrigger = useRef<HTMLButtonElement>(null);
  const directory = useRef<HTMLElement>(null);
  const islandScroll = useRef(0);
  const directoryScroll = useRef(0);
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
  const journalCategory = categories.find(({ id }) => id === journal?.categoryId);
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
  const select = (id: string, keepDirectory = false) => {
    const start = performance.now();

    if (!keepDirectory) {
      setSidebarView("island");
      if (directory.current) directory.current.scrollTop = 0;
    }
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
    if (getToolStatus(tool) !== "archive") {
      setSelected(categoryId);
      journey.select(categoryId);
    }
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
    if (sidebarView === "island") {
      islandScroll.current = directory.current?.scrollTop ?? 0;
    }
    setPreview(null);
    setDirectoryStatus("active");
    setSidebarView("directory");
    if (directory.current) directory.current.scrollTop = 0;
    requestAnimationFrame(() => directory.current?.focus());
  };
  const closeDirectory = useCallback(() => {
    setSidebarView("island");
    requestAnimationFrame(() => {
      if (directory.current) directory.current.scrollTop = islandScroll.current;
      directoryTrigger.current?.focus();
    });
  }, []);
  const changeDirectoryStatus = (status: DirectoryStatus) => {
    if (status === directoryStatus) return;
    setDirectoryStatus(status);
    if (directory.current) directory.current.scrollTop = 0;
  };
  const openArchive = () => {
    directoryScroll.current = directory.current?.scrollTop ?? 0;
    setPreview(null);
    setSidebarView("archive");
    if (directory.current) directory.current.scrollTop = 0;
    requestAnimationFrame(() => directory.current?.focus());
  };
  const closeArchive = useCallback(() => {
    setSidebarView("directory");
    requestAnimationFrame(() => {
      if (directory.current) directory.current.scrollTop = directoryScroll.current;
      archiveTrigger.current?.focus({ preventScroll: true });
      archiveTrigger.current?.scrollIntoView?.({ block: "nearest" });
    });
  }, []);
  const toggleDirectory = () => {
    if (sidebarView === "archive") closeArchive();
    else if (sidebarView === "directory") closeDirectory();
    else openDirectory();
  };
  useEffect(() => {
    if (sidebarView === "island" || journal) return;
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (sidebarView === "archive") closeArchive();
      else closeDirectory();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [closeArchive, closeDirectory, journal, sidebarView]);

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
  const collectionSections = (groups: Category[], archived = false) =>
    groups.map((category) => {
      const { accent, landmark } = getAtlasIslandStyle(category.id);
      return (
        <section
          className="atlas-collection-section"
          key={category.id}
          aria-label={`${category.name} tools`}
          data-island={archived ? undefined : category.id}
          style={{ "--island-accent": accent } as CSSProperties}
        >
          {archived ? (
            <h3 className="atlas-archive-category">
              <AtlasGlyph kind={landmark} />
              {category.name}
            </h3>
          ) : (
            <h3>
              <button
                type="button"
                aria-current={selected === category.id || undefined}
                onClick={() => {
                  select(category.id, directoryStatus === "experimental");
                  requestAnimationFrame(() => directory.current?.focus());
                }}
              >
                <AtlasGlyph kind={landmark} />
                {category.name}
              </button>
            </h3>
          )}
          {category.tools.map((tool) => toolRow(tool, category.id))}
        </section>
      );
    });
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
            aria-expanded={sidebarView !== "island"}
            aria-controls="atlas-directory"
            onClick={toggleDirectory}
          >
            <span aria-hidden="true">▤</span> Tools
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
                experimentalFallback={experimentalFallback}
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
          aria-label={sidebarLabels[sidebarView]}
          tabIndex={-1}
        >
          {sidebarView === "archive" && (
            <>
              <div className="atlas-shore-header">
                <div>
                  <p>AI Atlas</p>
                  <h2>Archive</h2>
                </div>
                <button
                  type="button"
                  className="atlas-collection-close"
                  aria-label="Close archive"
                  onClick={closeArchive}
                >
                  ×
                </button>
              </div>
              <div className="atlas-collection-tools">
                {collectionSections(collection.archive, true)}
                {!collection.archive.length && (
                  <p className="atlas-directory-empty">No archived tools.</p>
                )}
              </div>
            </>
          )}
          {sidebarView === "directory" && (
            <>
              <div className="atlas-shore-header">
                <div>
                  <p>AI Atlas</p>
                  <h2>Tools</h2>
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
              <div className="atlas-directory-controls">
                <div
                  className="atlas-directory-tabs"
                  role="group"
                  aria-label="Directory tool status"
                >
                  {directoryStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={directoryStatus === status}
                      onClick={() => changeDirectoryStatus(status)}
                    >
                      {status === "active" ? "Active" : "Experimental"}
                    </button>
                  ))}
                </div>
                <div className="atlas-directory-actions">
                  <button
                    type="button"
                    className="atlas-directory-archive"
                    ref={archiveTrigger}
                    onClick={openArchive}
                  >
                    Archive
                  </button>
                </div>
              </div>
              <div className="atlas-collection-tools">
                {collectionSections(collection[directoryStatus])}
                {!collection[directoryStatus].length && (
                  <p className="atlas-directory-empty">No {directoryStatus} tools.</p>
                )}
              </div>
            </>
          )}
          {sidebarView === "island" && sidebarIsland && (
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
                    {experimentalFallback.has(sidebarIsland.id) ? "experimental" : "active"}{" "}
                    {sidebarIsland.category.tools.length === 1 ? "tool" : "tools"}
                  </small>
                </div>
              </div>
              <div className="atlas-shore-tools">
                {sidebarIsland.category.tools.map((tool) =>
                  toolRow(tool, sidebarIsland.id),
                )}
              </div>
            </div>
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
      {journal && journalCategory && (
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
          categoryName={journalCategory.name}
          categoryColor={getAtlasIslandStyle(journalCategory.id).accent}
          onClose={closeTool}
        />
      )}
    </main>
  );
}
