interface CompassRoseProps {
  onResetView: () => void;
}

export function CompassRose({ onResetView }: CompassRoseProps) {
  return (
    <svg
      className="compass"
      viewBox="0 0 100 100"
      onClick={onResetView}
      aria-label="Reset map view"
    >
      {/* Outer ring */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="#D4A03A" strokeWidth="1.5" opacity="0.6" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#D4A03A" strokeWidth="0.5" opacity="0.3" />

      {/* Cardinal points */}
      {/* North */}
      <polygon points="50,8 45,40 50,35 55,40" fill="#D4A03A" opacity="0.8" />
      {/* South */}
      <polygon points="50,92 45,60 50,65 55,60" fill="#8B6914" opacity="0.5" />
      {/* East */}
      <polygon points="92,50 60,45 65,50 60,55" fill="#8B6914" opacity="0.5" />
      {/* West */}
      <polygon points="8,50 40,45 35,50 40,55" fill="#8B6914" opacity="0.5" />

      {/* Center dot */}
      <circle cx="50" cy="50" r="3" fill="#D4A03A" opacity="0.7" />

      {/* Cardinal labels */}
      <text x="50" y="6" textAnchor="middle" fill="#D4A03A" fontSize="8" fontFamily="Cinzel, serif" opacity="0.7">N</text>
      <text x="50" y="99" textAnchor="middle" fill="#D4A03A" fontSize="8" fontFamily="Cinzel, serif" opacity="0.5">S</text>
      <text x="97" y="53" textAnchor="middle" fill="#D4A03A" fontSize="8" fontFamily="Cinzel, serif" opacity="0.5">E</text>
      <text x="3" y="53" textAnchor="middle" fill="#D4A03A" fontSize="8" fontFamily="Cinzel, serif" opacity="0.5">W</text>
    </svg>
  );
}
