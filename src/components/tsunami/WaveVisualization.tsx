import { TsunamiShip } from './TsunamiShip';
import { getSurferState, type SurferState } from '../../data/tsunami-data';

interface WaveVisualizationProps {
  score: number;
  wavePercent: number;
  daysSinceStart: number;
}

// Generate a seamless wave SVG path with MORE DRAMATIC, JAGGED SHAPE
// Two sine frequencies create a chaotic, stormy wave pattern
function waveDataUri(color: string, opacity: number, amplitude: number, phase: number): string {
  const w = 1440;
  const h = 200;
  const mid = h * 0.4;
  const freq1 = (Math.PI * 4) / w;
  const freq2 = (Math.PI * 8) / w;

  let d = `M0,${mid}`;
  for (let x = 0; x <= w; x += 20) {
    // Jagged wave: primary + secondary frequency
    const y = mid + 
      Math.sin(x * freq1 + phase) * amplitude + 
      Math.sin(x * freq2 + phase * 1.7) * (amplitude * 0.3);
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
  const state: SurferState = getSurferState(score, wavePercent);

  // Determine ship tier (1-5) based on composite score
  const tier = score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 45 ? 2 : 1;

  // Wave heights scale with wavePercent — 4 layers now, taller amplitudes
  const baseHeight = wavePercent + 10;
  const layer1Height = Math.min(95, baseHeight + 15);
  const layer2Height = Math.min(90, baseHeight + 10);
  const layer3Height = Math.min(85, baseHeight + 5);
  const layer4Height = Math.min(82, baseHeight);

  // CRITICAL: Ship positioning RELATIVE TO WATERLINE
  const waterlineY = wavePercent;
  const minPos = 3;   // lowest (fully submerged)
  const maxPos = 75;  // highest (well above waves)

  let shipBottom: number;
  if (score <= wavePercent) {
    // Below or at waterline: [0, wavePercent] → [minPos, waterlineY]
    const t = wavePercent > 0 ? score / wavePercent : 0;
    shipBottom = minPos + t * (waterlineY - minPos);
  } else {
    // Above waterline: [wavePercent, 100] → [waterlineY, maxPos]
    const t = (score - wavePercent) / (100 - wavePercent);
    shipBottom = waterlineY + t * (maxPos - waterlineY);
  }

  return (
    <div className="wave-container">
      {/* STORM SKY — near-black gradient with subtle horizon glow */}
      <div className="wave-sky" />

      {/* STORM EFFECTS — rain, lightning, fog */}
      <div className="storm-rain" />
      <div className="storm-lightning" />
      <div className="storm-fog" />

      {/* WAVE LAYER 1 (back) — ghostly, barely visible */}
      <div
        className="wave-layer wave-layer-1"
        style={{
          height: `${layer1Height}%`,
          backgroundImage: waveDataUri('rgba(8, 20, 35, 0.5)', 1, 40, 0),
        }}
      />

      {/* WAVE LAYER 2 — dark */}
      <div
        className="wave-layer wave-layer-2"
        style={{
          height: `${layer2Height}%`,
          backgroundImage: waveDataUri('rgba(12, 30, 50, 0.6)', 1, 35, 2),
        }}
      />

      {/* WAVE LAYER 3 — medium dark */}
      <div
        className="wave-layer wave-layer-3"
        style={{
          height: `${layer3Height}%`,
          backgroundImage: waveDataUri('rgba(15, 40, 65, 0.75)', 1, 30, 4),
        }}
      />

      {/* WAVE LAYER 4 (front) — near-black cresting waves */}
      <div
        className="wave-layer wave-layer-4"
        style={{
          height: `${layer4Height}%`,
          backgroundImage: waveDataUri('rgba(10, 25, 45, 0.9)', 1, 25, 6),
        }}
      />

      {/* Deep water fill below waves */}
      <div
        className="wave-deep"
        style={{ height: `${Math.max(0, baseHeight - 15)}%` }}
      />

      {/* Foam / spray at the waterline */}
      <div className="wave-foam-bar" style={{ bottom: `${baseHeight - 2}%` }} />

      {/* SHIP (replaces turtle surfer) */}
      <div
        className="ship-container"
        style={{ bottom: `${shipBottom}%` }}
      >
        <TsunamiShip tier={tier} state={state} />
      </div>

      {/* Overlay info — shows through the storm */}
      <div className="wave-overlay-text">
        <span className="wave-day">Day {daysSinceStart}</span>
        <span className="wave-separator">·</span>
        <span className="wave-waterline">Waterline: {wavePercent.toFixed(1)}%</span>
      </div>
    </div>
  );
};
