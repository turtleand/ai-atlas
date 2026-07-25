import { useMemo, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { parseToolsYaml } from './utils/parseTools.ts';
import { ArchipelagoMap } from './components/ArchipelagoMap.tsx';
import toolsYaml from './data/ai-tools.yaml?raw';

// Lazy-load tsunami route — keeps Three.js out of the main atlas bundle
const TsunamiPage = lazy(() =>
  import('./components/tsunami/TsunamiPage.tsx').then((m) => ({ default: m.TsunamiPage }))
);

const ImpactMapPage = lazy(() =>
  import('./components/impact-map/ImpactMapPage.tsx').then((m) => ({ default: m.ImpactMapPage }))
);

const LoopCompassPage = lazy(() =>
  import('./components/loop-compass/LoopCompassPage.tsx').then((m) => ({ default: m.LoopCompassPage }))
);

export default function App() {
  const categories = useMemo(() => parseToolsYaml(toolsYaml), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ArchipelagoMap categories={categories} />} />
        <Route
          path="/productivity-loop"
          element={
            <Suspense fallback={<div style={{ background: '#0a1628', width: '100%', height: '100vh' }} />}>
              <LoopCompassPage />
            </Suspense>
          }
        />
        <Route
          path="/tsunami"
          element={
            <Suspense fallback={<div style={{ background: '#0a1628', width: '100%', height: '100vh' }} />}>
              <TsunamiPage />
            </Suspense>
          }
        />
        <Route
          path="/ai-impact-map"
          element={
            <Suspense fallback={<div style={{ background: '#0a1628', width: '100%', height: '100vh' }} />}>
              <ImpactMapPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
