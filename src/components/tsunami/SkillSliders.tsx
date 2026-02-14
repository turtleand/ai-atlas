import { SKILL_DIMENSIONS } from '../../data/tsunami-data';

interface SkillSlidersProps {
  scores: Record<string, number>;
  onChange: (id: string, value: number) => void;
  isCustomizing: boolean;
}

export function SkillSliders({ scores, onChange, isCustomizing }: SkillSlidersProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {SKILL_DIMENSIONS.map((dim) => (
        <div key={dim.id} className="skill-slider">
          <div className="slider-header">
            <div className="slider-label">{dim.name}</div>
            <div className="slider-value">{scores[dim.id]}</div>
          </div>
          <div className="slider-description">{dim.description}</div>
          <input
            type="range"
            min="0"
            max="100"
            value={scores[dim.id]}
            onChange={(e) => onChange(dim.id, parseInt(e.target.value))}
            className="slider-input"
            disabled={!isCustomizing}
          />
        </div>
      ))}
    </div>
  );
}
