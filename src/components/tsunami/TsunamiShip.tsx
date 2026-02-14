import type { SurferState } from '../../data/tsunami-data';

interface TsunamiShipProps {
  tier: 1 | 2 | 3 | 4 | 5;
  state: SurferState;
}

const CYAN_GLOW = '#00FFDD';
const DARK_HULL = '#1a2535';
const METAL_HULL = '#2a3040';
const WOOD_HULL = '#5C3A1E';
const CHROME = '#A8A9AD';

export const TsunamiShip: React.FC<TsunamiShipProps> = ({ tier, state }) => {
  // Glow color based on state
  const glowColor =
    state === 'surfing' ? 'rgba(0, 255, 221, 0.6)' :
    state === 'riding' ? 'rgba(0, 255, 221, 0.3)' :
    state === 'struggling' ? 'rgba(255, 152, 0, 0.4)' :
    'rgba(244, 67, 54, 0.5)';

  const tierClass = `ship ship--tier${tier}`;

  return (
    <div
      className={tierClass}
      style={{
        filter: tier >= 4 ? `drop-shadow(0 0 16px ${glowColor})` : 'none',
      }}
    >
      <svg
        viewBox="0 0 200 120"
        width="200"
        height="120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ClipPath for wreckage (tier 1) */}
          <clipPath id="wreckage-clip">
            <rect x="0" y="0" width="200" height="60" />
          </clipPath>

          {/* Gradient for shield dome */}
          <radialGradient id="shield-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor={CYAN_GLOW} stopOpacity="0.3" />
            <stop offset="100%" stopColor={CYAN_GLOW} stopOpacity="0.05" />
          </radialGradient>

          {/* Gradient for AI orb */}
          <radialGradient id="orb-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor={CYAN_GLOW} stopOpacity="0.7" />
            <stop offset="100%" stopColor={CYAN_GLOW} stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* ===== TIER 5: QUANTUM ARK ===== */}
        {tier === 5 && (
          <g>
            {/* Shield dome */}
            <ellipse
              cx="100"
              cy="45"
              rx="70"
              ry="35"
              fill="url(#shield-glow)"
              opacity="0.6"
              className="shield-pulse"
            />

            {/* Hull */}
            <path
              d="M 20,65 C 20,55 40,35 100,32 C 160,35 180,55 180,65 L 175,72 C 120,78 80,78 25,72 Z"
              fill={DARK_HULL}
            />

            {/* Circuit lines on hull */}
            <path
              d="M 40,50 L 60,50 L 65,45 M 80,48 L 100,48 M 120,48 L 140,48 L 145,53"
              stroke={CYAN_GLOW}
              strokeWidth="1.5"
              fill="none"
              opacity="0.8"
              className="circuit-glow"
            />
            <path
              d="M 50,60 L 70,60 M 90,58 L 110,58 M 130,60 L 150,60"
              stroke={CYAN_GLOW}
              strokeWidth="1"
              fill="none"
              opacity="0.6"
              className="circuit-glow"
            />

            {/* Deck structure */}
            <rect x="85" y="32" width="30" height="18" rx="2" fill={DARK_HULL} opacity="0.9" />
            <rect x="88" y="35" width="24" height="3" fill={CYAN_GLOW} opacity="0.3" />

            {/* AI Navigation orb */}
            <circle cx="100" cy="25" r="8" fill="url(#orb-glow)" className="orb-pulse" />
            <circle cx="100" cy="25" r="4" fill="#ffffff" opacity="0.9" />

            {/* Antenna array */}
            <line x1="95" y1="25" x2="95" y2="15" stroke={CHROME} strokeWidth="1" />
            <line x1="105" y1="25" x2="105" y2="15" stroke={CHROME} strokeWidth="1" />
            <circle cx="95" cy="15" r="2" fill={CYAN_GLOW} opacity="0.8" />
            <circle cx="105" cy="15" r="2" fill={CYAN_GLOW} opacity="0.8" />

            {/* Thrusters */}
            <ellipse cx="30" cy="70" rx="6" ry="3" fill={CYAN_GLOW} opacity="0.7" />
            <ellipse cx="170" cy="70" rx="6" ry="3" fill={CYAN_GLOW} opacity="0.7" />
            <ellipse cx="25" cy="72" rx="8" ry="2" fill={CYAN_GLOW} opacity="0.3" className="thruster-trail" />
            <ellipse cx="165" cy="72" rx="8" ry="2" fill={CYAN_GLOW} opacity="0.3" className="thruster-trail" />

            {/* Captain (Turtleand avatar) */}
            <image href="/assets/turtleand-avatar.png" x="85" y="8" width="30" height="30" />
          </g>
        )}

        {/* ===== TIER 4: NEURAL CRUISER ===== */}
        {tier === 4 && (
          <g>
            {/* Hull */}
            <path
              d="M 20,65 C 20,55 40,35 100,32 C 160,35 180,55 180,65 L 175,72 C 120,78 80,78 25,72 Z"
              fill={DARK_HULL}
            />

            {/* Dimmer circuit lines */}
            <path
              d="M 40,50 L 60,50 L 65,45 M 80,48 L 100,48 M 120,48 L 140,48 L 145,53"
              stroke={CYAN_GLOW}
              strokeWidth="1"
              fill="none"
              opacity="0.4"
            />

            {/* Deck structure */}
            <rect x="85" y="35" width="30" height="15" rx="2" fill={DARK_HULL} opacity="0.8" />

            {/* Radar dish */}
            <ellipse cx="100" cy="28" rx="12" ry="3" fill={CHROME} opacity="0.7" />
            <line x1="100" y1="28" x2="100" y2="20" stroke={CHROME} strokeWidth="2" />
            <circle cx="100" cy="20" r="3" fill={CYAN_GLOW} opacity="0.5" />

            {/* Single thruster */}
            <ellipse cx="100" cy="70" rx="5" ry="2.5" fill={CYAN_GLOW} opacity="0.4" />

            {/* Captain */}
            <image href="/assets/turtleand-avatar.png" x="85" y="10" width="30" height="30" />
          </g>
        )}

        {/* ===== TIER 3: THE ANALOG ===== */}
        {tier === 3 && (
          <g>
            {/* Hull - plain metal */}
            <path
              d="M 20,65 C 20,55 40,35 100,32 C 160,35 180,55 180,65 L 175,72 C 120,78 80,78 25,72 Z"
              fill={METAL_HULL}
            />

            {/* Metal rivets */}
            <circle cx="50" cy="55" r="1.5" fill={CHROME} opacity="0.5" />
            <circle cx="70" cy="52" r="1.5" fill={CHROME} opacity="0.5" />
            <circle cx="90" cy="50" r="1.5" fill={CHROME} opacity="0.5" />
            <circle cx="110" cy="50" r="1.5" fill={CHROME} opacity="0.5" />
            <circle cx="130" cy="52" r="1.5" fill={CHROME} opacity="0.5" />
            <circle cx="150" cy="55" r="1.5" fill={CHROME} opacity="0.5" />

            {/* Basic cabin */}
            <rect x="80" y="38" width="40" height="18" rx="2" fill={METAL_HULL} />
            <rect x="85" y="42" width="10" height="8" fill="#4a5568" opacity="0.6" />
            <rect x="105" y="42" width="10" height="8" fill="#4a5568" opacity="0.6" />

            {/* Small antenna */}
            <line x1="100" y1="38" x2="100" y2="28" stroke={CHROME} strokeWidth="1.5" />
            <circle cx="100" cy="28" r="2" fill="#ff6b6b" />

            {/* Captain */}
            <image href="/assets/turtleand-avatar.png" x="85" y="12" width="30" height="30" />
          </g>
        )}

        {/* ===== TIER 2: THE DRIFTER ===== */}
        {tier === 2 && (
          <g>
            {/* Wooden hull (boxier shape) */}
            <path
              d="M 30,68 L 30,55 L 50,45 L 100,40 L 150,45 L 170,55 L 170,68 L 160,74 L 40,74 Z"
              fill={WOOD_HULL}
            />

            {/* Wood grain lines */}
            <line x1="35" y1="50" x2="165" y2="50" stroke="#4a3520" strokeWidth="1" opacity="0.4" />
            <line x1="40" y1="60" x2="160" y2="60" stroke="#4a3520" strokeWidth="1" opacity="0.4" />
            <line x1="45" y1="70" x2="155" y2="70" stroke="#4a3520" strokeWidth="1" opacity="0.4" />

            {/* Crack/damage lines */}
            <path d="M 60,65 L 65,55 L 63,50" stroke="#2d1f10" strokeWidth="1.5" fill="none" />
            <path d="M 140,62 L 135,52" stroke="#2d1f10" strokeWidth="1.5" fill="none" />

            {/* Water inside hull */}
            <ellipse cx="100" cy="72" rx="50" ry="4" fill="#4fc3f7" opacity="0.6" />

            {/* Torn sail */}
            <line x1="100" y1="40" x2="100" y2="10" stroke={WOOD_HULL} strokeWidth="3" />
            <path
              d="M 100,12 L 130,20 L 125,35 L 100,38 Z"
              fill="#e8d7c3"
              opacity="0.7"
            />
            {/* Tear in sail */}
            <path d="M 115,22 L 120,28 L 118,32" stroke="#b08968" strokeWidth="1.5" fill="none" />

            {/* Captain (lower, clinging on) */}
            <image href="/assets/turtleand-avatar.png" x="85" y="28" width="30" height="30" />
          </g>
        )}

        {/* ===== TIER 1: WRECKAGE ===== */}
        {tier === 1 && (
          <g clipPath="url(#wreckage-clip)">
            {/* Broken planks floating */}
            <rect x="40" y="45" width="50" height="8" rx="1" fill={WOOD_HULL} transform="rotate(-15 65 49)" />
            <rect x="110" y="50" width="40" height="6" rx="1" fill={WOOD_HULL} transform="rotate(12 130 53)" />
            <rect x="70" y="58" width="30" height="7" rx="1" fill={WOOD_HULL} transform="rotate(-8 85 61)" />
            <rect x="95" y="40" width="35" height="10" rx="1" fill={WOOD_HULL} transform="rotate(5 112 45)" />

            {/* Wood grain on planks */}
            <line x1="45" y1="48" x2="85" y2="48" stroke="#4a3520" strokeWidth="0.5" opacity="0.5" transform="rotate(-15 65 48)" />
            <line x1="115" y1="52" x2="145" y2="52" stroke="#4a3520" strokeWidth="0.5" opacity="0.5" transform="rotate(12 130 52)" />

            {/* Rope/debris */}
            <path d="M 60,52 Q 75,48 90,54" stroke="#8b7355" strokeWidth="2" fill="none" opacity="0.6" />

            {/* Bubbles rising */}
            <circle cx="55" cy="65" r="3" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" className="bubble-rise-1" />
            <circle cx="145" cy="68" r="2.5" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.3" className="bubble-rise-2" />
            <circle cx="100" cy="70" r="2" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.3" className="bubble-rise-3" />

            {/* Captain clinging to largest plank */}
            <image href="/assets/turtleand-avatar.png" x="95" y="32" width="25" height="25" />
          </g>
        )}
      </svg>
    </div>
  );
};
