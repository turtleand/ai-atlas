import { describe, expect, it } from "vitest";
import { parseToolsYaml } from "../../utils/parseTools";
import data from "../../data/ai-tools.yaml?raw";
import {
  createScene,
  clearSegment,
  findWaterPath,
  isWater,
  distance,
} from "./atlas-model";
import {
  advanceJourney,
  createJourney,
  redirectJourney,
  CRUISE_SPEED,
} from "./journey";
import { buildSeaGeometry } from "./atlas-sea-geometry";
import { MeshLambertMaterial } from "three";
import {
  buildAtlasGeometry,
  buildTurtle,
  focusIslandGeometry,
} from "./atlas-geometry";
const categories = parseToolsYaml(data);
const scene = createScene(categories);
describe("living archipelago geography", () => {
  it("uses stable catalog identities and deterministic, safe docking points", () => {
    expect(createScene(categories)).toEqual(scene);
    expect(scene.islands.map((i) => i.id)).toEqual(categories.map((c) => c.id));
    for (const i of scene.islands)
      expect(isWater(scene, i.dock), i.id).toBe(true);
  });
  it("connects every pair by collision-checked water paths", () => {
    for (const a of scene.islands)
      for (const b of scene.islands) {
        const path = findWaterPath(scene, a.dock, b.dock);
        expect(path, `${a.id} to ${b.id}`).not.toBeNull();
        expect(path![0]).toEqual(a.dock);
        expect(path!.at(-1)).toEqual(b.dock);
        for (let n = 1; n < path!.length; n++)
          expect(clearSegment(scene, path![n - 1], path![n])).toBe(true);
      }
  });
  it("keeps seven deterministic sea features clear of docks and blocks their territory", () => {
    expect(scene.features).toHaveLength(7);
    expect(createScene([...categories].reverse()).features).toEqual(
      scene.features,
    );
    for (const f of scene.features) {
      expect(isWater(scene, f.center), f.name).toBe(false);
      for (const i of scene.islands)
        expect(distance(f.center, i.dock)).toBeGreaterThan(f.radius + 140);
      expect(findWaterPath(scene, f.center, scene.islands[0].dock)).toBeNull();
    }
    expect(createScene([]).features).toHaveLength(0);
    expect(createScene(categories.slice(0, 1)).features).toHaveLength(0);
  });
  it("rejects paths through land and handles empty and single-island scenes", () => {
    expect(
      findWaterPath(scene, scene.islands[0].center, scene.islands[1].dock),
    ).toBeNull();
    for (const cats of [[], categories.slice(0, 1)]) {
      const model = createScene(cats),
        j = createJourney(model),
        before = { ...j.position };
      for (let n = 0; n < 300; n++) advanceJourney(model, j, 1 / 60);
      expect(j.position).toEqual(before);
    }
  });
});
describe("turtle journey continuity", () => {
  it("crosses phases, stays in water, visits the destination, and never teleports", () => {
    const j = createJourney(scene);
    redirectJourney(scene, j, scene.islands[4].id);
    const phases = new Set<string>();
    let arrived = false;
    for (let n = 0; n < 6000; n++) {
      const before = { ...j.position };
      advanceJourney(scene, j, 1 / 60);
      phases.add(j.phase);
      expect(isWater(scene, j.position)).toBe(true);
      expect(distance(before, j.position)).toBeLessThanOrEqual(
        CRUISE_SPEED / 60 + 0.001,
      );
      if (j.phase === "visit") {
        arrived = true;
        break;
      }
    }
    expect(arrived).toBe(true);
    expect(phases).toEqual(new Set(["depart", "swim", "approach", "visit"]));
  });
  it("keeps the current pose during rapid redirection and uses the latest target", () => {
    const j = createJourney(scene);
    redirectJourney(scene, j, scene.islands[4].id);
    for (let n = 0; n < 300; n++) advanceJourney(scene, j, 1 / 60);
    const position = { ...j.position },
      heading = j.heading;
    for (const i of [2, 7, 3]) {
      expect(redirectJourney(scene, j, scene.islands[i].id)).toBe(true);
      expect(j.position).toEqual(position);
      expect(j.heading).toBe(heading);
    }
    expect(j.destination).toBe(scene.islands[3].id);
  });
  it("uses time-based motion and leaves a safe static pose for reduced motion", () => {
    const poses = [30, 60, 120].map((rate) => {
      const j = createJourney(scene);
      redirectJourney(scene, j, scene.islands[5].id);
      for (let n = 0; n < rate * 6; n++) advanceJourney(scene, j, 1 / rate);
      return j;
    });
    for (const j of poses)
      expect(distance(j.position, poses[0].position)).toBeLessThan(0.001);
    const j = poses[0];
    redirectJourney(scene, j, scene.islands[8].id, true);
    expect(j.position).toEqual(scene.islands[8].dock);
    expect(j.phase).toBe("visit");
  });
});
describe("procedural asset budgets", () => {
  it("focuses only the requested terrain while retaining complete geometry in at most three draws", () => {
    const art = buildAtlasGeometry(scene);
    for (const selected of [null, ...scene.islands.map((i) => i.id)]) {
      focusIslandGeometry(art.terrain, art.islandRanges, selected);
      expect(art.terrain.groups.length).toBeLessThanOrEqual(3);
      let end = 0;
      for (const group of art.terrain.groups) {
        expect(group.start).toBe(end);
        end += group.count;
      }
      expect(end).toBe(art.terrain.getAttribute("position").count);
      const active = art.terrain.groups.filter((g) => g.materialIndex === 1);
      expect(active).toHaveLength(selected ? 1 : 0);
      if (selected) {
        const range = art.islandRanges.find((r) => r.id === selected)!;
        expect(active[0].start).toBe(range.start);
        expect(active[0].count).toBe(range.count);
      }
    }
    art.terrain.dispose();
  });
  it("keeps geometry finite, deterministic, and within the scene triangle allowance", () => {
    const a = buildAtlasGeometry(scene),
      b = buildAtlasGeometry(scene),
      turtle = buildTurtle();
    expect(a.terrain.getAttribute("position").array).toEqual(
      b.terrain.getAttribute("position").array,
    );
    let triangles =
      a.terrain.getAttribute("position").count / 3 +
      a.trees.length * (20 + 4 * 24);
    turtle.root.traverse((obj) => {
      if ("geometry" in obj) {
        const g = (obj as import("three").Mesh).geometry;
        triangles += (g.index?.count ?? g.getAttribute("position").count) / 3;
      }
    });
    const material = new MeshLambertMaterial({ vertexColors: true }),
      sea = buildSeaGeometry(scene, material);
    expect(sea.roots).toHaveLength(7);
    for (const mesh of sea.roots) {
      triangles += mesh.geometry.getAttribute("position").count / 3;
      expect(
        [...mesh.geometry.getAttribute("position").array].every(
          Number.isFinite,
        ),
      ).toBe(true);
    }
    sea.dispose();
    material.dispose();
    expect(triangles).toBeLessThan(35000);
    expect(
      [...a.terrain.getAttribute("position").array].every(Number.isFinite),
    ).toBe(true);
    expect(turtle.paddles).toHaveLength(4);
    a.terrain.dispose();
    b.terrain.dispose();
    turtle.dispose();
  });
});
