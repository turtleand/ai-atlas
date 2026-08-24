import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#0a1628', color: '#f5f7fb' }}>
      <section style={{ maxWidth: '38rem', textAlign: 'center' }}>
        <p style={{ color: '#7dd3fc', letterSpacing: '0.12em', textTransform: 'uppercase' }}>404</p>
        <h1>That part of the map is uncharted.</h1>
        <p>The requested AI Atlas page does not exist.</p>
        <Link to="/" style={{ color: '#7dd3fc' }}>Return to AI Atlas</Link>
      </section>
    </main>
  );
}
