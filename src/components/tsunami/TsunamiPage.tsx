import { useState } from 'react';
import { motion } from 'motion/react';
import { TsunamiNav } from './TsunamiNav';
import { WaveVisualization } from './WaveVisualization';
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

export const TsunamiPage: React.FC = () => {
  // Initialize scores with defaults
  const initialScores = SKILL_DIMENSIONS.reduce((acc, dim) => {
    acc[dim.id] = dim.defaultValue;
    return acc;
  }, {} as Record<string, number>);

  const [scores, setScores] = useState(initialScores);
  
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
      
      {/* Full-width wave visualization */}
      <WaveVisualization
        score={compositeScore}
        wavePercent={wavePercent}
        daysSinceStart={daysSinceStart}
      />
      
      {/* Constrained content area */}
      <div className="tsunami-content">
        <ScoreDisplay score={compositeScore} wavePercent={wavePercent} />
        
        <SkillSliders scores={scores} onScoresChange={setScores} />
        
        <TsunamiTimeline />
      </div>
    </motion.div>
  );
};
