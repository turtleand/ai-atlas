import { useState } from "react";
import type { AtlasScene } from "./atlas-model";
import { projection, type AtlasView } from "./useAtlas";
import type { Tool } from "../../utils/parseTools";
export function AtlasLabels({
  scene,
  view,
  selected,
  depth,
  onSelect,
  onTool,
}: {
  scene: AtlasScene;
  view: AtlasView;
  selected: string | null;
  depth: boolean;
  onSelect: (id: string) => void;
  onTool: (tool: Tool, id: string) => void;
}) {
  const [focused, setFocused] = useState<string | null>(null);
  const compact = view.height < 300 && selected === null;
  const labels = scene.islands
    .flatMap((island) => {
      const isSelected = island.id === selected;
      const category = {
        key: island.id,
        name: island.category.name,
        count: island.category.tools.length,
        point: {
          x: island.center.x + (compact ? island.radius * 1.15 : 0),
          y: island.center.y + (compact ? 0 : island.radius * 0.8),
        },
        island,
        tool: null as Tool | null,
      };
      if (!isSelected) return [category];
      return [
        category,
        ...island.category.tools.map((tool, n) => {
          const a =
            Math.PI *
            // Leave the eastern docking cove clear so visits remain visible.
            (0.3 + (n / Math.max(1, island.category.tools.length - 1)) * 1.4);
          return {
            key: `${island.id}:${tool.id}`,
            name: tool.name,
            count: 0,
            point: {
              x: island.center.x + Math.cos(a) * 205,
              y: island.center.y + Math.sin(a) * 173,
            },
            island,
            tool,
          };
        }),
      ];
    })
    .map((label) => ({
      ...label,
      screen: projection(label.point, view, depth),
    }));
  labels.sort(
    (a, b) =>
      Number(b.key === focused || b.island.id === selected) -
      Number(a.key === focused || a.island.id === selected),
  );
  const placed: { x: number; y: number; w: number }[] = [];
  return (
    <div className="atlas-labels">
      {labels.map((label) => {
        const w = compact
            ? 44
            : view.width < 600
              ? 100
              : Math.min(160, Math.max(100, 450 * view.zoom - 12)),
          p = {
            x: label.screen.x,
            y: label.screen.y + (compact ? -22 : label.tool ? 0 : 10),
            w,
          };
        const priority = label.key === focused || label.key === selected;
        const offscreen =
          p.x < 20 ||
          p.x > view.width - 20 ||
          p.y < 12 ||
          p.y > view.height - 30;
        const overlaps = placed.some(
          (other) =>
            Math.abs(p.x - other.x) < (w + other.w) / 2 + 4 &&
            Math.abs(p.y - other.y) < 46,
        );
        if ((offscreen || overlaps) && !priority) return null;
        placed.push(p);
        return (
          <button
            key={label.key}
            className={`atlas-label ${label.tool ? "atlas-tool-marker" : ""} ${compact ? "is-compact" : ""}`}
            aria-label={
              compact ? `${label.name}, ${label.count} tools` : undefined
            }
            style={
              {
                width: `${w}px`,
                left: `${Math.max(w / 2, Math.min(view.width - w / 2, p.x))}px`,
                top: `${Math.max(0, Math.min(view.height - 44, p.y))}px`,
                "--island-accent": label.island.accent,
              } as React.CSSProperties
            }
            aria-pressed={label.tool ? undefined : label.island.id === selected}
            onFocus={() => setFocused(label.key)}
            onBlur={() => setFocused(null)}
            onClick={() =>
              label.tool
                ? onTool(label.tool, label.island.id)
                : onSelect(label.island.id)
            }
          >
            <span>
              {compact
                ? String(scene.islands.indexOf(label.island) + 1).padStart(
                    2,
                    "0",
                  )
                : label.name}
            </span>
            {!label.tool && !compact && (
              <small>
                {label.count} {label.count === 1 ? "tool" : "tools"}
              </small>
            )}
          </button>
        );
      })}
    </div>
  );
}
