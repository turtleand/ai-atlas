import { useMemo } from 'react';
import { parseToolsMarkdown } from './utils/parseTools.ts';
import { ArchipelagoMap } from './components/ArchipelagoMap.tsx';
import toolsMarkdown from './data/ai-tools.md?raw';

export default function App() {
  const categories = useMemo(() => parseToolsMarkdown(toolsMarkdown), []);

  return <ArchipelagoMap categories={categories} />;
}
