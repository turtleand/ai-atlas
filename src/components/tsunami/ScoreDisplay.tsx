import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect } from 'react';
import { getVerdict, getSurferState, TIER_INFO } from '../../data/tsunami-data';

interface ScoreDisplayProps {
  score: number;
  wavePercent: number;
  tier: number;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, wavePercent, tier }) => {
  const motionScore = useMotionValue(score);
  const rounded = useTransform(motionScore, (latest) => Math.round(latest));
  
  const verdict = getVerdict(score);
  const surferState = getSurferState(score, wavePercent);
  const tierInfo = TIER_INFO.find((t) => t.tier === tier);
  
  const getBorderColor = () => {
    switch (surferState) {
      case 'surfing': return '#4CAF50';
      case 'riding': return '#D4A03A';
      case 'struggling': return '#FF9800';
      case 'drowning': return '#f44336';
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
        {tierInfo && <span className="score-tier-badge">{tierInfo.emoji} Tier {tier}: {tierInfo.name}</span>}
      </div>
      <div className="score-description">{verdict.description}</div>
    </div>
  );
};
