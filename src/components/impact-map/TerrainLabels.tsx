import { useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { industryRegions, WATER_LEVEL } from '../../data/impact-map-data';
import type { Role } from '../../data/impact-map-data';
import { getWorldPos } from './Continent3D';

interface TerrainLabelsProps {
  onRoleClick?: (role: Role) => void;
}

// Zoom thresholds for progressive label reveal
const ZOOM_HIDE_ALL_ROLES = 22; // distance > this: hide all role labels
const ZOOM_SHOW_SURFACE = 18; // distance < this: show frontier + safe roles
const ZOOM_SHOW_ALL = 12; // distance < this: show submerged roles too

function shouldShowRole(status: string, cameraDistance: number): boolean {
  if (cameraDistance > ZOOM_HIDE_ALL_ROLES) return false;
  if (cameraDistance > ZOOM_SHOW_SURFACE) return false;
  if (cameraDistance > ZOOM_SHOW_ALL && status === 'submerged') return false;
  return true;
}

function getRoleOpacity(status: string, cameraDistance: number): number {
  if (cameraDistance > ZOOM_HIDE_ALL_ROLES) return 0;
  // Fade in roles between thresholds
  if (status === 'submerged') {
    if (cameraDistance > ZOOM_SHOW_ALL) return 0;
    if (cameraDistance > ZOOM_SHOW_ALL - 2) {
      return (ZOOM_SHOW_ALL - cameraDistance) / 2;
    }
    return 1;
  }
  // frontier/safe
  if (cameraDistance > ZOOM_SHOW_SURFACE) return 0;
  if (cameraDistance > ZOOM_SHOW_SURFACE - 2) {
    return (ZOOM_SHOW_SURFACE - cameraDistance) / 2;
  }
  return 1;
}

export function TerrainLabels({ onRoleClick }: TerrainLabelsProps) {
  const { camera } = useThree();
  const [camDist, setCamDist] = useState(() => camera.position.length());

  useFrame(() => {
    const d = camera.position.length();
    // Only update state when crossing thresholds (avoid constant re-renders)
    const prev = camDist;
    const thresholds = [ZOOM_SHOW_ALL - 2, ZOOM_SHOW_ALL, ZOOM_SHOW_SURFACE - 2, ZOOM_SHOW_SURFACE, ZOOM_HIDE_ALL_ROLES];
    const prevBucket = thresholds.findIndex((t) => prev <= t);
    const currBucket = thresholds.findIndex((t) => d <= t);
    if (prevBucket !== currBucket) {
      setCamDist(d);
    }
  });

  return (
    <group>
      {industryRegions.map((region) => {
        const [ix, iy, iz] = getWorldPos(
          region.position[0],
          region.position[1],
          Math.max(region.elevation, WATER_LEVEL + 0.05),
        );

        return (
          <group key={region.id}>
            {/* Industry name label — always visible */}
            <Html
              position={[ix, iy + 0.8, iz]}
              center
              distanceFactor={12}
              zIndexRange={[1, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div className="impact-label impact-label-industry">{region.name}</div>
            </Html>

            {/* Role labels — zoom-dependent visibility */}
            {region.roles.map((role) => {
              if (!shouldShowRole(role.status, camDist)) return null;

              const rnx = region.position[0] + role.offset[0];
              const rnz = region.position[1] + role.offset[1];
              const [rx, ry, rz] = getWorldPos(rnx, rnz, Math.max(role.elevation, WATER_LEVEL * 0.8));
              const opacity = getRoleOpacity(role.status, camDist);

              const isClickable = !!role.notesFile;

              const label = (
                <div
                  className={`impact-label impact-label-role ${role.status}${isClickable ? ' clickable' : ''}`}
                  style={{ opacity, transition: 'opacity 0.4s ease' }}
                >
                  {role.name}
                  {isClickable && <span className="notes-icon"> &#128196;</span>}
                </div>
              );

              if (isClickable) {
                return (
                  <Html
                    key={role.id}
                    position={[rx, ry + 0.25, rz]}
                    center
                    distanceFactor={12}
                    zIndexRange={[1, 0]}
                    style={{ pointerEvents: opacity > 0.5 ? 'auto' : 'none' }}
                  >
                    <button
                      type="button"
                      className="impact-label-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRoleClick?.(role);
                      }}
                    >
                      {label}
                    </button>
                  </Html>
                );
              }

              return (
                <Html
                  key={role.id}
                  position={[rx, ry + 0.25, rz]}
                  center
                  distanceFactor={12}
                  zIndexRange={[1, 0]}
                  style={{ pointerEvents: 'none' }}
                >
                  {label}
                </Html>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
