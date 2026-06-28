export type LoopStageId = 'learn' | 'apply' | 'position' | 'adapt';

export interface LoopStage {
  id: LoopStageId;
  title: string;
  purpose: string;
  question: string;
}

export interface LoopMetric {
  id: string;
  title: string;
  question: string;
  description: string;
  stage: LoopStageId;
}

export const LOOP_STAGES: LoopStage[] = [
  {
    id: 'learn',
    title: 'Learn',
    purpose: 'Sharpen understanding.',
    question: 'Did I learn something that changed, sharpened, or deepened my understanding?',
  },
  {
    id: 'apply',
    title: 'Apply',
    purpose: 'Make something visible.',
    question: 'Did I turn learning into something visible or usable?',
  },
  {
    id: 'position',
    title: 'Position',
    purpose: 'Strengthen strategic identity.',
    question: 'Did today\'s work move us closer to clear strategic identity?',
  },
  {
    id: 'adapt',
    title: 'Adapt',
    purpose: 'Update direction from signal.',
    question: 'Did I adjust direction based on what changed outside or inside?',
  },
];

export const LOOP_STAGES_BY_ID = LOOP_STAGES.reduce((acc, stage) => {
  acc[stage.id] = stage;
  return acc;
}, {} as Record<LoopStageId, LoopStage>);

export const LOOP_METRICS: LoopMetric[] = [
  {
    id: 'learning-depth',
    title: 'Learning Depth',
    question: 'Did I learn something that changed or sharpened understanding?',
    description:
      'Signals: I can explain a concept more clearly, noticed a useful pattern, or corrected an earlier assumption.',
    stage: 'learn',
  },
  {
    id: 'domain-mastery',
    title: 'Domain Mastery',
    question: 'Did I deepen knowledge in a core strategic domain?',
    description:
      'Signals: stronger understanding in agents, AI infrastructure, blockchain, human-AI systems, productivity, or similar strategy domains.',
    stage: 'learn',
  },
  {
    id: 'applied-output',
    title: 'Applied Output',
    question: 'Did learning become visible, reusable value?',
    description:
      'Signals: notes, article, framework, tool, experiment, diagram, or ecosystem update that did not exist before.',
    stage: 'apply',
  },
  {
    id: 'positioning',
    title: 'Positioning',
    question: 'Did today\'s work move us toward trusted interpretation and strategic clarity?',
    description:
      'Signals: clearer public voice, stronger ecosystem coherence, better framing of disruption for AI, blockchain, and systems work.',
    stage: 'position',
  },
  {
    id: 'reach-resonance',
    title: 'Reach and Resonance',
    question: 'Are people seeing and responding to the work?',
    description:
      'Signals: conversations, quality replies, comments, shares, repeated attention, and better discoverability across the right channels.',
    stage: 'adapt',
  },
  {
    id: 'sustainability',
    title: 'Sustainability',
    question: 'Did I make progress without harming tomorrow?',
    description:
      'Signals: preserved sleep, health, and energy while sustaining quality work and thoughtful pace.',
    stage: 'adapt',
  },
];

export const LOOP_STAGE_ORDER: LoopStageId[] = LOOP_STAGES.map((stage) => stage.id);
