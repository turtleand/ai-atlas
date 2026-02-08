import { useMemo } from 'react';
import { parseToolsYaml } from './utils/parseTools.ts';
import { ArchipelagoMap } from './components/ArchipelagoMap.tsx';
import toolsYaml from './data/ai-tools.yaml?raw';

export default function App() {
  const categories = useMemo(() => parseToolsYaml(toolsYaml), []);

  return <ArchipelagoMap categories={categories} />;
}
