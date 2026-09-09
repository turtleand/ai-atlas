import { atlasCapture, capturedJourney } from "./capture";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { advanceJourney, redirectJourney, type Journey } from "./journey";
import type { AtlasScene, Point } from "./atlas-model";
import { fitScene, revealIsland, type ViewIntent } from "./atlas-camera";
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
export function useAtlasView(
  scene: AtlasScene,
  _selected: string | null,
  reduced = false,
) {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<AtlasView>({
    center: { x: scene.width / 2, y: scene.height / 2 },
    zoom: 0.5,
    width: 1,
    height: 1,
  });
  const viewRef = useRef(view),
    intent = useRef<ViewIntent>("overview"),
    all = useRef(false),
    cameraFrame = useRef(0);
  const depthRef = useRef(false);
  useLayoutEffect(() => {
    viewRef.current = view;
  });
  const cancelCamera = useCallback(() => {
    cancelAnimationFrame(cameraFrame.current);
    cameraFrame.current = 0;
  }, []);
  const manual = useCallback(() => {
    cancelCamera();
    intent.current = "manual";
  }, [cancelCamera]);
  useEffect(() => cancelCamera, [cancelCamera]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      cancelCamera();
      setView((v) =>
        intent.current === "manual" && v.width > 1
          ? { ...v, width, height }
          : fitScene(scene, width, height, all.current),
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [scene, cancelCamera]);
  useEffect(() => {
    if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1")
      document.documentElement.dataset.atlasView = JSON.stringify({
        ...view,
        intent: intent.current,
      });
  }, [view]);
  const reset = useCallback(() => {
    cancelCamera();
    intent.current = "overview";
    all.current = true;
    setView((v) => fitScene(scene, v.width, v.height, true));
  }, [scene, cancelCamera]);
  const panTo = useCallback(
    (target: Point) => {
      cancelCamera();
      const current = viewRef.current;
      if (
        Math.hypot(target.x - current.center.x, target.y - current.center.y) <
        0.1
      )
        return;
      intent.current = "manual";
      if (reduced) {
        setView((v) => ({ ...v, center: target }));
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - start) / 240));
        const ease = 1 - (1 - t) ** 3;
        setView((v) => ({
          ...v,
          center: {
            x: current.center.x + (target.x - current.center.x) * ease,
            y: current.center.y + (target.y - current.center.y) * ease,
          },
        }));
        if (t < 1) cameraFrame.current = requestAnimationFrame(tick);
      };
      cameraFrame.current = requestAnimationFrame(tick);
    },
    [cancelCamera, reduced],
  );
  const focus = useCallback(
    (id: string) => {
      cancelCamera();
      const island = scene.islands.find((i) => i.id === id);
      if (!island) return;
      const current = viewRef.current;
      const target = revealIsland(current, island, depthRef.current);
      if (
        Math.hypot(target.x - current.center.x, target.y - current.center.y) <
        0.1
      )
        return;
      panTo(target);
    },
    [scene, cancelCamera, panTo],
  );
  const reveal = useCallback(
    (point: Point) => {
      const v = viewRef.current,
        p = projection(point, v, depthRef.current);
      const x =
        p.x < 90 ? p.x - 90 : p.x > v.width - 90 ? p.x - v.width + 90 : 0;
      const y =
        p.y < 34 ? p.y - 34 : p.y > v.height - 34 ? p.y - v.height + 34 : 0;
      if (x || y)
        panTo({
          x: v.center.x + x / v.zoom,
          y: v.center.y + y / v.zoom / (depthRef.current ? 0.72 : 1),
        });
    },
    [panTo],
  );
  const zoom = useCallback(
    (factor: number) => {
      manual();
      setView((v) => ({
        ...v,
        zoom: Math.max(0.12, Math.min(2.4, v.zoom * factor)),
      }));
    },
    [manual],
  );
  const pointers = useRef(new Map<number, Point>());
  const previous = useRef<{ mid: Point; span: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function wheel(e: WheelEvent) {
      e.preventDefault();
      manual();
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
  }, [manual]);
  const handlers = {
    onPointerDown(e: React.PointerEvent) {
      if (e.button !== 0 || (e.target as Element).closest("button,a")) return;
      manual();
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
        const [a, b] = values,
          mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
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
  // Presentation changes are not navigation, even when their available width changes.
  return {
    ref,
    view,
    focus,
    reset,
    zoom,
    handlers,
    depthRef,
    reveal,
  };
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
  const [initial] = useState(() => capturedJourney(scene));
  const ref = useRef(initial);
  const listeners = useRef(new Set<() => void>());
  useEffect(() => {
    ref.current = capturedJourney(scene);
    listeners.current.forEach((fn) => fn());
  }, [scene]);
  const select = useCallback(
    (id: string) => {
      const startedAt =
        import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1"
          ? performance.now()
          : 0;
      redirectJourney(scene, ref.current, id, reduced);
      if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1")
        document.documentElement.dataset.atlasRouteMs = String(
          performance.now() - startedAt,
        );
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
