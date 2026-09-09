import type { AtlasIsland, AtlasScene, Point } from "./atlas-model";
import type { AtlasView } from "./useAtlas";

export type ViewIntent = "overview" | "manual";
export function fitScene(
  scene: AtlasScene,
  width: number,
  height: number,
  all = false,
): AtlasView {
  const zoom = Math.min(width / scene.width, height / scene.height) * 0.96;
  const narrow = !all && (width < 600 || height < 330);
  const center = (narrow ? scene.islands[0]?.center : null) ?? {
    x: scene.width / 2,
    y: scene.height / 2,
  };
  return {
    width,
    height,
    center: { x: center.x - (narrow ? 35 : 0), y: center.y },
    zoom: narrow ? Math.max(0.62, zoom) : zoom,
  };
}

// Return the smallest pan that reveals the coast and its category caption.
export function revealIsland(
  view: AtlasView,
  island: AtlasIsland,
  depth: boolean,
): Point {
  const dy = depth ? 0.72 : 1;
  const xs = island.coast.map(
    (p) => (p.x - view.center.x) * view.zoom + view.width / 2,
  );
  const ys = island.coast.map(
    (p) => (p.y - view.center.y) * view.zoom * dy + view.height / 2,
  );
  const shift = (min: number, max: number, size: number) =>
    max - min > size - 48
      ? (min + max - size) / 2
      : min < 24
        ? min - 24
        : max > size - 24
          ? max - size + 24
          : 0;
  return {
    x:
      view.center.x +
      shift(Math.min(...xs) - 12, Math.max(...xs) + 12, view.width) / view.zoom,
    y:
      view.center.y +
      shift(Math.min(...ys) - 12, Math.max(...ys) + 50, view.height) /
        (view.zoom * dy),
  };
}
