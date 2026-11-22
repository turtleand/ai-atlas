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

function seaCaptionLayout(
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
  onSelect: (id: string) => void;
  onTool: (tool: Tool, id: string, trigger?: HTMLButtonElement) => void;
  preview: ToolPreview;
  onPreview: (preview: ToolPreview) => void;
  onReveal: (point: Point) => void;
}) {
  const { zoom, width, height } = view;
  const compact = width < 600 || height < 330;
  const layout = useMemo(() => {
    const overview = fitScene(scene, width, height);
    const overviewScale = zoom <= overview.zoom * 1.01;
    const frame = {
      center: overview.center,
      zoom,
      width: overviewScale ? width : Math.max(width, scene.width * zoom),
      height: overviewScale
        ? height
        : Math.max(height, scene.height * zoom * (depth ? 0.72 : 1)),
    };
    const signs = shoreSignpostLayout(scene, frame, depth, compact);
    return {
      frame,
      signs,
      captions:
        compact || zoom < 0.55 ? [] : seaCaptionLayout(scene, frame, depth, signs),
    };
  }, [scene, zoom, width, height, depth, compact]);
  const dx =
    (width - layout.frame.width) / 2 +
    (layout.frame.center.x - view.center.x) * zoom;
  const dy =
    (height - layout.frame.height) / 2 +
    (layout.frame.center.y - view.center.y) * zoom * (depth ? 0.72 : 1);
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
    reveal: boolean,
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
                className="atlas-signpost-tool is-tool"
                aria-label={tool.name}
              >
                <span>{tool.name}</span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
