// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { LightningHeadlines } from './LightningHeadlines';
import {
  createSeededRandom, getSceneCaptureOptions, useReducedMotion, useSceneCaptureOptions,
} from './scene-utils';

let osReducedMotion: boolean;
let media: EventTarget;

function address(url: string) {
  window.history.replaceState(null, '', url);
}

function changeHash(parameters: string) {
  act(() => {
    address(`${window.location.pathname}${window.location.search}${parameters ? `#${parameters}` : ''}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

function advance(milliseconds: number) {
  act(() => { vi.advanceTimersByTime(milliseconds); });
}

beforeEach(() => {
  vi.useFakeTimers();
  address('/tsunami');
  osReducedMotion = false;
  media = new EventTarget();
  Object.defineProperty(media, 'matches', { get: () => osReducedMotion });
  vi.stubGlobal('matchMedia', vi.fn(() => media));
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  address('/tsunami');
});

describe('deterministic scene capture controls', () => {
  it('reads query-only capture controls and gives hash values priority on initial load and hash changes', () => {
    address('/tsunami?capture=1&time=2&wave=30&angle=-1&zoom=1.2&reducedMotion=1');
    const { result } = renderHook(() => ({ options: useSceneCaptureOptions(), reduced: useReducedMotion() }));
    expect(result.current.options).toMatchObject({ time: 2, wavePercent: 30, angle: -1, zoom: 1.2 });
    expect(result.current.reduced).toBe(true);

    changeHash('time=9&wave=80&angle=1.4&zoom=1.8&reducedMotion=0');
    expect(result.current.options).toMatchObject({ time: 9, wavePercent: 80, angle: 1.4, zoom: 1.8 });
    expect(result.current.reduced).toBe(false);
    const fresh = renderHook(() => ({ options: useSceneCaptureOptions(), reduced: useReducedMotion() }));
    expect(fresh.result.current).toEqual(result.current);

    changeHash('time=3.5&wave=60&angle=-0.7&reducedMotion=1');
    expect(result.current.options).toMatchObject({ time: 3.5, wavePercent: 60, angle: -0.7, zoom: 1.2 });
    expect(result.current.reduced).toBe(true);
    changeHash('capture=0&reducedMotion=0');
    expect(result.current.options.time).toBeUndefined();
    expect(result.current.options.wavePercent).toBeUndefined();
    expect(result.current.reduced).toBe(false);
  });

  it('reproduces fixed capture options and seeded effects after unrelated capture history', () => {
    const fixture = '/tsunami?capture=1&time=2&wave=20#time=8.75&wave=64&days=500&angle=0.75&zoom=1.4&lighting=flash&quality=low';
    address(fixture);
    const first = getSceneCaptureOptions();
    const random = createSeededRandom(1492);
    const sequence = Array.from({ length: 64 }, () => random());
    address('/tsunami#capture=1&time=9000&wave=99&quality=high');
    getSceneCaptureOptions();
    const unrelated = createSeededRandom(888);
    Array.from({ length: 100 }, () => unrelated());
    address(fixture);
    expect(getSceneCaptureOptions()).toEqual(first);
    expect(first).toEqual({
      time: 8.75, wavePercent: 64, daysSinceStart: 500, angle: 0.75, zoom: 1.4,
      lighting: 'flash', lowQuality: true,
    });
    const fresh = createSeededRandom(1492);
    expect(Array.from({ length: 64 }, () => fresh())).toEqual(sequence);
    expect(sequence.every(value => value >= 0 && value < 1)).toBe(true);
  });

  it('uses safe defaults for invalid numbers and clamps finite values to supported capture bounds', () => {
    address('/tsunami#capture=1&time=NaN&wave=nope&days=Infinity&angle=-Infinity&zoom=Infinity&lighting=invalid');
    expect(getSceneCaptureOptions()).toEqual({
      time: 4.25, wavePercent: 52.2, daysSinceStart: 248, angle: 0, zoom: 1,
      lighting: 'scene', lowQuality: false,
    });
    address('/tsunami#capture=1&time=-10&wave=130&days=50000&angle=99&zoom=0.1');
    expect(getSceneCaptureOptions()).toMatchObject({ time: 0, wavePercent: 100, daysSinceStart: 10000, angle: Math.PI * 2, zoom: 0.5 });
    address('/tsunami#capture=1&time=20000&wave=-2&days=-1&angle=-99&zoom=99');
    expect(getSceneCaptureOptions()).toMatchObject({ time: 10000, wavePercent: 0, daysSinceStart: 0, angle: -Math.PI * 2, zoom: 2.5 });
    address('/tsunami#capture=0&time=2&wave=20&quality=low');
    expect(getSceneCaptureOptions()).toEqual({ zoom: 1, lighting: 'scene', lowQuality: true });
  });

  it('cannot disable an OS reduced-motion preference through query or hash overrides', () => {
    osReducedMotion = true;
    address('/tsunami?reducedMotion=1#reducedMotion=0');
    const { result } = renderHook(useReducedMotion);
    expect(result.current).toBe(true);
    changeHash('reducedMotion=0');
    expect(result.current).toBe(true);
    act(() => { osReducedMotion = false; media.dispatchEvent(new Event('change')); });
    expect(result.current).toBe(false);
    changeHash('reducedMotion=1');
    expect(result.current).toBe(true);
    act(() => { osReducedMotion = true; media.dispatchEvent(new Event('change')); });
    changeHash('reducedMotion=0');
    expect(result.current).toBe(true);
  });
});

describe('headlines during live and deterministic scene capture', () => {
  it('schedules no random headline timers for a fresh query-only capture', () => {
    address('/tsunami?capture=1&time=4.25');
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { container } = render(<LightningHeadlines />);
    expect(vi.getTimerCount()).toBe(0);
    advance(60000);
    expect(container.querySelector('.lightning-headline')).toBeNull();
    expect(random).not.toHaveBeenCalled();
  });

  it('removes an already visible headline and cancels fade, hide and random scheduling on hash capture entry', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { container } = render(<LightningHeadlines />);
    advance(1500);
    expect(container.textContent).toContain('AI is replacing entire industries');
    expect(container.querySelector('.lightning-headline--visible')).not.toBeNull();
    expect(vi.getTimerCount()).toBe(3);
    expect(random).toHaveBeenCalledTimes(1);
    changeHash('capture=1&time=7.5');
    expect(container.querySelector('.lightning-headline')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    advance(60000);
    expect(container.querySelector('.lightning-headline')).toBeNull();
    expect(random).toHaveBeenCalledTimes(1);
    changeHash('capture=1&time=8.25');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('restores the normal delayed headline cycle when leaving capture, without reviving a stale headline', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { container, unmount } = render(<LightningHeadlines />);
    advance(1500);
    expect(container.querySelector('.lightning-headline')).not.toBeNull();
    changeHash('capture=1&time=4.25');
    advance(30000);
    changeHash('capture=0');
    expect(container.querySelector('.lightning-headline')).toBeNull();
    expect(vi.getTimerCount()).toBe(1);
    advance(1499);
    expect(container.querySelector('.lightning-headline')).toBeNull();
    advance(1);
    expect(container.querySelector('.lightning-headline--visible')).not.toBeNull();
    advance(1400);
    expect(container.querySelector('.lightning-headline--fading')).not.toBeNull();
    advance(400);
    expect(container.querySelector('.lightning-headline')).toBeNull();
    advance(2700);
    expect(container.querySelector('.lightning-headline--visible')).not.toBeNull();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
