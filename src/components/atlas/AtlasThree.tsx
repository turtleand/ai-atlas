import { useEffect, useLayoutEffect, useRef } from "react";
import type {
  AtlasThreeProps,
  RenderConfig,
  RenderInput,
  RenderOutput,
} from "./atlas-renderer";
export type { AtlasThreeProps } from "./atlas-renderer";

export function AtlasThree(props: AtlasThreeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const worker = useRef<Worker | null>(null);
  const latest = useRef(props);
  const config = (): RenderConfig => ({
    view: props.view,
    selected: props.selected,
    active: props.active,
    maxDpr: window.devicePixelRatio || 1,
    initialLow:
      window.innerWidth < 761 || window.matchMedia("(pointer: coarse)").matches,
  });
  useLayoutEffect(() => {
    latest.current = props;
  });
  const { onFail, driver } = props;
  useEffect(() => {
    const element = canvas.current;
    if (
      !element ||
      !element.transferControlToOffscreen ||
      typeof Worker === "undefined"
    ) {
      onFail(new Error("Offscreen WebGL is unavailable"));
      return;
    }
    let cancelled = false,
      inFlight = false,
      pendingPose = false,
      preparationTimer = 0,
      disposeTimer = 0;
    let instance: Worker | null = null;
    let sentPath: AtlasThreeProps["driver"]["ref"]["current"]["path"] | null =
      null;
    const send = (message: RenderInput, transfer: Transferable[] = []) =>
      instance?.postMessage(message, transfer);
    const pose = () => {
      if (cancelled || !instance) return;
      if (inFlight) {
        pendingPose = true;
        return;
      }
      pendingPose = false;
      inFlight = true;
      const j = driver.ref.current;
      const { path, lengths: _lengths, ...journey } = j;
      void _lengths;
      send({ type: "pose", journey, ...(path === sentPath ? {} : { path }) });
      sentPath = path;
    };
    // Defer transfer until after Strict Mode's setup/cleanup probe and the loading paint.
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        const renderer = new Worker(
          new URL("./atlas.worker.tsx", import.meta.url),
          { type: "module" },
        );
        instance = renderer;
        worker.current = renderer;
        preparationTimer = window.setTimeout(() => {
          if (!cancelled)
            latest.current.onFail(new Error("3D preparation timed out"));
        }, 15000);
        renderer.onmessage = ({ data }: MessageEvent<RenderOutput>) => {
          if (data.type === "disposed") {
            clearTimeout(disposeTimer);
            renderer.terminate();
            return;
          }
          if (cancelled) return;
          if (data.type === "frame") {
            inFlight = false;
            if (pendingPose || latest.current.active) pose();
          }
          if (data.type === "ready") {
            clearTimeout(preparationTimer);
            inFlight = false;
            pose();
            latest.current.onReady();
          }
          if (data.type === "slow") latest.current.onSlow();
          if (data.type === "error")
            latest.current.onFail(new Error(data.message));
          if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1") {
            if (data.type === "stats" && element.parentElement)
              element.parentElement.dataset.renderStats = JSON.stringify(
                data.stats,
              );
            if (data.type === "timing")
              document.documentElement.dataset.atlas3dContextMs = String(
                data.contextMs,
              );
          }
        };
        renderer.onerror = (event) => {
          event.preventDefault();
          if (!cancelled) latest.current.onFail(new Error(event.message));
        };
        const offscreen = element.transferControlToOffscreen();
        const current = latest.current;
        send(
          {
            type: "init",
            canvas: offscreen,
            scene: current.scene,
            journey: driver.ref.current,
            config: {
              view: current.view,
              selected: current.selected,
              active: current.active,
              maxDpr: window.devicePixelRatio || 1,
              initialLow:
                window.innerWidth < 761 ||
                window.matchMedia("(pointer: coarse)").matches,
            },
          },
          [offscreen],
        );
      } catch (error) {
        onFail(error);
      }
    });
    const unsubscribe = driver.subscribe(pose);
    return () => {
      cancelled = true;
      clearTimeout(preparationTimer);
      cancelAnimationFrame(frame);
      unsubscribe();
      worker.current = null;
      send({ type: "dispose" });
      // A busy or failed worker must never outlive cancellation indefinitely.
      disposeTimer = window.setTimeout(() => instance?.terminate(), 100);
    };
  }, [onFail, driver]);
  useEffect(() => {
    worker.current?.postMessage({
      type: "config",
      config: config(),
    } satisfies RenderInput);
  });
  const faultTest =
    (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1") &&
    new URLSearchParams(location.search).get("testWebgl") === "1";
  return (
    <>
      <canvas
        ref={canvas}
        aria-hidden="true"
        style={{ width: "100%", height: "100%" }}
      />
      {faultTest && (
        <button
          style={{
            position: "fixed",
            right: 20,
            top: 180,
            zIndex: 100,
            padding: 14,
            pointerEvents: "auto",
          }}
          onClick={() =>
            worker.current?.postMessage({
              type: "lose-context",
            } satisfies RenderInput)
          }
        >
          Lose WebGL context (QA)
        </button>
      )}
    </>
  );
}
