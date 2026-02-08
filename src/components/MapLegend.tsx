import { useState } from 'react';
import type { IslandLayout } from '../utils/layoutEngine.ts';

interface MapLegendProps {
  islands: IslandLayout[];
  onIslandClick: (island: IslandLayout) => void;
}

export function MapLegend({ islands, onIslandClick }: MapLegendProps) {
  const [expanded, setExpanded] = useState(false);
  const totalTools = islands.reduce((sum, i) => sum + i.category.tools.length, 0);

  return (
    <div className={`legend${expanded ? ' legend--expanded' : ''}`}>
      <div className="legend-header" onClick={() => setExpanded(prev => !prev)}>
        {totalTools} tools explored across {islands.length} islands
        <span className="legend-toggle-icon">{expanded ? '▾' : '▸'}</span>
      </div>
      {islands.map((island) => (
        <div
          key={island.category.id}
          className="legend-item"
          onClick={() => onIslandClick(island)}
        >
          <span className="legend-dot" style={{ background: island.color }} />
          <span>{island.category.name}</span>
          <span className="legend-count">{island.category.tools.length}</span>
          <span className="legend-arrow">›</span>
        </div>
      ))}
    </div>
  );
}
