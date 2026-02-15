import { Html } from '@react-three/drei';
import { industryRegions } from '../../data/impact-map-data';
import { getWorldPos } from './Continent3D';

export function NewsMarkers() {
  const markers: Array<{
    key: string;
    position: [number, number, number];
    headline: string;
    url: string;
  }> = [];

  for (const region of industryRegions) {
    for (const role of region.roles) {
      if (role.newsLink) {
        const nx = region.position[0] + role.offset[0];
        const nz = region.position[1] + role.offset[1];
        const pos = getWorldPos(nx, nz, role.elevation);
        markers.push({
          key: `${region.id}-${role.name}`,
          position: [pos[0], pos[1] + 0.5, pos[2]],
          headline: role.newsLink.headline,
          url: role.newsLink.url,
        });
      }
    }
  }

  return (
    <group>
      {markers.map((m) => (
        <Html key={m.key} position={m.position} center distanceFactor={12}>
          <div
            className="news-marker"
            onClick={() => window.open(m.url, '_blank', 'noopener')}
          >
            <div className="news-marker-dot" />
            <div className="news-marker-tooltip">{m.headline}</div>
          </div>
        </Html>
      ))}
    </group>
  );
}
