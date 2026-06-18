import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { Continent3D } from './Continent3D';
import { WaterPlane } from './WaterPlane';
import { TerrainLabels } from './TerrainLabels';
import { NotesPanel } from './NotesPanel';
import type { Role } from '../../data/impact-map-data';
import '../../styles/impact-map.css';

function useIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export function ImpactMapPage() {
  const isMobile = useIsMobile();
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [legendOpen, setLegendOpen] = useState(!isMobile);
  const handleRoleClick = useCallback((role: Role) => setActiveRole(role), []);
  const handleClosePanel = useCallback(() => setActiveRole(null), []);

  return (
    <div className="impact-map-page">
      {/* Title overlay */}
      <div className="impact-map-title">
        <h1>AI Impact Map</h1>
        <p>A curated signal map of where automation pressure is rising.</p>
      </div>

      {/* Back link */}
      <Link to="/" className="impact-map-back">
        Back to Atlas
      </Link>

      {/* Legend - collapsible on mobile */}
      <div className={`impact-map-legend ${legendOpen ? 'open' : 'collapsed'}`}>
        {isMobile && (
          <button
            className="impact-map-legend-toggle"
            onClick={() => setLegendOpen(!legendOpen)}
            aria-label={legendOpen ? 'Collapse legend' : 'Expand legend'}
          >
            {legendOpen ? '▼ Legend' : '▲ Legend'}
          </button>
        )}
        {(legendOpen || !isMobile) && (
          <>
            {!isMobile && <h3>Elevation Key</h3>}
            <div className="impact-map-legend-item">
              <div className="impact-map-legend-dot submerged" />
              <span>Submerged (automated)</span>
            </div>
            <div className="impact-map-legend-item">
              <div className="impact-map-legend-dot frontier" />
              <span>Frontier (2025-2026)</span>
            </div>
            <div className="impact-map-legend-item">
              <div className="impact-map-legend-dot safe" />
              <span>Safe (for now)</span>
            </div>
            <div className="impact-map-legend-hint">Tap labeled roles with 📄 to read more</div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="impact-map-info">
        {isMobile ? 'Drag to explore · Pinch to zoom' : 'Rotate to explore. Click roles for notes.'}
      </div>

      {/* 3D Scene */}
      <Canvas
        camera={{
          position: isMobile ? [-1, 18, 20] : [0, 12, 14],
          fov: isMobile ? 60 : 50,
        }}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a1628');
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[8, 12, 5]} intensity={0.8} />
        <directionalLight position={[-5, 8, -3]} intensity={0.3} color="#6090c0" />

        <Continent3D />
        <WaterPlane />
        <TerrainLabels onRoleClick={handleRoleClick} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={isMobile ? 8 : 6}
          maxDistance={isMobile ? 40 : 25}
          maxPolarAngle={Math.PI / 2.2}
          panSpeed={isMobile ? 1.2 : 0.8}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />

        {/* Fog for depth */}
        <fog attach="fog" args={['#0a1628', 20, 40]} />
      </Canvas>

      <NotesPanel role={activeRole} onClose={handleClosePanel} />

      {/* Footer */}
      <div className="impact-map-footer">
        A Turtleand signal map based on observed news and interpretation, not an exhaustive global ranking. <a href="https://github.com/turtleand/ai-atlas" target="_blank" rel="noopener noreferrer">Fork it and map your world.</a>
      </div>
    </div>
  );
}
