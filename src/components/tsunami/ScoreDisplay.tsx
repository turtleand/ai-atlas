import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect } from 'react';
import { getVerdict, getSurferState } from '../../data/tsunami-data';

interface ScoreDisplayProps {
  score: number;
  wavePercent: number;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, wavePercent }) => {
  const motionScore = useMotionValue(score);
  const rounded = useTransform(motionScore, (latest) => Math.round(latest));
  
  const verdict = getVerdict(score);
  const surferState = getSurferState(score, wavePercent);
  const difference = score - wavePercent;
  
  // Determine border color based on surfer state
  const getBorderColor = () => {
    switch (surferState) {
      case 'surfing':
        return '#4CAF50'; // Green
      case 'riding':
        return '#D4A03A'; // Amber/Gold
      case 'struggling':
        return '#FF9800'; // Amber-Red
      case 'drowning':
        return '#f44336'; // Red
    }
  };

  useEffect(() => {
    const controls = animate(motionScore, score, {
      duration: 0.5,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [score, motionScore]);

  return (
    <div 
      className="score-card"
      style={{ borderLeftColor: getBorderColor() }}
    >
      <div className="score-main">
        <motion.span className="score-number">
          {rounded}
        </motion.span>
        <span className="score-separator">·</span>
        <span className="score-verdict-emoji">{verdict.emoji}</span>
        <span className="score-verdict-title">{verdict.title}</span>
      </div>
      <div className="score-subtitle">
        {difference > 0 
          ? `${Math.round(difference)} points above the waterline`
          : `${Math.abs(Math.round(difference))} points below the waterline`
        }
      </div>
      <div className="score-description">{verdict.description}</div>
    </div>
  );
};
