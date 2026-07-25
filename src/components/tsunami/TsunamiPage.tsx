import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { TsunamiNav } from './TsunamiNav';
import { StormScene } from './StormScene';
import { ScoreDisplay } from './ScoreDisplay';
import { TierPreview } from './TierPreview';
import { SkillSliders } from './SkillSliders';
import {
  SKILL_DIMENSIONS,
  calculateDaysSinceStart,
  calculateWavePercent,
  calculateCompositeScore,
  calculateTier,
  getTierScorePreset,
} from '../../data/tsunami-data';
import '../../styles/tsunami.css';

const STORAGE_KEY = 'tsunami-tracker-scores';

function getDefaultScores(): Record<string, number> {
  return SKILL_DIMENSIONS.reduce((defaults, dimension) => {
    defaults[dimension.id] = dimension.defaultValue;
    return defaults;
  }, {} as Record<string, number>);
}

function hasValidScores(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object') return false;
  const scores = value as Record<string, unknown>;
  return SKILL_DIMENSIONS.every((dimension) => {
    const score = scores[dimension.id];
    return typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100;
  });
}

function getInitialScores(): Record<string, number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      // Migrate old "traditionalDependence" → "aiIndependence" (inverted)
      if (
        typeof parsed.traditionalDependence === 'number'
        && typeof parsed.aiIndependence !== 'number'
      ) {
        parsed.aiIndependence = 100 - parsed.traditionalDependence;
        delete parsed.traditionalDependence;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch {
          // The migrated values can still be used for this session.
        }
      }
      if (hasValidScores(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return getDefaultScores();
}

export const TsunamiPage: React.FC = () => {
  // Override global overflow:hidden so page can scroll on mobile
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const els = [html, body, root].filter(Boolean) as HTMLElement[];
    // Force override with !important via style attribute for maximum specificity
    els.forEach(el => {
      el.style.setProperty('overflow', 'visible', 'important');
      el.style.setProperty('height', 'auto', 'important');
    });
    // Also add a class for CSS-based overrides
    body.classList.add('tsunami-active');
    return () => {
      els.forEach(el => {
        el.style.removeProperty('overflow');
        el.style.removeProperty('height');
      });
      body.classList.remove('tsunami-active');
    };
  }, []);

  const [userScores, setUserScores] = useState(getInitialScores);
  const [previewTier, setPreviewTier] = useState<number | null>(null);

  const daysSinceStart = calculateDaysSinceStart();
  const wavePercent = calculateWavePercent();
  const compositeScore = calculateCompositeScore(userScores);
  const actualTier = calculateTier(compositeScore);

  const displayTier = previewTier ?? actualTier;
  const displayScores = previewTier ? getTierScorePreset(previewTier) : userScores;
  const displayScore = calculateCompositeScore(displayScores);

  const handleScoresChange = useCallback((newScores: Record<string, number>) => {
    setUserScores(newScores);
    setPreviewTier(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newScores));
    } catch {
      // Keep the current session usable when storage is unavailable.
    }
  }, []);

  const handleScoresReset = useCallback(() => {
    setUserScores(getDefaultScores());
    setPreviewTier(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The in-memory reset still succeeds.
    }
  }, []);

  return (
    <div className="tsunami-scroll-wrapper">
    <motion.div
      className="tsunami-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <TsunamiNav />

      <div className="tsunami-layout">
        {/* Left/Top: 3D Storm Scene */}
        <div className="tsunami-scene-panel">
          <StormScene
            score={displayScore}
            wavePercent={wavePercent}
            daysSinceStart={daysSinceStart}
            tier={displayTier}
          />
        </div>

        {/* Right/Bottom: Controls Panel */}
        <div className="tsunami-controls-panel">
          <ScoreDisplay score={displayScore} wavePercent={wavePercent} tier={displayTier} />
          <TierPreview
            currentTier={actualTier}
            previewTier={previewTier}
            onPreview={setPreviewTier}
          />
          <SkillSliders
            scores={displayScores}
            previewTier={previewTier}
            onScoresChange={handleScoresChange}
            onReset={handleScoresReset}
          />
        </div>
      </div>
    </motion.div>
    </div>
  );
};
