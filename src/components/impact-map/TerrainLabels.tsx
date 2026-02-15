import { Html } from '@react-three/drei';
import { industryRegions, WATER_LEVEL } from '../../data/impact-map-data';
import { getWorldPos } from './Continent3D';

export function TerrainLabels() {
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
            {/* Industry name label */}
            <Html
              position={[ix, iy + 0.6, iz]}
              center
              distanceFactor={12}
              style={{ pointerEvents: 'none' }}
            >
              <div className="impact-label impact-label-industry">{region.name}</div>
            </Html>

            {/* Role labels */}
            {region.roles.map((role) => {
              const rnx = region.position[0] + role.offset[0];
              const rnz = region.position[1] + role.offset[1];
              const [rx, ry, rz] = getWorldPos(rnx, rnz, Math.max(role.elevation, WATER_LEVEL * 0.8));

              return (
                <Html
                  key={role.name}
                  position={[rx, ry + 0.25, rz]}
                  center
                  distanceFactor={12}
                  style={{ pointerEvents: 'none' }}
                >
                  <div className={`impact-label impact-label-role ${role.status}`}>{role.name}</div>
                </Html>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
