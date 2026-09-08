import {
  distance,
  findWaterPath,
  type AtlasScene,
  type Point,
} from "./atlas-model";
export type JourneyPhase = "depart" | "swim" | "approach" | "visit";
export interface Journey {
  position: Point;
  heading: number;
  time: number;
  phase: JourneyPhase;
  destination: string | null;
  path: Point[];
  wake: (Point & { t: number })[];
  lengths: number[];
  length: number;
  traveled: number;
  visitTime: number;
  nextIndex: number;
}
export function createJourney(scene: AtlasScene): Journey {
  const first = scene.islands[0];
  return {
    position: first
      ? { ...first.dock }
      : { x: scene.width / 2, y: scene.height / 2 },
    heading: Math.PI,
    time: 0,
    phase: "visit",
    destination: first?.id ?? null,
    path: [],
    wake: [],
    lengths: [],
    length: 0,
    traveled: 0,
    visitTime: 0,
    nextIndex: 1,
  };
}
export function redirectJourney(
  scene: AtlasScene,
  journey: Journey,
  id: string,
  instant = false,
) {
  const island = scene.islands.find((i) => i.id === id);
  if (!island) return false;
  if (instant) {
    journey.position = { ...island.dock };
    journey.destination = id;
    journey.phase = "visit";
    journey.path = [];
    journey.wake = [];
    journey.visitTime = 0;
    journey.heading = Math.atan2(
      island.center.y - island.dock.y,
      island.center.x - island.dock.x,
    );
    return true;
  }
  const path = findWaterPath(scene, journey.position, island.dock);
  if (!path) return false;
  journey.destination = id;
  journey.path = path;
  journey.lengths = [0];
  for (let i = 1; i < path.length; i++)
    journey.lengths.push(
      journey.lengths[i - 1] + distance(path[i - 1], path[i]),
    );
  journey.length = journey.lengths.at(-1) ?? 0;
  journey.traveled = 0;
  journey.phase = "depart";
  journey.visitTime = 0;
  return true;
}
export function advanceJourney(scene: AtlasScene, j: Journey, elapsed: number) {
  // Fixed simulation steps give identical travel at 30/60/120Hz. Visibility is handled by the owner.
  let remaining = Math.min(0.1, Math.max(0, elapsed));
  while (remaining > 1e-8) {
    const dt = Math.min(1 / 120, remaining);
    remaining -= dt;
    j.time += dt;
    while (j.wake.length && j.time - j.wake[0].t > 2.5) j.wake.shift();
    if (scene.islands.length < 2) continue;
    if (j.phase === "visit") {
      j.visitTime += dt;
      const island = scene.islands.find((i) => i.id === j.destination);
      if (island)
        turn(
          j,
          Math.atan2(
            island.center.y - j.position.y,
            island.center.x - j.position.x,
          ),
          dt,
        );
      if (j.visitTime >= 2) {
        let next = scene.islands[j.nextIndex++ % scene.islands.length];
        if (next.id === j.destination)
          next = scene.islands[j.nextIndex++ % scene.islands.length];
        if (!redirectJourney(scene, j, next.id)) j.visitTime = 0;
      }
      continue;
    }
    const left = j.length - j.traveled;
    const speed = 88 * Math.min(1, 0.32 + j.traveled / 90, 0.23 + left / 100);
    j.traveled = Math.min(j.length, j.traveled + speed * dt);
    j.phase = left < 85 ? "approach" : j.traveled < 65 ? "depart" : "swim";
    let k = 1;
    while (k < j.lengths.length - 1 && j.lengths[k] < j.traveled) k++;
    const a = j.path[k - 1],
      b = j.path[k];
    if (!a || !b || j.traveled >= j.length) {
      j.phase = "visit";
      j.visitTime = 0;
      if (b) j.position = { ...b };
      continue;
    }
    const t =
      (j.traveled - j.lengths[k - 1]) / (j.lengths[k] - j.lengths[k - 1] || 1);
    j.position = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    turn(j, Math.atan2(b.y - a.y, b.x - a.x), dt);
    if (!j.wake.length || j.time - j.wake.at(-1)!.t >= 0.12) {
      j.wake.push({ ...j.position, t: j.time });
      if (j.wake.length > 22) j.wake.shift();
    }
  }
}
function turn(j: Journey, angle: number, dt: number) {
  const difference = Math.atan2(
    Math.sin(angle - j.heading),
    Math.cos(angle - j.heading),
  );
  j.heading += difference * (1 - Math.exp(-dt * 5));
}
