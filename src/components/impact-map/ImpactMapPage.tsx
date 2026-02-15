import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TOUCH } from 'three';
import { Link } from 'react-router-dom';
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
  const handleRoleClick = useCallback((role: Role) => setActiveRole(role), []);
  const handleClosePanel = useCallback(() => setActiveRole(null), []);

  return (
    <div className="impact-map-page">
      {/* Title overlay */}
      <div className="impact-map-title">
        <h1>AI Impact Map</h1>
        <p>Which jobs are already underwater?</p>
      </div>

      {/* Back link */}
      <Link to="/" className="impact-map-back">
        Back to Atlas
      </Link>

      {/* Legend */}
      <div className="impact-map-legend">
        <h3>Elevation Key</h3>
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
        <div className="impact-map-legend-hint">Click labeled roles with 📄 to read more</div>
      </div>

      {/* Info */}
      <div className="impact-map-info">
        {isMobile ? 'Pinch to zoom. Drag to rotate.' : 'Rotate to explore. Click roles for notes.'}
      </div>

      {/* Mobile hint */}
      {isMobile && (
        <div className="impact-map-mobile-hint">Pinch to rotate</div>
      )}

      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 12, 14], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
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
          enablePan={false}
          minDistance={6}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2.2}
          touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_ROTATE }}
        />

        {/* Fog for depth */}
        <fog attach="fog" args={['#0a1628', 20, 40]} />
      </Canvas>

      <NotesPanel role={activeRole} onClose={handleClosePanel} />

      {/* Footer */}
      <div className="impact-map-footer">
        This map shows one perspective. <a href="https://github.com/turtleand/ai-atlas" target="_blank" rel="noopener noreferrer">Fork it and map your world.</a>
      </div>
    </div>
  );
}
