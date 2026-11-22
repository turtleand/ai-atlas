import {
  useMemo,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import type { Tool } from "../../utils/parseTools";
import type { AtlasScene, Point } from "./atlas-model";
import { fitScene } from "./atlas-camera";
import { projection, type AtlasView } from "./useAtlas";
import { shoreSignpostLayout } from "./shore-signposts";

import { AtlasGlyph } from "./AtlasLandmark";

export type ToolPreview = { tool: Tool; x: number; y: number } | null;
type Rect = { x: number; y: number; w: number; h: number };
const intersects = (a: Rect, b: Rect) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 3 &&
  Math.abs(a.y - b.y) < (a.h + b.h) / 2 + 3;

export function discoveryLayout(
  scene: AtlasScene,
  view: AtlasView,
  depth: boolean,
  names: boolean,
  includeTools = true,
) {
  const desktop = !includeTools || (view.width >= 600 && view.height >= 330);
  const placed: Rect[] = scene.islands.flatMap((i) => {
    const center = projection(i.center, view, depth),
      dock = projection(i.dock, view, depth);
    if (!includeTools) return [{ ...center, w: 14, h: 14 }];
    return [
      { ...center, w: 40 * Math.min(1, view.zoom / 0.4), h: 34 },
      { ...dock, w: 30, h: 28 },
    ];
  });
  const shoreReservations = [...placed];

  const items = scene.islands.flatMap((i) => [
    {
      island: i,
      tool: null as Tool | null,
      anchor: projection(
        { x: i.center.x, y: i.center.y + i.radius * 0.83 },
        view,
        depth,
      ),
    },
    ...(includeTools ? i.tools : []).map((t) => ({
      island: i,
      tool: t.tool,
      anchor: projection(t.point, view, depth),
    })),
  ]);
  // Category captions establish the map hierarchy; tool names fill the nearest free water.
  const priority = [
    "education",
    "research",
    "code",
    "chatbot",
    "images",
    "agents",
    "local-infrastructure",
    "video-generation",
    "auxiliary-tools",
  ];
  items.sort(
    (a, b) =>
      Number(!!a.tool) - Number(!!b.tool) ||
      priority.indexOf(a.island.id) - priority.indexOf(b.island.id) ||
      (b.tool?.name.length ?? 0) - (a.tool?.name.length ?? 0),
  );
  const labels = items.map((item) => {
    const name = item.tool?.name ?? item.island.category.name;
    const named = !item.tool || names;
    const w = !includeTools
      ? 118
      : named
        ? Math.min(
            item.tool ? 142 : 158,
            Math.max(
              item.tool ? 100 : item.island.id === "education" ? 126 : 110,
              name.length * 6.1 + 20,
            ),
          )
        : 44;
    const h = !includeTools ? 48 : !item.tool && name.length > 12 ? 60 : 44;
    const base = { ...item.anchor, w, h };
    if (item.tool && named) base.y = Math.round(base.y / 48) * 48;
    const candidates: Rect[] = [base];
    if (named) {
      for (let r = 1; r <= 10; r++) {
        for (let n = 0; n < r * 12; n++) {
          const a = (n * Math.PI * 2) / (r * 12);
          candidates.push({
            ...base,
            x: base.x + Math.cos(a) * r * 24,
            y: base.y + Math.sin(a) * r * 24,
          });
        }
      }
    }
    if (item.tool && named)
      for (const p of candidates) p.y = Math.round(p.y / 48) * 48;
    const fits = (p: Rect) =>
      (!desktop ||
        (p.x - w / 2 >= 4 &&
          p.x + w / 2 <= view.width - 4 &&
          p.y >= h / 2 + 4 &&
          p.y + h / 2 <= view.height - 4)) &&
      !placed.some((other) => intersects(p, other));
    let rect = candidates.find(fits);
    if (!rect && desktop) {
      const spare: Rect[] = [];
      for (let y = h / 2 + 4; y < view.height - h / 2; y += 6)
        for (let x = w / 2 + 4; x < view.width - w / 2; x += 6) {
          const p = { x, y, w, h };
          if (fits(p)) spare.push(p);
        }
      spare.sort(
        (a, b) =>
          Math.hypot(a.x - base.x, a.y - base.y) -
          Math.hypot(b.x - base.x, b.y - base.y),
      );
      rect = spare[0];
    }
    rect ??= base;
    placed.push(rect);
    return {
      ...item,
      ...rect,
      named,
      key: item.tool ? `${item.island.id}:${item.tool.id}` : item.island.id,
    };
  });
  if (
    !includeTools &&
    labels.some((a, n) => labels.slice(n + 1).some((b) => intersects(a, b)))
  ) {
    // Tiny overview captions use the available margins; the geography stays fixed.
    const columns = Math.min(3, Math.max(1, Math.floor(view.width / 120)));
    const rows = Math.ceil(labels.length / columns);
    const slots = Array.from({ length: columns * rows }, (_, n) => ({
      x: (((n % columns) + 0.5) * view.width) / columns,
      y: ((Math.floor(n / columns) + 0.5) * view.height) / rows,
    }));
    for (const label of labels) {
      slots.sort(
        (a, b) =>
          Math.hypot(a.x - label.anchor.x, a.y - label.anchor.y) -
          Math.hypot(b.x - label.anchor.x, b.y - label.anchor.y),
      );
      Object.assign(label, slots.shift());
    }
  }
  // Pair swaps undo greedy crowding: a late tool must not be exiled to another shore.
  const fixed = shoreReservations;
  const centers = scene.islands.map((i) => ({
    id: i.id,
    ...projection(i.center, view, depth),
  }));
  const cost = (label: (typeof labels)[number], p: Rect) => {
    const own = centers.find((c) => c.id === label.island.id)!;
    const ownDistance = Math.hypot(p.x - own.x, p.y - own.y);
    const nearest = Math.min(
      ...centers
        .filter((c) => c !== own)
        .map((c) => Math.hypot(p.x - c.x, p.y - c.y)),
    );
    return (
      (p.x - label.anchor.x) ** 2 +
      (p.y - label.anchor.y) ** 2 +
      Math.max(0, ownDistance - nearest) ** 2 * 6
    );
  };
  for (let pass = 0; pass < 12; pass++) {
    let improved = false;
    for (let a = scene.islands.length; a < labels.length; a++)
      for (let b = a + 1; b < labels.length; b++) {
        const first = labels[a],
          second = labels[b];
        const p = { ...first, x: second.x, y: second.y, w: second.w },
          q = { ...second, x: first.x, y: first.y, w: first.w };
        if (
          cost(first, p) + cost(second, q) >=
          cost(first, first) + cost(second, second) - 1
        )
          continue;
        const free = (r: Rect) =>
          (!desktop ||
            (r.x - r.w / 2 >= 4 &&
              r.x + r.w / 2 <= view.width - 4 &&
              r.y - r.h / 2 >= 4 &&
              r.y + r.h / 2 <= view.height - 4)) &&
          !fixed.some((f) => intersects(r, f)) &&
          !labels.some((l, n) => n !== a && n !== b && intersects(l, r));
        if (!intersects(p, q) && free(p) && free(q)) {
          first.x = p.x;
          first.y = p.y;
          first.w = p.w;
          second.x = q.x;
          second.y = q.y;
          second.w = q.w;
          improved = true;
        }
      }
    if (!improved) break;
  }
  return labels;
}

export function seaCaptionLayout(
  scene: AtlasScene,
  view: AtlasView,
  depth: boolean,
  labels: Rect[],
) {
  const occupied = [
    ...labels,
    ...scene.islands.map((i) => ({
      ...projection(i.center, view, depth),
      w: i.radius * view.zoom * 1.8,
      h: i.radius * view.zoom * 1.6,
    })),
    ...scene.features.map((f) => ({
      ...projection(f.center, view, depth),
      w: 130 * view.zoom,
      h: 140 * view.zoom,
    })),
  ];
  return scene.features.flatMap((f) => {
    const anchor = projection(f.center, view, depth),
      w = Math.min(138, f.name.length * 5.5 + 12),
      h = 18;
    const candidates = Array.from({ length: 160 }, (_, n) => {
      const r = 20 + Math.floor(n / 16) * 10,
        a = ((n % 16) * Math.PI) / 8;
      return {
        x: anchor.x + Math.cos(a) * r,
        y: anchor.y + 48 * view.zoom + 18 + Math.sin(a) * r,
        w,
        h,
      };
    });
    let rect = candidates.find(
      (p) =>
        p.x - w / 2 > 4 &&
        p.x + w / 2 < view.width - 4 &&
        p.y - h / 2 > 4 &&
        p.y + h / 2 < view.height - 4 &&
        !occupied.some((o) => intersects(p, o)),
    );
    if (!rect && view.width >= 600 && view.height >= 330) {
      let best = Infinity;
      for (let y = 16; y < view.height - 16; y += 8)
        for (let x = w / 2 + 4; x < view.width - w / 2 - 4; x += 8) {
          const p = { x, y, w, h },
            cost = (x - anchor.x) ** 2 + (y - anchor.y - 25) ** 2;
          if (cost < best && !occupied.some((o) => intersects(p, o))) {
            rect = p;
            best = cost;
          }
        }
    }
    if (!rect) return [];
    occupied.push(rect);
    return [{ ...rect, feature: f, anchor }];
  });
}

export function AtlasDiscovery({
  scene,
  view,
  depth = false,
  activeId,
  selected,
  display,
  onSelect,
  onTool,
  preview,
  onPreview,
  onReveal,
}: {
  scene: AtlasScene;
  view: AtlasView;
  depth?: boolean;
  activeId: string | null;
  selected: string | null;
  display: "featured" | "all";
  onSelect: (id: string) => void;
  onTool: (tool: Tool, id: string, trigger?: HTMLButtonElement) => void;
  preview: ToolPreview;
  onPreview: (preview: ToolPreview) => void;
  onReveal: (point: Point) => void;
}) {
  const featured = display === "featured";
  const { zoom, width, height } = view;
  const compact = featured && (width < 600 || height < 330);
  const layout = useMemo(() => {
    const overview = featured ? fitScene(scene, width, height) : null;
    const overviewScale = overview && zoom <= overview.zoom * 1.01;
    const frame = {
      center: overview?.center ?? { x: scene.width / 2, y: scene.height / 2 },
      zoom,
      width: overviewScale
        ? width
        : Math.max(width, scene.width * zoom, featured ? 0 : 832),
      height: overviewScale
        ? height
        : Math.max(
            height,
            scene.height * zoom * (depth ? 0.72 : 1),
            featured ? 0 : 512,
          ),
    };
    const signs = featured
      ? shoreSignpostLayout(scene, frame, depth, compact)
      : [];
    const labels = featured ? [] : discoveryLayout(scene, frame, depth, true);
    return {
      frame,
      signs,
      labels,
      captions:
        compact || (featured && zoom < 0.55)
          ? []
          : seaCaptionLayout(scene, frame, depth, featured ? signs : labels),
    };
  }, [scene, zoom, width, height, depth, compact, featured]);
  const dx =
    (width - layout.frame.width) / 2 +
    (layout.frame.center.x - view.center.x) * zoom;
  const dy =
    (height - layout.frame.height) / 2 +
    (layout.frame.center.y - view.center.y) * zoom * (depth ? 0.72 : 1);
  const labels = layout.labels.map((l) => ({
    ...l,
    x: l.x + dx,
    y: l.y + dy,
    anchor: { x: l.anchor.x + dx, y: l.anchor.y + dy },
  }));
  const peek = (tool: Tool, element: HTMLElement) => {
    const r = element.getBoundingClientRect();
    onPreview({
      tool,
      x: Math.max(
        12,
        Math.min(window.innerWidth - 292, r.x + r.width / 2 - 140),
      ),
      y: Math.min(window.innerHeight - 150, r.bottom + 8),
    });
  };
  const buttonProps = (
    tool: Tool | null,
    id: string,
    point: Point,
    reveal = true,
  ): ComponentPropsWithoutRef<"button"> => ({
    type: "button",
    "aria-describedby":
      tool && preview?.tool === tool ? "atlas-tool-preview" : undefined,
    onPointerEnter: (event) => {
      if (tool && event.pointerType !== "touch")
        peek(tool, event.currentTarget);
    },
    onPointerLeave: (event) => {
      if (
        preview?.tool === tool &&
        document.activeElement !== event.currentTarget
      )
        onPreview(null);
    },
    onFocus: (event) => {
      if (reveal && event.currentTarget.matches(":focus-visible"))
        onReveal({
          x: view.center.x + (point.x - width / 2) / zoom,
          y: view.center.y + (point.y - height / 2) / zoom / (depth ? 0.72 : 1),
        });
      if (tool) peek(tool, event.currentTarget);
    },
    onBlur: () => onPreview(null),
    onKeyDown: (event) => {
      if (event.key === "Escape" && preview) {
        event.stopPropagation();
        onPreview(null);
      }
    },
    onClick: (event) => {
      onPreview(null);
      if (tool) onTool(tool, id, event.currentTarget);
      else onSelect(id);
    },
  });
  return (
    <div
      className={`atlas-labels atlas-discovery ${compact ? "is-overview" : ""}`}
      data-active-islands={activeId ?? ""}
      data-display={display}
    >
      <svg
        className="atlas-leaders"
        width={view.width}
        height={view.height}
        aria-hidden="true"
      >
        {layout.captions.map((c) => (
          <path
            key={c.feature.id}
            d={`M${c.anchor.x + dx},${c.anchor.y + dy}L${c.x + dx},${c.y + dy}`}
            fill="none"
            stroke={c.feature.color}
            strokeWidth=".7"
            strokeOpacity=".28"
          />
        ))}
        {layout.signs.map(({ island, anchor, end }) => (
          <path
            key={island.id}
            className="atlas-signpost-leader"
            data-emphasis={activeId === island.id ? "active" : "muted"}
            style={{ "--island-accent": island.accent } as CSSProperties}
            d={`M${anchor.x + dx},${anchor.y + dy}L${end.x + dx},${end.y + dy}`}
            fill="none"
            stroke={island.accent}
            strokeWidth="1"
          />
        ))}
        {labels
          .filter((l) => l.tool)
          .map((l) => (
            <g
              key={l.key}
              className="atlas-tool-leader"
              data-emphasis={activeId === l.island.id ? "active" : "muted"}
              style={{ "--island-accent": l.island.accent } as CSSProperties}
            >
              <path
                d={`M${l.anchor.x},${l.anchor.y} L${l.x},${l.y}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle
                cx={l.anchor.x}
                cy={l.anchor.y}
                r="3"
                fill="currentColor"
              />
            </g>
          ))}
      </svg>
      {layout.captions.map((c) => (
        <span
          key={c.feature.id}
          className="atlas-sea-caption"
          style={{
            left: c.x + dx,
            top: c.y + dy,
            width: c.w,
            color: c.feature.color,
          }}
        >
          {c.feature.name}
        </span>
      ))}
      {layout.signs.map((sign) => {
        const { island, tools, w, h } = sign;
        const point = { x: sign.x + dx, y: sign.y + dy };
        const clipped =
          point.x - w / 2 < 0 ||
          point.x + w / 2 > width ||
          point.y - h / 2 < 0 ||
          point.y + h / 2 > height;
        return (
          <div
            key={island.id}
            className="atlas-signpost"
            data-island={island.id}
            data-emphasis={activeId === island.id ? "active" : "muted"}
            style={
              {
                left: point.x,
                top: point.y,
                width: w,
                "--island-accent": island.accent,
              } as CSSProperties
            }
          >
            <button
              {...buttonProps(null, island.id, point, clipped)}
              className="atlas-signpost-category"
              aria-label={`${island.category.name}, ${island.category.tools.length} tools`}
              aria-pressed={selected === island.id}
            >
              <AtlasGlyph kind={island.landmark} />
              <span>{island.category.name}</span>
            </button>
            {tools.map((tool) => (
              <button
                {...buttonProps(tool, island.id, point, clipped)}
                key={tool.id}
                className="atlas-signpost-tool is-tool is-named"
                aria-label={tool.name}
              >
                <span>{tool.name}</span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        );
      })}
      {labels.map((l) => (
        <button
          {...buttonProps(l.tool, l.island.id, l)}
          key={l.key}
          className={`atlas-discovery-label is-named ${l.tool ? "is-tool" : "is-category"}`}
          data-emphasis={activeId === l.island.id ? "active" : "muted"}
          data-island={l.island.id}
          style={
            {
              left: l.x,
              top: l.y,
              width: l.w,
              height: l.h,
              "--island-accent": l.island.accent,
              "--island-label": l.island.palette.label,
            } as CSSProperties
          }
          aria-label={
            l.tool?.name ??
            `${l.island.category.name}, ${l.island.category.tools.length} tools`
          }
          aria-pressed={!l.tool ? l.island.id === selected : undefined}
        >
          <span>
            {!l.tool && <AtlasGlyph kind={l.island.landmark} />}{" "}
            {l.tool?.name ?? l.island.category.name}
          </span>
          {!l.tool && <small>{l.island.category.tools.length} tools</small>}
        </button>
      ))}
    </div>
  );
}
