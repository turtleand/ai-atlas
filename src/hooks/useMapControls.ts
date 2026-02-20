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
  const isPinching = useRef(false);

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return;
    // Don't start drag if pinch is active
    if (isPinching.current) return;
    isDragging.current = true;
    hasDragged.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || isPinching.current) return;
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

  const onPointerUp = useCallback((_e: PointerEvent) => {
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

    // --- Pinch-to-zoom via touch events ---
    let lastPinchDist = 0;
    let lastPinchMid = { x: 0, y: 0 };

    const getTouchDist = (t: TouchList) =>
      Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);

    const getTouchMid = (t: TouchList) => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching.current = true;
        isDragging.current = false; // cancel any ongoing drag
        lastPinchDist = getTouchDist(e.touches);
        lastPinchMid = getTouchMid(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching.current) {
        e.preventDefault();
        const newDist = getTouchDist(e.touches);
        const newMid = getTouchMid(e.touches);
        const scaleFactor = newDist / lastPinchDist;

        setTransform(prev => {
          const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * scaleFactor));
          const rect = el.getBoundingClientRect();
          const mx = newMid.x - rect.left;
          const my = newMid.y - rect.top;
          const scaleRatio = newScale / prev.scale;
          // Zoom toward pinch midpoint + pan with midpoint movement
          const newX = mx - (mx - prev.x) * scaleRatio + (newMid.x - lastPinchMid.x);
          const newY = my - (my - prev.y) * scaleRatio + (newMid.y - lastPinchMid.y);
          return { x: newX, y: newY, scale: newScale };
        });

        lastPinchDist = newDist;
        lastPinchMid = newMid;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching.current = false;
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
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
