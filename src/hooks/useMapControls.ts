import { useState, useCallback, useRef, useEffect, type PointerEvent, type RefObject } from 'react';

interface MapTransform {
  x: number;
  y: number;
  scale: number;
}

interface MapControls {
  transform: MapTransform;
  containerRef: RefObject<HTMLDivElement | null>;
  handlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
  };
  resetView: () => void;
  panTo: (cx: number, cy: number) => void;
}
function getInitialTransform(): MapTransform {
  const viewW = window.innerWidth;
  if (viewW <= 768) {
    const scale = 0.45;
    const viewH = window.innerHeight;
    return {
      x: viewW / 2 - 1200 * scale,
      y: viewH / 2 - 800 * scale,
      scale,
    };
  }
  return { x: 0, y: 0, scale: 0.7 };
}

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.0;

export function useMapControls(): MapControls {
  const [transform, setTransform] = useState<MapTransform>(getInitialTransform);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeTouches = useRef(0);

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return;
    if (e.pointerType === 'touch') {
      activeTouches.current++;
      // On touch devices, require two fingers to pan
      if (activeTouches.current < 2) return;
    }
    isDragging.current = true;
    hasDragged.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    // On touch, only pan with 2+ fingers
    if (e.pointerType === 'touch' && activeTouches.current < 2) return;
    if (!hasDragged.current) {
      const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
      if (dist < 3) return;
      hasDragged.current = true;
    }
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      activeTouches.current = Math.max(0, activeTouches.current - 1);
    }
    isDragging.current = false;
  }, []);

  // Attach wheel listener with RAF throttling and { passive: false } so we can preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;
    let latestWheelEvent: WheelEvent | null = null;

    const applyZoom = () => {
      rafId = null;
      const e = latestWheelEvent;
      if (!e) return;
      latestWheelEvent = null;

      const delta = -e.deltaY * 0.001;
      setTransform(prev => {
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * (1 + delta)));
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const scaleRatio = newScale / prev.scale;
        const newX = mx - (mx - prev.x) * scaleRatio;
        const newY = my - (my - prev.y) * scaleRatio;
        return { x: newX, y: newY, scale: newScale };
      });
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      latestWheelEvent = e;
      if (rafId === null) {
        rafId = requestAnimationFrame(applyZoom);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const resetView = useCallback(() => {
    setTransform(getInitialTransform());
  }, []);

  const panTo = useCallback((cx: number, cy: number) => {
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const scale = 1.0;
    setTransform({
      x: viewW / 2 - cx * scale,
      y: viewH / 2 - cy * scale,
      scale,
    });
  }, []);

  return {
    transform,
    containerRef,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    resetView,
    panTo,
  };
}
