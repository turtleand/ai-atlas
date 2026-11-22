import type { AtlasIsland, AtlasScene, Point } from "./atlas-model";
import type { AtlasView } from "./useAtlas";

export type ViewIntent = "overview" | "manual";
export function fitScene(
  scene: AtlasScene,
  width: number,
  height: number,
): AtlasView {
  const coasts = scene.islands.flatMap(({ coast }) => coast);
  const xs = coasts.map(({ x }) => x);
  const ys = coasts.map(({ y }) => y);
  const left = xs.length ? Math.min(...xs) : 0;
  const right = xs.length ? Math.max(...xs) : scene.width;
  const top = ys.length ? Math.min(...ys) : 0;
  const bottom = ys.length ? Math.max(...ys) : scene.height;
  const compact = width < 600 || height < 330;
  const zoom = Math.max(
    0.05,
    Math.min(
      (width - (compact ? 52 : 110)) / Math.max(1, right - left),
      (height - (compact ? 61 : 84)) / Math.max(1, bottom - top),
    ),
  );
  return {
    width,
    height,
    center: {
      x: (left + right) / 2,
      y: (top + bottom) / 2 + (compact ? 9 : 11) / zoom,
    },
    zoom,
  };
}

export function turtleScreenScale({ width, height, zoom }: AtlasView) {
  const minimum = width < 600 || height < 330 ? 0.26 : 0.48;
  return Math.min(zoom * 1.7, Math.max(minimum, zoom * 0.92));
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
