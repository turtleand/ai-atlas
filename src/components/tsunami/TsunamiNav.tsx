import { Link } from 'react-router-dom';
import { TurtleandHubLink } from '../TurtleandHubLink';

export const TsunamiNav: React.FC = () => {
  return (
    <nav className="tsunami-nav" aria-label="Tsunami navigation">
      <h1><span className="tsunami-nav-wave" aria-hidden="true">🌊</span> AI Tsunami Tracker</h1>
      <div className="tsunami-nav-actions">
        <Link to="/islands/" className="tsunami-islands-link">
          <span className="tsunami-islands-back" aria-hidden="true">←</span>
          <svg viewBox="0 0 38 28" aria-hidden="true" focusable="false">
            <path d="M3 20q0-3 6-5l6-2 4-3q3-2 7 0l4 3q6 2 5 5-1 5-12 6l-11-1q-9 0-9-3Z" fill="#36746d" />
            <path d="M7 18q1-2 6-3l6-5q3-2 7 0l3 3q4 1 3 4-1 4-8 4l-12-1q-5 0-5-2Z" fill="#dbb67b" />
            <path d="m13 16 6-5 4-2 5 5q0 3-4 3Z" fill="#7eaa83" />
            <path d="m17 13 5-6 5 6m-5-6V4m0 0 6 2-6 1" fill="none" stroke="#f2e2bc" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 25h16m5 0h11" fill="none" stroke="#a8d3bc" strokeLinecap="round" />
          </svg>
          <span>Islands</span>
        </Link>
        <TurtleandHubLink />
      </div>
    </nav>
  );
};
