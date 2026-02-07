import type { Category } from './parseTools.ts';

export interface BeaconPosition {
  x: number;
  y: number;
  tool: { id: string; name: string; url: string; description: string };
}

export interface IslandLayout {
  category: Category;
  cx: number;
  cy: number;
  radius: number;
  beacons: BeaconPosition[];
  color: string;
  colorDark: string;
  shapePoints: Array<{ x: number; y: number }>;
}

export interface MapLayout {
  islands: IslandLayout[];
  width: number;
  height: number;
  routes: Array<{ from: IslandLayout; to: IslandLayout }>;
}

// Deterministic hash from string → number
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Seeded pseudo-random number generator
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

const CATEGORY_COLORS: Record<string, [string, string]> = {
  'chatbot': ['#D4A03A', '#8B6914'],
  'images': ['#9B59B6', '#6C3483'],
  'video-generation': ['#5B6DAD', '#2C3E6B'],
  'code': ['#27AE60', '#1A7A42'],
  'education': ['#E8A838', '#A67C2E'],
  'research': ['#2E86C1', '#1B4F72'],
  'local---infrastructure': ['#E74C3C', '#922B21'],
  'general': ['#95A5A6', '#7F8C8D'],
};

const EXTRA_COLORS: Array<[string, string]> = [
  ['#E67E22', '#A04000'],
  ['#1ABC9C', '#117864'],
  ['#F39C12', '#B7950B'],
  ['#3498DB', '#21618C'],
  ['#E91E63', '#AD1457'],
  ['#00BCD4', '#00838F'],
];

function getCategoryColors(categoryId: string, index: number): [string, string] {
  if (CATEGORY_COLORS[categoryId]) return CATEGORY_COLORS[categoryId];
  return EXTRA_COLORS[index % EXTRA_COLORS.length];
}

// Generate organic blob shape points
function generateBlobShape(
  cx: number,
  cy: number,
  radius: number,
  seed: number,
  numPoints: number = 16,
): Array<{ x: number; y: number }> {
  const rng = seededRandom(seed);
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const variation = 0.75 + rng() * 0.5; // 0.75 to 1.25
    const r = radius * variation;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }

  return points;
}

// Position beacons within an island
function positionBeacons(
  cx: number,
  cy: number,
  radius: number,
  tools: Category['tools'],
): BeaconPosition[] {
  if (tools.length === 0) return [];

  if (tools.length === 1) {
    return [{ x: cx, y: cy, tool: tools[0] }];
  }

  const innerRadius = radius * 0.5;
  return tools.map((tool, i) => {
    const angle = (i / tools.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * innerRadius,
      y: cy + Math.sin(angle) * innerRadius,
      tool,
    };
  });
}

export function computeLayout(categories: Category[]): MapLayout {
  const numIslands = categories.length;
  if (numIslands === 0) {
    return { islands: [], width: 2400, height: 1600, routes: [] };
  }

  const mapCx = 1200;
  const mapCy = 800;
  const baseOrbitRadius = 520;
  const baseIslandRadius = 90;
  const radiusPerTool = 20;
  const minIslandRadius = 85;
  const maxIslandRadius = 200;

  const islands: IslandLayout[] = categories.map((cat, i) => {
    const hash = hashString(cat.name);
    const angleStep = (Math.PI * 2) / numIslands;
    const angle = angleStep * i - Math.PI / 2;

    // Deterministic radius variation
    const radiusOffset = ((hash % 100) / 100) * 100 - 50;
    const orbitRadius = baseOrbitRadius + radiusOffset;

    const cx = mapCx + Math.cos(angle) * orbitRadius;
    const cy = mapCy + Math.sin(angle) * orbitRadius;

    const rawRadius = baseIslandRadius + cat.tools.length * radiusPerTool;
    const radius = Math.max(minIslandRadius, Math.min(maxIslandRadius, rawRadius));

    const [color, colorDark] = getCategoryColors(cat.id, i);

    const shapePoints = generateBlobShape(cx, cy, radius, hash);
    const beacons = positionBeacons(cx, cy, radius, cat.tools);

    return { category: cat, cx, cy, radius, beacons, color, colorDark, shapePoints };
  });

  // Compute sailing routes: connect each island to its 5 nearest neighbors
  const routes: MapLayout['routes'] = [];
  const routeSet = new Set<string>();

  for (const island of islands) {
    const sorted = [...islands]
      .filter(other => other !== island)
      .sort((a, b) => {
        const da = Math.hypot(a.cx - island.cx, a.cy - island.cy);
        const db = Math.hypot(b.cx - island.cx, b.cy - island.cy);
        return da - db;
      });

    for (const neighbor of sorted.slice(0, 5)) {
      const key = [island.category.id, neighbor.category.id].sort().join('::');
      if (!routeSet.has(key)) {
        routeSet.add(key);
        routes.push({ from: island, to: neighbor });
      }
    }
  }

  return { islands, width: 2400, height: 1600, routes };
}

// Convert blob shape points to a smooth SVG path using cubic bezier curves
export function shapeToPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 3) return '';

  const n = points.length;
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  d += ' Z';
  return d;
}
