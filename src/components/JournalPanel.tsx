import type { RelatedLink } from '../utils/parseTools';

interface JournalPanelProps {
  toolName: string;
  toolDescription: string;
  toolUrl: string;
  toolUsage?: string;
  toolRelated?: RelatedLink[];
  toolTags?: string[];
  categoryName: string;
  categoryColor: string;
  onClose: () => void;
}

export function JournalPanel({
  toolName,
  toolDescription,
  toolUrl,
  toolUsage,
  toolRelated,
  toolTags,
  categoryName,
  categoryColor,
  onClose,
}: JournalPanelProps) {
  return (
    <div className="journal-overlay">
      <div className="journal-backdrop" onClick={onClose} />
      <div className="journal-panel">
        <button className="journal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <h2 className="journal-title">{toolName}</h2>

        <div className="journal-badge">
          <span className="journal-badge-dot" style={{ background: categoryColor }} />
          {categoryName}
        </div>

        {toolTags && toolTags.length > 0 && (
          <div className="journal-tags">
            {toolTags.map(tag => (
              <span key={tag} className="journal-tag">{tag}</span>
            ))}
          </div>
        )}

        <hr className="journal-divider" />

        <div className="journal-section">
          <h3 className="journal-section-title">About</h3>
          <p className="journal-desc">{toolDescription}</p>
        </div>

        {toolUsage && (
          <div className="journal-section">
            <h3 className="journal-section-title">🐢 How I Use It</h3>
            <p className="journal-usage">{toolUsage}</p>
          </div>
        )}

        {toolRelated && toolRelated.length > 0 && (
          <div className="journal-section">
            <h3 className="journal-section-title">🔗 Related</h3>
            <div className="journal-related">
              {toolRelated.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="journal-related-link"
                >
                  {link.title} →
                </a>
              ))}
            </div>
          </div>
        )}

        <hr className="journal-divider" />

        <a
          href={toolUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="journal-sail-btn"
        >
          Visit Tool &rarr;
        </a>
      </div>
    </div>
  );
}
