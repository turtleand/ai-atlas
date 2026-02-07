interface ToolTooltipProps {
  name: string;
  description: string;
  x: number;
  y: number;
}

export function ToolTooltip({ name, description, x, y }: ToolTooltipProps) {
  return (
    <div
      className="tooltip"
      style={{
        left: x + 16,
        top: y - 10,
      }}
    >
      <div className="tooltip-name">{name}</div>
      <div className="tooltip-desc">{description}</div>
    </div>
  );
}
