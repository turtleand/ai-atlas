import { TsunamiSurfer } from './TsunamiSurfer';
import { getSurferState, type SurferState } from '../../data/tsunami-data';

interface WaveVisualizationProps {
  score: number;
  wavePercent: number;
  daysSinceStart: number;
}

// Generate a seamless wave SVG path for use as data URI background
// The path tiles perfectly when repeated via background-repeat
function waveDataUri(color: string, opacity: number, amplitude: number, phase: number): string {
  const w = 1440;
  const h = 200;
  const mid = h * 0.4;

  let d = `M0,${mid}`;
  // Two full sine periods across the width for smooth tiling
  for (let x = 0; x <= w; x += 20) {
    const y = mid + Math.sin((x / w) * Math.PI * 4 + phase) * amplitude;
    d += ` L${x},${y}`;
  }
  d += ` L${w},${h} L0,${h} Z`;

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'><path d='${d}' fill='${color}' fill-opacity='${opacity}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export const WaveVisualization: React.FC<WaveVisualizationProps> = ({
  score,
  wavePercent,
  daysSinceStart,
}) => {
  const surferState: SurferState = getSurferState(score, wavePercent);

  // Wave heights scale with wavePercent (the daily tsunami level)
  // Each layer is slightly taller to create depth
  const baseHeight = wavePercent + 10; // extra breathing room
  const layer1Height = Math.min(95, baseHeight + 12);
  const layer2Height = Math.min(90, baseHeight + 6);
  const layer3Height = Math.min(85, baseHeight);

  // Surfer vertical position: map score (0-100) to percentage from bottom
  // Clamp between 5% and 90% to stay within the wave area
  const surferBottom = Math.max(5, Math.min(90, score));

  return (
    <div className="wave-container">
      {/* Sky / deep ocean gradient background */}
      <div className="wave-sky" />

      {/* Wave Layer 1 (back) — slowest, lightest */}
      <div
        className="wave-layer wave-layer-1"
        style={{
          height: `${layer1Height}%`,
          backgroundImage: waveDataUri('#1a5276', 0.35, 30, 0),
        }}
      />

      {/* Wave Layer 2 (mid) */}
      <div
        className="wave-layer wave-layer-2"
        style={{
          height: `${layer2Height}%`,
          backgroundImage: waveDataUri('#1a5276', 0.55, 25, 2),
        }}
      />

      {/* Wave Layer 3 (front) — fastest, darkest */}
      <div
        className="wave-layer wave-layer-3"
        style={{
          height: `${layer3Height}%`,
          backgroundImage: waveDataUri('#1a5276', 0.85, 20, 4),
        }}
      />

      {/* Deep water fill below waves */}
      <div
        className="wave-deep"
        style={{ height: `${Math.max(0, baseHeight - 15)}%` }}
      />

      {/* Foam / spray at the waterline */}
      <div className="wave-foam-bar" style={{ bottom: `${baseHeight - 2}%` }} />

      {/* Turtle Surfer */}
      <div
        className="surfer-container"
        style={{ bottom: `${surferBottom}%` }}
      >
        <TsunamiSurfer state={surferState} />
      </div>

      {/* Overlay info */}
      <div className="wave-overlay-text">
        <span className="wave-day">Day {daysSinceStart}</span>
        <span className="wave-separator">·</span>
        <span className="wave-waterline">Waterline: {wavePercent.toFixed(1)}%</span>
      </div>
    </div>
  );
};
