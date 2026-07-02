export interface Role {
  id: string;
  name: string;
  status: 'submerged' | 'frontier' | 'safe';
  offset: [number, number];
  elevation: number;
  notesFile?: string;
}

export interface IndustryRegion {
  id: string;
  name: string;
  position: [number, number];
  elevation: number;
  radius: number;
  roles: Role[];
}

export const industryRegions: IndustryRegion[] = [
  {
    id: 'software-engineering',
    name: 'Software Engineering',
    position: [0.5, 0.45],
    elevation: 0.45,
    radius: 0.18,
    roles: [
      {
        id: 'boilerplate-code',
        name: 'Boilerplate/CRUD Code',
        status: 'submerged',
        offset: [-0.12, -0.08],
        elevation: 0.10,
        notesFile: 'boilerplate-code',
      },
      {
        id: 'simple-bug-fixes',
        name: 'Simple Bug Fixes',
        status: 'submerged',
        offset: [0.10, -0.10],
        elevation: 0.12,
        notesFile: 'simple-bug-fixes',
      },
      {
        id: 'junior-dev-tasks',
        name: 'Junior Dev Tasks',
        status: 'frontier',
        offset: [-0.15, 0.04],
        elevation: 0.24,
        notesFile: 'junior-dev-tasks',
      },
      {
        id: 'qa-testing',
        name: 'QA Testing',
        status: 'frontier',
        offset: [0.14, 0.02],
        elevation: 0.32,
        notesFile: 'qa-testing',
      },
      {
        id: 'code-review',
        name: 'Code Review',
        status: 'frontier',
        offset: [0.04, 0.08],
        elevation: 0.34,
        notesFile: 'code-review',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'frontier',
        offset: [-0.08, 0.12],
        elevation: 0.28,
        notesFile: 'documentation',
      },
      {
        id: 'system-architecture',
        name: 'System Architecture',
        status: 'safe',
        offset: [-0.04, 0.16],
        elevation: 0.70,
      },
      {
        id: 'complex-problem-solving',
        name: 'Complex Problem Solving',
        status: 'safe',
        offset: [0.08, 0.15],
        elevation: 0.75,
        notesFile: 'complex-problem-solving',
      },
    ],
  },
  {
    id: 'content-publishing',
    name: 'Content & Publishing',
    position: [0.18, 0.40],
    elevation: 0.30,
    radius: 0.12,
    roles: [
      {
        id: 'seo-copywriting',
        name: 'SEO Copywriting',
        status: 'submerged',
        offset: [-0.04, -0.08],
        elevation: 0.08,
        notesFile: 'seo-copywriting',
      },
      {
        id: 'stock-photography',
        name: 'Stock Photography',
        status: 'submerged',
        offset: [0.06, -0.06],
        elevation: 0.10,
        notesFile: 'stock-photography',
      },
      {
        id: 'copywriting',
        name: 'Copywriting',
        status: 'submerged',
        offset: [-0.06, 0.04],
        elevation: 0.15,
        notesFile: 'copywriting',
      },
      {
        id: 'translation',
        name: 'Translation',
        status: 'frontier',
        offset: [0.06, 0.04],
        elevation: 0.26,
        notesFile: 'translation',
      },
      {
        id: 'creative-direction',
        name: 'Creative Direction',
        status: 'safe',
        offset: [-0.02, 0.10],
        elevation: 0.55,
      },
      {
        id: 'thought-leadership',
        name: 'Thought Leadership',
        status: 'safe',
        offset: [0.04, 0.09],
        elevation: 0.52,
      },
    ],
  },
  {
    id: 'ai-agents',
    name: 'AI & Agents',
    position: [0.72, 0.20],
    elevation: 0.75,
    radius: 0.10,
    roles: [
      {
        id: 'basic-prompt-engineering',
        name: 'Basic Prompt Engineering',
        status: 'frontier',
        offset: [-0.06, -0.04],
        elevation: 0.28,
        notesFile: 'basic-prompt-engineering',
      },
      {
        id: 'ml-ops',
        name: 'ML Ops',
        status: 'frontier',
        offset: [0.06, -0.02],
        elevation: 0.38,
        notesFile: 'ml-ops',
      },
      {
        id: 'agent-architecture',
        name: 'Agent Architecture',
        status: 'safe',
        offset: [-0.02, 0.07],
        elevation: 0.85,
        notesFile: 'agent-architecture',
      },
      {
        id: 'evaluation-design',
        name: 'Evaluation Design',
        status: 'safe',
        offset: [0.04, 0.09],
        elevation: 0.88,
        notesFile: 'evaluation-design',
      },
    ],
  },
  {
    id: 'blockchain',
    name: 'Blockchain',
    position: [0.75, 0.72],
    elevation: 0.60,
    radius: 0.09,
    roles: [
      {
        id: 'smart-contract-auditing',
        name: 'Smart Contract Auditing',
        status: 'frontier',
        offset: [-0.04, -0.04],
        elevation: 0.36,
        notesFile: 'smart-contract-auditing',
      },
      {
        id: 'protocol-design',
        name: 'Protocol Design',
        status: 'safe',
        offset: [0.04, 0.06],
        elevation: 0.78,
        notesFile: 'protocol-design',
      },
      {
        id: 'mechanism-design',
        name: 'Mechanism Design',
        status: 'safe',
        offset: [-0.02, 0.07],
        elevation: 0.82,
        notesFile: 'mechanism-design',
      },
    ],
  },
];

// Water level in normalized elevation (0-1). Anything below this is "submerged".
export const WATER_LEVEL = 0.22;
