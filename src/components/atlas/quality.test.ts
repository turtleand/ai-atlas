import { expect, it } from "vitest";
import { freshTiming, sampleQuality } from "./quality";

it("reduces sustained slow rendering before falling back to interaction-only frames", () => {
  const run = (fps: number, low: boolean) => {
    const timing = freshTiming();
    const decisions = [];
    for (let frame = 0; frame <= fps * 7; frame++) {
      const decision = sampleQuality(timing, 10000 + (frame * 1000) / fps, low);
      if (decision) decisions.push(decision);
    }
    return decisions;
  };
  expect(run(60, false)).toEqual([]);
  expect(run(30, false)).toEqual(["reduce"]);
  expect(run(30, true)).toEqual([]);
  expect(run(20, true)).toEqual(["pause"]);
});

it("excludes preparation time and recovers from a brief slow window", () => {
  const timing = freshTiming();
  expect(sampleQuality(timing, 15000, false)).toBeNull();
  let now = 15000;
  for (let n = 0; n < 60; n++)
    expect(sampleQuality(timing, (now += 50), false)).toBeNull();
  for (let n = 0; n < 600; n++)
    expect(sampleQuality(timing, (now += 1000 / 60), false)).toBeNull();
});
