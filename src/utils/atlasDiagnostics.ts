// Included only in development or an explicitly requested QA build.
export function startAtlasDiagnostics() {
  const output = document.createElement("output");
  output.id = "atlas-diagnostics";
  output.hidden = true;
  document.body.append(output);
  let frames: number[] = [];
  const longTasks: number[] = [];
  let previous = 0;
  let lcp = 0;
  let cls = 0;
  const interactions: number[] = [];
  for (const type of [
    "largest-contentful-paint",
    "layout-shift",
    "longtask",
    "event",
  ]) {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (type === "largest-contentful-paint") lcp = entry.startTime;
        if (
          type === "layout-shift" &&
          !(entry as PerformanceEntry & { hadRecentInput: boolean })
            .hadRecentInput
        )
          cls += (entry as PerformanceEntry & { value: number }).value;
        if (type === "longtask") {
          longTasks.push(entry.duration);
          if (longTasks.length > 200) longTasks.shift();
        }
        if (type === "event") {
          interactions.push(entry.duration);
          if (interactions.length > 200) interactions.shift();
        }
      }
    }).observe({
      type,
      buffered: true,
      durationThreshold: 16,
    } as PerformanceObserverInit);
  }
  function tick(now: number) {
    if (previous && document.visibilityState === "visible")
      frames.push(now - previous);
    previous = now;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  setInterval(() => {
    const sorted = frames.sort((a, b) => a - b);
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    output.textContent = JSON.stringify({
      time: Math.round(performance.now()),
      focused: document.hasFocus(),
      visibility: document.visibilityState,
      frames: sorted.length,
      median: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      max: sorted.at(-1) ?? 0,
      longTasks,
      lcp,
      cls,
      interactions,
      nodes: document.querySelectorAll("*").length,
      resources: resources.map((r) => ({
        name: r.name.replace(location.origin, ""),
        bytes: r.encodedBodySize,
        duration: r.duration,
      })),
    });
    frames = [];
  }, 5000);
}
