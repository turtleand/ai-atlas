import { motion } from 'motion/react';

interface TsunamiSurferProps {
  score: number;
  wavePercent: number;
  state: 'surfing' | 'riding' | 'struggling' | 'drowning';
}

export const TsunamiSurfer: React.FC<TsunamiSurferProps> = ({ score, state }) => {
  // Map score (0-100) to vertical position within wave area
  const verticalPosition = `${100 - score}%`;

  // State-specific transforms and visibility
  const getStateStyles = () => {
    switch (state) {
      case 'surfing':
        return { rotation: -10, boardOffset: 0 };
      case 'riding':
        return { rotation: 0, boardOffset: 0 };
      case 'struggling':
        return { rotation: 5, boardOffset: 0 };
      case 'drowning':
        return { rotation: 8, boardOffset: 15 };
    }
  };

  const { rotation, boardOffset } = getStateStyles();

  return (
    <motion.g
      className={`surfer ${state}`}
      initial={{ y: verticalPosition }}
      animate={{ y: verticalPosition }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      {/* Surfboard */}
      <g transform={`translate(${boardOffset}, 0)`}>
        <ellipse
          cx="60"
          cy="50"
          rx="35"
          ry="8"
          fill="#8B4513"
          opacity={state === 'drowning' ? 0.7 : 1}
        />
        <ellipse
          cx="60"
          cy="50"
          rx="30"
          ry="3"
          fill="#D4A03A"
        />
      </g>

      {/* Turtle body */}
      <g transform={`rotate(${rotation}, 60, 40)`}>
        {/* Shell */}
        <ellipse
          cx="60"
          cy="40"
          rx="20"
          ry="16"
          fill="#2E7D32"
          filter={
            state === 'surfing' ? 'url(#glow-green)' :
            state === 'riding' ? 'url(#glow-amber)' :
            state === 'struggling' ? 'url(#glow-amber-red)' :
            'url(#glow-red)'
          }
        />
        
        {/* Shell pattern */}
        <g opacity="0.6">
          <polygon points="60,28 67,35 60,42 53,35" fill="#388E3C" />
          <polygon points="60,42 67,49 60,56 53,49" fill="#388E3C" />
          <polygon points="50,35 57,42 50,49 43,42" fill="#4CAF50" />
          <polygon points="70,35 77,42 70,49 63,42" fill="#4CAF50" />
        </g>

        {/* Head */}
        <circle
          cx="60"
          cy={state === 'drowning' ? '22' : '25'}
          r="7"
          fill="#2E7D32"
        />
        
        {/* Eyes */}
        <circle cx="58" cy="24" r="1.5" fill="#000" />
        <circle cx="62" cy="24" r="1.5" fill="#000" />
        
        {/* Front flippers */}
        {state === 'surfing' ? (
          <>
            <ellipse cx="45" cy="38" rx="8" ry="4" fill="#2E7D32" transform="rotate(-30, 45, 38)" />
            <ellipse cx="75" cy="30" rx="8" ry="4" fill="#2E7D32" transform="rotate(45, 75, 30)" />
          </>
        ) : state === 'struggling' ? (
          <>
            <ellipse cx="42" cy="45" rx="8" ry="4" fill="#2E7D32" transform="rotate(-60, 42, 45)" />
            <ellipse cx="78" cy="45" rx="8" ry="4" fill="#2E7D32" transform="rotate(60, 78, 45)" />
          </>
        ) : state === 'drowning' ? (
          <>
            <ellipse cx="52" cy="18" rx="8" ry="4" fill="#2E7D32" transform="rotate(-80, 52, 18)" />
          </>
        ) : (
          <>
            <ellipse cx="45" cy="40" rx="8" ry="4" fill="#2E7D32" transform="rotate(-15, 45, 40)" />
            <ellipse cx="75" cy="40" rx="8" ry="4" fill="#2E7D32" transform="rotate(15, 75, 40)" />
          </>
        )}
        
        {/* Back flippers */}
        {state !== 'drowning' && (
          <>
            <ellipse cx="48" cy="50" rx="7" ry="3" fill="#2E7D32" transform="rotate(-20, 48, 50)" />
            <ellipse cx="72" cy="50" rx="7" ry="3" fill="#2E7D32" transform="rotate(20, 72, 50)" />
          </>
        )}
        
        {/* Tail */}
        {state !== 'drowning' && (
          <ellipse cx="60" cy="56" rx="3" ry="4" fill="#2E7D32" />
        )}
      </g>

      {/* Spray particles for surfing state */}
      {state === 'surfing' && (
        <g className="spray-particles">
          <circle cx="80" cy="35" r="2" fill="#fff" opacity="0.8">
            <animate attributeName="cy" values="35;30;35" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="85" cy="40" r="1.5" fill="#fff" opacity="0.7">
            <animate attributeName="cy" values="40;35;40" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="75" cy="32" r="1.8" fill="#fff" opacity="0.6">
            <animate attributeName="cy" values="32;28;32" dur="0.9s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Wobble animation for struggling */}
      {state === 'struggling' && (
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 60 40; 3 60 40; -3 60 40; 0 60 40"
          dur="1.5s"
          repeatCount="indefinite"
        />
      )}

      {/* Slow sink for drowning */}
      {state === 'drowning' && (
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 3; 0 0"
          dur="3s"
          repeatCount="indefinite"
        />
      )}

      {/* Glow filters */}
      <defs>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow-amber-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </motion.g>
  );
};
