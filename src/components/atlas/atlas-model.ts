import type { Category } from "../../utils/parseTools";

export interface Point {
  x: number;
  y: number;
}
export type Landmark =
  | "pavilion"
  | "pigment"
  | "cinema"
  | "workshop"
  | "observatory"
  | "library"
  | "utilities"
  | "harbor"
  | "jetty";
export interface AtlasIsland {
  id: string;
  category: Category;
  center: Point;
  coast: Point[];
  radius: number;
  dock: Point;
  accent: string;
  landmark: Landmark;
  seed: number;
}
export interface AtlasScene {
  islands: AtlasIsland[];
  width: number;
  height: number;
  water: Uint8Array;
  cols: number;
  rows: number;
}
export const CELL = 24;
export const CLEARANCE = 54;
const styles: Record<string, [Landmark, string]> = {
  chatbot: ["pavilion", "#e8ba6b"],
  images: ["pigment", "#d7a6d5"],
  "video-generation": ["cinema", "#aab8ed"],
  code: ["workshop", "#87c9a0"],
  research: ["observatory", "#81c6da"],
  education: ["library", "#e4c883"],
  "local-infrastructure": ["utilities", "#dba98c"],
  agents: ["harbor", "#83cfc1"],
  "auxiliary-tools": ["jetty", "#bbbf99"],
};
export function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function hash(value: string) {
  let h = 5381;
  for (const c of value) h = Math.imul(h, 33) ^ c.charCodeAt(0);
  return h >>> 0;
}
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export function inside(p: Point, poly: Point[]) {
  let yes = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      yes = !yes;
  }
  return yes;
}
function edgeDistance(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
    ),
  );
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}
export function isWater(
  scene: Pick<AtlasScene, "islands" | "width" | "height">,
  p: Point,
) {
  if (p.x < 12 || p.y < 12 || p.x > scene.width - 12 || p.y > scene.height - 12)
    return false;
  return scene.islands.every(
    (i) =>
      distance(p, i.center) > i.radius * 1.5 + CLEARANCE ||
      (!inside(p, i.coast) &&
        i.coast.every(
          (a, n) =>
            edgeDistance(p, a, i.coast[(n + 1) % i.coast.length]) >= CLEARANCE,
        )),
  );
}
export function clearSegment(scene: AtlasScene, a: Point, b: Point) {
  const steps = Math.max(1, Math.ceil(distance(a, b) / 8));
  for (let k = 0; k <= steps; k++)
    if (
      !isWater(scene, {
        x: a.x + ((b.x - a.x) * k) / steps,
        y: a.y + ((b.y - a.y) * k) / steps,
      })
    )
      return false;
  return true;
}
export function createScene(categories: Category[]): AtlasScene {
  const columns = Math.min(3, Math.max(1, categories.length));
  const rows = Math.max(1, Math.ceil(categories.length / columns));
  const width = columns * 450 + 100,
    height = rows * 430 + 140;
  const islands = categories.map((category, index): AtlasIsland => {
    const seed = hash(category.id),
      rng = random(seed);
    const center = {
      x: 270 + (index % columns) * 450 + (rng() - 0.5) * 44,
      y: 250 + Math.floor(index / columns) * 430 + (rng() - 0.5) * 38,
    };
    const radius = 125 + rng() * 12;
    const phase = rng() * 6;
    const coast = Array.from({ length: 48 }, (_, n) => {
      const a = (n / 48) * Math.PI * 2;
      const r =
        radius *
        (1 +
          0.12 * Math.sin(a * 3 + phase) +
          0.07 * Math.cos(a * 5 - phase) -
          0.2 * Math.exp(-Math.pow((a - 0.5) / 0.34, 2)));
      return {
        x: center.x + Math.cos(a) * r * 1.13,
        y: center.y + Math.sin(a) * r * 0.84,
      };
    });
    const [landmark, accent] = styles[category.id] ?? ["jetty", "#bbbf99"];
    return {
      id: category.id,
      category,
      center,
      radius,
      coast,
      dock: { x: center.x + radius * 1.7, y: center.y + 24 },
      accent,
      landmark,
      seed,
    };
  });
  const scene: AtlasScene = {
    islands,
    width,
    height,
    cols: Math.ceil(width / CELL),
    rows: Math.ceil(height / CELL),
    water: new Uint8Array(),
  };
  scene.water = new Uint8Array(scene.cols * scene.rows);
  for (let n = 0; n < scene.water.length; n++)
    scene.water[n] = isWater(scene, {
      x: (n % scene.cols) * CELL,
      y: Math.floor(n / scene.cols) * CELL,
    })
      ? 1
      : 0;
  return scene;
}
export function coastPath(points: Point[]) {
  return `M${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")}Z`;
}

// Cache only checked grid edges; the scene key allows the cache to be collected on exit.
const waterEdges = new WeakMap<AtlasScene, Map<number, boolean>>();
// A* over a small cached water grid. Exact endpoints are joined only by safe segments.
export function findWaterPath(
  scene: AtlasScene,
  start: Point,
  end: Point,
): Point[] | null {
  if (!isWater(scene, start) || !isWater(scene, end)) return null;
  if (clearSegment(scene, start, end)) return [start, end];
  const point = (n: number) => ({
    x: (n % scene.cols) * CELL,
    y: Math.floor(n / scene.cols) * CELL,
  });
  function nearest(p: Point) {
    const candidates: { n: number; d: number }[] = [];
    for (let n = 0; n < scene.water.length; n++) {
      if (!scene.water[n]) continue;
      candidates.push({ n, d: distance(p, point(n)) });
    }
    // Check nearby joins first instead of sampling long segments across the entire map.
    candidates.sort((a, b) => a.d - b.d);
    return (
      candidates.find(({ n }) => clearSegment(scene, p, point(n)))?.n ?? -1
    );
  }
  const edges = waterEdges.get(scene) ?? new Map<number, boolean>();
  waterEdges.set(scene, edges);
  const first = nearest(start),
    last = nearest(end);
  if (first < 0 || last < 0) return null;
  const costs = new Float64Array(scene.water.length).fill(Infinity),
    parents = new Int32Array(scene.water.length).fill(-1);
  const open = new Set([first]),
    closed = new Set<number>();
  costs[first] = 0;
  while (open.size) {
    let current = -1,
      best = Infinity;
    for (const n of open) {
      const score = costs[n] + distance(point(n), point(last));
      if (score < best) {
        current = n;
        best = score;
      }
    }
    if (current === last) {
      const path: Point[] = [end];
      let n = last;
      while (n !== -1) {
        path.push(point(n));
        n = parents[n];
      }
      path.push(start);
      path.reverse();
      const simple: Point[] = [start];
      let a = 0;
      while (a < path.length - 1) {
        let b = path.length - 1;
        while (b > a + 1 && !clearSegment(scene, path[a], path[b])) b--;
        simple.push(path[b]);
        a = b;
      }
      // Chaikin corner cutting stays inside the safety corridor; reject unsafe curves.
      let smooth = simple;
      for (let pass = 0; pass < 3; pass++) {
        const next = [smooth[0]];
        for (let k = 0; k < smooth.length - 1; k++) {
          const u = smooth[k],
            v = smooth[k + 1];
          next.push(
            { x: u.x * 0.75 + v.x * 0.25, y: u.y * 0.75 + v.y * 0.25 },
            { x: u.x * 0.25 + v.x * 0.75, y: u.y * 0.25 + v.y * 0.75 },
          );
        }
        next.push(smooth.at(-1)!);
        if (
          next.every((p, k) => k === 0 || clearSegment(scene, next[k - 1], p))
        )
          smooth = next;
      }
      return smooth;
    }
    open.delete(current);
    closed.add(current);
    const cx = current % scene.cols,
      cy = Math.floor(current / scene.cols);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const x = cx + dx,
          y = cy + dy,
          n = y * scene.cols + x;
        if (
          x < 0 ||
          x >= scene.cols ||
          y < 0 ||
          y >= scene.rows ||
          !scene.water[n] ||
          closed.has(n)
        )
          continue;
        const key =
          Math.min(current, n) * scene.water.length + Math.max(current, n);
        let safe = edges.get(key);
        if (safe === undefined) {
          safe = clearSegment(scene, point(current), point(n));
          edges.set(key, safe);
        }
        if (!safe) continue;
        const cost = costs[current] + CELL * Math.hypot(dx, dy);
        if (cost < costs[n]) {
          costs[n] = cost;
          parents[n] = current;
          open.add(n);
        }
      }
  }
  return null;
}
