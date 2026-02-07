import type { MapLayout } from '../utils/layoutEngine.ts';
import { useAiTurtleAnimation } from '../hooks/useAiTurtleAnimation.ts';

const WAKE_COUNT = 20;

interface AiTurtleProps {
  routes: MapLayout['routes'];
}

export function AiTurtle({ routes }: AiTurtleProps) {
  const { turtleRef, wakeRef } = useAiTurtleAnimation(routes);

  if (routes.length === 0) return null;

  return (
    <g>
      {/* Wake trail (pool of reusable circles) */}
      <g ref={wakeRef}>
        {Array.from({ length: WAKE_COUNT }, (_, i) => (
          <circle
            key={i}
            cx={0}
            cy={0}
            r={3}
            fill="#56F5DF"
            opacity={0}
          />
        ))}
      </g>

      {/* AI Turtle (~65x40 units, centered at origin, facing right, top-down view) */}
      <g ref={turtleRef}>
        {/* Tail */}
        <path
          d="M -22,0 C -26,-1 -30,0 -28,2 C -26,3 -23,1 -22,0"
          fill="#7B8C3C"
          stroke="#5C6B2A"
          strokeWidth={0.5}
        />

        {/* Back flippers — organic paddle shapes */}
        <path
          d="M -10,8 C -14,12 -22,18 -24,16 C -26,14 -20,10 -14,6"
          fill="#7B8C3C"
          stroke="#5C6B2A"
          strokeWidth={0.6}
          data-flipper="back-right"
          data-pivot-x="-10"
          data-pivot-y="8"
        />
        <path
          d="M -10,-8 C -14,-12 -22,-18 -24,-16 C -26,-14 -20,-10 -14,-6"
          fill="#7B8C3C"
          stroke="#5C6B2A"
          strokeWidth={0.6}
          data-flipper="back-left"
          data-pivot-x="-10"
          data-pivot-y="-8"
        />

        {/* Body (underside) */}
        <ellipse cx={0} cy={0} rx={20} ry={13} fill="#8B9A3E" stroke="#6B7A2E" strokeWidth={0.6} />

        {/* Shell — full top-down ellipse */}
        <ellipse cx={-1} cy={0} rx={17} ry={11} fill="#684A2A" stroke="#5C3D1F" strokeWidth={0.8} />

        {/* Shell scute segments — vertebral line */}
        <line x1={-16} y1={0} x2={14} y2={0} stroke="#5C3D1F" strokeWidth={0.6} opacity={0.7} />

        {/* Shell scute segments — costal dividers */}
        <line x1={-10} y1={-10.5} x2={-10} y2={10.5} stroke="#5C3D1F" strokeWidth={0.5} opacity={0.6} />
        <line x1={-3} y1={-11} x2={-3} y2={11} stroke="#5C3D1F" strokeWidth={0.5} opacity={0.6} />
        <line x1={5} y1={-10.5} x2={5} y2={10.5} stroke="#5C3D1F" strokeWidth={0.5} opacity={0.6} />
        <line x1={11} y1={-8} x2={11} y2={8} stroke="#5C3D1F" strokeWidth={0.5} opacity={0.6} />

        {/* Circuit traces following scute seams — PCB style right-angle turns */}
        <polyline
          points="-14,0 -10,0 -10,-4 -6,-4 -6,-8"
          fill="none"
          stroke="#56F5DF"
          strokeWidth={0.7}
          opacity={0.85}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={-10} cy={0} r={0.8} fill="#56F5DF" opacity={0.85} />
        <circle cx={-6} cy={-4} r={0.8} fill="#56F5DF" opacity={0.85} />

        <polyline
          points="-10,4 -6,4 -6,0 -3,0 -3,-6 0,-6"
          fill="none"
          stroke="#56F5DF"
          strokeWidth={0.6}
          opacity={0.85}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={-3} cy={0} r={0.8} fill="#56F5DF" opacity={0.85} />
        <circle cx={0} cy={-6} r={0.8} fill="#56F5DF" opacity={0.85} />

        <polyline
          points="0,6 5,6 5,0 8,0 8,-5 11,-5"
          fill="none"
          stroke="#56F5DF"
          strokeWidth={0.6}
          opacity={0.85}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={5} cy={0} r={0.8} fill="#56F5DF" opacity={0.85} />
        <circle cx={11} cy={-5} r={0.8} fill="#56F5DF" opacity={0.85} />

        <polyline
          points="-3,8 2,8 2,4 5,4"
          fill="none"
          stroke="#56F5DF"
          strokeWidth={0.5}
          opacity={0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={2} cy={4} r={0.7} fill="#56F5DF" opacity={0.8} />

        {/* Front flippers — organic paddle shapes */}
        <path
          d="M 10,8 C 14,12 22,18 24,16 C 26,14 20,10 14,6"
          fill="#8B9A3E"
          stroke="#6B7A2E"
          strokeWidth={0.6}
          data-flipper="front-right"
          data-pivot-x="10"
          data-pivot-y="8"
        />
        <path
          d="M 10,-8 C 14,-12 22,-18 24,-16 C 26,-14 20,-10 14,-6"
          fill="#8B9A3E"
          stroke="#6B7A2E"
          strokeWidth={0.6}
          data-flipper="front-left"
          data-pivot-x="10"
          data-pivot-y="-8"
        />

        {/* Head — larger, top-down with both eyes visible */}
        <ellipse cx={22} cy={0} rx={10} ry={7.5} fill="#A5C56E" stroke="#7B9A3C" strokeWidth={0.6} />

        {/* Nostrils */}
        <circle cx={30} cy={-1.2} r={0.6} fill="#6B8A2E" />
        <circle cx={30} cy={1.2} r={0.6} fill="#6B8A2E" />

        {/* Left eye (top-down: upper side) */}
        <ellipse cx={25} cy={-4} rx={2.5} ry={2} fill="white" />
        <circle cx={26} cy={-4} r={1.3} fill="#4A8C3C" />
        <circle cx={26.5} cy={-4.3} r={0.6} fill="#1A1A2E" />
        <circle cx={27} cy={-4.6} r={0.25} fill="white" />

        {/* Right eye (top-down: lower side) */}
        <ellipse cx={25} cy={4} rx={2.5} ry={2} fill="white" />
        <circle cx={26} cy={4} r={1.3} fill="#4A8C3C" />
        <circle cx={26.5} cy={4.3} r={0.6} fill="#1A1A2E" />
        <circle cx={27} cy={4.6} r={0.25} fill="white" />

        {/* Mouth — gentle smile */}
        <path
          d="M 28,1.5 Q 30,3 28,-1.5"
          fill="none"
          stroke="#5C3D1F"
          strokeWidth={0.5}
          strokeLinecap="round"
        />

        {/* Headphone — wider headband arc + ear cup */}
        <path
          d="M 20,-6 C 18,-10 18,-12 22,-11 C 24,-10 23,-8 22,-7"
          fill="none"
          stroke="#3A3A4A"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <ellipse cx={20} cy={-6} rx={2.5} ry={1.8} fill="#3A3A4A" stroke="#56F5DF" strokeWidth={0.5} />
        <circle cx={20} cy={-6} r={1} fill="#56F5DF" opacity={0.9} />

        {/* Smartwatch on front-left flipper — band + face + screen lines */}
        <rect
          x={14}
          y={-14}
          width={5}
          height={2}
          rx={0.6}
          fill="#3A3A4A"
          stroke="#56F5DF"
          strokeWidth={0.4}
        />
        <rect
          x={14.8}
          y={-13.8}
          width={3.4}
          height={1.6}
          rx={0.3}
          fill="#0a1628"
        />
        <line x1={15.3} y1={-13.2} x2={17.5} y2={-13.2} stroke="#56F5DF" strokeWidth={0.3} opacity={0.8} />
        <line x1={15.3} y1={-12.7} x2={16.8} y2={-12.7} stroke="#56F5DF" strokeWidth={0.3} opacity={0.6} />
      </g>
    </g>
  );
}
