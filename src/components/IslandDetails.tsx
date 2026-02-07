import type { IslandLayout } from '../utils/layoutEngine.ts';

// Seeded pseudo-random number generator
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

interface DetailElement {
  type: 'palm' | 'mountain' | 'hut' | 'flag';
  angle: number;
  distanceFactor: number; // multiplier of radius
}

function pickDetails(radius: number): DetailElement['type'][] {
  if (radius > 180) return ['palm', 'palm', 'mountain', 'hut', 'flag'];
  if (radius > 140) return ['palm', 'palm', 'mountain', 'hut'];
  if (radius > 100) return ['palm', 'palm', 'flag'];
  return ['palm', 'flag'];
}

function placeDetails(
  types: DetailElement['type'][],
  beaconAngles: number[],
  rng: () => number,
): DetailElement[] {
  const placed: DetailElement[] = [];
  const usedAngles: number[] = [];

  for (const type of types) {
    let angle: number;
    let attempts = 0;
    do {
      angle = rng() * Math.PI * 2;
      attempts++;
    } while (
      attempts < 20 &&
      (beaconAngles.some(ba => Math.abs(angleDiff(angle, ba)) < Math.PI / 6) ||
        usedAngles.some(ua => Math.abs(angleDiff(angle, ua)) < Math.PI / 8))
    );

    const distanceFactor =
      type === 'palm' ? 0.75 + rng() * 0.1 :
      type === 'mountain' ? 0.6 + rng() * 0.1 :
      type === 'hut' ? 0.45 + rng() * 0.1 :
      0.3 + rng() * 0.15;

    placed.push({ type, angle, distanceFactor });
    usedAngles.push(angle);
  }

  return placed;
}

function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function PalmTree({ x, y, outwardAngle }: { x: number; y: number; outwardAngle: number }) {
  const deg = (outwardAngle * 180) / Math.PI;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${deg + 90})`}>
      {/* Trunk */}
      <path
        d="M 0,0 Q 3,-10 1,-20"
        stroke="#8B6914"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaves */}
      <path d="M 1,-20 Q 10,-25 12,-18" stroke="#2E7D32" strokeWidth={1.5} fill="none" />
      <path d="M 1,-20 Q -8,-26 -10,-19" stroke="#388E3C" strokeWidth={1.5} fill="none" />
      <path d="M 1,-20 Q 2,-28 6,-24" stroke="#43A047" strokeWidth={1.5} fill="none" />
    </g>
  );
}

function Mountain({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Mountain body */}
      <polygon points="-12,0 0,-20 12,0" fill="#5D6D7E" />
      {/* Snow cap */}
      <polygon points="-4,-12 0,-20 4,-12" fill="#D5DBDB" />
    </g>
  );
}

function Hut({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Body */}
      <rect x={-5} y={-4} width={10} height={8} fill="#A0522D" rx={1} />
      {/* Roof */}
      <polygon points="-7,-4 0,-12 7,-4" fill="#8B4513" />
    </g>
  );
}

function Flag({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Pole */}
      <line x1={0} y1={0} x2={0} y2={-14} stroke="#6B6B6B" strokeWidth={1} />
      {/* Pennant */}
      <polygon points="0,-14 8,-11 0,-8" fill="#DAA520" />
    </g>
  );
}

interface IslandDetailsProps {
  island: IslandLayout;
}

export function IslandDetails({ island }: IslandDetailsProps) {
  const seed = hashString(island.category.name);
  const rng = seededRandom(seed + 7777);

  // Compute beacon angles relative to island center
  const beaconAngles = island.beacons.map(b =>
    Math.atan2(b.y - island.cy, b.x - island.cx)
  );

  const types = pickDetails(island.radius);
  const details = placeDetails(types, beaconAngles, rng);

  return (
    <g>
      {details.map((d, i) => {
        const dx = Math.cos(d.angle) * island.radius * d.distanceFactor;
        const dy = Math.sin(d.angle) * island.radius * d.distanceFactor;
        const x = island.cx + dx;
        const y = island.cy + dy;

        switch (d.type) {
          case 'palm':
            return <PalmTree key={i} x={x} y={y} outwardAngle={d.angle} />;
          case 'mountain':
            return <Mountain key={i} x={x} y={y} />;
          case 'hut':
            return <Hut key={i} x={x} y={y} />;
          case 'flag':
            return <Flag key={i} x={x} y={y} />;
        }
      })}
    </g>
  );
}
