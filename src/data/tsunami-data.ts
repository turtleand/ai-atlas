export interface TsunamiEvent {
  day: number;
  label: string;
  description: string;
}

export interface SkillDimension {
  id: string;
  name: string;
  description: string;
  defaultValue: number;
  weight: number;
  inverse?: boolean;
}

export const TSUNAMI_START_DATE = '2026-01-01';

export const SKILL_DIMENSIONS: SkillDimension[] = [
  {
    id: 'aiIntegration',
    name: 'AI Integration',
    description: 'Daily AI tool usage, multi-tool workflows, prompt sophistication',
    defaultValue: 88,
    weight: 0.25,
  },
  {
    id: 'automation',
    name: 'Automation & Pipelines',
    description: 'CI/CD with AI, autonomous systems, self-managing infrastructure',
    defaultValue: 75,
    weight: 0.20,
  },
  {
    id: 'adaptability',
    name: 'Adaptability',
    description: 'Learning velocity, comfort with change, experimentation mindset',
    defaultValue: 90,
    weight: 0.20,
  },
  {
    id: 'aiIndependence',
    name: 'AI Independence',
    description: 'Freedom from manual/soon-to-be-automated work — higher means more future-proof',
    defaultValue: 60,
    weight: 0.15,
  },
  {
    id: 'strategicThinking',
    name: 'Strategic Thinking',
    description: 'System design, business understanding, cross-domain synthesis',
    defaultValue: 82,
    weight: 0.20,
  },
];

export const TSUNAMI_EVENTS: TsunamiEvent[] = [
  {
    day: 0,
    label: 'AI Tsunami begins',
    description: 'Start of accelerated AI disruption cycle',
  },
  {
    day: 14,
    label: '30K+ tech layoffs',
    description: '80% AI-related, first 40 days of 2026',
  },
  {
    day: 44,
    label: 'Spotify: devs not coding',
    description: "CEO confirms developers haven't written code since December",
  },
  {
    day: 45,
    label: 'X launches crypto trading',
    description: '1B+ users get trading access — AI + fintech convergence',
  },
];

export function calculateDaysSinceStart(): number {
  const start = new Date(TSUNAMI_START_DATE);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function calculateWavePercent(): number {
  const days = calculateDaysSinceStart();
  return Math.min(95, 15 + days * 0.15);
}

export function calculateCompositeScore(scores: Record<string, number>): number {
  let total = 0;
  SKILL_DIMENSIONS.forEach((dim) => {
    const value = scores[dim.id] ?? dim.defaultValue;
    const adjustedValue = dim.inverse ? 100 - value : value;
    total += adjustedValue * dim.weight;
  });
  return Math.round(total);
}

export function getVerdict(score: number): { emoji: string; title: string; description: string } {
  if (score >= 99) {
    return {
      emoji: '🔱',
      title: 'The Singularity',
      description: "You don't ride the wave — you are the wave",
    };
  }
  if (score >= 95) {
    return {
      emoji: '🏄',
      title: 'Wave Rider',
      description: "Top 5% — AI-native, commanding the storm",
    };
  }
  if (score >= 80) {
    return {
      emoji: '⛵',
      title: 'Steady Sailor',
      description: 'Top 20% — above water, keep building',
    };
  }
  if (score >= 50) {
    return {
      emoji: '⚠️',
      title: 'Rising Tide',
      description: 'The wave is catching up — act now',
    };
  }
  return {
    emoji: '🌊',
    title: 'Underwater',
    description: 'The tsunami has passed you',
  };
}

export type SurferState = 'surfing' | 'riding' | 'struggling' | 'drowning';

export function getSurferState(score: number, wavePercent: number): SurferState {
  if (score > wavePercent + 15) return 'surfing';
  if (score > wavePercent + 5) return 'riding';
  if (score > wavePercent - 5) return 'struggling';
  return 'drowning';
}

// Tier system
export function calculateTier(score: number): number {
  if (score >= 99) return 5;
  if (score >= 95) return 4;
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

export interface TierInfo {
  tier: number;
  name: string;
  emoji: string;
  description: string;
  scoreRange: string;
}

export const TIER_INFO: TierInfo[] = [
  { tier: 1, name: 'Wreckage', emoji: '💀', description: 'Floating debris — the tsunami won', scoreRange: '0–49' },
  { tier: 2, name: 'Damaged Sloop', emoji: '🚣', description: 'Taking on water, hull cracked, barely afloat', scoreRange: '50–79' },
  { tier: 3, name: 'Hybrid Cruiser', emoji: '⚡', description: 'Tech-augmented vessel — chrome plating, circuit lines, radar arrays', scoreRange: '80–94' },
  { tier: 4, name: 'AI Flagship', emoji: '✦', description: 'AI-native command ship — geometric intelligence above the storm', scoreRange: '95–98' },
  { tier: 5, name: 'The Singularity', emoji: '🔱', description: 'Beyond comprehension — reshapes reality itself, master of ocean and sky', scoreRange: '99–100' },
];

export function getTierMidpoint(tier: number): number {
  switch (tier) {
    case 5: return 100;
    case 4: return 97;
    case 3: return 87;
    case 2: return 65;
    case 1: return 25;
    default: return 50;
  }
}
