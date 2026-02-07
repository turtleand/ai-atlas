import type { IslandLayout, BeaconPosition } from '../utils/layoutEngine.ts';
import { shapeToPath } from '../utils/layoutEngine.ts';
import { ToolBeacon } from './ToolBeacon.tsx';
import { IslandDetails } from './IslandDetails.tsx';

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
      {/* Beach / sand ring */}
      <path
        d={shapePath}
        fill="rgba(210, 180, 120, 0.2)"
        transform={`translate(${island.cx} ${island.cy}) scale(1.08) translate(${-island.cx} ${-island.cy})`}
      />

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

      {/* Island details (palms, mountains, huts, flags) */}
      <IslandDetails island={island} />

      {/* Category label background pill */}
      <rect
        x={island.cx - (island.category.name.length * 13) / 2 - 8}
        y={island.cy + island.radius + 30 - 18}
        width={island.category.name.length * 13 + 16}
        height={28}
        rx={6}
        fill="rgba(10, 18, 35, 0.7)"
      />

      {/* Category label */}
      <text
        x={island.cx}
        y={island.cy + island.radius + 30}
        className="category-label"
        style={{ fill: island.color }}
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
