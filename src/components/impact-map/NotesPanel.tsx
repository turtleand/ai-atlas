import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '../../data/impact-map-data';
import './NotesPanel.css';

interface NotesPanelProps {
  role: Role | null;
  onClose: () => void;
}

interface ParsedNote {
  title: string;
  status: string;
  explanation: string;
  latest: string[];
  history: string[];
  sources: string[];
}

function parseNoteMarkdown(md: string): ParsedNote {
  const lines = md.split('\n');
  const result: ParsedNote = {
    title: '',
    status: '',
    explanation: '',
    latest: [],
    history: [],
    sources: [],
  };

  let section = 'intro';
  const explanationLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      result.title = trimmed.slice(2);
      continue;
    }

    if (trimmed.startsWith('**Status:**')) {
      result.status = trimmed.replace('**Status:**', '').trim().toLowerCase();
      continue;
    }

    if (trimmed === '## Latest') { section = 'latest'; continue; }
    if (trimmed === '## History') { section = 'history'; continue; }
    if (trimmed === '## Sources') { section = 'sources'; continue; }

    if (trimmed.startsWith('- ') && section === 'latest') {
      result.latest.push(trimmed.slice(2));
    } else if (trimmed.startsWith('- ') && section === 'history') {
      result.history.push(trimmed.slice(2));
    } else if (trimmed.startsWith('- ') && section === 'sources') {
      result.sources.push(trimmed.slice(2));
    } else if (section === 'intro' && trimmed && !trimmed.startsWith('#')) {
      explanationLines.push(trimmed);
    }
  }

  result.explanation = explanationLines.join(' ');
  return result;
}

const markdownTokenPattern = /\[([^\]]+)]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*/g;
const safeLinkProtocols = new Set(['http:', 'https:', 'mailto:']);

function isSafeLinkHref(href: string): boolean {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://turtleand.com';
    const url = new URL(href, baseUrl);

    return safeLinkProtocols.has(url.protocol);
  } catch {
    return false;
  }
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(markdownTokenPattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    const [, label, href, boldText, italicText] = match;
    const key = `${index}-${match[0]}`;

    if (label && href) {
      if (isSafeLinkHref(href)) {
        nodes.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>,
        );
      } else {
        nodes.push(label);
      }
    } else if (boldText) {
      nodes.push(<strong key={key}>{boldText}</strong>);
    } else if (italicText) {
      nodes.push(<em key={key}>{italicText}</em>);
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function NotesPanel({ role, onClose }: NotesPanelProps) {
  const [rawContent, setRawContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isOpen = !!role;

  useEffect(() => {
    if (!role?.notesFile) return;
    setLoading(true);
    setRawContent('');
    setHistoryOpen(false);
    setSourcesOpen(false);
    fetch(`/impact-notes/${role.notesFile}.md`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then((md) => {
        setRawContent(md);
        setLoading(false);
      })
      .catch(() => {
        setRawContent('');
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

  const parsed = rawContent ? parseNoteMarkdown(rawContent) : null;
  const isSubmerged = role?.status === 'submerged';
  const isFrontier = role?.status === 'frontier';

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
            <div className={`notes-body ${isSubmerged ? 'muted' : ''}`}>
              {loading ? (
                <p className="notes-loading">Loading...</p>
              ) : parsed ? (
                <>
                  {/* Explanation */}
                  <p className="notes-explanation">{parsed.explanation}</p>

                  {/* Submerged summary */}
                  {isSubmerged && (
                    <div className="notes-submerged-summary">
                      This area is already automated.
                    </div>
                  )}

                  {/* Latest section */}
                  {parsed.latest.length > 0 && (
                    <div className={`notes-latest ${isFrontier ? 'frontier-highlight' : ''}`}>
                      <h3 className="notes-section-title">
                        {isFrontier && <span className="notes-new-badge">NEW</span>}
                        Latest
                      </h3>
                      <ul>
                        {parsed.latest.map((item, i) => (
                          <li key={i}>{renderInlineMarkdown(item)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* History section - collapsed */}
                  {parsed.history.length > 0 && (
                    <div className="notes-collapsible">
                      <button
                        className="notes-toggle"
                        onClick={() => setHistoryOpen(!historyOpen)}
                      >
                        {historyOpen ? 'Hide history' : 'Show history'} {historyOpen ? '\u25BE' : '\u25B8'}
                      </button>
                      {historyOpen && (
                        <ul className="notes-history-list">
                          {parsed.history.map((item, i) => (
                            <li key={i}>{renderInlineMarkdown(item)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Sources section - collapsed */}
                  {parsed.sources.length > 0 && (
                    <div className="notes-collapsible">
                      <button
                        className="notes-toggle"
                        onClick={() => setSourcesOpen(!sourcesOpen)}
                      >
                        {sourcesOpen ? 'Hide sources' : 'View sources'} {sourcesOpen ? '\u25BE' : '\u25B8'}
                      </button>
                      {sourcesOpen && (
                        <ul className="notes-sources-list">
                          {parsed.sources.map((item, i) => (
                            <li key={i}>{renderInlineMarkdown(item)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p>Could not load notes.</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
