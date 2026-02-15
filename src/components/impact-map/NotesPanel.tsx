import { useEffect, useState, useCallback } from 'react';
import type { Role } from '../../data/impact-map-data';
import './NotesPanel.css';

interface NotesPanelProps {
  role: Role | null;
  onClose: () => void;
}

function parseMarkdown(md: string): string {
  let html = md
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr />');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Paragraphs: wrap remaining lines that aren't already tags
  html = html
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-3]|ul|li|hr|blockquote)/.test(trimmed)) return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .join('\n');

  return html;
}

export function NotesPanel({ role, onClose }: NotesPanelProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const isOpen = !!role;

  useEffect(() => {
    if (!role?.notesFile) return;
    setLoading(true);
    setContent('');
    fetch(`/impact-notes/${role.notesFile}.md`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then((md) => {
        setContent(parseMarkdown(md));
        setLoading(false);
      })
      .catch(() => {
        setContent('<p>Could not load notes.</p>');
        setLoading(false);
      });
  }, [role?.notesFile]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`notes-backdrop ${isOpen ? 'open' : ''}`}
        onClick={handleBackdropClick}
      />
      <div className={`notes-panel ${isOpen ? 'open' : ''}`}>
        {role && (
          <>
            <div className="notes-panel-header">
              <span className={`notes-badge ${role.status}`}>
                {role.status === 'submerged' ? 'Submerged' : role.status === 'frontier' ? 'Frontier' : 'Safe'}
              </span>
              <button className="notes-close" onClick={onClose} aria-label="Close">
                &times;
              </button>
            </div>
            <h2 className="notes-title">{role.name}</h2>
            <div className="notes-body">
              {loading ? (
                <p className="notes-loading">Loading...</p>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: content }} />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
