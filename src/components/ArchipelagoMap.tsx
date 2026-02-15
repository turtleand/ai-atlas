import { useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '../utils/parseTools.ts';
import { computeLayout, type BeaconPosition, type IslandLayout } from '../utils/layoutEngine.ts';
import { useMapControls } from '../hooks/useMapControls.ts';
import { Island } from './Island.tsx';
import { JournalPanel } from './JournalPanel.tsx';
import { MapLegend } from './MapLegend.tsx';
import { CompassRose } from './CompassRose.tsx';
import { MapTitle } from './MapTitle.tsx';
import { AiTurtle } from './AiTurtle.tsx';
import { MapDecorations } from './MapDecorations.tsx';

interface ArchipelagoMapProps {
  categories: Category[];
}

interface JournalState {
  beacon: BeaconPosition;
  island: IslandLayout;
}

export function ArchipelagoMap({ categories }: ArchipelagoMapProps) {
  const layout = useMemo(() => computeLayout(categories), [categories]);
  const { transform, containerRef, handlers, resetView, panTo } = useMapControls();

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [journal, setJournal] = useState<JournalState | null>(null);

  const handleBeaconHover = useCallback((beacon: BeaconPosition, e: React.PointerEvent) => {
    const el = tooltipRef.current;
    if (!el) return;
    el.style.display = 'block';
    el.style.left = `${e.clientX + 16}px`;
    el.style.top = `${e.clientY - 10}px`;
    el.querySelector('.tooltip-name')!.textContent = beacon.tool.name;
    el.querySelector('.tooltip-desc')!.textContent = beacon.tool.description;
  }, []);

  const handleBeaconHoverEnd = useCallback(() => {
    const el = tooltipRef.current;
    if (el) el.style.display = 'none';
  }, []);

  const handleBeaconClick = useCallback((beacon: BeaconPosition, island: IslandLayout) => {
    const el = tooltipRef.current;
    if (el) el.style.display = 'none';
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
          <ellipse className="cloud" cx="530" cy="260" rx="120" ry="30" fill="#ffffff" />
          <ellipse className="cloud" cx="1870" cy="470" rx="160" ry="25" fill="#ffffff" />

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

          {/* Map decorations (ships, dragon, waves, text labels, etc.) */}
          <MapDecorations />

          {/* AI turtle sailing between islands */}
          <AiTurtle routes={layout.routes} />

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

      {/* Tooltip (ref-driven, no re-renders) */}
      <div ref={tooltipRef} className="tooltip" style={{ display: 'none' }}>
        <div className="tooltip-name" />
        <div className="tooltip-desc" />
      </div>

      {/* Journal panel */}
      {journal && (
        <JournalPanel
          toolName={journal.beacon.tool.name}
          toolDescription={journal.beacon.tool.description}
          toolUrl={journal.beacon.tool.url}
          toolUsage={journal.beacon.tool.usage}
          toolRelated={journal.beacon.tool.related}
          toolTags={journal.beacon.tool.tags}
          categoryName={journal.island.category.name}
          categoryColor={journal.island.color}
          onClose={handleJournalClose}
        />
      )}

      {/* Tsunami Tracker Link */}
      <Link to="/tsunami" className="tsunami-link">
        <span className="tsunami-link-icon">🌊</span>
        <span className="tsunami-link-text">
          <span className="tsunami-link-title">AI Tsunami Tracker</span>
          <span className="tsunami-link-sub">Are you ready?</span>
        </span>
      </Link>
    </>
  );
}
