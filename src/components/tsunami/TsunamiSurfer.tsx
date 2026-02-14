import type { SurferState } from '../../data/tsunami-data';

interface TsunamiSurferProps {
  state: SurferState;
}

export const TsunamiSurfer: React.FC<TsunamiSurferProps> = ({ state }) => {
  // Rotation based on state
  const rotation =
    state === 'surfing' ? -12 :
    state === 'riding' ? -3 :
    state === 'struggling' ? 5 :
    10;

  // How much of the turtle is visible (clip from bottom)
  // For drowning, clip most of the body
  const clipPercent =
    state === 'drowning' ? 55 :
    state === 'struggling' ? 20 :
    0;

  // Glow color
  const glowColor =
    state === 'surfing' ? 'rgba(76, 175, 80, 0.7)' :
    state === 'riding' ? 'rgba(212, 160, 58, 0.5)' :
    state === 'struggling' ? 'rgba(255, 152, 0, 0.6)' :
    'rgba(244, 67, 54, 0.7)';

  return (
    <div
      className={`surfer surfer--${state}`}
      style={{
        filter: `drop-shadow(0 0 12px ${glowColor})`,
      }}
    >
      <svg
        viewBox="0 0 120 90"
        width="120"
        height="90"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.6s ease-out',
        }}
      >
        <defs>
          <clipPath id="water-clip">
            <rect x="0" y="0" width="120" height={90 - clipPercent * 0.9} />
          </clipPath>
        </defs>

        <g clipPath={clipPercent > 0 ? 'url(#water-clip)' : undefined}>
          {/* ===== SURFBOARD ===== */}
          <g className={state === 'drowning' ? 'board-drifting' : ''}>
            <ellipse cx="60" cy="68" rx="40" ry="7" fill="#6D4C2A" />
            {/* Board stripe */}
            <ellipse cx="60" cy="68" rx="34" ry="3" fill="#D4A03A" opacity="0.8" />
            {/* Board shine */}
            <ellipse cx="45" cy="66" rx="12" ry="1.5" fill="#fff" opacity="0.15" />
          </g>

          {/* ===== TURTLE BODY ===== */}
          {/* Shell (main) */}
          <ellipse cx="60" cy="48" rx="22" ry="18" fill="#2E7D32" />
          {/* Shell pattern — hexagonal plates */}
          <ellipse cx="60" cy="48" rx="18" ry="14" fill="none" stroke="#388E3C" strokeWidth="1.5" />
          <line x1="60" y1="34" x2="60" y2="62" stroke="#388E3C" strokeWidth="1" opacity="0.6" />
          <line x1="42" y1="48" x2="78" y2="48" stroke="#388E3C" strokeWidth="1" opacity="0.6" />
          <line x1="48" y1="36" x2="72" y2="60" stroke="#388E3C" strokeWidth="0.8" opacity="0.4" />
          <line x1="72" y1="36" x2="48" y2="60" stroke="#388E3C" strokeWidth="0.8" opacity="0.4" />
          {/* Shell highlight */}
          <ellipse cx="55" cy="42" rx="8" ry="5" fill="#4CAF50" opacity="0.4" />

          {/* ===== HEAD ===== */}
          <ellipse cx="60" cy="28" rx="9" ry="8" fill="#43A047" />
          {/* Cheeks */}
          <circle cx="54" cy="30" r="2" fill="#66BB6A" opacity="0.5" />
          <circle cx="66" cy="30" r="2" fill="#66BB6A" opacity="0.5" />
          {/* Eyes */}
          <circle cx="56" cy="26" r="2.5" fill="#fff" />
          <circle cx="64" cy="26" r="2.5" fill="#fff" />
          <circle cx={state === 'surfing' ? '57' : '56.5'} cy="26" r="1.3" fill="#1a1a1a" />
          <circle cx={state === 'surfing' ? '65' : '64.5'} r="1.3" cy="26" fill="#1a1a1a" />
          {/* Determined expression for surfing, worried for struggling/drowning */}
          {state === 'surfing' || state === 'riding' ? (
            <path d="M56,31 Q60,34 64,31" fill="none" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" />
          ) : (
            <path d="M56,32 Q60,30 64,32" fill="none" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" />
          )}

          {/* ===== FLIPPERS ===== */}
          {state === 'surfing' ? (
            /* Surfing: arms wide, confident */
            <>
              <ellipse cx="35" cy="42" rx="12" ry="5" fill="#2E7D32" transform="rotate(-25, 35, 42)" />
              <ellipse cx="85" cy="38" rx="12" ry="5" fill="#2E7D32" transform="rotate(30, 85, 38)" />
            </>
          ) : state === 'riding' ? (
            /* Riding: arms at sides, relaxed */
            <>
              <ellipse cx="38" cy="50" rx="10" ry="5" fill="#2E7D32" transform="rotate(-10, 38, 50)" />
              <ellipse cx="82" cy="50" rx="10" ry="5" fill="#2E7D32" transform="rotate(10, 82, 50)" />
            </>
          ) : state === 'struggling' ? (
            /* Struggling: arms reaching up */
            <>
              <ellipse cx="38" cy="38" rx="10" ry="5" fill="#2E7D32" transform="rotate(-50, 38, 38)" />
              <ellipse cx="82" cy="38" rx="10" ry="5" fill="#2E7D32" transform="rotate(50, 82, 38)" />
            </>
          ) : (
            /* Drowning: one arm reaching up */
            <>
              <ellipse cx="52" cy="26" rx="10" ry="4" fill="#2E7D32" transform="rotate(-75, 52, 26)" />
            </>
          )}

          {/* Back flippers (hidden when drowning) */}
          {state !== 'drowning' && (
            <>
              <ellipse cx="44" cy="62" rx="8" ry="4" fill="#2E7D32" transform="rotate(-15, 44, 62)" />
              <ellipse cx="76" cy="62" rx="8" ry="4" fill="#2E7D32" transform="rotate(15, 76, 62)" />
            </>
          )}

          {/* Tail */}
          {state !== 'drowning' && (
            <ellipse cx="60" cy="66" rx="4" ry="3" fill="#2E7D32" />
          )}
        </g>

        {/* ===== SPRAY PARTICLES (surfing only) ===== */}
        {state === 'surfing' && (
          <g className="spray-particles">
            <circle cx="92" cy="55" r="2.5" fill="#fff" opacity="0.8" />
            <circle cx="98" cy="50" r="2" fill="#fff" opacity="0.6" />
            <circle cx="88" cy="48" r="1.8" fill="#fff" opacity="0.7" />
            <circle cx="95" cy="60" r="1.5" fill="#fff" opacity="0.5" />
            <circle cx="100" cy="56" r="1.2" fill="#4fc3f7" opacity="0.4" />
          </g>
        )}

        {/* ===== WATER SPLASH (struggling) ===== */}
        {state === 'struggling' && (
          <g className="splash-particles">
            <circle cx="30" cy="55" r="2" fill="#4fc3f7" opacity="0.5" />
            <circle cx="90" cy="55" r="2" fill="#4fc3f7" opacity="0.5" />
            <circle cx="35" cy="50" r="1.5" fill="#fff" opacity="0.4" />
            <circle cx="85" cy="50" r="1.5" fill="#fff" opacity="0.4" />
          </g>
        )}

        {/* ===== BUBBLES (drowning) ===== */}
        {state === 'drowning' && (
          <g className="bubble-particles">
            <circle cx="55" cy="45" r="2" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.5" />
            <circle cx="65" cy="50" r="1.5" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
            <circle cx="58" cy="55" r="1" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
          </g>
        )}
      </svg>
    </div>
  );
};
