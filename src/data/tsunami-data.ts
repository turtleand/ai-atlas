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
    defaultValue: 92,
    weight: 0.25,
  },
  {
    id: 'automation',
    name: 'Automation & Pipelines',
    description: 'CI/CD with AI, autonomous systems, self-managing infrastructure',
    defaultValue: 85,
    weight: 0.20,
  },
  {
    id: 'adaptability',
    name: 'Adaptability',
    description: 'Learning velocity, comfort with change, experimentation mindset',
    defaultValue: 95,
    weight: 0.20,
  },
  {
    id: 'traditionalDependence',
    name: 'Traditional Dependence',
    description: 'Reliance on manual/soon-to-be-automated work (INVERSE — higher = more risk)',
    defaultValue: 25,
    weight: 0.15,
    inverse: true,
  },
  {
    id: 'strategicThinking',
    name: 'Strategic Thinking',
    description: 'System design, business understanding, cross-domain synthesis',
    defaultValue: 88,
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
  if (score >= 90) {
    return {
      emoji: '🏄',
      title: 'Wave Rider',
      description: "You're not just surviving, you're surfing",
    };
  }
  if (score >= 75) {
    return {
      emoji: '⛵',
      title: 'Steady Sailor',
      description: 'Above water, keep building',
    };
  }
  if (score >= 60) {
    return {
      emoji: '🚣',
      title: 'Treading Water',
      description: 'The wave is catching up',
    };
  }
  if (score >= 45) {
    return {
      emoji: '⚠️',
      title: 'Rising Tide',
      description: 'Immediate action needed',
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
