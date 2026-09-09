import { Link } from "react-router-dom";

export function AtlasNavigation() {
  return (
    <nav className="atlas-navigation" aria-label="Atlas and Turtleand">
      <div className="atlas-nav-side">
        <a href="https://lab.turtleand.com/" className="atlas-nav-link">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M4 8v17c4-1 8 0 12 2 4-2 8-3 12-2V8" />
            <g className="atlas-book-pages">
              <path d="M16 25V8C12 5 8 5 4 6v16c4-1 8 0 12 3Zm0 0V8c4-3 8-3 12-2v16c-4-1-8 0-12 3Z" />
              <path d="m8 10 5 2m-5 3 5 2m6-5 5-2m-5 7 5-2" />
            </g>
          </svg>
          <span>AI Lab</span>
        </a>
        <Link to="/ai-impact-map/" className="atlas-nav-link">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="m4 25 8-19 5 10 4-6 7 15M9 12l3 2 3-2" />
            <g className="atlas-impact-water">
              <path d="M3 23q4-3 8 0t8 0t10 0M3 28q4-3 8 0t8 0t10 0" />
            </g>
          </svg>
          <span>Impact Map</span>
        </Link>
      </div>
      <Link to="/tsunami/" className="atlas-tsunami-link">
        <svg viewBox="0 0 52 44" aria-hidden="true">
          <path className="atlas-wave-horizon" d="M3 38h45M6 41h32" />
          <g className="atlas-nav-wave">
            <path d="M4 35c10-1 9-16 16-24C28 1 43 4 46 16c-5-7-13-7-17-1-5 8 4 14 15 12-3 9-12 12-23 11Z" />
            <path
              className="atlas-wave-foam"
              d="M14 26c3-9 4-18 15-19 7-1 12 2 15 6M26 15c-7 12 6 20 14 15"
            />
            <path className="atlas-wave-seam" d="m6 34 11-2 6 3 9-1" />
          </g>
        </svg>
        <span>Tsunami</span>
        <span className="atlas-nav-arrow" aria-hidden="true">
          ↗
        </span>
      </Link>
      <div className="atlas-nav-side">
        <Link to="/productivity-loop/" className="atlas-nav-link">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="12" />
            <path d="M16 1v5m0 20v5M1 16h5m20 0h5" />
            <g className="atlas-compass-needle">
              <path d="m20 7-1 12-12 6 6-12Z" />
              <path d="m20 7-7 6 6 6Z" fill="currentColor" />
            </g>
          </svg>
          <span>Compass</span>
        </Link>
      </div>
    </nav>
  );
}
