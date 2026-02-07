import type { IslandLayout, BeaconPosition } from '../utils/layoutEngine.ts';
import { shapeToPath } from '../utils/layoutEngine.ts';
import { ToolBeacon } from './ToolBeacon.tsx';

interface IslandProps {
  island: IslandLayout;
  index: number;
  onBeaconHover: (beacon: BeaconPosition, e: React.PointerEvent) => void;
  onBeaconHoverEnd: () => void;
  onBeaconClick: (beacon: BeaconPosition, island: IslandLayout) => void;
}

export function Island({ island, index, onBeaconHover, onBeaconHoverEnd, onBeaconClick }: IslandProps) {
  const shapePath = shapeToPath(island.shapePoints);

  // Create a lighter coastline by adjusting the color
  const coastlineColor = island.color + '80'; // semi-transparent version

  return (
    <g
      className="island-group"
      style={{ animationDelay: `${index * 200}ms` }}
    >
      {/* Coastline / outer ring */}
      <path
        d={shapePath}
        fill={coastlineColor}
        stroke={island.color}
        strokeWidth={3}
        className="island-shape"
      />

      {/* Inner terrain (scaled toward island center) */}
      <path
        d={shapePath}
        fill={island.colorDark}
        transform={`translate(${island.cx} ${island.cy}) scale(0.85) translate(${-island.cx} ${-island.cy})`}
      />

      {/* Central highlight */}
      <circle
        cx={island.cx}
        cy={island.cy - island.radius * 0.15}
        r={island.radius * 0.3}
        fill={island.color}
        opacity={0.35}
      />

      {/* Category label */}
      <text
        x={island.cx}
        y={island.cy + island.radius + 30}
        className="category-label"
        fill={island.color}
      >
        {island.category.name}
      </text>

      {/* Tool beacons */}
      {island.beacons.map((beacon) => (
        <ToolBeacon
          key={beacon.tool.id}
          beacon={beacon}
          color={island.color}
          onHover={onBeaconHover}
          onHoverEnd={onBeaconHoverEnd}
          onClick={(b) => onBeaconClick(b, island)}
        />
      ))}
    </g>
  );
}
