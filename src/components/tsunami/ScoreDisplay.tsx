import { getVerdict, calculateWavePercent } from '../../data/tsunami-data';

interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const verdict = getVerdict(score);
  const wavePercent = calculateWavePercent();
  
  // Approximate percentile (simplified - in reality would need population data)
  const percentile = Math.min(99, Math.max(1, Math.round(score)));
  
  // Determine status relative to wave
  let status: 'safe' | 'at-risk' | 'danger';
  if (score > wavePercent + 10) {
    status = 'safe';
  } else if (score > wavePercent) {
    status = 'at-risk';
  } else {
    status = 'danger';
  }
  
  return (
    <div className="score-display">
      <div style={{ fontSize: '0.9rem', color: 'rgba(224, 216, 200, 0.7)' }}>
        Composite Score
      </div>
      <div className="composite-score">{score}</div>
      <div className="percentile">~{percentile}th percentile</div>
      
      <div className="verdict">
        <div className="verdict-emoji">{verdict.emoji}</div>
        <div className="verdict-title">{verdict.title}</div>
        <div className="verdict-description">{verdict.description}</div>
      </div>
      
      <div className={`status-indicator ${status}`}>
        {status === 'safe' && `✓ ${(score - wavePercent).toFixed(0)} points above the waterline`}
        {status === 'at-risk' && `⚠ ${(score - wavePercent).toFixed(0)} points above (but close!)`}
        {status === 'danger' && `⚠ ${(wavePercent - score).toFixed(0)} points below the waterline`}
      </div>
    </div>
  );
}
