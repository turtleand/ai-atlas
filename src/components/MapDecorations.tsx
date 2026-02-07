interface SailingShipProps {
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
        stroke="rgba(212,160,58,0.22)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 350 12 Q 360 20, 370 14 Q 375 8, 365 6"
        fill="none"
        stroke="rgba(212,160,58,0.18)"
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
        stroke="rgba(212,160,58,0.22)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

function SeaDragon() {
  return (
    <g transform="translate(280, 1320)" opacity="0.25">
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

function SailingShip({ x, y, scale = 1, rotation = 0, mirrored = false, opacity = 0.24 }: SailingShipProps) {
  const scaleX = mirrored ? -scale : scale;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scale})`} opacity={opacity}>
      {/* Hull */}
      <path
        d="M -35 30 C -30 45, 30 45, 35 30 L 30 15 C 20 20, -20 20, -30 15 Z"
        fill="#5C3D1F"
        stroke="#3A2A0A"
        strokeWidth="1.5"
      />
      {/* Planking lines */}
      <line x1="-25" y1="25" x2="25" y2="25" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.5" />
      <line x1="-28" y1="32" x2="28" y2="32" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.5" />
      <line x1="-22" y1="38" x2="22" y2="38" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.4" />

      {/* Stern castle */}
      <path
        d="M -30 15 L -32 5 L -25 0 L -20 5 L -20 15"
        fill="#5C3D1F"
        stroke="#3A2A0A"
        strokeWidth="1"
      />
      {/* Stern windows */}
      <rect x="-29" y="6" width="3" height="3" rx="0.5" fill="#D4A03A" opacity="0.5" />
      <rect x="-25" y="6" width="3" height="3" rx="0.5" fill="#D4A03A" opacity="0.5" />

      {/* Bowsprit */}
      <line x1="30" y1="18" x2="50" y2="5" stroke="#3A2A0A" strokeWidth="1.5" strokeLinecap="round" />

      {/* Main mast */}
      <line x1="0" y1="15" x2="0" y2="-55" stroke="#3A2A0A" strokeWidth="2" strokeLinecap="round" />
      {/* Crow's nest */}
      <rect x="-5" y="-55" width="10" height="5" rx="1" fill="#5C3D1F" stroke="#3A2A0A" strokeWidth="0.8" />
      {/* Gold pennant flag */}
      <path d="M 0 -55 L 12 -60 L 0 -65" fill="#D4A03A" opacity="0.7" />

      {/* Main sail (billowing) */}
      <path
        d="M -2 -48 Q 22 -35, 20 -10 L -2 -10 Z"
        fill="rgba(240,230,210,0.6)"
        stroke="rgba(180,170,150,0.4)"
        strokeWidth="1"
      />
      {/* Sail detail lines */}
      <line x1="-2" y1="-30" x2="18" y2="-25" stroke="rgba(180,170,150,0.3)" strokeWidth="0.5" />

      {/* Foremast */}
      <line x1="18" y1="15" x2="18" y2="-35" stroke="#3A2A0A" strokeWidth="1.5" strokeLinecap="round" />
      {/* Fore sail */}
      <path
        d="M 16 -32 Q 32 -22, 30 -5 L 16 -5 Z"
        fill="rgba(240,230,210,0.55)"
        stroke="rgba(180,170,150,0.35)"
        strokeWidth="0.8"
      />

      {/* Rigging lines */}
      <line x1="-25" y1="5" x2="0" y2="-50" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.4" />
      <line x1="35" y1="18" x2="0" y2="-50" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.4" />
      <line x1="0" y1="-50" x2="18" y2="-32" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.4" />
      <line x1="35" y1="18" x2="18" y2="-32" stroke="#3A2A0A" strokeWidth="0.5" opacity="0.4" />
    </g>
  );
}

function SunkenShip() {
  return (
    <g transform="translate(2050, 1480)" opacity="0.22">
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

        {/* Broken mast — snapped at angle */}
        <line x1="0" y1="0" x2="-5" y2="-30" stroke="#3A2A0A" strokeWidth="2" strokeLinecap="round" />
        <line x1="-5" y1="-30" x2="-15" y2="-35" stroke="#3A2A0A" strokeWidth="1.5" strokeLinecap="round" />

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
    </g>
  );
}

function Siren() {
  return (
    <g transform="translate(100, 900)" opacity="0.22">
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
        stroke="rgba(100,180,255,0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 5 10 Q 20 2, 35 10 Q 50 18, 65 10 Q 80 2, 95 10"
        fill="none"
        stroke="rgba(100,180,255,0.22)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 10 20 Q 25 12, 40 20 Q 55 28, 70 20 Q 85 12, 100 20"
        fill="none"
        stroke="rgba(100,180,255,0.15)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
  );
}

function WhirlpoolDecoration() {
  return (
    <g transform="translate(2300, 1100)" opacity="0.18">
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
    <g transform="translate(1500, 1520)" opacity="0.18">
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

      {/* Sailing ships scattered around edges */}
      <SailingShip x={350} y={180} scale={0.8} opacity={0.24} />
      <SailingShip x={2280} y={750} scale={0.7} mirrored opacity={0.20} />
      <SailingShip x={2100} y={1350} scale={0.65} rotation={-8} opacity={0.22} />

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
