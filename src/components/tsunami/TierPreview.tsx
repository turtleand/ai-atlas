import { TIER_INFO } from '../../data/tsunami-data';

interface TierPreviewProps {
  currentTier: number;
  previewTier: number | null;
  onPreview: (tier: number | null) => void;
}

export function TierPreview({ currentTier, previewTier, onPreview }: TierPreviewProps) {
  const activeTier = previewTier ?? currentTier;
  const activeInfo = TIER_INFO.find((t) => t.tier === activeTier);

  return (
    <div className="tier-preview">
      <div className="tier-preview-header">
        <span className="tier-preview-label">Ship Class</span>
        <span className="tier-preview-name">
          {activeInfo?.emoji} {activeInfo?.name}
        </span>
      </div>

      <div className="tier-buttons">
        {TIER_INFO.map((info) => (
          <button
            key={info.tier}
            className={`tier-btn ${info.tier === activeTier ? 'active' : ''} ${info.tier === currentTier && !previewTier ? 'current' : ''}`}
            onClick={() => onPreview(info.tier === currentTier ? null : info.tier)}
            title={`${info.name} (${info.scoreRange})`}
          >
            <span className="tier-btn-emoji">{info.emoji}</span>
            <span className="tier-btn-number">T{info.tier}</span>
            <span className="tier-btn-range">{info.scoreRange}</span>
          </button>
        ))}
      </div>

      {activeInfo && (
        <p className="tier-preview-desc">{activeInfo.description}</p>
      )}

      {previewTier && (
        <button className="tier-reset-btn" onClick={() => onPreview(null)}>
          ← Back to your score
        </button>
      )}
    </div>
  );
}
