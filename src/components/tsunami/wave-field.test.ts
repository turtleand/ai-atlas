import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createNavalModel } from './naval-models';
import {
  getSloopPose, getWaveHeight, SLOOP_HEADING, SLOOP_PITCH_LIMIT,
  SLOOP_ROLL_LIMIT, SLOOP_SCALE, WAVES, waveHeightGLSL,
} from './wave-field';

const up = new THREE.Vector3(0, 1, 0);

/** An independent time-domain integration of the actual five water samples. */
function integratedSupportNormal(time: number, intensity: number) {
  const anchors = [[0.43, 0], [-0.43, 0], [0, 1.15], [0, -1.15]].map(([x, z]) => (
    new THREE.Vector3(x, 0, z).multiplyScalar(SLOOP_SCALE).applyAxisAngle(up, SLOOP_HEADING)
  ));
  const dt = 1 / 1000;
  const response = 1 - Math.exp(-8 * dt);
  let sideSlope = 0;
  let bowSlope = 0;
  // Eight seconds removes the initial state to far below floating-point noise.
  for (let step = 0; step < 8000; step++) {
    const sampleTime = time - 8 + (step + 0.5) * dt;
    const heights = anchors.map(({ x, z }) => getWaveHeight(x, z, sampleTime, intensity));
    sideSlope += ((heights[0] - heights[1]) / anchors[0].distanceTo(anchors[1]) - sideSlope) * response;
    bowSlope += ((heights[2] - heights[3]) / anchors[2].distanceTo(anchors[3]) - bowSlope) * response;
  }
  return new THREE.Vector3(-sideSlope, 1, -bowSlope).normalize().applyAxisAngle(up, SLOOP_HEADING);
}

describe('shared water and deterministic sloop support', () => {
  it('returns the same pose after arbitrary tier/capture history and at different frame rates', () => {
    const times = [0, 0.125, 4.25, 13.75, 33.33, 59.875, 200 * Math.PI];
    const expected = times.map((time) => getSloopPose(time, 1.8));
    for (const frameRate of [30, 60, 120]) {
      for (let frame = 0; frame < frameRate * 2; frame++) getSloopPose(frame / frameRate, 0.5);
      getSloopPose(800, 2);
      getSloopPose(0, 0.5);
      expect(times.map((time) => getSloopPose(time, 1.8))).toEqual(expected);
    }
  });

  it('aligns the rendered YXZ plane to damped world-space samples at the actual heading and scale', () => {
    for (const time of [0, 2.75, 7.1, 16.4, 43.9, 59.75]) {
      // Low intensity keeps the physical comparison clear of the deliberate angle limits.
      const pose = getSloopPose(time, 0.5);
      const actualNormal = up.clone().applyEuler(new THREE.Euler(pose.x, pose.y, pose.z, 'YXZ'));
      expect(actualNormal.distanceTo(integratedSupportNormal(time, 0.5))).toBeLessThan(1e-6);
      expect(pose.height - getWaveHeight(0, 0, time, 0.5)).toBeCloseTo(0.14, 12);
    }
  });

  it('keeps the generated shader spectrum and calm-zone response consistent with CPU water height', () => {
    const shaderWaves = Array.from(waveHeightGLSL.matchAll(
      /height \+= ([\d.-]+) \* sin\(dot\(point, vec2\(([\d.-]+), ([\d.-]+)\)\) \* ([\d.-]+) \+ uTime \* ([\d.-]+)\);/g,
    )).map((match) => ({ amp: Number(match[1]), x: Number(match[2]), z: Number(match[3]), freq: Number(match[4]), speed: Number(match[5]) }));
    expect(shaderWaves).toEqual(WAVES);
    expect(waveHeightGLSL).toContain('mix(0.08, 1.0, smoothstep(0.0, uCalmRadius, length(point)))');
    expect(waveHeightGLSL).toContain('return height * uStormIntensity * attenuation;');
    for (const [x, z, time, intensity, calmRadius] of [
      [0, 0, 4.25, 0.5, 0], [1.4, -0.8, 19.2, 2, 0],
      [0, 0, 4.25, 2, 5], [1.4, -0.8, 19.2, 2, 5], [8, -7, 5.8, 1.2, 7],
    ]) {
      const radiusFraction = calmRadius > 0 ? Math.min(1, Math.hypot(x, z) / calmRadius) : 1;
      const attenuation = 0.08 + 0.92 * (radiusFraction ** 2 * (3 - 2 * radiusFraction));
      const shaderHeight = shaderWaves.reduce((height, wave) => (
        height + wave.amp * Math.sin((wave.x * x + wave.z * z) * wave.freq + time * wave.speed)
      ), 0) * intensity * attenuation;
      expect(getWaveHeight(x, z, time, intensity, calmRadius)).toBeCloseTo(shaderHeight, 12);
    }
  });

  it('keeps the actual authored deck, cockpit and keel clear of water through the full shared wave cycle', () => {
    const model = createNavalModel(2);
    expect(model.flotation).toBeDefined();
    const deck = model.flotation!.deckSamples.map((point) => new THREE.Vector3(...point));
    const keel = model.flotation!.keelSamples.map((point) => new THREE.Vector3(...point));
    const cockpit: THREE.Vector3[] = [];
    const centerHullHeights: number[] = [];
    const unique = new Set<string>();
    model.root.updateMatrixWorld(true);
    model.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.name.startsWith('continuous-sloop-construction')) return;
      const positions = object.geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const point = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
        const key = point.toArray().map((value) => value.toFixed(6)).join(',');
        if (unique.has(key)) continue;
        unique.add(key);
        if (Math.abs(point.z) < 1e-6 && Math.abs(point.x) < 0.45 && point.y > -0.35 && point.y < 0.4) centerHullHeights.push(point.y);
        // Real mesh vertices verify the recessed cockpit sole and the keel's
        // upper edge as well as the model's exported deck/bottom support points.
        if (Math.abs(point.x) < 0.28 && point.y > 0.03 && point.y < 0.09 && point.z > -1.02 && point.z < 0.22) cockpit.push(point);
        if (Math.abs(point.x) < 0.03 && point.y < -0.23 && point.z > -0.62 && point.z < 0.55) keel.push(point);
      }
    });
    expect(cockpit.length).toBeGreaterThan(8);
    expect(keel.length).toBeGreaterThan(8);
    const centerHullBottom = Math.min(...centerHullHeights);
    const centerHullTop = Math.max(...centerHullHeights);
    expect(centerHullTop - centerHullBottom).toBeGreaterThan(0.5);
    const carrier = new THREE.Group();
    carrier.scale.setScalar(SLOOP_SCALE);
    carrier.add(model.root);
    const world = new THREE.Vector3();
    let minimumDeck = Infinity;
    let minimumCockpit = Infinity;
    let highestKeel = -Infinity;
    let maximumPitch = 0;
    let maximumRoll = 0;
    let maximumAngularSpeed = 0;
    let minimumWaterlineFraction = Infinity;
    let maximumWaterlineFraction = -Infinity;
    let poseCount = 0;
    const sweep = (intensity: number, duration: number, interval: number) => {
      let previous = getSloopPose(0, intensity);
      for (let index = 0; index <= Math.ceil(duration / interval); index++) {
        const time = Math.min(duration, index * interval);
        const pose = getSloopPose(time, intensity);
        carrier.position.y = pose.height;
        carrier.rotation.set(pose.x, pose.y, pose.z, 'YXZ');
        carrier.updateMatrixWorld(true);
        const clearance = (point: THREE.Vector3) => {
          world.copy(point).applyMatrix4(model.root.matrixWorld);
          return world.y - getWaveHeight(world.x, world.z, time, intensity);
        };
        for (const point of deck) minimumDeck = Math.min(minimumDeck, clearance(point));
        for (const point of cockpit) minimumCockpit = Math.min(minimumCockpit, clearance(point));
        for (const point of keel) highestKeel = Math.max(highestKeel, clearance(point));
        if (index % 40 === 0) {
          // Intersect actual water with the model's tilted center column. This
          // checks draft against authored hull depth, not a second heave formula.
          let bottom = centerHullBottom;
          let top = centerHullTop;
          for (let iteration = 0; iteration < 20; iteration++) {
            const midpoint = (bottom + top) / 2;
            world.set(0, midpoint, 0).applyMatrix4(model.root.matrixWorld);
            if (world.y > getWaveHeight(world.x, world.z, time, intensity)) top = midpoint;
            else bottom = midpoint;
          }
          const fraction = ((bottom + top) / 2 - centerHullBottom) / (centerHullTop - centerHullBottom);
          minimumWaterlineFraction = Math.min(minimumWaterlineFraction, fraction);
          maximumWaterlineFraction = Math.max(maximumWaterlineFraction, fraction);
        }
        maximumPitch = Math.max(maximumPitch, Math.abs(pose.x));
        maximumRoll = Math.max(maximumRoll, Math.abs(pose.z));
        maximumAngularSpeed = Math.max(maximumAngularSpeed, Math.hypot(pose.x - previous.x, pose.z - previous.z) / interval);
        previous = pose;
        poseCount++;
      }
    };
    try {
      // Frequencies .42/.65/.85/1.1 have a common period of 200π seconds.
      for (const intensity of [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]) sweep(intensity, 200 * Math.PI, 0.1);
      // Dense ordinary/reduced-time samples expose snapping hidden by a contact sheet.
      for (const intensity of [0.5, 1.25, 2]) sweep(intensity, 60, 1 / 120);
      expect(minimumDeck, 'actual deck/gunwale clearance').toBeGreaterThan(0.04);
      expect(minimumCockpit, 'actual cockpit remains dry').toBeGreaterThan(0.03);
      expect(highestKeel, 'the whole sampled keel stays submerged').toBeLessThan(-0.025);
      expect(maximumPitch).toBeLessThanOrEqual(SLOOP_PITCH_LIMIT);
      expect(maximumRoll).toBeLessThanOrEqual(SLOOP_ROLL_LIMIT);
      expect(maximumAngularSpeed, 'smooth bounded pitch/roll response').toBeLessThan(0.2);
      expect(minimumWaterlineFraction, 'waterline stays near the lower third of the actual hull').toBeGreaterThan(0.25);
      expect(maximumWaterlineFraction).toBeLessThan(0.4);
      console.info('Sloop flotation sweep', {
        poseCount, minimumDeck, minimumCockpit, highestKeel, maximumAngularSpeed,
        minimumWaterlineFraction, maximumWaterlineFraction,
      });
    } finally {
      model.dispose();
    }
  }, 15_000); // The 65,598-pose sweep can exceed 5s when test workers share a busy host.
});
