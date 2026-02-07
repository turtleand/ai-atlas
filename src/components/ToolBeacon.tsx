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
      onPointerDown={(e) => e.stopPropagation()}
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
        stroke="rgba(10, 18, 35, 0.9)"
        strokeWidth={3}
        paintOrder="stroke"
      >
        {beacon.tool.name}
      </text>
      {/* Explored badge */}
      <circle cx={beacon.x + 7} cy={beacon.y + 7} r={4.5} fill="#0a1628" />
      <circle cx={beacon.x + 7} cy={beacon.y + 7} r={3.5} fill="#56F5DF" />
      <path
        d={`M ${beacon.x + 5} ${beacon.y + 7} L ${beacon.x + 6.5} ${beacon.y + 8.5} L ${beacon.x + 9} ${beacon.y + 5.5}`}
        fill="none"
        stroke="#0a1628"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
