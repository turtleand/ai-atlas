import type { IslandLayout } from '../utils/layoutEngine.ts';

interface MapLegendProps {
  islands: IslandLayout[];
  onIslandClick: (island: IslandLayout) => void;
}

export function MapLegend({ islands, onIslandClick }: MapLegendProps) {
  const totalTools = islands.reduce((sum, i) => sum + i.category.tools.length, 0);

  return (
    <div className="legend">
      <div className="legend-header">
        {totalTools} tools charted across {islands.length} islands
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
        </div>
      ))}
    </div>
  );
}
