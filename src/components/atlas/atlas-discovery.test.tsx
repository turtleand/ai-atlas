import { describe, it, expect } from "vitest";
import { parseToolsYaml } from "../../utils/parseTools";
import data from "../../data/ai-tools.yaml?raw";
import {
  createScene,
  isWater,
  findWaterPath,
  clearSegment,
} from "./atlas-model";
import { discoveryLayout } from "./AtlasDiscovery";
import { fitScene, revealIsland } from "./atlas-camera";
import { shoreSignpostLayout } from "./shore-signposts";
import { projection } from "./useAtlas";
const categories = parseToolsYaml(data);
const scene = createScene(categories);
describe("organic discovery", () => {
  it("keeps every authored footprint and tool anchor stable across catalog order", () => {
    const reversed = createScene([...categories].reverse());
    for (const i of scene.islands)
      expect(reversed.islands.find((j) => j.id === i.id)).toEqual(i);
    expect(scene.islands.flatMap((i) => i.tools)).toHaveLength(29);
    const extra = { id: "new-space", name: "New space", tools: [] };
    expect(createScene([...categories, extra])).toEqual(
      createScene([...categories, extra]),
    );
  });
  it("keeps all 81 docking routes collision free after rotating shores", () => {
    for (const a of scene.islands) {
      expect(isWater(scene, a.dock), a.id).toBe(true);
      for (const b of scene.islands) {
        const route = findWaterPath(scene, a.dock, b.dock);
        expect(route, `${a.id} -> ${b.id}`).not.toBeNull();
        for (let n = 1; n < route!.length; n++)
          expect(clearSegment(scene, route![n - 1], route![n])).toBe(true);
      }
    }
  });
  it.each([
    [1424, 612],
    [1214, 612],
    [1008, 480],
    [832, 512],
  ])("places all names without overlap at %sx%s", (width, height) => {
    const view = fitScene(scene, width, height);
    const labels = discoveryLayout(scene, view, false, true);
    expect(labels.filter((l) => l.tool)).toHaveLength(29);
    for (const [n, a] of labels.entries()) {
      expect(a.x - a.w / 2, a.key).toBeGreaterThanOrEqual(0);
      expect(a.x + a.w / 2, a.key).toBeLessThanOrEqual(width);
      expect(a.y - a.h / 2, a.key).toBeGreaterThanOrEqual(0);
      expect(a.y + a.h / 2, a.key).toBeLessThanOrEqual(height);
      for (const b of labels.slice(n + 1))
        expect(
          Math.abs(a.x - b.x) >= (a.w + b.w) / 2 ||
            Math.abs(a.y - b.y) >= (a.h + b.h) / 2,
          `${a.key} overlaps ${b.key}`,
        ).toBe(true);
    }
  });
  it("keeps all category captions inside the phone overview", () => {
    for (const [width, height] of [
      [374, 250],
      [374, 500],
      [828, 180],
    ]) {
      const view = fitScene(scene, width, height);
      const labels = discoveryLayout(scene, view, false, false, false);
      expect(labels).toHaveLength(9);
      for (const island of scene.islands)
        for (const point of island.coast) {
          const { x, y } = projection(point, view);
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(width);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(height);
        }
      for (const [n, label] of labels.entries()) {
        for (const other of labels.slice(n + 1))
          expect(
            Math.abs(label.x - other.x) >= (label.w + other.w) / 2 ||
              Math.abs(label.y - other.y) >= (label.h + other.h) / 2,
            `${label.key} and ${other.key}`,
          ).toBe(true);
        expect(label.x - label.w / 2, label.key).toBeGreaterThanOrEqual(0);
        expect(label.x + label.w / 2, label.key).toBeLessThanOrEqual(width);
        expect(label.y - label.h / 2, label.key).toBeGreaterThanOrEqual(0);
        expect(label.y + label.h / 2, label.key).toBeLessThanOrEqual(height);
      }
    }
  });
  it.each([
    [1118, 630, false, false, 15],
    [1118, 630, true, false, 15],
    [390, 335, false, true, 9],
    [320, 307, false, true, 9],
    [320, 270, false, true, 9],
  ])(
    "fits the featured signposts at %sx%s with depth %s",
    (width, height, depth, compact, count) => {
      const signs = shoreSignpostLayout(
        scene,
        fitScene(scene, width, height),
        depth,
        compact,
      );
      expect(signs.flatMap((sign) => sign.tools)).toHaveLength(count);
      expect(
        signs
          .find((sign) => sign.island.id === "images")
          ?.tools.map((tool) => tool.id),
      ).toEqual(compact ? ["nano-banana"] : ["nano-banana", "recraft"]);
      for (const [index, sign] of signs.entries()) {
        expect(sign.x - sign.w / 2).toBeGreaterThanOrEqual(0);
        expect(sign.x + sign.w / 2).toBeLessThanOrEqual(width);
        expect(sign.y - sign.h / 2).toBeGreaterThanOrEqual(0);
        expect(sign.y + sign.h / 2).toBeLessThanOrEqual(height);
        for (const other of signs.slice(index + 1))
          expect(
            Math.abs(sign.x - other.x) >= (sign.w + other.w) / 2 ||
              Math.abs(sign.y - other.y) >= (sign.h + other.h) / 2,
            `${sign.island.id} overlaps ${other.island.id}`,
          ).toBe(true);
      }
    },
  );
  it("keeps visible selections still and pans clipped coastlines without zoom", () => {
    const overview = fitScene(scene, 1200, 700);
    expect(revealIsland(overview, scene.islands[0], false)).toEqual(
      overview.center,
    );
    const manual = { ...overview, zoom: 0.8, center: { x: 0, y: 0 } };
    const center = revealIsland(manual, scene.islands[0], false);
    expect(center).not.toEqual(manual.center);
    expect(
      revealIsland({ ...manual, center }, scene.islands[0], false),
    ).toEqual(center);
  });
});
