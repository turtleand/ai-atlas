import { useState, useEffect, useMemo } from 'react';
import { TsunamiNav } from './TsunamiNav';
import { WaveVisualization } from './WaveVisualization';
import { SkillSliders } from './SkillSliders';
import { ScoreDisplay } from './ScoreDisplay';
import { TsunamiTimeline } from './TsunamiTimeline';
import { SKILL_DIMENSIONS, calculateCompositeScore } from '../../data/tsunami-data';
import '../../styles/tsunami.css';

const STORAGE_KEY = 'tsunami-skill-scores';
const TURTLEAND_DEFAULTS: Record<string, number> = {};
SKILL_DIMENSIONS.forEach(dim => {
  TURTLEAND_DEFAULTS[dim.id] = dim.defaultValue;
});

export function TsunamiPage() {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { ...TURTLEAND_DEFAULTS };
      }
    }
    return { ...TURTLEAND_DEFAULTS };
  });

  // Save to localStorage whenever scores change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  }, [scores]);

  const compositeScore = useMemo(() => {
    return calculateCompositeScore(scores);
  }, [scores]);

  const handleScoreChange = (id: string, value: number) => {
    setScores(prev => ({ ...prev, [id]: value }));
  };

  const handleCustomize = () => {
    setIsCustomizing(true);
  };

  const handleReset = () => {
    setScores({ ...TURTLEAND_DEFAULTS });
    setIsCustomizing(false);
  };

  const isTurtleandProfile = useMemo(() => {
    return Object.keys(TURTLEAND_DEFAULTS).every(
      key => scores[key] === TURTLEAND_DEFAULTS[key]
    );
  }, [scores]);

  return (
    <div className="tsunami-page">
      <TsunamiNav />
      
      <div className="tsunami-content">
        {/* Wave Visualization */}
        <WaveVisualization score={compositeScore} />
        
        {/* Sliders & Score */}
        <div className="sliders-container">
          <div className="profile-header">
            <div className="profile-status">
              {isTurtleandProfile && !isCustomizing
                ? "Showing: Turtleand's Profile (96th percentile)"
                : isCustomizing
                ? 'Customize Your Profile'
                : 'Your Custom Profile'}
            </div>
            <div className="profile-actions">
              {!isCustomizing && (
                <button className="profile-button" onClick={handleCustomize}>
                  ✏️ Customize Your Profile
                </button>
              )}
              {(!isTurtleandProfile || isCustomizing) && (
                <button className="profile-button" onClick={handleReset}>
                  🔄 Reset to Turtleand
                </button>
              )}
            </div>
          </div>
          
          <ScoreDisplay score={compositeScore} />
          
          <SkillSliders
            scores={scores}
            onChange={handleScoreChange}
            isCustomizing={isCustomizing}
          />
          
          <TsunamiTimeline />
        </div>
      </div>
    </div>
  );
}
