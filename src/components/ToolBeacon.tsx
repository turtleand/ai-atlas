import type { BeaconPosition } from '../utils/layoutEngine.ts';

interface ToolBeaconProps {
  beacon: BeaconPosition;
  color: string;
  onHover: (beacon: BeaconPosition, e: React.PointerEvent) => void;
  onHoverEnd: () => void;
  onClick: (beacon: BeaconPosition) => void;
}

export function ToolBeacon({ beacon, color, onHover, onHoverEnd, onClick }: ToolBeaconProps) {
  return (
    <g
      className="beacon"
      onPointerEnter={(e) => onHover(beacon, e)}
      onPointerLeave={onHoverEnd}
      onClick={(e) => { e.stopPropagation(); onClick(beacon); }}
    >
      {/* Outer glow */}
      <circle
        cx={beacon.x}
        cy={beacon.y}
        r={14}
        fill={color}
        opacity={0.3}
        className="beacon-glow"
      />
      {/* Core dot */}
      <circle
        cx={beacon.x}
        cy={beacon.y}
        r={8}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
      />
      {/* Label */}
      <text
        x={beacon.x}
        y={beacon.y - 18}
        className="beacon-label"
        textAnchor="middle"
      >
        {beacon.tool.name}
      </text>
    </g>
  );
}
