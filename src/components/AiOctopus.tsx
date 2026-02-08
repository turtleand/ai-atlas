import type { MapLayout } from '../utils/layoutEngine.ts';
import { useAiOctopusAnimation } from '../hooks/useAiOctopusAnimation.ts';

const BUBBLE_COUNT = 15;

interface AiOctopusProps {
  routes: MapLayout['routes'];
}

export function AiOctopus({ routes }: AiOctopusProps) {
  const { octopusRef, bubbleRef } = useAiOctopusAnimation(routes);

  if (routes.length === 0) return null;

  return (
    <g>
      {/* Bubble trail (pool of reusable circles) */}
      <g ref={bubbleRef}>
        {Array.from({ length: BUBBLE_COUNT }, (_, i) => (
          <circle
            key={i}
            cx={0}
            cy={0}
            r={2}
            fill="none"
            stroke="#E056F5"
            strokeWidth={0.5}
            opacity={0}
          />
        ))}
      </g>

      {/* AI Octopus (~60x60 units, centered at origin, facing right, top-down view) */}
      <g ref={octopusRef}>
        {/* Tentacles — 8 flowing appendages arranged radially */}
        
        {/* Back tentacles (behind body) */}
        <path
          d="M -8,0 C -18,8 -28,12 -32,8 C -36,4 -30,2 -26,6 C -22,10 -16,6 -12,4"
          fill="#9B4F96"
          stroke="#7A3D75"
          strokeWidth={0.6}
          data-tentacle="back-center"
          data-pivot-x="-8"
          data-pivot-y="0"
        />
        
        <path
          d="M -6,6 C -14,16 -20,26 -18,30 C -16,34 -12,28 -14,22 C -16,16 -10,12 -6,10"
          fill="#9B4F96"
          stroke="#7A3D75"
          strokeWidth={0.6}
          data-tentacle="back-right-1"
          data-pivot-x="-6"
          data-pivot-y="6"
        />
        
        <path
          d="M -6,-6 C -14,-16 -20,-26 -18,-30 C -16,-34 -12,-28 -14,-22 C -16,-16 -10,-12 -6,-10"
          fill="#9B4F96"
          stroke="#7A3D75"
          strokeWidth={0.6}
          data-tentacle="back-left-1"
          data-pivot-x="-6"
          data-pivot-y="-6"
        />

        <path
          d="M -2,10 C -6,22 -4,32 0,34 C 4,36 6,28 2,22 C -2,16 0,12 2,10"
          fill="#A85BA3"
          stroke="#7A3D75"
          strokeWidth={0.6}
          data-tentacle="side-right"
          data-pivot-x="-2"
          data-pivot-y="10"
        />
        
        <path
          d="M -2,-10 C -6,-22 -4,-32 0,-34 C 4,-36 6,-28 2,-22 C -2,-16 0,-12 2,-10"
          fill="#A85BA3"
          stroke="#7A3D75"
          strokeWidth={0.6}
          data-tentacle="side-left"
          data-pivot-x="-2"
          data-pivot-y="-10"
        />

        {/* Front tentacles */}
        <path
          d="M 6,8 C 12,18 18,28 22,26 C 26,24 22,18 18,20 C 14,22 10,14 8,10"
          fill="#B567B0"
          stroke="#8A4A85"
          strokeWidth={0.6}
          data-tentacle="front-right-1"
          data-pivot-x="6"
          data-pivot-y="8"
        />
        
        <path
          d="M 6,-8 C 12,-18 18,-28 22,-26 C 26,-24 22,-18 18,-20 C 14,-22 10,-14 8,-10"
          fill="#B567B0"
          stroke="#8A4A85"
          strokeWidth={0.6}
          data-tentacle="front-left-1"
          data-pivot-x="6"
          data-pivot-y="-8"
        />

        <path
          d="M 10,4 C 20,10 30,12 32,8 C 34,4 28,4 24,6 C 20,8 14,4 12,2"
          fill="#B567B0"
          stroke="#8A4A85"
          strokeWidth={0.6}
          data-tentacle="front-right-2"
          data-pivot-x="10"
          data-pivot-y="4"
        />
        
        <path
          d="M 10,-4 C 20,-10 30,-12 32,-8 C 34,-4 28,-4 24,-6 C 20,-8 14,-4 12,-2"
          fill="#B567B0"
          stroke="#8A4A85"
          strokeWidth={0.6}
          data-tentacle="front-left-2"
          data-pivot-x="10"
          data-pivot-y="-4"
        />

        {/* Mantle (body) — rounded bulbous shape */}
        <ellipse cx={-4} cy={0} rx={14} ry={12} fill="#C77DC2" stroke="#9B5A96" strokeWidth={0.8} />
        
        {/* Mantle texture — subtle gradient spots */}
        <ellipse cx={-8} cy={-4} rx={3} ry={2.5} fill="#D48FD0" opacity={0.6} />
        <ellipse cx={-6} cy={4} rx={2.5} ry={2} fill="#D48FD0" opacity={0.5} />
        <ellipse cx={-2} cy={-2} rx={2} ry={1.5} fill="#D48FD0" opacity={0.4} />

        {/* Bioluminescent patterns — AI circuitry theme */}
        <circle cx={-10} cy={0} r={1.2} fill="#E056F5" opacity={0.9}>
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={-6} cy={-5} r={0.8} fill="#56F5DF" opacity={0.85}>
          <animate attributeName="opacity" values="0.85;0.3;0.85" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx={-6} cy={5} r={0.8} fill="#56F5DF" opacity={0.85}>
          <animate attributeName="opacity" values="0.85;0.3;0.85" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx={0} cy={-3} r={0.6} fill="#E056F5" opacity={0.7}>
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx={0} cy={3} r={0.6} fill="#E056F5" opacity={0.7}>
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.7s" repeatCount="indefinite" />
        </circle>

        {/* Neural network lines */}
        <path
          d="M -10,0 L -6,-5 M -10,0 L -6,5 M -6,-5 L 0,-3 M -6,5 L 0,3"
          fill="none"
          stroke="#56F5DF"
          strokeWidth={0.4}
          opacity={0.6}
        />

        {/* Head section — front of mantle */}
        <ellipse cx={8} cy={0} rx={10} ry={9} fill="#D48FD0" stroke="#A85BA3" strokeWidth={0.6} />

        {/* Eyes — large, expressive */}
        <ellipse cx={10} cy={-4} rx={4} ry={3.5} fill="#1A1A2E" stroke="#E056F5" strokeWidth={0.5} />
        <ellipse cx={10} cy={4} rx={4} ry={3.5} fill="#1A1A2E" stroke="#E056F5" strokeWidth={0.5} />
        
        {/* Eye shine/pupils */}
        <ellipse cx={11} cy={-4} rx={2} ry={1.8} fill="#3A3A5E" />
        <ellipse cx={11} cy={4} rx={2} ry={1.8} fill="#3A3A5E" />
        
        {/* Eye highlights */}
        <circle cx={12.5} cy={-5} r={1} fill="#E056F5" opacity={0.8} />
        <circle cx={12.5} cy={3} r={1} fill="#E056F5" opacity={0.8} />
        <circle cx={9} cy={-3} r={0.5} fill="white" opacity={0.9} />
        <circle cx={9} cy={5} r={0.5} fill="white" opacity={0.9} />

        {/* Siphon (jet propulsion organ) */}
        <ellipse cx={16} cy={0} rx={2} ry={1.5} fill="#B567B0" stroke="#8A4A85" strokeWidth={0.4} />

        {/* Tech accessory — small antenna/sensor array */}
        <g transform="translate(4, -10)">
          <rect x={-2} y={-1} width={4} height={2} rx={0.5} fill="#3A3A4A" stroke="#56F5DF" strokeWidth={0.3} />
          <circle cx={0} cy={0} r={0.6} fill="#56F5DF">
            <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <line x1={0} y1={-1} x2={0} y2={-3} stroke="#3A3A4A" strokeWidth={0.5} />
          <circle cx={0} cy={-3.5} r={0.8} fill="#56F5DF" opacity={0.9}>
            <animate attributeName="r" values="0.8;1.2;0.8" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>
    </g>
  );
}
