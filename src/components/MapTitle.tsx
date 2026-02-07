export function MapTitle() {
  return (
    <div className="map-title">
      <nav className="map-nav">
        <a href="https://lab.turtleand.com/" className="nav-link" target="_blank" rel="noopener">
          <span className="nav-icon">🧪</span> Back to AI Lab
        </a>
        <a href="https://turtleand.com/" className="nav-link nav-link-hub" target="_blank" rel="noopener">
          <span className="nav-icon">⚓</span> Turtleand Hub
        </a>
      </nav>
      <h1>Turtleand's AI Atlas</h1>
      <p className="map-subtitle">Tools I've charted on my journey</p>
      <div className="map-title-border" />
    </div>
  );
}
