import { useState, useMemo, useCallback } from 'react';
import type { Category } from '../utils/parseTools.ts';
import { computeLayout, type BeaconPosition, type IslandLayout } from '../utils/layoutEngine.ts';
import { useMapControls } from '../hooks/useMapControls.ts';
import { Island } from './Island.tsx';
import { ToolTooltip } from './ToolTooltip.tsx';
import { JournalPanel } from './JournalPanel.tsx';
import { MapLegend } from './MapLegend.tsx';
import { CompassRose } from './CompassRose.tsx';
import { MapTitle } from './MapTitle.tsx';

interface ArchipelagoMapProps {
  categories: Category[];
}

interface TooltipState {
  beacon: BeaconPosition;
  x: number;
  y: number;
}

interface JournalState {
  beacon: BeaconPosition;
  island: IslandLayout;
}

export function ArchipelagoMap({ categories }: ArchipelagoMapProps) {
  const layout = useMemo(() => computeLayout(categories), [categories]);
  const { transform, containerRef, handlers, resetView, panTo } = useMapControls();

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [journal, setJournal] = useState<JournalState | null>(null);

  const handleBeaconHover = useCallback((beacon: BeaconPosition, e: React.PointerEvent) => {
    setTooltip({ beacon, x: e.clientX, y: e.clientY });
  }, []);

  const handleBeaconHoverEnd = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleBeaconClick = useCallback((beacon: BeaconPosition, island: IslandLayout) => {
    setTooltip(null);
    setJournal({ beacon, island });
  }, []);

  const handleJournalClose = useCallback(() => {
    setJournal(null);
  }, []);

  const handleLegendIslandClick = useCallback((island: IslandLayout) => {
    panTo(island.cx, island.cy);
  }, [panTo]);

  return (
    <>
      {/* Ocean background */}
      <div className="ocean">
        <div className="ocean-wave-3" />
      </div>

      {/* Map container with pan/zoom */}
      <div
        ref={containerRef}
        className="map-container"
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerUp}
        onClick={() => { if (journal) handleJournalClose(); }}
      >
        <svg
          className="map-svg"
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {/* Ambient clouds */}
          <ellipse className="cloud" cx="400" cy="200" rx="120" ry="30" fill="#ffffff" />
          <ellipse className="cloud" cx="1400" cy="350" rx="160" ry="25" fill="#ffffff" />

          {/* Sailing routes */}
          {layout.routes.map((route, i) => (
            <line
              key={i}
              x1={route.from.cx}
              y1={route.from.cy}
              x2={route.to.cx}
              y2={route.to.cy}
              className="sailing-route"
            />
          ))}

          {/* "Here Be Dragons" text */}
          <text x="100" y="1100" className="dragons-text">Here Be Dragons</text>
          <text x="1500" y="100" className="dragons-text">Terra Incognita</text>

          {/* Islands */}
          {layout.islands.map((island, index) => (
            <Island
              key={island.category.id}
              island={island}
              index={index}
              onBeaconHover={handleBeaconHover}
              onBeaconHoverEnd={handleBeaconHoverEnd}
              onBeaconClick={handleBeaconClick}
            />
          ))}
        </svg>
      </div>

      {/* Fog overlay */}
      <div className="fog-overlay" />

      {/* UI overlays */}
      <MapTitle />
      <MapLegend islands={layout.islands} onIslandClick={handleLegendIslandClick} />
      <CompassRose onResetView={resetView} />

      {/* Tooltip */}
      {tooltip && (
        <ToolTooltip
          name={tooltip.beacon.tool.name}
          description={tooltip.beacon.tool.description}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}

      {/* Journal panel */}
      {journal && (
        <JournalPanel
          toolName={journal.beacon.tool.name}
          toolDescription={journal.beacon.tool.description}
          toolUrl={journal.beacon.tool.url}
          categoryName={journal.island.category.name}
          categoryColor={journal.island.color}
          onClose={handleJournalClose}
        />
      )}
    </>
  );
}
