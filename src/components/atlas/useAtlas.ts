import { atlasCapture, capturedJourney } from "./capture";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { advanceJourney, redirectJourney, type Journey } from "./journey";
import type { AtlasScene, Point } from "./atlas-model";
export interface AtlasView {
  center: Point;
  zoom: number;
  width: number;
  height: number;
}
export function projection(point: Point, view: AtlasView, depth = false) {
  return {
    x: view.width / 2 + (point.x - view.center.x) * view.zoom,
    y:
      view.height / 2 +
      (point.y - view.center.y) * view.zoom * (depth ? 0.72 : 1),
  };
}
export function useAtlasView(scene: AtlasScene, selected: string | null) {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<AtlasView>({
    center: { x: scene.width / 2, y: scene.height / 2 },
    zoom: 0.5,
    width: 1,
    height: 1,
  });
  const fit = useCallback(
    (width: number, height: number, id: string | null = null): AtlasView => {
      const island = scene.islands.find((i) => i.id === id);
      const center = island
        ? island.center
        : { x: scene.width / 2 - 20, y: scene.height / 2 - 10 };
      return {
        width,
        height,
        center: { ...center },
        zoom:
          Math.min(
            width / (island ? 550 : scene.width),
            height / (island ? 460 : scene.height),
          ) * 0.96,
      };
    },
    [scene],
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setView(fit(width, height, selected));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit, selected]);
  const reset = useCallback(
    () => setView((v) => fit(v.width, v.height)),
    [fit],
  );
  const focus = useCallback(
    (id: string) => setView((v) => fit(v.width, v.height, id)),
    [fit],
  );
  const zoom = useCallback(
    (factor: number) =>
      setView((v) => ({
        ...v,
        zoom: Math.max(0.12, Math.min(2.4, v.zoom * factor)),
      })),
    [],
  );
  const pointers = useRef(new Map<number, Point>());
  const previous = useRef<{ mid: Point; span: number } | null>(null);
  const depthRef = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function wheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      setView((v) => {
        const scale = Math.max(
          0.12,
          Math.min(2.4, v.zoom * Math.exp(-e.deltaY * 0.001)),
        );
        const x = e.clientX - rect.left - v.width / 2,
          y =
            (e.clientY - rect.top - v.height / 2) /
            (depthRef.current ? 0.72 : 1);
        return {
          ...v,
          zoom: scale,
          center: {
            x: v.center.x + x / v.zoom - x / scale,
            y: v.center.y + y / v.zoom - y / scale,
          },
        };
      });
    }
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);
  const handlers = {
    onPointerDown(e: React.PointerEvent) {
      if (e.button !== 0 || (e.target as Element).closest("button,a")) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      previous.current = null;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove(e: React.PointerEvent) {
      if (!pointers.current.has(e.pointerId)) return;
      const old = pointers.current.get(e.pointerId)!;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const values = [...pointers.current.values()];
      if (values.length > 1) {
        const [a, b] = values;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          span = Math.hypot(a.x - b.x, a.y - b.y);
        const last = previous.current;
        if (last)
          setView((v) => ({
            ...v,
            zoom: Math.max(
              0.12,
              Math.min(2.4, (v.zoom * span) / (last.span || span)),
            ),
            center: {
              x: v.center.x - (mid.x - last.mid.x) / v.zoom,
              y:
                v.center.y -
                (mid.y - last.mid.y) / v.zoom / (depthRef.current ? 0.72 : 1),
            },
          }));
        previous.current = { mid, span };
      } else
        setView((v) => ({
          ...v,
          center: {
            x: v.center.x - (e.clientX - old.x) / v.zoom,
            y:
              v.center.y -
              (e.clientY - old.y) / v.zoom / (depthRef.current ? 0.72 : 1),
          },
        }));
    },
    onPointerUp(e: React.PointerEvent) {
      pointers.current.delete(e.pointerId);
      previous.current = null;
    },
    onPointerCancel(e: React.PointerEvent) {
      pointers.current.delete(e.pointerId);
      previous.current = null;
    },
  };
  return { ref, view, focus, reset, zoom, handlers, depthRef };
}
export function useMotionPolicy() {
  const [reduced, setReduced] = useState(
    () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !!atlasCapture()?.reduced,
  );
  const [visible, setVisible] = useState(
    () => document.visibilityState !== "hidden",
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches || !!atlasCapture()?.reduced),
      visibility = () => setVisible(document.visibilityState !== "hidden");
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return { reduced, visible };
}
export type JourneyRef = RefObject<Journey>;
export function useJourney(
  scene: AtlasScene,
  paused: boolean,
  reduced: boolean,
) {
  const ref = useRef(capturedJourney(scene));
  const listeners = useRef(new Set<() => void>());
  useEffect(() => {
    ref.current = capturedJourney(scene);
    listeners.current.forEach((fn) => fn());
  }, [scene]);
  const select = useCallback(
    (id: string) => {
      redirectJourney(scene, ref.current, id, reduced);
      listeners.current.forEach((fn) => fn());
    },
    [scene, reduced],
  );
  const subscribe = useCallback((fn: () => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);
  useEffect(() => {
    if (paused || reduced || atlasCapture()) return;
    let frame = 0,
      last = 0;
    const tick = (now: number) => {
      if (last) advanceJourney(scene, ref.current, (now - last) / 1000);
      last = now;
      listeners.current.forEach((fn) => fn());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [scene, paused, reduced]);
  return { ref, subscribe, select };
}
export interface JourneyDriver {
  ref: JourneyRef;
  subscribe: (fn: () => void) => () => void;
}
