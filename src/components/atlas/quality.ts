export interface FrameTiming {
  last: number;
  total: number;
  count: number;
  windows: number;
}
export const freshTiming = (): FrameTiming => ({
  last: 0,
  total: 0,
  count: 0,
  windows: 0,
});

// Two sustained windows avoid treating context creation or one slow frame as animation load.
export function sampleQuality(stats: FrameTiming, now: number, low: boolean) {
  if (stats.last) {
    stats.total += now - stats.last;
    stats.count++;
  }
  stats.last = now;
  if (stats.total < 3000) return null;
  const average = stats.total / Math.max(1, stats.count);
  stats.windows = average > (low ? 40 : 25) ? stats.windows + 1 : 0;
  stats.total = 0;
  stats.count = 0;
  if (stats.windows < 2) return null;
  stats.windows = 0;
  return low ? "pause" : "reduce";
}
