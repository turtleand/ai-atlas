interface JournalPanelProps {
  toolName: string;
  toolDescription: string;
  toolUrl: string;
  categoryName: string;
  categoryColor: string;
  onClose: () => void;
}

export function JournalPanel({
  toolName,
  toolDescription,
  toolUrl,
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

        <hr className="journal-divider" />

        <p className="journal-desc">{toolDescription}</p>

        <a
          href={toolUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="journal-sail-btn"
        >
          Set Sail &rarr;
        </a>
      </div>
    </div>
  );
}
