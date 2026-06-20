import { Link } from 'react-router-dom';

export function MapTitle() {
  return (
    <>
      <div className="map-title">
        <h1>AI Atlas by Turtleand</h1>
        <p className="map-subtitle">Human-centered maps for choosing AI tools</p>
        <div className="map-title-border" />
      </div>
      <nav className="map-nav">
        <a href="https://lab.turtleand.com/" className="nav-link" target="_blank" rel="noopener">
          <span className="nav-icon">🧪</span> AI Lab
        </a>
        <Link to="/tsunami" className="nav-link nav-link-feature">
          <span className="nav-icon">🌊</span> Tsunami
        </Link>
        <Link to="/ai-impact-map" className="nav-link nav-link-feature">
          <span className="nav-icon">🗺️</span> Impact
        </Link>
        <a href="https://turtleand.com/" className="nav-link nav-link-hub" target="_blank" rel="noopener">
          <span className="nav-icon">⚓</span> Hub
        </a>
      </nav>
    </>
  );
}
