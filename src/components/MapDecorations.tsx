interface ShipProps {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  mirrored?: boolean;
  opacity?: number;
}

function HereBeDragonsText() {
  return (
    <g transform="translate(180, 1440) rotate(-6)">
      <text className="dragons-text" x="0" y="0">Here Be Dragons</text>
      {/* Calligraphic underline flourish */}
      <path
        d="M -5 12 Q 60 18, 140 10 Q 220 2, 310 14 Q 340 18, 350 12 Q 355 8, 340 6 Q 320 4, 300 10"
        fill="none"
        stroke="rgba(212,160,58,0.32)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 350 12 Q 360 20, 370 14 Q 375 8, 365 6"
        fill="none"
        stroke="rgba(212,160,58,0.28)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
  );
}

function TerraIncognitaText() {
  return (
    <g transform="translate(1950, 160) rotate(4)">
      <text className="dragons-text" style={{ fontSize: 36 }} x="0" y="0">Terra Incognita</text>
      {/* Calligraphic underline flourish */}
      <path
        d="M -5 10 Q 50 16, 120 8 Q 200 0, 280 12 Q 310 16, 320 10 Q 325 4, 310 4"
        fill="none"
        stroke="rgba(212,160,58,0.32)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

function SeaDragon() {
  return (
    <g transform="translate(280, 1320)" opacity="0.40">
      {/* Water splash arcs at waterline */}
      <path
        d="M -80 40 Q -60 30, -40 40 Q -20 50, 0 40"
        fill="none"
        stroke="rgba(100,180,255,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 60 45 Q 80 35, 100 45 Q 120 55, 140 45"
        fill="none"
        stroke="rgba(100,180,255,0.35)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Serpentine body — 3 S-curve humps */}
      <path
        d="M -90 20 C -70 -30, -30 -50, 0 -20
           C 30 10, 50 -30, 80 -40
           C 110 -50, 130 -10, 150 10
           C 165 25, 175 20, 185 5
           L 195 -10 L 180 0 L 195 -5"
        fill="#3A5C3A"
        stroke="#2A4A2A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Belly highlight */}
      <path
        d="M -80 20 C -60 -15, -25 -30, 5 -8
           C 35 15, 55 -15, 82 -25
           C 108 -35, 128 -2, 148 14"
        fill="#5A7A4A"
        stroke="none"
      />

      {/* Dorsal spines/fins along ridge */}
      <path d="M -50 -30 L -55 -52 L -40 -35" fill="#3A5C3A" stroke="#2A4A2A" strokeWidth="1" />
      <path d="M -25 -42 L -28 -62 L -15 -45" fill="#3A5C3A" stroke="#2A4A2A" strokeWidth="1" />
      <path d="M 10 -18 L 8 -38 L 20 -20" fill="#3A5C3A" stroke="#2A4A2A" strokeWidth="1" />
      <path d="M 60 -32 L 58 -54 L 70 -38" fill="#3A5C3A" stroke="#2A4A2A" strokeWidth="1" />
      <path d="M 90 -45 L 88 -65 L 100 -48" fill="#3A5C3A" stroke="#2A4A2A" strokeWidth="1" />
      <path d="M 120 -30 L 118 -48 L 130 -32" fill="#3A5C3A" stroke="#2A4A2A" strokeWidth="1" />
      <path d="M 145 -5 L 143 -22 L 155 -8" fill="#3A5C3A" stroke="#2A4A2A" strokeWidth="1" />

      {/* Forked tail fin */}
      <path
        d="M 185 5 L 200 -20 Q 205 -30, 195 -25 L 185 -15
           M 185 5 L 205 15 Q 210 25, 200 18 L 190 10"
        fill="#3A5C3A"
        stroke="#2A4A2A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Dragon head */}
      <g transform="translate(-90, 15)">
        {/* Head shape */}
        <path
          d="M 0 0 C -15 -15, -35 -20, -45 -10
             C -55 0, -50 15, -40 18
             C -30 22, -10 15, 0 5 Z"
          fill="#3A5C3A"
          stroke="#2A4A2A"
          strokeWidth="2"
        />
        {/* Jaw */}
        <path
          d="M -40 18 C -45 22, -50 25, -48 28
             C -46 30, -35 28, -25 22 L -20 15"
          fill="#3A5C3A"
          stroke="#2A4A2A"
          strokeWidth="1.5"
        />
        {/* Teeth */}
        <path d="M -42 18 L -44 23 L -38 19" fill="#E8E0D0" stroke="none" />
        <path d="M -35 20 L -36 25 L -31 21" fill="#E8E0D0" stroke="none" />
        <path d="M -28 20 L -29 24 L -25 20" fill="#E8E0D0" stroke="none" />
        {/* Eye */}
        <circle cx="-30" cy="-5" r="4" fill="#D4A03A" />
        <circle cx="-31" cy="-6" r="1.5" fill="#1A1A0A" />
        {/* Nostril smoke wisps */}
        <path
          d="M -48 -8 Q -55 -15, -52 -25 Q -50 -30, -55 -35"
          fill="none"
          stroke="rgba(180,180,180,0.35)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M -46 -5 Q -52 -12, -48 -20 Q -46 -25, -50 -30"
          fill="none"
          stroke="rgba(180,180,180,0.25)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

function Galleon({ x, y, scale = 1, rotation = 0, mirrored = false, opacity = 0.38 }: ShipProps) {
  const scaleX = mirrored ? -scale : scale;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scale})`} opacity={opacity}>
      {/* Water wake */}
      <path
        d="M -45 52 Q -25 44, -5 52 Q 15 60, 35 52"
        fill="none"
        stroke="rgba(100,180,255,0.35)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M -35 58 Q -15 50, 5 58 Q 25 66, 45 58"
        fill="none"
        stroke="rgba(100,180,255,0.25)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M -25 64 Q -5 56, 15 64 Q 35 72, 50 64"
        fill="none"
        stroke="rgba(100,180,255,0.18)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* Hull — wide with pronounced shape */}
      <path
        d="M -45 35 C -40 50, 40 52, 45 35 L 40 15 C 30 20, -30 20, -40 15 Z"
        fill="#4A2A10"
        stroke="#2A1808"
        strokeWidth="1.8"
      />
      {/* Waterline highlight */}
      <path
        d="M -42 42 C -30 48, 30 50, 42 42"
        fill="none"
        stroke="rgba(120,90,50,0.5)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Planking lines */}
      <line x1="-32" y1="25" x2="32" y2="25" stroke="#2A1808" strokeWidth="0.5" opacity="0.5" />
      <line x1="-36" y1="32" x2="36" y2="32" stroke="#2A1808" strokeWidth="0.5" opacity="0.5" />
      <line x1="-33" y1="39" x2="33" y2="39" stroke="#2A1808" strokeWidth="0.5" opacity="0.4" />
      {/* Cannon ports */}
      <rect x="-25" y="27" width="4" height="3" rx="0.5" fill="#1A0A00" opacity="0.5" />
      <rect x="-14" y="27" width="4" height="3" rx="0.5" fill="#1A0A00" opacity="0.5" />
      <rect x="-3" y="27" width="4" height="3" rx="0.5" fill="#1A0A00" opacity="0.5" />
      <rect x="8" y="27" width="4" height="3" rx="0.5" fill="#1A0A00" opacity="0.5" />
      <rect x="19" y="27" width="4" height="3" rx="0.5" fill="#1A0A00" opacity="0.5" />

      {/* Stern castle — multi-deck */}
      <path
        d="M -40 15 L -44 0 L -42 -8 L -35 -12 L -28 -8 L -25 0 L -25 15"
        fill="#4A2A10"
        stroke="#2A1808"
        strokeWidth="1.2"
      />
      {/* Stern gallery windows */}
      <rect x="-40" y="-4" width="3.5" height="3.5" rx="0.5" fill="#D4A03A" opacity="0.55" />
      <rect x="-35" y="-4" width="3.5" height="3.5" rx="0.5" fill="#D4A03A" opacity="0.55" />
      <rect x="-30" y="-4" width="3.5" height="3.5" rx="0.5" fill="#D4A03A" opacity="0.55" />
      {/* Gold stern trim */}
      <line x1="-42" y1="2" x2="-26" y2="2" stroke="#D4A03A" strokeWidth="0.8" opacity="0.6" />
      <line x1="-43" y1="8" x2="-26" y2="8" stroke="#D4A03A" strokeWidth="0.6" opacity="0.5" />

      {/* Forecastle */}
      <path
        d="M 35 15 L 38 5 L 35 0 L 28 0 L 25 5 L 25 15"
        fill="#4A2A10"
        stroke="#2A1808"
        strokeWidth="1"
      />

      {/* Bowsprit */}
      <line x1="40" y1="18" x2="62" y2="2" stroke="#2A1808" strokeWidth="1.8" strokeLinecap="round" />
      {/* Jib sail */}
      <path
        d="M 62 2 L 15 -55 L 38 5 Z"
        fill="rgba(235,220,195,0.45)"
        stroke="rgba(180,170,150,0.3)"
        strokeWidth="0.6"
      />

      {/* Foremast */}
      <line x1="22" y1="15" x2="22" y2="-55" stroke="#2A1808" strokeWidth="1.8" strokeLinecap="round" />
      {/* Fore main sail */}
      <path
        d="M 20 -48 Q 42 -36, 40 -18 L 20 -18 Z"
        fill="rgba(235,220,195,0.65)"
        stroke="rgba(180,170,150,0.35)"
        strokeWidth="0.8"
      />
      {/* Fore main sail seam */}
      <line x1="20" y1="-34" x2="38" y2="-28" stroke="rgba(180,170,150,0.25)" strokeWidth="0.5" />
      {/* Fore topsail */}
      <path
        d="M 20 -52 Q 36 -48, 34 -38 L 20 -38 Z"
        fill="rgba(235,220,195,0.55)"
        stroke="rgba(180,170,150,0.3)"
        strokeWidth="0.6"
      />

      {/* Mainmast */}
      <line x1="0" y1="15" x2="0" y2="-68" stroke="#2A1808" strokeWidth="2.2" strokeLinecap="round" />
      {/* Crow's nest */}
      <rect x="-6" y="-68" width="12" height="5" rx="1" fill="#4A2A10" stroke="#2A1808" strokeWidth="0.8" />
      {/* Gold pennant flag */}
      <path d="M 0 -68 L 14 -74 L 0 -80" fill="#D4A03A" opacity="0.7" />
      {/* Main sail */}
      <path
        d="M -2 -60 Q 28 -44, 26 -18 L -2 -18 Z"
        fill="rgba(235,220,195,0.65)"
        stroke="rgba(180,170,150,0.35)"
        strokeWidth="1"
      />
      {/* Main sail seams */}
      <line x1="-2" y1="-42" x2="24" y2="-34" stroke="rgba(180,170,150,0.25)" strokeWidth="0.5" />
      <line x1="-2" y1="-28" x2="25" y2="-24" stroke="rgba(180,170,150,0.2)" strokeWidth="0.5" />
      {/* Main topsail */}
      <path
        d="M -2 -64 Q 18 -58, 16 -48 L -2 -48 Z"
        fill="rgba(235,220,195,0.55)"
        stroke="rgba(180,170,150,0.3)"
        strokeWidth="0.6"
      />
      {/* Main topsail seam */}
      <line x1="-2" y1="-56" x2="14" y2="-53" stroke="rgba(180,170,150,0.2)" strokeWidth="0.4" />

      {/* Mizzenmast */}
      <line x1="-22" y1="15" x2="-22" y2="-48" stroke="#2A1808" strokeWidth="1.5" strokeLinecap="round" />
      {/* Mizzen sail */}
      <path
        d="M -24 -42 Q -40 -32, -38 -15 L -24 -15 Z"
        fill="rgba(235,220,195,0.6)"
        stroke="rgba(180,170,150,0.3)"
        strokeWidth="0.8"
      />
      {/* Mizzen sail seam */}
      <line x1="-24" y1="-30" x2="-36" y2="-25" stroke="rgba(180,170,150,0.22)" strokeWidth="0.5" />
      {/* Mizzen topsail */}
      <path
        d="M -24 -46 Q -36 -42, -34 -34 L -24 -34 Z"
        fill="rgba(235,220,195,0.5)"
        stroke="rgba(180,170,150,0.25)"
        strokeWidth="0.6"
      />

      {/* Rigging — shrouds from hull rail to mast tops */}
      <line x1="-40" y1="5" x2="0" y2="-65" stroke="#2A1808" strokeWidth="0.4" opacity="0.35" />
      <line x1="40" y1="10" x2="0" y2="-65" stroke="#2A1808" strokeWidth="0.4" opacity="0.35" />
      <line x1="-35" y1="8" x2="-22" y2="-45" stroke="#2A1808" strokeWidth="0.4" opacity="0.35" />
      <line x1="38" y1="10" x2="22" y2="-52" stroke="#2A1808" strokeWidth="0.4" opacity="0.35" />
      {/* Stay lines between masts */}
      <line x1="-22" y1="-45" x2="0" y2="-65" stroke="#2A1808" strokeWidth="0.35" opacity="0.3" />
      <line x1="0" y1="-65" x2="22" y2="-52" stroke="#2A1808" strokeWidth="0.35" opacity="0.3" />
      <line x1="22" y1="-52" x2="62" y2="2" stroke="#2A1808" strokeWidth="0.35" opacity="0.3" />
    </g>
  );
}

function Caravel({ x, y, scale = 1, rotation = 0, mirrored = false, opacity = 0.34 }: ShipProps) {
  const scaleX = mirrored ? -scale : scale;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scale})`} opacity={opacity}>
      {/* Water wake */}
      <path
        d="M -35 42 Q -15 34, 5 42 Q 25 50, 40 42"
        fill="none"
        stroke="rgba(100,180,255,0.35)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M -25 48 Q -5 40, 15 48 Q 35 56, 48 48"
        fill="none"
        stroke="rgba(100,180,255,0.22)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* Hull — narrow, sleek */}
      <path
        d="M -32 28 C -28 40, 28 42, 32 28 L 28 12 C 18 16, -18 16, -28 12 Z"
        fill="#6B4423"
        stroke="#3A2A0A"
        strokeWidth="1.5"
      />
      {/* Waterline highlight */}
      <path
        d="M -28 35 C -18 40, 18 41, 28 35"
        fill="none"
        stroke="rgba(140,110,65,0.5)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      {/* Planking lines */}
      <line x1="-22" y1="22" x2="22" y2="22" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.5" />
      <line x1="-25" y1="28" x2="25" y2="28" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.45" />
      <line x1="-22" y1="34" x2="22" y2="34" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.4" />

      {/* Curved stempost at bow */}
      <path
        d="M 28 12 Q 35 8, 40 0 Q 42 -5, 38 -2"
        fill="none"
        stroke="#3A2A0A"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Small stern cabin */}
      <path
        d="M -28 12 L -30 2 L -26 -2 L -20 -2 L -18 2 L -18 12"
        fill="#6B4423"
        stroke="#3A2A0A"
        strokeWidth="1"
      />
      {/* Stern window */}
      <rect x="-27" y="3" width="3" height="3" rx="0.5" fill="#D4A03A" opacity="0.5" />
      <rect x="-22" y="3" width="3" height="3" rx="0.5" fill="#D4A03A" opacity="0.5" />

      {/* Foremast with lateen sail */}
      <line x1="14" y1="12" x2="14" y2="-42" stroke="#3A2A0A" strokeWidth="1.5" strokeLinecap="round" />
      {/* Lateen yard arm (diagonal) */}
      <line x1="2" y1="-5" x2="22" y2="-42" stroke="#3A2A0A" strokeWidth="1" strokeLinecap="round" />
      {/* Lateen sail — triangular */}
      <path
        d="M 14 -40 L 22 -42 Q 28 -25, 20 -5 L 14 -5 Z"
        fill="rgba(245,238,225,0.6)"
        stroke="rgba(180,170,150,0.35)"
        strokeWidth="0.8"
      />
      {/* Sail seam */}
      <line x1="14" y1="-24" x2="24" y2="-24" stroke="rgba(180,170,150,0.25)" strokeWidth="0.5" />

      {/* Mainmast with lateen sail */}
      <line x1="-5" y1="12" x2="-5" y2="-52" stroke="#3A2A0A" strokeWidth="1.8" strokeLinecap="round" />
      {/* Lateen yard arm (diagonal) */}
      <line x1="-18" y1="-2" x2="8" y2="-52" stroke="#3A2A0A" strokeWidth="1.2" strokeLinecap="round" />
      {/* Lateen sail — triangular */}
      <path
        d="M -5 -50 L 8 -52 Q 16 -30, 10 -2 L -5 -2 Z"
        fill="rgba(245,238,225,0.6)"
        stroke="rgba(180,170,150,0.35)"
        strokeWidth="0.8"
      />
      {/* Sail seams */}
      <line x1="-5" y1="-30" x2="12" y2="-30" stroke="rgba(180,170,150,0.25)" strokeWidth="0.5" />
      <line x1="-5" y1="-16" x2="11" y2="-14" stroke="rgba(180,170,150,0.2)" strokeWidth="0.5" />
      {/* Simple pennant */}
      <path d="M -5 -52 L 8 -56 L -5 -60" fill="#D4A03A" opacity="0.6" />

      {/* Rigging — shrouds */}
      <line x1="-26" y1="2" x2="-5" y2="-50" stroke="#3A2A0A" strokeWidth="0.4" opacity="0.35" />
      <line x1="30" y1="12" x2="-5" y2="-50" stroke="#3A2A0A" strokeWidth="0.4" opacity="0.35" />
      <line x1="30" y1="12" x2="14" y2="-40" stroke="#3A2A0A" strokeWidth="0.35" opacity="0.3" />
      {/* Stay between masts */}
      <line x1="-5" y1="-50" x2="14" y2="-40" stroke="#3A2A0A" strokeWidth="0.35" opacity="0.3" />
    </g>
  );
}

function Sloop({ x, y, scale = 1, rotation = 0, mirrored = false, opacity = 0.36 }: ShipProps) {
  const scaleX = mirrored ? -scale : scale;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scale})`} opacity={opacity}>
      {/* Water wake */}
      <path
        d="M -25 35 Q -8 28, 8 35 Q 24 42, 35 35"
        fill="none"
        stroke="rgba(100,180,255,0.3)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M -18 40 Q -2 34, 14 40 Q 30 46, 40 40"
        fill="none"
        stroke="rgba(100,180,255,0.2)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* Hull — compact */}
      <path
        d="M -24 25 C -20 36, 22 38, 26 25 L 22 10 C 14 14, -14 14, -20 10 Z"
        fill="#7A6B55"
        stroke="#4A3D30"
        strokeWidth="1.4"
      />
      {/* Waterline highlight */}
      <path
        d="M -20 31 C -12 35, 14 36, 22 31"
        fill="none"
        stroke="rgba(160,145,120,0.45)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
      {/* Planking lines */}
      <line x1="-16" y1="18" x2="16" y2="18" stroke="#4A3D30" strokeWidth="0.5" opacity="0.5" />
      <line x1="-18" y1="24" x2="20" y2="24" stroke="#4A3D30" strokeWidth="0.5" opacity="0.45" />
      <line x1="-16" y1="30" x2="18" y2="30" stroke="#4A3D30" strokeWidth="0.5" opacity="0.4" />

      {/* Single tall mast */}
      <line x1="2" y1="10" x2="2" y2="-55" stroke="#4A3D30" strokeWidth="1.8" strokeLinecap="round" />

      {/* Gaff (diagonal boom for gaff sail) */}
      <line x1="2" y1="-50" x2="20" y2="-58" stroke="#4A3D30" strokeWidth="1" strokeLinecap="round" />
      {/* Boom (lower sail edge) */}
      <line x1="2" y1="-5" x2="22" y2="-8" stroke="#4A3D30" strokeWidth="1" strokeLinecap="round" />

      {/* Gaff sail (fore-and-aft) — large quadrilateral */}
      <path
        d="M 2 -50 L 20 -58 Q 26 -35, 22 -8 L 2 -5 Z"
        fill="rgba(240,235,220,0.55)"
        stroke="rgba(180,170,150,0.35)"
        strokeWidth="0.8"
      />
      {/* Sail seams */}
      <line x1="2" y1="-34" x2="22" y2="-36" stroke="rgba(180,170,150,0.22)" strokeWidth="0.5" />
      <line x1="2" y1="-20" x2="22" y2="-22" stroke="rgba(180,170,150,0.18)" strokeWidth="0.5" />

      {/* Jib sail (triangle from mast top to bowsprit) */}
      <path
        d="M 2 -50 L 30 8 L 2 -5 Z"
        fill="rgba(240,235,220,0.45)"
        stroke="rgba(180,170,150,0.3)"
        strokeWidth="0.6"
      />
      {/* Jib seam */}
      <line x1="6" y1="-30" x2="18" y2="-4" stroke="rgba(180,170,150,0.18)" strokeWidth="0.4" />

      {/* Bowsprit */}
      <line x1="22" y1="12" x2="32" y2="5" stroke="#4A3D30" strokeWidth="1.2" strokeLinecap="round" />

      {/* Small pennant */}
      <path d="M 2 -55 L 10 -58 L 2 -61" fill="#D4A03A" opacity="0.55" />

      {/* Rigging — shrouds */}
      <line x1="-18" y1="5" x2="2" y2="-52" stroke="#4A3D30" strokeWidth="0.35" opacity="0.35" />
      <line x1="24" y1="10" x2="2" y2="-52" stroke="#4A3D30" strokeWidth="0.35" opacity="0.35" />
    </g>
  );
}

function SunkenShip() {
  return (
    <g transform="translate(2050, 1480)" opacity="0.35">
      {/* Tilted hull */}
      <g transform="rotate(25)">
        <path
          d="M -30 10 C -25 25, 25 30, 30 15 L 25 0 C 15 5, -15 5, -25 0 Z"
          fill="#5C3D1F"
          stroke="#3A2A0A"
          strokeWidth="1.5"
        />
        {/* Planking */}
        <line x1="-20" y1="10" x2="20" y2="12" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.5" />
        <line x1="-15" y1="18" x2="22" y2="20" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.4" />

        {/* Barnacles on hull */}
        <circle cx="-12" cy="14" r="1.5" fill="#5A6A5A" stroke="#4A5A4A" strokeWidth="0.5" opacity="0.6" />
        <circle cx="-6" cy="20" r="1.2" fill="#5A6A5A" stroke="#4A5A4A" strokeWidth="0.5" opacity="0.55" />
        <circle cx="5" cy="16" r="1.8" fill="#5A6A5A" stroke="#4A5A4A" strokeWidth="0.5" opacity="0.5" />
        <circle cx="15" cy="22" r="1.3" fill="#5A6A5A" stroke="#4A5A4A" strokeWidth="0.5" opacity="0.5" />
        <circle cx="10" cy="12" r="1" fill="#5A6A5A" stroke="#4A5A4A" strokeWidth="0.4" opacity="0.45" />

        {/* Broken mast — snapped at angle */}
        <line x1="0" y1="0" x2="-5" y2="-30" stroke="#3A2A0A" strokeWidth="2" strokeLinecap="round" />
        <line x1="-5" y1="-30" x2="-15" y2="-35" stroke="#3A2A0A" strokeWidth="1.5" strokeLinecap="round" />

        {/* Seaweed strands hanging from broken mast */}
        <path
          d="M -3 -15 Q -6 -8, -2 -2 Q 1 4, -2 10"
          fill="none"
          stroke="rgba(50,120,60,0.5)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M -8 -25 Q -12 -18, -8 -12 Q -5 -6, -9 0 Q -12 5, -8 10"
          fill="none"
          stroke="rgba(50,120,60,0.45)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M -10 -30 Q -14 -24, -10 -18 Q -7 -14, -11 -8"
          fill="none"
          stroke="rgba(60,130,70,0.4)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Tattered sail fragment */}
        <path
          d="M -5 -28 Q 5 -20, 8 -10 L -3 -10 Q -4 -18, -5 -28"
          fill="rgba(240,230,210,0.35)"
          stroke="rgba(180,170,150,0.3)"
          strokeWidth="0.8"
        />
        {/* Torn edge */}
        <path
          d="M 8 -10 L 10 -8 L 7 -6 L 9 -4"
          fill="none"
          stroke="rgba(180,170,150,0.3)"
          strokeWidth="0.8"
        />
      </g>

      {/* Waterline */}
      <path
        d="M -40 5 Q -20 -2, 0 5 Q 20 12, 40 5"
        fill="none"
        stroke="rgba(100,180,255,0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Bubbles */}
      <circle cx="5" cy="-5" r="2" fill="none" stroke="rgba(100,180,255,0.3)" strokeWidth="0.8" />
      <circle cx="12" cy="-12" r="1.5" fill="none" stroke="rgba(100,180,255,0.25)" strokeWidth="0.6" />
      <circle cx="8" cy="-18" r="1" fill="none" stroke="rgba(100,180,255,0.2)" strokeWidth="0.5" />
      <circle cx="-5" cy="-8" r="1.8" fill="none" stroke="rgba(100,180,255,0.25)" strokeWidth="0.7" />
      <circle cx="15" cy="-3" r="1.2" fill="none" stroke="rgba(100,180,255,0.2)" strokeWidth="0.5" />
      {/* Extra bubble */}
      <circle cx="-10" cy="-15" r="1.4" fill="none" stroke="rgba(100,180,255,0.22)" strokeWidth="0.6" />
    </g>
  );
}

function Siren() {
  return (
    <g transform="translate(100, 900)" opacity="0.36">
      {/* Rocks — organic shapes */}
      <path
        d="M -20 40 Q -15 20, 0 15 Q 15 10, 25 20 Q 35 30, 30 45 Q 20 50, 0 48 Q -15 46, -20 40"
        fill="#4A4A42"
        stroke="#3A3A32"
        strokeWidth="1.5"
      />
      <path
        d="M 25 35 Q 35 25, 48 28 Q 55 35, 50 45 Q 42 50, 30 45 Z"
        fill="#555548"
        stroke="#3A3A32"
        strokeWidth="1"
      />
      <path
        d="M -25 42 Q -35 35, -30 25 Q -22 20, -15 30 Q -18 40, -25 42"
        fill="#4A4A42"
        stroke="#3A3A32"
        strokeWidth="1"
      />

      {/* Fish tail — muted teal */}
      <path
        d="M 10 15 C 15 25, 30 30, 40 20
           C 50 10, 55 15, 60 5
           M 60 5 L 70 -5 Q 75 -10, 68 -8 L 60 5
           M 60 5 L 72 12 Q 78 18, 70 14 L 60 5"
        fill="#2E7D6D"
        stroke="#1E5D4D"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Tail scales hint */}
      <path d="M 25 22 Q 30 18, 35 22" fill="none" stroke="#1E5D4D" strokeWidth="0.6" opacity="0.6" />
      <path d="M 35 18 Q 40 14, 45 17" fill="none" stroke="#1E5D4D" strokeWidth="0.6" opacity="0.5" />

      {/* Simplified torso silhouette */}
      <path
        d="M 0 -10 C -8 -5, -10 5, -5 15
           C 0 20, 10 18, 12 15
           C 16 8, 12 -5, 5 -12 Z"
        fill="#2E7D6D"
        stroke="#1E5D4D"
        strokeWidth="1"
      />

      {/* Head */}
      <circle cx="2" cy="-18" r="8" fill="#2E7D6D" stroke="#1E5D4D" strokeWidth="1" />

      {/* Flowing gold hair */}
      <path
        d="M -5 -22 C -15 -20, -20 -10, -25 0
           Q -28 8, -22 12"
        fill="none"
        stroke="#D4A03A"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M -3 -24 C -10 -28, -18 -22, -22 -12
           Q -25 -5, -20 2"
        fill="none"
        stroke="#D4A03A"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M 5 -24 C 10 -30, 15 -25, 18 -18
           Q 20 -12, 18 -5"
        fill="none"
        stroke="#D4A03A"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Raised arm gesture */}
      <path
        d="M -5 -5 C -12 -15, -18 -25, -15 -35
           Q -13 -40, -10 -38 L -8 -35"
        fill="none"
        stroke="#2E7D6D"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Hand/fingers hint */}
      <path
        d="M -15 -35 L -18 -40 M -13 -37 L -14 -42 M -11 -36 L -10 -41"
        fill="none"
        stroke="#2E7D6D"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
  );
}

interface WaveGroupProps {
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
}

function WaveGroup({ x, y, rotation = 0, scale = 1 }: WaveGroupProps) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
      <path
        d="M 0 0 Q 15 -8, 30 0 Q 45 8, 60 0 Q 75 -8, 90 0"
        fill="none"
        stroke="rgba(100,180,255,0.45)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 5 10 Q 20 2, 35 10 Q 50 18, 65 10 Q 80 2, 95 10"
        fill="none"
        stroke="rgba(100,180,255,0.35)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 10 20 Q 25 12, 40 20 Q 55 28, 70 20 Q 85 12, 100 20"
        fill="none"
        stroke="rgba(100,180,255,0.25)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
  );
}

function WhirlpoolDecoration() {
  return (
    <g transform="translate(2300, 1100)" opacity="0.30">
      {/* Archimedean spiral via bezier */}
      <path
        d="M 0 0
           C 5 -3, 10 -8, 8 -14
           C 6 -20, -5 -22, -12 -18
           C -20 -14, -22 -2, -18 8
           C -14 18, 0 24, 12 22
           C 24 20, 30 8, 28 -6
           C 26 -20, 12 -30, -4 -30
           C -20 -30, -32 -16, -32 0
           C -32 16, -20 32, -2 34
           C 16 36, 34 24, 38 6"
        fill="none"
        stroke="rgba(100,180,255,0.4)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Inner spiral detail */}
      <path
        d="M 0 0 C 3 -2, 5 -5, 4 -8 C 3 -12, -2 -13, -6 -10 C -10 -7, -10 0, -6 5"
        fill="none"
        stroke="rgba(100,180,255,0.35)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Foam dots */}
      <circle cx="30" cy="15" r="1.5" fill="rgba(100,180,255,0.3)" />
      <circle cx="-25" cy="25" r="2" fill="rgba(100,180,255,0.25)" />
      <circle cx="35" cy="-15" r="1.2" fill="rgba(100,180,255,0.25)" />
      <circle cx="-30" cy="-20" r="1.8" fill="rgba(100,180,255,0.2)" />
      <circle cx="15" cy="30" r="1" fill="rgba(100,180,255,0.2)" />
      <circle cx="-10" cy="-28" r="1.5" fill="rgba(100,180,255,0.22)" />
      <circle cx="38" cy="0" r="1.3" fill="rgba(100,180,255,0.18)" />
    </g>
  );
}

function SeaMonsterTentacles() {
  return (
    <g transform="translate(1500, 1520)" opacity="0.30">
      {/* Tentacle 1 — curving left and up */}
      <path
        d="M 0 30 C -10 15, -15 0, -8 -15
           C -2 -28, 5 -35, 10 -45
           Q 12 -50, 8 -48"
        fill="none"
        stroke="#5A4A6A"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Suction cups tentacle 1 */}
      <circle cx="-8" cy="15" r="2.5" fill="none" stroke="#5A4A6A" strokeWidth="1" opacity="0.6" />
      <circle cx="-12" cy="2" r="2" fill="none" stroke="#5A4A6A" strokeWidth="1" opacity="0.5" />
      <circle cx="-6" cy="-12" r="1.8" fill="none" stroke="#5A4A6A" strokeWidth="0.8" opacity="0.5" />
      <circle cx="2" cy="-25" r="1.5" fill="none" stroke="#5A4A6A" strokeWidth="0.8" opacity="0.4" />
      <circle cx="8" cy="-38" r="1.2" fill="none" stroke="#5A4A6A" strokeWidth="0.6" opacity="0.3" />

      {/* Tentacle 2 — curving right and up */}
      <path
        d="M 30 35 C 40 20, 50 5, 45 -10
           C 40 -25, 35 -35, 38 -48
           Q 40 -55, 35 -50"
        fill="none"
        stroke="#5A4A6A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Suction cups tentacle 2 */}
      <circle cx="38" cy="18" r="2.2" fill="none" stroke="#5A4A6A" strokeWidth="1" opacity="0.6" />
      <circle cx="48" cy="2" r="1.8" fill="none" stroke="#5A4A6A" strokeWidth="0.8" opacity="0.5" />
      <circle cx="44" cy="-12" r="1.5" fill="none" stroke="#5A4A6A" strokeWidth="0.8" opacity="0.4" />
      <circle cx="38" cy="-28" r="1.3" fill="none" stroke="#5A4A6A" strokeWidth="0.6" opacity="0.35" />

      {/* Tentacle 3 — smaller, center */}
      <path
        d="M 15 28 C 18 18, 20 5, 18 -8
           C 16 -18, 20 -28, 22 -35
           Q 23 -40, 20 -36"
        fill="none"
        stroke="#5A4A6A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Suction cups tentacle 3 */}
      <circle cx="18" cy="12" r="1.8" fill="none" stroke="#5A4A6A" strokeWidth="0.8" opacity="0.5" />
      <circle cx="19" cy="-2" r="1.5" fill="none" stroke="#5A4A6A" strokeWidth="0.7" opacity="0.4" />
      <circle cx="17" cy="-15" r="1.2" fill="none" stroke="#5A4A6A" strokeWidth="0.6" opacity="0.35" />

      {/* Water disturbance around tentacles */}
      <path
        d="M -15 35 Q 0 28, 15 35 Q 30 42, 45 35"
        fill="none"
        stroke="rgba(100,180,255,0.25)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </g>
  );
}

export function MapDecorations() {
  return (
    <g className="map-decorations">
      {/* Text labels */}
      <HereBeDragonsText />
      <TerraIncognitaText />

      {/* Dragon illustration near bottom-left text */}
      <SeaDragon />

      {/* Sailing ships — three distinct types */}
      <Galleon x={350} y={180} scale={0.85} opacity={0.38} />
      <Caravel x={2280} y={750} scale={0.75} mirrored opacity={0.34} />
      <Sloop x={2100} y={1350} scale={0.7} rotation={-8} opacity={0.36} />

      {/* Sunken ship */}
      <SunkenShip />

      {/* Siren on rocks */}
      <Siren />

      {/* Wave groups scattered around edges */}
      <WaveGroup x={80} y={350} rotation={-10} scale={1.1} />
      <WaveGroup x={2200} y={400} rotation={5} />
      <WaveGroup x={150} y={750} rotation={-5} scale={0.9} />
      <WaveGroup x={2300} y={900} rotation={8} scale={0.85} />
      <WaveGroup x={900} y={1500} rotation={2} scale={1.0} />
      <WaveGroup x={1900} y={1520} rotation={-3} scale={0.9} />

      {/* Whirlpool */}
      <WhirlpoolDecoration />

      {/* Sea monster tentacles */}
      <SeaMonsterTentacles />
    </g>
  );
}
