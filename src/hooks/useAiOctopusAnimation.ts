import { useRef, useEffect, useCallback } from 'react';
import type { MapLayout } from '../utils/layoutEngine.ts';

interface OctopusState {
  fromIdx: number;
  toIdx: number;
  progress: number; // 0..1 along current route
  recentRoutes: number[]; // indices of recently traveled routes (up to 5)
}

const SPEED = 180; // px per second (slightly slower than turtle)
const BUBBLE_COUNT = 15;
const BUBBLE_INTERVAL = 5; // frames between bubble spawns

export function useAiOctopusAnimation(routes: MapLayout['routes']) {
  const octopusRef = useRef<SVGGElement | null>(null);
  const bubbleRef = useRef<SVGGElement | null>(null);
  const tentaclesRef = useRef<SVGElement[] | null>(null);
  const stateRef = useRef<OctopusState>({
    fromIdx: 0,
    toIdx: 0,
    progress: 0,
    recentRoutes: [],
  });
  const frameCountRef = useRef(0);
  const bubbleIdxRef = useRef(0);
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
      // Octopus prefers longer routes (more adventurous)
      candidates.sort((a, b) => {
        const distA = Math.hypot(
          routes[a].to.cx - routes[a].from.cx,
          routes[a].to.cy - routes[a].from.cy
        );
        const distB = Math.hypot(
          routes[b].to.cx - routes[b].from.cx,
          routes[b].to.cy - routes[b].from.cy
        );
        return distB - distA; // prefer longer routes
      });
      // Pick from top 3 longest with some randomness
      const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
      return topCandidates[Math.floor(Math.random() * topCandidates.length)];
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

    // Initialize state — start from a different position than turtle (middle of routes array)
    const startIdx = Math.floor(routes.length / 2);
    stateRef.current = {
      fromIdx: startIdx,
      toIdx: 1, // Start going in reverse direction
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

        // Record recent route (octopus remembers more routes)
        state.recentRoutes.push(state.fromIdx);
        if (state.recentRoutes.length > 5) state.recentRoutes.shift();

        // Pick next route sharing destination
        const nextRoute = pickNextRoute(toX, toY);
        const nextR = routes[nextRoute];

        // Determine direction
        if (nextR && Math.abs(nextR.from.cx - toX) < 1 && Math.abs(nextR.from.cy - toY) < 1) {
          state.toIdx = 0;
        } else {
          state.toIdx = 1;
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

      // Update octopus transform via DOM
      if (octopusRef.current) {
        octopusRef.current.setAttribute('transform', `translate(${x}, ${y}) rotate(${angle})`);
      }

      // Tentacle animation — lazily cache tentacle elements
      if (!tentaclesRef.current && octopusRef.current) {
        const els = octopusRef.current.querySelectorAll('[data-tentacle]');
        tentaclesRef.current = Array.from(els) as SVGElement[];
      }
      if (tentaclesRef.current) {
        // Flowing wave animation with phase offsets for each tentacle
        for (let i = 0; i < tentaclesRef.current.length; i++) {
          const el = tentaclesRef.current[i];
          const px = el.getAttribute('data-pivot-x') || '0';
          const py = el.getAttribute('data-pivot-y') || '0';
          
          // Each tentacle has a phase offset for wave-like motion
          const phaseOffset = i * 0.8;
          const waveAngle = Math.sin(time * 0.003 + phaseOffset) * 8; // gentler wave
          const secondaryWave = Math.sin(time * 0.005 + phaseOffset * 1.5) * 4;
          
          el.setAttribute(
            'transform',
            `rotate(${waveAngle + secondaryWave}, ${px}, ${py})`,
          );
        }
      }

      // Spawn bubbles behind octopus
      frameCountRef.current++;
      if (bubbleRef.current && frameCountRef.current % BUBBLE_INTERVAL === 0) {
        const circles = bubbleRef.current.children;
        if (circles.length > 0) {
          // Offset behind octopus siphon
          const angleRad = Math.atan2(toY - fromY, toX - fromX);
          // Add some randomness to bubble positions
          const offsetAngle = angleRad + (Math.random() - 0.5) * 0.5;
          const bubbleX = x - Math.cos(offsetAngle) * 20 + (Math.random() - 0.5) * 8;
          const bubbleY = y - Math.sin(offsetAngle) * 20 + (Math.random() - 0.5) * 8;

          const idx = bubbleIdxRef.current % BUBBLE_COUNT;
          const circle = circles[idx] as SVGCircleElement;
          circle.setAttribute('cx', String(bubbleX));
          circle.setAttribute('cy', String(bubbleY));
          circle.setAttribute('opacity', '0.5');
          circle.setAttribute('r', String(1.5 + Math.random() * 2));
          bubbleIdxRef.current++;
        }
      }

      // Fade and float bubbles upward
      if (bubbleRef.current) {
        const circles = bubbleRef.current.children;
        for (let i = 0; i < circles.length; i++) {
          const circle = circles[i] as SVGCircleElement;
          const currentOpacity = parseFloat(circle.getAttribute('opacity') || '0');
          if (currentOpacity > 0.01) {
            circle.setAttribute('opacity', String(currentOpacity * 0.96));
            // Bubbles float slightly upward
            const currentY = parseFloat(circle.getAttribute('cy') || '0');
            circle.setAttribute('cy', String(currentY - 0.3));
            // Bubbles expand slightly as they rise
            const currentR = parseFloat(circle.getAttribute('r') || '2');
            circle.setAttribute('r', String(Math.min(5, currentR * 1.005)));
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
      tentaclesRef.current = null;
    };
  }, [routes, pickNextRoute]);

  return { octopusRef, bubbleRef };
}
