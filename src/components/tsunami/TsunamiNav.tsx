import { Link } from 'react-router-dom';

export function TsunamiNav() {
  return (
    <nav className="tsunami-nav">
      <h1>🌊 AI Tsunami Tracker</h1>
      <Link to="/" className="back-to-atlas">
        ← Back to Atlas
      </Link>
    </nav>
  );
}
