import type { AtlasScene } from "./atlas-model";
import { advanceJourney, createJourney, redirectJourney } from "./journey";
export function atlasCapture() {
  if (!import.meta.env.DEV && import.meta.env.VITE_ATLAS_QA !== "1")
    return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("capture") !== "1") return null;
  const time = Math.min(180, Math.max(0, Number(params.get("time")) || 0));
  return {
    time,
    destination: params.get("destination"),
    selection: params.get("selection"),
    tool: params.get("tool"),
    reduced: params.get("reducedMotion") === "1",
  };
}
export function capturedJourney(scene: AtlasScene) {
  const j = createJourney(scene),
    capture = atlasCapture();
  if (capture) {
    if (capture.destination)
      redirectJourney(scene, j, capture.destination, capture.reduced);
    for (
      let time = capture.reduced ? capture.time : 0;
      time < capture.time;
      time += 1 / 120
    )
      advanceJourney(scene, j, Math.min(1 / 120, capture.time - time));
  }
  return j;
}
