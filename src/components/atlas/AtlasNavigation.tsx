import { Link } from "react-router-dom";
import { AtlasTsunamiLink } from "./AtlasTsunamiLink";

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
      <AtlasTsunamiLink />
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
