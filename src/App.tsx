import { useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { parseToolsYaml } from './utils/parseTools.ts';
import { ArchipelagoMap } from './components/ArchipelagoMap.tsx';
import { TsunamiPage } from './components/tsunami/TsunamiPage.tsx';
import toolsYaml from './data/ai-tools.yaml?raw';

export default function App() {
  const categories = useMemo(() => parseToolsYaml(toolsYaml), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ArchipelagoMap categories={categories} />} />
        <Route path="/tsunami" element={<TsunamiPage />} />
      </Routes>
    </BrowserRouter>
  );
}
