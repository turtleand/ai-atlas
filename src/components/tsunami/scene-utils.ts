import { useEffect, useState } from 'react';

export function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function captureParameters() {
  const params = new URLSearchParams(window.location.search);
  new URLSearchParams(window.location.hash.slice(1)).forEach((value,key) => params.set(key,value));
  return params;
}

function readReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    (import.meta.env.DEV && captureParameters().get('reducedMotion') === '1');
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(readReducedMotion());
    update();
    media.addEventListener('change', update);
    if (import.meta.env.DEV) window.addEventListener('hashchange', update);
    return () => { media.removeEventListener('change', update); window.removeEventListener('hashchange', update); };
  }, []);
  return reducedMotion;
}

export function usePageVisible() {
  const [isVisible, setIsVisible] = useState(() => document.visibilityState !== 'hidden');

  useEffect(() => {
    const update = () => setIsVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return isVisible;
}


export interface SceneCaptureOptions {
  time?: number;
  wavePercent?: number;
  daysSinceStart?: number;
  angle?: number;
  polar?: number;
  zoom: number;
  lighting: 'scene' | 'ambient' | 'flash' | 'neutral';
  lowQuality: boolean;
}

export function getSceneCaptureOptions(): SceneCaptureOptions {
  const defaults: SceneCaptureOptions = { zoom: 1, lighting: 'scene', lowQuality: false };
  if (!import.meta.env.DEV) return defaults;
  const params = captureParameters();
  const number = (key: string, fallback: number, min: number, max: number) => {
    const value = params.get(key);
    const parsed = value === null ? fallback : Number(value);
    return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
  };
  if (params.get('capture') !== '1') return { ...defaults, lowQuality: params.get('quality') === 'low' };
  const lighting = params.get('lighting');
  return {
    time: number('time', 4.25, 0, 10000),
    wavePercent: number('wave', 52.2, 0, 100),
    daysSinceStart: number('days', 248, 0, 10000),
    angle: params.has('angle') ? number('angle', 0, -Math.PI * 2, Math.PI * 2) : undefined,
    polar: params.has('polar') ? number('polar', Math.PI/3, Math.PI/6, Math.PI/2.05) : undefined,
    zoom: number('zoom', 1, 0.5, 2.5),
    lighting: lighting === 'ambient' || lighting === 'flash' || lighting === 'neutral' ? lighting : 'scene',
    lowQuality: params.get('quality') === 'low',
  };
}

/** One isolated, smooth lightning pulse. Tier changes never restart the weather clock. */
export function getLightningEnvelope(time: number): number {
  const phase = ((time - 1.8) % 8.5 + 8.5) % 8.5;
  if (phase >= 0.55) return 0;
  const rise = Math.min(1, phase / 0.12);
  const fall = Math.max(0, (phase - 0.12) / 0.43);
  return rise * rise * (3 - 2 * rise) * (1 - fall * fall * (3 - 2 * fall));
}

/** Development-only capture controls stay outside the public interface. */
export function useSceneCaptureOptions() {
  const [options, setOptions] = useState(getSceneCaptureOptions);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const update = () => setOptions(getSceneCaptureOptions());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return options;
}
