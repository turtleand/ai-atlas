import type { AtlasScene, Point } from "./atlas-model";
import { projection, type AtlasView } from "./useAtlas";

// Feature distinct uses from the journal on each shore. The catalog remains
// the source of every tool's name, description and usage notes.
const featuredToolIds: Record<string, readonly string[]> = {
  chatbot: ["chatgpt", "sesame"],
  images: ["nano-banana", "recraft"],
  "video-generation": ["veo-3"],
  code: ["claude-code", "sourcegraph-deepsearch"],
  research: ["perplexity-comet", "chatgpt-deep-search"],
  education: ["notebooklm", "gamma"],
  "local-infrastructure": ["llama-cpp", "hugging-face"],
  agents: ["hermes-agent"],
  voice: ["elevenlabs"],
  "auxiliary-tools": ["ntfy"],
};

type Rect = Point & { w: number; h: number };
type Connection = { anchor: Point; end: Point };
const placementOrder = Object.keys(featuredToolIds);
const phoneOrder = [
  "video-generation",
  "chatbot",
  "auxiliary-tools",
  "code",
  "local-infrastructure",
  "education",
  "images",
  "agents",
  "voice",
  "research",
];
const phoneSides: Record<string, "north" | "west" | "south" | "east"> = {
  chatbot: "west",
  images: "north",
  "video-generation": "north",
  research: "south",
  agents: "east",
  voice: "east",
};
const shifts = [0, -18, 18, -36, 36, -54, 54, -72, 72, -96, 96];

function textWidth(name: string, fontSize: number) {
  return Array.from(name).reduce((width, char) => {
    const weight = /[ .ijlItfr]/.test(char)
      ? 0.39
      : /[MWQGm&]/.test(char)
        ? 0.85
        : 0.61;
    return width + fontSize * weight;
  }, 0);
}

function areaOverlap(a: Rect, b: Rect, gap = 0) {
  const x =
    Math.min(a.x + a.w / 2, b.x + b.w / 2 + gap) -
    Math.max(a.x - a.w / 2, b.x - b.w / 2 - gap);
  const y =
    Math.min(a.y + a.h / 2, b.y + b.h / 2 + gap) -
    Math.max(a.y - a.h / 2, b.y - b.h / 2 - gap);
  return Math.max(0, x) * Math.max(0, y);
}

function shoreConnection(rect: Rect, coast: Point[]): Connection {
  const edge = (point: Point) => ({
    x: Math.max(rect.x - rect.w / 2, Math.min(rect.x + rect.w / 2, point.x)),
    y: Math.max(rect.y - rect.h / 2, Math.min(rect.y + rect.h / 2, point.y)),
  });
  let anchor = coast[0],
    end = edge(anchor),
    nearest = Infinity;
  for (const point of coast) {
    const contact = edge(point);
    const distance = (contact.x - point.x) ** 2 + (contact.y - point.y) ** 2;
    if (distance < nearest) {
      anchor = point;
      end = contact;
      nearest = distance;
    }
  }
  return { anchor, end };
}

function coversConnection(rect: Rect, { anchor, end }: Connection) {
  for (let step = 1; step < 8; step++) {
    const x = anchor.x + ((end.x - anchor.x) * step) / 8;
    const y = anchor.y + ((end.y - anchor.y) * step) / 8;
    if (Math.abs(x - rect.x) < rect.w / 2 && Math.abs(y - rect.y) < rect.h / 2)
      return true;
  }
  return false;
}

export function shoreSignpostLayout(
  scene: AtlasScene,
  frame: AtlasView,
  depth: boolean,
  compact: boolean,
  experimentalFallback?: ReadonlySet<string>,
) {
  if (frame.width < 80 || frame.height < 54) return [];
  const shores = scene.islands.map((island) => {
    const coast = island.coast.map((point) => projection(point, frame, depth));
    const left = Math.min(...coast.map((point) => point.x)),
      right = Math.max(...coast.map((point) => point.x)),
      top = Math.min(...coast.map((point) => point.y)),
      bottom = Math.max(...coast.map((point) => point.y));
    return {
      island,
      coast,
      bounds: {
        x: (left + right) / 2,
        y: (top + bottom) / 2,
        w: right - left,
        h: bottom - top,
      },
    };
  });
  const placed: (Rect & Connection)[] = [];
  const priority = compact ? phoneOrder : placementOrder;
  const ordered = [...shores].sort(
    (a, b) =>
      priority.indexOf(a.island.id) - priority.indexOf(b.island.id) ||
      a.island.id.localeCompare(b.island.id),
  );
  const signs = ordered.map(({ island, coast, bounds }) => {
    const toolLimit = compact ? 1 : 2;
    let tools = island.category.tools.slice(0, toolLimit);
    if (!experimentalFallback) {
      const featured = (featuredToolIds[island.id] ?? []).flatMap((id) => {
        const tool = island.category.tools.find((entry) => entry.id === id);
        return tool ? [tool] : [];
      });
      tools = featured.length ? featured.slice(0, toolLimit) : tools.slice(0, 1);
    }
    const showStatus = experimentalFallback?.has(island.id);
    const titleSize = compact ? 9.5 : 10.5;
    const toolSize = compact ? 11 : 12;
    const titlePadding = compact ? 28 : 42;
    const toolPadding = compact ? 17 : 36;
    const textWidths = [
      textWidth(island.category.name, titleSize) + titlePadding,
      ...tools.map((tool) => textWidth(tool.name, toolSize) + toolPadding),
      ...(showStatus ? [textWidth("Experimental", 10) + 18] : []),
    ];
    const w = Math.min(
      compact ? 142 : 220,
      frame.width - 12,
      Math.max(compact ? 63 : 98, ...textWidths),
    );
    const h =
      (compact ? 20 : 24) +
      tools.length * 24 +
      (showStatus ? 18 : 0) +
      4 +
      textWidths.filter((width) => width > w).length * 12;
    const xMin = w / 2 + 6,
      xMax = frame.width - xMin,
      yMin = h / 2 + 5,
      yMax = frame.height - yMin;
    const bound = (x: number, y: number) => ({
      x: Math.min(xMax, Math.max(xMin, x)),
      y: Math.min(yMax, Math.max(yMin, y)),
      w,
      h,
    });
    const { x, y } = bounds;
    const spreadX = (bounds.w + w) / 2 + 5;
    const spreadY = (bounds.h + h) / 2 + 5;
    const preferred = {
      north: { x, y: y - spreadY },
      west: { x: x - spreadX, y },
      east: { x: x + spreadX, y },
      south: { x, y: y + spreadY },
    }[
      compact
        ? (phoneSides[island.id] ?? "south")
        : island.id === "video-generation"
          ? "north"
          : "south"
    ];
    const score = (rect: Rect) => {
      const land = shores.reduce(
        (area, shore) =>
          area +
          areaOverlap(rect, shore.bounds, 3) +
          areaOverlap(rect, {
            ...shore.bounds,
            w: shore.bounds.w * 0.5,
            h: shore.bounds.h * 0.6,
          }) *
            10,
        0,
      );
      const gapX = Math.max(0, Math.abs(rect.x - x) - (bounds.w + w) / 2);
      const gapY = Math.max(0, Math.abs(rect.y - y) - (bounds.h + h) / 2);
      return (
        land * (compact ? 0.55 : 4) +
        Math.hypot(rect.x - preferred.x, rect.y - preferred.y) *
          (compact ? 0.65 : 1) +
        Math.hypot(gapX, gapY) * 4
      );
    };
    let best: (Rect & Connection) | undefined;
    let bestScore = Infinity;
    const consider = (rect: Rect) => {
      if (placed.some((other) => areaOverlap(rect, other, 4) > 0)) return;
      const position = { ...rect, ...shoreConnection(rect, coast) };
      let cost = score(rect);
      if (compact) {
        const stemLength = Math.hypot(
          position.anchor.x - position.end.x,
          position.anchor.y - position.end.y,
        );
        const obscured = placed.some(
          (other) =>
            coversConnection(rect, other) || coversConnection(other, position),
        );
        cost += stemLength * 2 + (obscured ? 400 : 0);
      }
      if (cost < bestScore) {
        best = position;
        bestScore = cost;
      }
    };

    for (const shift of shifts) {
      consider(bound(x + shift, y + spreadY));
      consider(bound(x + shift, y - spreadY));
      consider(bound(x - spreadX, y + shift));
      consider(bound(x + spreadX, y + shift));
    }
    // In a crowded viewport use the nearest remaining pocket of water.
    if (!best || bestScore > 180) {
      const stride = compact ? 7 : 12;
      const searchLeft = Math.max(xMin, x - 180);
      const searchRight = Math.min(xMax, x + 180);
      const searchTop = Math.max(yMin, y - 175);
      const searchBottom = Math.min(yMax, y + 175);
      for (let py = searchTop; py <= searchBottom; py += stride)
        for (let px = searchLeft; px <= searchRight; px += stride)
          consider({ x: px, y: py, w, h });
    }
    const fallback = bound(preferred.x, preferred.y);
    const position = best ?? {
      ...fallback,
      ...shoreConnection(fallback, coast),
    };
    placed.push(position);
    return { ...position, island, tools };
  });
  // Keep keyboard reading order aligned with the directory and catalog.
  return scene.islands.flatMap((island) =>
    signs.filter((sign) => sign.island === island),
  );
}
