import { useState, useCallback } from 'react';
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
  getTierMidpoint,
} from '../../data/tsunami-data';
import '../../styles/tsunami.css';

const STORAGE_KEY = 'tsunami-tracker-scores';

function getInitialScores(): Record<string, number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old "traditionalDependence" → "aiIndependence" (inverted)
      if ('traditionalDependence' in parsed && !('aiIndependence' in parsed)) {
        parsed.aiIndependence = 100 - parsed.traditionalDependence;
        delete parsed.traditionalDependence;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      const valid = SKILL_DIMENSIONS.every((dim) => typeof parsed[dim.id] === 'number');
      if (valid) return parsed;
    }
  } catch {
    // ignore
  }
  return SKILL_DIMENSIONS.reduce((acc, dim) => {
    acc[dim.id] = dim.defaultValue;
    return acc;
  }, {} as Record<string, number>);
}

export const TsunamiPage: React.FC = () => {
  const [scores, setScores] = useState(getInitialScores);
  const [previewTier, setPreviewTier] = useState<number | null>(null);

  const daysSinceStart = calculateDaysSinceStart();
  const wavePercent = calculateWavePercent();
  const compositeScore = calculateCompositeScore(scores);
  const actualTier = calculateTier(compositeScore);

  // When previewing a tier, override the displayed tier and score
  const displayTier = previewTier ?? actualTier;
  const displayScore = previewTier ? getTierMidpoint(previewTier) : compositeScore;

  const handleScoresChange = useCallback((newScores: Record<string, number>) => {
    setScores(newScores);
    setPreviewTier(null); // Clear preview when user adjusts sliders
  }, []);

  return (
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
          <ScoreDisplay score={compositeScore} wavePercent={wavePercent} tier={actualTier} />
          <TierPreview
            currentTier={actualTier}
            previewTier={previewTier}
            onPreview={setPreviewTier}
          />
          <SkillSliders scores={scores} onScoresChange={handleScoresChange} />
        </div>
      </div>
    </motion.div>
  );
};
