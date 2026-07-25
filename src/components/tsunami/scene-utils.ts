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

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forcedInCapture =
      import.meta.env.DEV &&
      new URLSearchParams(window.location.search).get('reducedMotion') === '1';
    const update = () => setReducedMotion(forcedInCapture || media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
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

export function getCaptureTime() {
  if (!import.meta.env.DEV) return undefined;

  const params = new URLSearchParams(window.location.search);
  if (params.get('capture') !== '1') return undefined;

  const requestedTime = Number(params.get('time'));
  return Number.isFinite(requestedTime) ? requestedTime : 4.25;
}
