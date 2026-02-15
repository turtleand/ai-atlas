export interface NewsLink {
  headline: string;
  url: string;
}

export interface Role {
  name: string;
  status: 'submerged' | 'frontier' | 'safe';
  offset: [number, number];
  elevation: number;
  newsLink?: NewsLink;
}

export interface IndustryRegion {
  id: string;
  name: string;
  position: [number, number];
  elevation: number;
  roles: Role[];
}

export const industryRegions: IndustryRegion[] = [
  {
    id: 'admin',
    name: 'Admin & Clerical',
    position: [0.2, 0.25],
    elevation: 0.18,
    roles: [
      {
        name: 'Data Entry',
        status: 'submerged',
        offset: [-0.02, -0.02],
        elevation: 0.08,
        newsLink: {
          headline: 'Data entry jobs decline 30% as automation takes hold',
          url: 'https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier',
        },
      },
      {
        name: 'Transcription',
        status: 'submerged',
        offset: [0.03, -0.01],
        elevation: 0.06,
      },
      {
        name: 'Filing/Records',
        status: 'submerged',
        offset: [-0.01, 0.03],
        elevation: 0.1,
      },
      {
        name: 'Executive Assistants',
        status: 'frontier',
        offset: [0.02, 0.02],
        elevation: 0.28,
        newsLink: {
          headline: 'AI assistants now handle 40% of scheduling and email tasks',
          url: 'https://www.businessinsider.com/ai-replacing-executive-assistants-scheduling-email-2024',
        },
      },
      {
        name: 'Office Management',
        status: 'safe',
        offset: [0.0, 0.04],
        elevation: 0.5,
      },
    ],
  },
  {
    id: 'customer-service',
    name: 'Customer Service',
    position: [0.75, 0.2],
    elevation: 0.25,
    roles: [
      {
        name: 'L1 Support',
        status: 'submerged',
        offset: [-0.02, -0.01],
        elevation: 0.1,
        newsLink: {
          headline: 'Chatbot adoption accelerates: 85% of customer interactions handled without humans',
          url: 'https://www.gartner.com/en/newsroom/press-releases/2024-ai-customer-service',
        },
      },
      {
        name: 'FAQ Handling',
        status: 'submerged',
        offset: [0.02, -0.02],
        elevation: 0.08,
      },
      {
        name: 'L2 Technical Support',
        status: 'frontier',
        offset: [-0.01, 0.02],
        elevation: 0.3,
      },
      {
        name: 'Claims Processing',
        status: 'frontier',
        offset: [0.03, 0.01],
        elevation: 0.32,
      },
      {
        name: 'Customer Success Strategy',
        status: 'safe',
        offset: [0.01, 0.04],
        elevation: 0.55,
      },
    ],
  },
  {
    id: 'legal',
    name: 'Legal',
    position: [0.35, 0.55],
    elevation: 0.35,
    roles: [
      {
        name: 'Document Review',
        status: 'submerged',
        offset: [-0.02, -0.02],
        elevation: 0.12,
      },
      {
        name: 'Contract Scanning',
        status: 'submerged',
        offset: [0.02, -0.01],
        elevation: 0.14,
      },
      {
        name: 'Paralegals',
        status: 'frontier',
        offset: [-0.01, 0.01],
        elevation: 0.3,
        newsLink: {
          headline: 'Paralegals face 80% automation risk by 2026',
          url: 'https://www.demandsage.com/ai-replacing-jobs-statistics/',
        },
      },
      {
        name: 'Legal Research',
        status: 'frontier',
        offset: [0.03, 0.02],
        elevation: 0.34,
      },
      {
        name: 'Litigation Strategy',
        status: 'safe',
        offset: [0.0, 0.04],
        elevation: 0.6,
      },
      {
        name: 'Courtroom Advocacy',
        status: 'safe',
        offset: [0.02, 0.04],
        elevation: 0.65,
      },
    ],
  },
  {
    id: 'content-media',
    name: 'Content & Media',
    position: [0.65, 0.45],
    elevation: 0.33,
    roles: [
      {
        name: 'Stock Photography',
        status: 'submerged',
        offset: [-0.03, -0.02],
        elevation: 0.08,
        newsLink: {
          headline: 'AI image generation decimates stock photography market',
          url: 'https://www.theverge.com/2023/12/18/24006275/ai-image-generators-stock-photography-market',
        },
      },
      {
        name: 'SEO Copywriting',
        status: 'submerged',
        offset: [0.01, -0.02],
        elevation: 0.1,
      },
      {
        name: 'Basic Translation',
        status: 'submerged',
        offset: [0.03, -0.01],
        elevation: 0.12,
        newsLink: {
          headline: 'AI translation reaches near human-level quality in real time',
          url: 'https://www.wired.com/story/ai-translation-real-time/',
        },
      },
      {
        name: 'Copywriting',
        status: 'frontier',
        offset: [-0.02, 0.02],
        elevation: 0.28,
        newsLink: {
          headline: 'Freelance writing rates drop 50% as AI content tools flood the market',
          url: 'https://www.cnbc.com/2024/01/15/ai-writing-tools-impact-freelance-writers.html',
        },
      },
      {
        name: 'Journalism',
        status: 'frontier',
        offset: [0.02, 0.02],
        elevation: 0.32,
      },
      {
        name: 'Video Editing',
        status: 'frontier',
        offset: [0.0, 0.03],
        elevation: 0.3,
      },
      {
        name: 'Creative Direction',
        status: 'safe',
        offset: [-0.01, 0.05],
        elevation: 0.6,
      },
      {
        name: 'Investigative Journalism',
        status: 'safe',
        offset: [0.02, 0.05],
        elevation: 0.62,
      },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    position: [0.2, 0.7],
    elevation: 0.35,
    roles: [
      {
        name: 'Bookkeeping',
        status: 'submerged',
        offset: [-0.02, -0.02],
        elevation: 0.1,
      },
      {
        name: 'Basic Tax Prep',
        status: 'submerged',
        offset: [0.02, -0.02],
        elevation: 0.12,
      },
      {
        name: 'Invoice Processing',
        status: 'submerged',
        offset: [0.0, -0.03],
        elevation: 0.09,
      },
      {
        name: 'Financial Analysis',
        status: 'frontier',
        offset: [-0.01, 0.01],
        elevation: 0.3,
        newsLink: {
          headline: 'AI financial modeling tools automate 53% of analyst tasks',
          url: 'https://www.bloomberg.com/news/articles/2024-03-20/ai-is-coming-for-wall-street-s-most-coveted-jobs',
        },
      },
      {
        name: 'Auditing',
        status: 'frontier',
        offset: [0.03, 0.01],
        elevation: 0.32,
      },
      {
        name: 'Loan Underwriting',
        status: 'frontier',
        offset: [0.02, 0.03],
        elevation: 0.28,
      },
      {
        name: 'CFO Strategy',
        status: 'safe',
        offset: [-0.01, 0.04],
        elevation: 0.65,
      },
      {
        name: 'Complex Tax Strategy',
        status: 'safe',
        offset: [0.02, 0.05],
        elevation: 0.6,
      },
    ],
  },
  {
    id: 'software',
    name: 'Software Engineering',
    position: [0.5, 0.35],
    elevation: 0.45,
    roles: [
      {
        name: 'Boilerplate/CRUD Code',
        status: 'submerged',
        offset: [-0.02, -0.03],
        elevation: 0.12,
      },
      {
        name: 'Simple Bug Fixes',
        status: 'submerged',
        offset: [0.02, -0.02],
        elevation: 0.14,
      },
      {
        name: 'Junior Development',
        status: 'frontier',
        offset: [-0.02, 0.01],
        elevation: 0.3,
        newsLink: {
          headline: 'Coding assistants now handle entry-level programming tasks',
          url: 'https://www.nytimes.com/2024/06/10/technology/ai-coding-software-engineers.html',
        },
      },
      {
        name: 'QA Testing',
        status: 'frontier',
        offset: [0.03, 0.0],
        elevation: 0.32,
      },
      {
        name: 'Code Review',
        status: 'frontier',
        offset: [0.0, 0.02],
        elevation: 0.34,
      },
      {
        name: 'Senior/Staff Engineering',
        status: 'safe',
        offset: [-0.01, 0.04],
        elevation: 0.7,
      },
      {
        name: 'System Architecture',
        status: 'safe',
        offset: [0.02, 0.05],
        elevation: 0.75,
      },
      {
        name: 'AI Engineering',
        status: 'safe',
        offset: [0.0, 0.06],
        elevation: 0.8,
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing & Sales',
    position: [0.8, 0.65],
    elevation: 0.32,
    roles: [
      {
        name: 'Email Campaign Generation',
        status: 'submerged',
        offset: [-0.02, -0.02],
        elevation: 0.1,
      },
      {
        name: 'Basic Ad Copy',
        status: 'submerged',
        offset: [0.02, -0.01],
        elevation: 0.12,
      },
      {
        name: 'Market Research',
        status: 'frontier',
        offset: [-0.01, 0.01],
        elevation: 0.28,
        newsLink: {
          headline: 'Bloomberg: 53% of market research tasks now automatable by AI',
          url: 'https://www.bloomberg.com/news/articles/2024-02-28/ai-market-research-automation',
        },
      },
      {
        name: 'Social Media Management',
        status: 'frontier',
        offset: [0.03, 0.02],
        elevation: 0.3,
      },
      {
        name: 'Ad Design',
        status: 'frontier',
        offset: [0.01, 0.03],
        elevation: 0.26,
      },
      {
        name: 'Brand Strategy',
        status: 'safe',
        offset: [-0.02, 0.04],
        elevation: 0.6,
      },
      {
        name: 'Relationship Sales',
        status: 'safe',
        offset: [0.02, 0.05],
        elevation: 0.58,
      },
    ],
  },
  {
    id: 'ai-blockchain',
    name: 'AI & Blockchain',
    position: [0.5, 0.75],
    elevation: 0.7,
    roles: [
      {
        name: 'ML Ops',
        status: 'frontier',
        offset: [-0.02, -0.01],
        elevation: 0.35,
        newsLink: {
          headline: 'MLOps platforms commoditize as managed AI services mature',
          url: 'https://venturebeat.com/ai/mlops-commoditization-managed-ai/',
        },
      },
      {
        name: 'Smart Contract Auditing',
        status: 'frontier',
        offset: [0.03, 0.0],
        elevation: 0.38,
      },
      {
        name: 'AI Architecture',
        status: 'safe',
        offset: [-0.01, 0.03],
        elevation: 0.85,
      },
      {
        name: 'DeFi Protocol Design',
        status: 'safe',
        offset: [0.02, 0.04],
        elevation: 0.88,
      },
      {
        name: 'Cryptography Research',
        status: 'safe',
        offset: [0.0, 0.05],
        elevation: 0.92,
      },
    ],
  },
];

// Water level in normalized elevation (0-1). Anything below this is "submerged".
export const WATER_LEVEL = 0.22;
