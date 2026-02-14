import { useState, useEffect } from 'react';
import { SKILL_DIMENSIONS } from '../../data/tsunami-data';

interface SkillSlidersProps {
  scores: Record<string, number>;
  onScoresChange: (scores: Record<string, number>) => void;
}

const STORAGE_KEY = 'tsunami-tracker-scores';

export const SkillSliders: React.FC<SkillSlidersProps> = ({ scores, onScoresChange }) => {
  const [hasCustomized, setHasCustomized] = useState(false);
  const [isInteracted, setIsInteracted] = useState(false);

  // Check if current scores differ from defaults
  const isCustom = () => {
    return SKILL_DIMENSIONS.some((dim) => scores[dim.id] !== dim.defaultValue);
  };

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const isDifferent = SKILL_DIMENSIONS.some(
          (dim) => parsed[dim.id] !== dim.defaultValue
        );
        if (isDifferent) {
          setHasCustomized(true);
          setIsInteracted(true);
          onScoresChange(parsed);
        }
      } catch (e) {
        // Invalid storage, ignore
      }
    }
  }, []);

  // Save to localStorage whenever scores change
  useEffect(() => {
    if (isInteracted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
      setHasCustomized(isCustom());
    }
  }, [scores, isInteracted]);

  const handleSliderChange = (dimensionId: string, value: number) => {
    if (!isInteracted) {
      setIsInteracted(true);
    }
    onScoresChange({
      ...scores,
      [dimensionId]: value,
    });
  };

  const handleReset = () => {
    const defaults = SKILL_DIMENSIONS.reduce((acc, dim) => {
      acc[dim.id] = dim.defaultValue;
      return acc;
    }, {} as Record<string, number>);
    onScoresChange(defaults);
    setHasCustomized(false);
    setIsInteracted(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="skill-sliders">
      <div className="sliders-header">
        <h2 className="sliders-title">Where Do You Stand?</h2>
        <div className="sliders-subtitle">
          {hasCustomized ? (
            <>
              <span>Your Profile</span>
              <button className="reset-link" onClick={handleReset}>
                ↩ Reset to Turtleand
              </button>
            </>
          ) : (
            <span>Turtleand's Profile (96th percentile)</span>
          )}
        </div>
      </div>

      <div className="sliders-list">
        {SKILL_DIMENSIONS.map((dimension) => {
          const value = scores[dimension.id] ?? dimension.defaultValue;
          
          return (
            <div key={dimension.id} className="slider-item">
              <div className="slider-label-row">
                <label htmlFor={dimension.id} className="slider-label">
                  {dimension.name}
                </label>
                <span className="slider-value">{value}</span>
              </div>
              
              <input
                type="range"
                id={dimension.id}
                min="0"
                max="100"
                value={value}
                onChange={(e) => handleSliderChange(dimension.id, parseInt(e.target.value))}
                className="slider-input"
                style={{
                  background: `linear-gradient(to right, #D4A03A 0%, #D4A03A ${value}%, #1a2a3a ${value}%, #1a2a3a 100%)`
                }}
              />
              
              <p className="slider-description">
                {dimension.description}
                {dimension.inverse && ' (lower is better)'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
