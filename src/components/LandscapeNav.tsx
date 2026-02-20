import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { icon: '🧪', label: 'AI Lab', href: 'https://lab.turtleand.com/', external: true },
  { icon: '🌊', label: 'Tsunami', to: '/tsunami' },
  { icon: '🗺️', label: 'Impact', to: '/ai-impact-map' },
  { icon: '⚓', label: 'Hub', href: 'https://turtleand.com/', external: true },
];

export function LandscapeNav() {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const autoClose = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(false), 4000);
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        // opening — start auto-close timer
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setOpen(false), 4000);
      }
      return !prev;
    });
  }, []);

  // Reset timer on any item hover
  const keepOpen = useCallback(() => {
    if (open) autoClose();
  }, [open, autoClose]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="landscape-nav" onPointerEnter={keepOpen}>
      {/* Expanded menu items */}
      <div className={`landscape-nav-items ${open ? 'landscape-nav-items--open' : ''}`}>
        {NAV_ITEMS.map((item, i) => {
          const style = {
            transitionDelay: open ? `${i * 50}ms` : `${(NAV_ITEMS.length - i) * 30}ms`,
          };
          const content = (
            <>
              <span className="landscape-nav-item-icon">{item.icon}</span>
              <span className="landscape-nav-item-label">{item.label}</span>
            </>
          );
          return item.external ? (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener"
              className="landscape-nav-item"
              style={style}
            >
              {content}
            </a>
          ) : (
            <Link
              key={item.label}
              to={item.to!}
              className="landscape-nav-item"
              style={style}
            >
              {content}
            </Link>
          );
        })}
      </div>

      {/* FAB trigger */}
      <button
        className={`landscape-nav-fab ${open ? 'landscape-nav-fab--open' : ''}`}
        onClick={toggle}
        aria-label="Navigation menu"
      >
        <span className="landscape-nav-fab-icon">☸</span>
      </button>
    </div>
  );
}
