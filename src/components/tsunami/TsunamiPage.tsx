import { useState } from 'react';
import { motion } from 'motion/react';
import { TsunamiNav } from './TsunamiNav';
import { StormScene } from './StormScene';
import { ScoreDisplay } from './ScoreDisplay';
import { SkillSliders } from './SkillSliders';
import { TsunamiTimeline } from './TsunamiTimeline';
import {
  SKILL_DIMENSIONS,
  calculateDaysSinceStart,
  calculateWavePercent,
  calculateCompositeScore,
} from '../../data/tsunami-data';
import '../../styles/tsunami.css';

const STORAGE_KEY = 'tsunami-tracker-scores';

function getInitialScores(): Record<string, number> {
  // Try localStorage first
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate it has all keys
      const valid = SKILL_DIMENSIONS.every((dim) => typeof parsed[dim.id] === 'number');
      if (valid) return parsed;
    }
  } catch {
    // ignore
  }
  // Fall back to Turtleand's defaults
  return SKILL_DIMENSIONS.reduce((acc, dim) => {
    acc[dim.id] = dim.defaultValue;
    return acc;
  }, {} as Record<string, number>);
}

export const TsunamiPage: React.FC = () => {
  const [scores, setScores] = useState(getInitialScores);

  const daysSinceStart = calculateDaysSinceStart();
  const wavePercent = calculateWavePercent();
  const compositeScore = calculateCompositeScore(scores);

  return (
    <motion.div
      className="tsunami-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <TsunamiNav />

      <StormScene
        score={compositeScore}
        wavePercent={wavePercent}
        daysSinceStart={daysSinceStart}
      />

      <div className="tsunami-content">
        <ScoreDisplay score={compositeScore} wavePercent={wavePercent} />
        <SkillSliders scores={scores} onScoresChange={setScores} />
        <TsunamiTimeline />
      </div>
    </motion.div>
  );
};
