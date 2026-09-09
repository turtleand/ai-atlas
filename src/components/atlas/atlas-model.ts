import { seaFeatures, type SeaFeature } from "./atlas-features";
import type { Category, Tool } from "../../utils/parseTools";

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
export interface IslandPalette {
  land: string;
  raised: string;
  shadow: string;
  label: string;
}
export interface AtlasIsland {
  id: string;
  category: Category;
  center: Point;
  coast: Point[];
  radius: number;
  dock: Point;
  accent: string;
  palette: IslandPalette;
  landmark: Landmark;
  seed: number;
  rotation: number;
  jetty: Point;
  tools: { tool: Tool; point: Point }[];
}
export interface AtlasScene {
  islands: AtlasIsland[];
  features: SeaFeature[];
  width: number;
  height: number;
  water: Uint8Array;
  cols: number;
  rows: number;
}

// Authored by identity, not catalog order. The gaps are navigable sea, not a grid.
const geography: Record<string, [number, number, number, number]> = {
  chatbot: [610, 305, 160, -0.35],
  research: [280, 680, 142, -0.5],
  education: [760, 785, 150, 0.5],
  images: [1245, 275, 155, 0.35],
  "video-generation": [1720, 585, 166, 2.65],
  code: [1110, 1120, 173, -0.5],
  agents: [1745, 1055, 147, -2.65],
  "local-infrastructure": [1495, 1475, 163, -1.25],
  "auxiliary-tools": [340, 1280, 129, -0.9],
};
export function islandPoint(
  island: Pick<AtlasIsland, "center" | "rotation">,
  x: number,
  y: number,
): Point {
  const a = island.rotation;
  return {
    x: island.center.x + x * Math.cos(a) - y * Math.sin(a),
    y: island.center.y + x * Math.sin(a) + y * Math.cos(a),
  };
}
export const CELL = 24;
export const CLEARANCE = 54;
const styles: Record<
  string,
  [Landmark, string, string, string, string, string]
> = {
  chatbot: ["pavilion", "#f3c279", "#8c713f", "#ba9859", "#564a32", "#423722"],
  images: ["pigment", "#e1b0ed", "#775988", "#a783b2", "#49385d", "#372b48"],
  "video-generation": [
    "cinema",
    "#bac7ff",
    "#5e6e9b",
    "#8a99c4",
    "#3c4b70",
    "#283651",
  ],
  code: ["workshop", "#8fdfb0", "#4c8867", "#7eae83", "#315747", "#203e32"],
  research: [
    "observatory",
    "#89d2f2",
    "#4a8198",
    "#79acc0",
    "#35566b",
    "#213e50",
  ],
  education: ["library", "#f3df8a", "#8d8a4d", "#b8b571", "#595c38", "#3d3d26"],
  "local-infrastructure": [
    "utilities",
    "#edb18d",
    "#996e56",
    "#bd9471",
    "#634c3e",
    "#493429",
  ],
  agents: ["harbor", "#8be1d0", "#458b81", "#74b4a4", "#2b5a58", "#203e3d"],
  "auxiliary-tools": [
    "jetty",
    "#f5acac",
    "#9e6c6d",
    "#c99b8d",
    "#67494c",
    "#493034",
  ],
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
  scene: Pick<AtlasScene, "islands" | "width" | "height" | "features">,
  p: Point,
) {
  if (p.x < 12 || p.y < 12 || p.x > scene.width - 12 || p.y > scene.height - 12)
    return false;
  return (
    scene.features.every(
      (f) => distance(p, f.center) >= f.radius + CLEARANCE,
    ) &&
    scene.islands.every(
      (i) =>
        distance(p, i.center) > i.radius * 1.5 + CLEARANCE ||
        (!inside(p, i.coast) &&
          i.coast.every(
            (a, n) =>
              edgeDistance(p, a, i.coast[(n + 1) % i.coast.length]) >=
              CLEARANCE,
          )),
    )
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
  let width: number, height: number;
  const fallback: Point[] = [];
  function placement(id: string): [number, number, number, number] {
    if (geography[id]) {
      const [x, y, radius, angle] = geography[id];
      return [x * 1.35, y * 0.8, radius, angle];
    }
    const seed = hash(id);
    for (let n = 0; ; n++) {
      const a = ((seed % 360) * Math.PI) / 180 + n * 2.39996;
      const r = 1150 + Math.floor(n / 12) * 360;
      const p = { x: 1050 + Math.cos(a) * r, y: 900 + Math.sin(a) * r };
      if (
        [
          ...Object.values(geography).map((v) => ({
            x: v[0] * 1.35,
            y: v[1] * 0.8,
          })),
          ...fallback,
        ].every((q) => distance(p, q) > 440)
      ) {
        fallback.push(p);
        return [p.x, p.y, 145, a];
      }
    }
  }
  const positions = new Map<string, [number, number, number, number]>();
  // Keep fallback locations deterministic when catalog order changes.
  [...categories]
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((c) => positions.set(c.id, placement(c.id)));
  const islands = categories.map((category): AtlasIsland => {
    const seed = hash(category.id),
      rng = random(seed);
    const authored = positions.get(category.id)!;
    const center = { x: authored[0], y: authored[1] },
      radius = authored[2],
      rotation = authored[3];
    const phase = rng() * 6;
    const coast = Array.from({ length: 48 }, (_, n) => {
      const a = (n / 48) * Math.PI * 2;
      const r =
        radius *
        (1 +
          0.12 * Math.sin(a * 3 + phase) +
          0.07 * Math.cos(a * 5 - phase) -
          0.2 * Math.exp(-Math.pow((a - 0.5) / 0.34, 2)));
      return islandPoint(
        { center, rotation },
        Math.cos(a) * r * 1.13,
        Math.sin(a) * r * 0.84,
      );
    });
    const [landmark, accent, land, raised, shadow, label] =
      styles[category.id] ?? styles["auxiliary-tools"];
    return {
      id: category.id,
      category,
      center,
      radius,
      coast,
      dock: islandPoint({ center, rotation }, radius * 1.7, 24),
      jetty: islandPoint({ center, rotation }, radius * 0.99, 22),
      rotation,
      tools: category.tools.map((tool, n) => {
        // Fan each category into its open water, keeping neighboring shores distinct.
        const bearings: Record<string, number> = {
          chatbot: -2.1,
          research: Math.PI,
          education: -0.55,
          images: -1.3,
          "video-generation": -0.3,
          code: 2.0,
          agents: 0.1,
          "local-infrastructure": 1.2,
          "auxiliary-tools": 2.8,
        };
        const bearing = bearings[category.id] ?? -1.57;
        const a =
          bearing +
          (category.tools.length === 1
            ? 0
            : (n / (category.tools.length - 1) - 0.5) * 1.5);
        let point = {
          x: center.x + Math.cos(a) * (radius + 80),
          y: center.y + Math.sin(a) * (radius + 85),
        };
        const dock = islandPoint({ center, rotation }, radius * 1.7, 24);
        if (distance(point, dock) < 85)
          point = { x: point.x, y: point.y - 100 };
        return { tool, point };
      }),
      accent,
      palette: { land, raised, shadow, label },
      landmark,
      seed,
    };
  });
  {
    const xs = islands.flatMap((i) =>
      [...i.coast, i.dock, ...i.tools.map((t) => t.point)].map((p) => p.x),
    );
    const ys = islands.flatMap((i) =>
      [...i.coast, i.dock, ...i.tools.map((t) => t.point)].map((p) => p.y),
    );
    const dx = 220 - (xs.length ? Math.min(...xs) : 0),
      dy = 180 - (ys.length ? Math.min(...ys) : 0);
    for (const i of islands)
      for (const p of [
        i.center,
        i.dock,
        i.jetty,
        ...i.coast,
        ...i.tools.map((t) => t.point),
      ]) {
        p.x += dx;
        p.y += dy;
      }
    width = Math.max(700, ...xs.map((x) => x + dx + 220));
    height = Math.max(600, ...ys.map((y) => y + dy + 180));
  }
  const scene: AtlasScene = {
    islands,
    features: [],
    width,
    height,
    cols: Math.ceil(width / CELL),
    rows: Math.ceil(height / CELL),
    water: new Uint8Array(),
  };
  const rasterize = () => {
    scene.water = new Uint8Array(scene.cols * scene.rows);
    for (let n = 0; n < scene.water.length; n++)
      scene.water[n] = isWater(scene, {
        x: (n % scene.cols) * CELL,
        y: Math.floor(n / scene.cols) * CELL,
      })
        ? 1
        : 0;
  };
  rasterize();
  if (islands.length > 1) {
    for (const [id, name, x, y, color, animated] of seaFeatures) {
      const origin = { x: width * x, y: height * y };
      const candidates = Array.from({ length: 100 }, (_, n) => {
        const a = n * 2.39996,
          r = n ? 40 * Math.sqrt(n) : 0;
        return { x: origin.x + Math.cos(a) * r, y: origin.y + Math.sin(a) * r };
      });
      for (const center of candidates) {
        const radius = 65;
        if (
          center.x < 110 ||
          center.x > width - 110 ||
          center.y < 110 ||
          center.y > height - 110
        )
          continue;
        if (
          islands.some((i) =>
            [i.dock, ...i.tools.map((t) => t.point)].some(
              (p) => distance(p, center) < radius + 140,
            ),
          )
        )
          continue;
        if (scene.features.some((f) => distance(f.center, center) < 230))
          continue;
        if (
          !Array.from({ length: 16 }, (_, n) => ({
            x: center.x + Math.cos((n * Math.PI) / 8) * (radius + CELL),
            y: center.y + Math.sin((n * Math.PI) / 8) * (radius + CELL),
          })).every((p) => isWater(scene, p))
        )
          continue;
        scene.features.push({
          id,
          name,
          center,
          radius,
          color,
          animated,
          phase: hash(id) % 7,
        });
        const previous = scene.water.slice();
        for (
          let row = Math.max(
            0,
            Math.floor((center.y - radius - CLEARANCE) / CELL),
          );
          row <
          Math.min(
            scene.rows,
            Math.ceil((center.y + radius + CLEARANCE) / CELL),
          );
          row++
        )
          for (
            let col = Math.max(
              0,
              Math.floor((center.x - radius - CLEARANCE) / CELL),
            );
            col <
            Math.min(
              scene.cols,
              Math.ceil((center.x + radius + CLEARANCE) / CELL),
            );
            col++
          )
            if (
              distance({ x: col * CELL, y: row * CELL }, center) <
              radius + CLEARANCE
            )
              scene.water[row * scene.cols + col] = 0;
        if (connectedDocks(scene)) break;
        scene.features.pop();
        scene.water = previous;
      }
    }
    waterEdges.delete(scene);
  }
  return scene;
}
// One cardinal flood-fill verifies connectivity during authoring without running 9 A* searches.
function connectedDocks(scene: AtlasScene) {
  const cells = scene.islands.map(
    (i) =>
      Math.round(i.dock.y / CELL) * scene.cols + Math.round(i.dock.x / CELL),
  );
  if (cells.some((n) => !scene.water[n])) return false;
  const seen = new Uint8Array(scene.water.length),
    queue = new Int32Array(scene.water.length);
  let head = 0,
    tail = 1;
  queue[0] = cells[0];
  seen[cells[0]] = 1;
  while (head < tail) {
    const n = queue[head++],
      col = n % scene.cols;
    for (const next of [
      col ? n - 1 : -1,
      col < scene.cols - 1 ? n + 1 : -1,
      n - scene.cols,
      n + scene.cols,
    ])
      if (
        next >= 0 &&
        next < scene.water.length &&
        scene.water[next] &&
        !seen[next]
      ) {
        seen[next] = 1;
        queue[tail++] = next;
      }
  }
  return cells.every((n) => seen[n]);
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
    const cx = Math.round(p.x / CELL),
      cy = Math.round(p.y / CELL);
    for (
      let y = Math.max(0, cy - 3);
      y <= Math.min(scene.rows - 1, cy + 3);
      y++
    )
      for (
        let x = Math.max(0, cx - 3);
        x <= Math.min(scene.cols - 1, cx + 3);
        x++
      ) {
        const n = y * scene.cols + x;
        if (scene.water[n]) candidates.push({ n, d: distance(p, point(n)) });
      }
    if (!candidates.length) return -1;
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
  const open: { n: number; score: number }[] = [],
    closed = new Uint8Array(scene.water.length);
  const destination = point(last);
  const less = (
    a: { n: number; score: number },
    b: { n: number; score: number },
  ) => a.score < b.score || (a.score === b.score && a.n < b.n);
  const enqueue = (n: number, score: number) => {
    const item = { n, score };
    let index = open.length;
    open.push(item);
    while (index) {
      const parent = (index - 1) >> 1;
      if (!less(item, open[parent])) break;
      open[index] = open[parent];
      index = parent;
    }
    open[index] = item;
  };
  const dequeue = () => {
    const first = open[0],
      tail = open.pop()!;
    if (open.length) {
      let index = 0;
      while (index * 2 + 1 < open.length) {
        let child = index * 2 + 1;
        if (child + 1 < open.length && less(open[child + 1], open[child]))
          child++;
        if (!less(open[child], tail)) break;
        open[index] = open[child];
        index = child;
      }
      open[index] = tail;
    }
    return first.n;
  };
  costs[first] = 0;
  enqueue(first, distance(point(first), destination));
  while (open.length) {
    const current = dequeue();
    if (closed[current]) continue;
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
    closed[current] = 1;
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
          closed[n]
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
          enqueue(n, cost + distance(point(n), destination));
        }
      }
  }
  return null;
}
