import { TsunamiSurfer } from './TsunamiSurfer';
import { getSurferState, type SurferState } from '../../data/tsunami-data';

interface WaveVisualizationProps {
  score: number;
  wavePercent: number;
  daysSinceStart: number;
}

export const WaveVisualization: React.FC<WaveVisualizationProps> = ({
  score,
  wavePercent,
  daysSinceStart,
}) => {
  const surferState: SurferState = getSurferState(score, wavePercent);

  // Generate wave path (simple sine-like pattern)
  const generateWavePath = (amplitude: number, frequency: number, yOffset: number) => {
    const points: string[] = [];
    const width = 200; // 2x viewport width for seamless loop
    const segments = 50;
    
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const y = yOffset + Math.sin((i / segments) * Math.PI * frequency) * amplitude;
      points.push(`${x},${y}`);
    }
    
    // Close the path at the bottom
    points.push(`200,100`);
    points.push(`0,100`);
    
    return `M ${points.join(' L ')} Z`;
  };

  return (
    <div className="wave-container">
      <svg
        className="wave-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for ocean depth */}
          <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a5276" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#1a5276" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a1628" stopOpacity="1" />
          </linearGradient>
          
          {/* Gradient for wave layers */}
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="30%" stopColor="#4fc3f7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1a5276" stopOpacity="0.3" />
          </linearGradient>
          
          <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="30%" stopColor="#4fc3f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1a5276" stopOpacity="0.6" />
          </linearGradient>
          
          <linearGradient id="wave-gradient-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#4fc3f7" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#1a5276" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Ocean background */}
        <rect x="0" y="0" width="100" height="100" fill="url(#ocean-gradient)" />

        {/* Wave Layer 1 (back) - slowest, lightest */}
        <g className="wave-layer wave-layer-1">
          <path
            d={generateWavePath(6, 3, 100 - wavePercent - 8)}
            fill="url(#wave-gradient-1)"
          />
        </g>

        {/* Wave Layer 2 (mid) - medium */}
        <g className="wave-layer wave-layer-2">
          <path
            d={generateWavePath(5, 4, 100 - wavePercent - 4)}
            fill="url(#wave-gradient-2)"
          />
        </g>

        {/* Wave Layer 3 (front) - fastest, full opacity */}
        <g className="wave-layer wave-layer-3">
          <path
            d={generateWavePath(4, 5, 100 - wavePercent)}
            fill="url(#wave-gradient-3)"
          />
        </g>

        {/* Foam/spray at wave crests */}
        <g className="foam-particles" opacity="0.6">
          <circle cx="20" cy={100 - wavePercent - 2} r="1" fill="#ffffff">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="45" cy={100 - wavePercent - 1} r="1.2" fill="#ffffff">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="70" cy={100 - wavePercent - 3} r="0.8" fill="#ffffff">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="90" cy={100 - wavePercent - 1.5} r="1" fill="#ffffff">
            <animate attributeName="opacity" values="0.6;0.95;0.6" dur="1.9s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Turtle Surfer */}
        <g transform="translate(35, 0) scale(0.25)">
          <TsunamiSurfer score={score} wavePercent={wavePercent} state={surferState} />
        </g>
      </svg>

      {/* Overlay text */}
      <div className="wave-overlay-text">
        <span className="wave-day">Day {daysSinceStart}</span>
        <span className="wave-separator">·</span>
        <span className="wave-waterline">Waterline: {wavePercent.toFixed(1)}%</span>
      </div>
    </div>
  );
};
