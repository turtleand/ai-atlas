import { useRef, useEffect, useCallback } from 'react';
import type { MapLayout } from '../utils/layoutEngine.ts';

interface TurtleState {
  fromIdx: number;
  toIdx: number;
  progress: number; // 0..1 along current route
  recentRoutes: number[]; // indices of recently traveled routes (up to 4)
}

const SPEED = 220; // px per second
const WAKE_COUNT = 20;
const WAKE_INTERVAL = 3; // frames between wake spawns

export function useAiTurtleAnimation(routes: MapLayout['routes']) {
  const turtleRef = useRef<SVGGElement | null>(null);
  const wakeRef = useRef<SVGGElement | null>(null);
  const flippersRef = useRef<SVGElement[] | null>(null);
  const stateRef = useRef<TurtleState>({
    fromIdx: 0,
    toIdx: 0,
    progress: 0,
    recentRoutes: [],
  });
  const frameCountRef = useRef(0);
  const wakeIdxRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  const pickNextRoute = useCallback((currentToIslandCx: number, currentToIslandCy: number) => {
    if (routes.length === 0) return 0;

    const { recentRoutes } = stateRef.current;

    // Find routes that share the destination island
    const candidates: number[] = [];
    for (let i = 0; i < routes.length; i++) {
      if (recentRoutes.includes(i)) continue;
      const r = routes[i];
      if (
        (Math.abs(r.from.cx - currentToIslandCx) < 1 && Math.abs(r.from.cy - currentToIslandCy) < 1) ||
        (Math.abs(r.to.cx - currentToIslandCx) < 1 && Math.abs(r.to.cy - currentToIslandCy) < 1)
      ) {
        candidates.push(i);
      }
    }

    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Fallback: pick any non-recent route
    const nonRecent = routes.map((_, i) => i).filter(i => !recentRoutes.includes(i));
    if (nonRecent.length > 0) {
      return nonRecent[Math.floor(Math.random() * nonRecent.length)];
    }

    return Math.floor(Math.random() * routes.length);
  }, [routes]);

  useEffect(() => {
    if (routes.length === 0) return;

    // Initialize state
    stateRef.current = {
      fromIdx: 0,
      toIdx: 0,
      progress: 0,
      recentRoutes: [],
    };

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const state = stateRef.current;
      const route = routes[state.fromIdx];
      if (!route) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // Determine from/to positions
      let fromX: number, fromY: number, toX: number, toY: number;
      if (state.toIdx === 0) {
        fromX = route.from.cx;
        fromY = route.from.cy;
        toX = route.to.cx;
        toY = route.to.cy;
      } else {
        fromX = route.to.cx;
        fromY = route.to.cy;
        toX = route.from.cx;
        toY = route.from.cy;
      }

      const dist = Math.hypot(toX - fromX, toY - fromY);
      const progressPerSec = dist > 0 ? SPEED / dist : 1;

      state.progress += progressPerSec * dt;

      if (state.progress >= 1) {
        state.progress = 0;

        // Record recent route
        state.recentRoutes.push(state.fromIdx);
        if (state.recentRoutes.length > 4) state.recentRoutes.shift();

        // Pick next route sharing destination
        const nextRoute = pickNextRoute(toX, toY);
        const nextR = routes[nextRoute];

        // Determine direction: start from the end that matches our current destination
        if (nextR && Math.abs(nextR.from.cx - toX) < 1 && Math.abs(nextR.from.cy - toY) < 1) {
          state.toIdx = 0; // going from→to
        } else {
          state.toIdx = 1; // going to→from (reversed)
        }
        state.fromIdx = nextRoute;

        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // Interpolate position
      const x = fromX + (toX - fromX) * state.progress;
      const y = fromY + (toY - fromY) * state.progress;

      // Rotation
      const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);

      // Update turtle transform via DOM
      if (turtleRef.current) {
        turtleRef.current.setAttribute('transform', `translate(${x}, ${y}) rotate(${angle})`);
      }

      // Flipper animation — lazily cache flipper elements
      if (!flippersRef.current && turtleRef.current) {
        const els = turtleRef.current.querySelectorAll('[data-flipper]');
        flippersRef.current = Array.from(els) as SVGElement[];
      }
      if (flippersRef.current) {
        const flipAngle = Math.sin(time * 0.005) * 12; // +/-12° at ~1.25Hz
        for (const el of flippersRef.current) {
          const px = el.getAttribute('data-pivot-x') || '0';
          const py = el.getAttribute('data-pivot-y') || '0';
          const isLeft = el.getAttribute('data-flipper')?.includes('left');
          const sign = isLeft ? -1 : 1;
          el.setAttribute(
            'transform',
            `rotate(${sign * flipAngle}, ${px}, ${py})`,
          );
        }
      }

      // Spawn wake behind turtle
      frameCountRef.current++;
      if (wakeRef.current && frameCountRef.current % WAKE_INTERVAL === 0) {
        const circles = wakeRef.current.children;
        if (circles.length > 0) {
          // Offset ~25px behind turtle center along negative travel direction
          const angleRad = Math.atan2(toY - fromY, toX - fromX);
          const wakeX = x - Math.cos(angleRad) * 25;
          const wakeY = y - Math.sin(angleRad) * 25;

          const idx = wakeIdxRef.current % WAKE_COUNT;
          const circle = circles[idx] as SVGCircleElement;
          circle.setAttribute('cx', String(wakeX));
          circle.setAttribute('cy', String(wakeY));
          circle.setAttribute('opacity', '0.35');
          circle.setAttribute('r', '3');
          wakeIdxRef.current++;
        }
      }

      // Fade wake circles
      if (wakeRef.current) {
        const circles = wakeRef.current.children;
        for (let i = 0; i < circles.length; i++) {
          const circle = circles[i] as SVGCircleElement;
          const currentOpacity = parseFloat(circle.getAttribute('opacity') || '0');
          if (currentOpacity > 0.01) {
            circle.setAttribute('opacity', String(currentOpacity * 0.97));
            const currentR = parseFloat(circle.getAttribute('r') || '3');
            circle.setAttribute('r', String(Math.max(0.5, currentR * 0.995)));
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
      flippersRef.current = null;
    };
  }, [routes, pickNextRoute]);

  return { turtleRef, wakeRef };
}
