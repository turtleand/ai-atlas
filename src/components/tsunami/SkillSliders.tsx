import { SKILL_DIMENSIONS } from '../../data/tsunami-data';

interface SkillSlidersProps {
  scores: Record<string, number>;
  previewTier: number | null;
  onScoresChange: (scores: Record<string, number>) => void;
  onReset: () => void;
}

export const SkillSliders: React.FC<SkillSlidersProps> = ({
  scores,
  previewTier,
  onScoresChange,
  onReset,
}) => {
  const hasCustomized = !previewTier && SKILL_DIMENSIONS.some(
    (dimension) => scores[dimension.id] !== dimension.defaultValue
  );

  const handleSliderChange = (dimensionId: string, value: number) => {
    onScoresChange({
      ...scores,
      [dimensionId]: value,
    });
  };

  return (
    <div className="skill-sliders">
      <div className="sliders-header">
        <h2 className="sliders-title">Where Do You Stand?</h2>
        <div className="sliders-subtitle">
          {previewTier ? (
            <span className="your-profile-label">T{previewTier} reference profile</span>
          ) : hasCustomized ? (
            <>
              <span className="your-profile-label">Your Profile</span>
              <button className="reset-link" onClick={onReset}>
                reset
              </button>
            </>
          ) : (
            <span className="turtleand-profile-label">Turtleand's Profile</span>
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
                step="1"
                value={value}
                onInput={(event) => {
                  handleSliderChange(
                    dimension.id,
                    parseInt(event.currentTarget.value, 10)
                  );
                }}
                className="slider-input"
                style={{
                  background: `linear-gradient(to right, #D4A03A 0%, #D4A03A ${value}%, #1a2a3a ${value}%, #1a2a3a 100%)`
                }}
              />
              
              <p className="slider-description">
                {dimension.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
