import { industryRegions, type IndustryRegion, type Role } from '../../data/impact-map-data';

export type ImpactStatus = Role['status'];

export const statusOrder: ImpactStatus[] = ['safe', 'frontier', 'submerged'];

export const statusLabels: Record<ImpactStatus, string> = {
  safe: 'Human high ground',
  frontier: 'Frontier waterline',
  submerged: 'Flooded already',
};

export const statusShortLabels: Record<ImpactStatus, string> = {
  safe: 'High ground',
  frontier: 'Frontier',
  submerged: 'Flooded',
};

export const statusNouns: Record<ImpactStatus, string> = {
  safe: 'high ground',
  frontier: 'frontier',
  submerged: 'flooded work',
};

export interface IndustryInsight {
  summary: string;
  signal: string;
  statusCopy: Record<ImpactStatus, string>;
}

export const industryInsights: Record<string, IndustryInsight> = {
  'software-engineering': {
    summary:
      'AI is compressing routine implementation first. Durable value moves toward system design, review judgment, integration, and ownership of consequences.',
    signal:
      'Routine code is under water. Judgment-heavy engineering stays valuable when it decides the shape, risk model, and long-term maintenance path.',
    statusCopy: {
      safe:
        'Architecture and complex problem solving remain high ground because someone must choose system shape, risk posture, trade-offs, and acceptable failure modes.',
      frontier:
        'Review, QA, docs, and junior implementation are under active pressure. AI can draft and inspect more work, but humans still own context and accountability.',
      submerged:
        'Boilerplate and simple fixes are already heavily compressed. The common version of this work is increasingly fast to generate and cheap to repeat.',
    },
  },
  'content-publishing': {
    summary:
      'AI floods commodity production first. The remaining leverage is taste, voice, editorial direction, and knowing what is worth saying.',
    signal:
      'Generic content is abundant. Scarcity moves toward judgment, perspective, trust, and audience-specific editorial choices.',
    statusCopy: {
      safe:
        'Creative direction and thought leadership stay high ground when they require taste, lived judgment, and a real point of view.',
      frontier:
        'Translation sits at the waterline. Literal transfer is easy, but nuance, cultural fit, and accountability still need human review.',
      submerged:
        'SEO copy, stock imagery, and basic copy are already flooded by abundant synthetic production and template-driven generation.',
    },
  },
  'ai-agents': {
    summary:
      'As tools get easier, scarce value moves from prompting toward architecture, evaluation, reliability, and deciding what agents should not do.',
    signal:
      'The operator layer is shifting fast. Prompting alone becomes less defensible while systems judgment compounds.',
    statusCopy: {
      safe:
        'Agent architecture and evaluation design remain high ground because reliability, goal boundaries, and judgment cannot be delegated blindly.',
      frontier:
        'Prompt engineering and ML Ops are changing quickly. AI helps with configuration and iteration, but production ownership remains difficult.',
      submerged:
        'This category has no currently flooded roles in the map. The pressure is real, but the listed roles are still frontier or high ground.',
    },
  },
  blockchain: {
    summary:
      'AI can assist code inspection, but protocol-level value still depends on adversarial thinking, incentives, governance, and accountability.',
    signal:
      'Automation helps at the code edge. The deeper work is designing systems that survive incentives, attacks, and social coordination.',
    statusCopy: {
      safe:
        'Protocol and mechanism design remain high ground because they require incentive reasoning, governance judgment, and long-horizon trade-offs.',
      frontier:
        'Smart contract auditing is at the waterline. AI can surface patterns, but adversarial reasoning and accountability still matter.',
      submerged:
        'This map does not yet classify a blockchain role as flooded. The category is more exposed at implementation edges than at system design depth.',
    },
  },
};

export interface RoleInsight {
  meaning: string;
  why: string;
  aiCanHelp: string;
  humanOwns: string;
  movementSignals: string;
}

const fallbackRoleInsight: RoleInsight = {
  meaning: 'A role or work pattern tracked by the AI Impact Map.',
  why: 'Its status reflects the current balance between automation pressure and human judgment.',
  aiCanHelp: 'AI can assist with drafting, pattern spotting, research, and fast iteration when the context is clear.',
  humanOwns: 'Humans still own direction, accountability, taste, validation, and the consequences of the work.',
  movementSignals: 'The status could change as tools gain reliability, broader context, or stronger evaluation loops.',
};

export const roleInsights: Record<string, RoleInsight> = {
  'boilerplate-code': {
    meaning: 'Common CRUD, wiring, scaffolding, and repeated implementation patterns.',
    why: 'The work is constrained, repetitive, and easy to verify against existing examples.',
    aiCanHelp: 'Generate first drafts, map framework conventions, and adapt common patterns quickly.',
    humanOwns: 'Choosing whether the generated path fits the product, data model, and maintenance burden.',
    movementSignals: 'This stays flooded unless new complexity appears around domain rules, security, or integrations.',
  },
  'simple-bug-fixes': {
    meaning: 'Localized fixes where the expected behavior and failure are already clear.',
    why: 'AI can inspect error messages, compare nearby code, and propose small patches with limited context.',
    aiCanHelp: 'Suggest fixes, write regression tests, and explain likely causes.',
    humanOwns: 'Confirming root cause, verifying adjacent behavior, and avoiding shallow symptom fixes.',
    movementSignals: 'More autonomous debugging will push this further underwater, but unclear failures remain higher up.',
  },
  'junior-dev-tasks': {
    meaning: 'Well-scoped implementation work that usually needs guidance from senior context.',
    why: 'AI can execute many steps, but task framing and review still determine whether the output is useful.',
    aiCanHelp: 'Draft code, follow patterns, update tests, and propose implementation paths.',
    humanOwns: 'Task definition, product fit, review, mentoring, and deciding when the solution is good enough.',
    movementSignals: 'Agent reliability, repo memory, and better review loops could move more of this below water.',
  },
  'qa-testing': {
    meaning: 'Designing and running checks that reveal whether behavior matches intent.',
    why: 'AI can generate test cases, but quality depends on knowing what risks matter.',
    aiCanHelp: 'Create test scaffolds, explore edge cases, summarize failures, and automate routine regression checks.',
    humanOwns: 'Coverage judgment, risk prioritization, release confidence, and interpreting ambiguous failures.',
    movementSignals: 'Better product context and autonomous browser agents could flood more routine QA.',
  },
  'code-review': {
    meaning: 'Inspecting code changes for correctness, maintainability, safety, and fit.',
    why: 'AI is strong at pattern spotting, but final accountability and trade-off judgment remain human-led.',
    aiCanHelp: 'Flag risky diffs, missing validation, style drift, and possible security issues.',
    humanOwns: 'Deciding severity, accepting trade-offs, protecting scope, and owning merge consequences.',
    movementSignals: 'Review agents with stronger project memory may move more routine review into flooded territory.',
  },
  documentation: {
    meaning: 'Explaining systems, decisions, workflows, or APIs so others can use them correctly.',
    why: 'AI can draft quickly, but accuracy, audience fit, and priority still need human judgment.',
    aiCanHelp: 'Create outlines, polish wording, update references, and produce examples.',
    humanOwns: 'Truthfulness, omissions, public-safety boundaries, and the reader journey.',
    movementSignals: 'If docs are generated from verified source behavior, more of the drafting layer moves underwater.',
  },
  'system-architecture': {
    meaning: 'Choosing the shape of a system, its boundaries, failure modes, and long-term trade-offs.',
    why: 'Architecture depends on context, constraints, accountability, and judgment about what must stay simple.',
    aiCanHelp: 'Map options, surface risks, compare patterns, and pressure-test assumptions.',
    humanOwns: 'Direction, taste, sequencing, risk acceptance, and responsibility for the system that ships.',
    movementSignals: 'This could move only if agents gain reliable context, evaluation, and accountability over long horizons.',
  },
  'complex-problem-solving': {
    meaning: 'Solving ambiguous problems where the right frame is not obvious yet.',
    why: 'The work depends on synthesis, judgment, taste, and defining the problem before solving it.',
    aiCanHelp: 'Generate hypotheses, search alternatives, simulate objections, and compress information.',
    humanOwns: 'Choosing the frame, deciding what matters, and carrying the consequences of the decision.',
    movementSignals: 'Better reasoning tools will assist more, but ownership and value judgment remain high ground.',
  },
  'seo-copywriting': {
    meaning: 'Search-oriented commodity writing built around keywords and standard page structures.',
    why: 'The pattern is repetitive, measurable, and widely templated.',
    aiCanHelp: 'Draft variants, summarize search intent, and produce quick metadata or page copy.',
    humanOwns: 'Brand integrity, factual accuracy, and whether the page deserves to exist.',
    movementSignals: 'Search quality changes and synthetic-content filters could reshape the value of this work.',
  },
  'stock-photography': {
    meaning: 'Generic visual supply for common scenes, concepts, and placeholders.',
    why: 'Synthetic image generation floods generic visuals with fast, abundant alternatives.',
    aiCanHelp: 'Generate concepts, variations, and placeholder imagery at low cost.',
    humanOwns: 'Visual taste, rights decisions, audience fit, and whether the image strengthens the story.',
    movementSignals: 'Authentic documentary evidence and distinctive brand systems remain harder to automate.',
  },
  copywriting: {
    meaning: 'Basic marketing or product copy that follows known persuasive patterns.',
    why: 'Generic copy can be drafted quickly, but distinct positioning is still scarce.',
    aiCanHelp: 'Create options, shorten text, change tone, and test angles.',
    humanOwns: 'Strategy, truthfulness, taste, and protecting the audience from empty persuasion.',
    movementSignals: 'More context-aware brand systems could flood routine copy further.',
  },
  translation: {
    meaning: 'Moving meaning between languages while preserving nuance, tone, and intent.',
    why: 'Literal translation is highly automated, but cultural fit and responsibility still matter.',
    aiCanHelp: 'Produce first-pass translations, alternatives, glossaries, and tone variants.',
    humanOwns: 'Nuance, sensitive context, legal or safety meaning, and final publication judgment.',
    movementSignals: 'Domain-specific evaluation and native speaker review loops could move more work below water.',
  },
  'creative-direction': {
    meaning: 'Choosing the concept, taste, references, constraints, and final creative direction.',
    why: 'The work depends on taste, point of view, and knowing what should not be made.',
    aiCanHelp: 'Explore references, mock variations, and test visual or narrative options.',
    humanOwns: 'The point of view, aesthetic judgment, cultural sensitivity, and final taste call.',
    movementSignals: 'AI will widen option space, but direction remains high ground when taste matters.',
  },
  'thought-leadership': {
    meaning: 'Public reasoning that advances a real perspective instead of repeating common summaries.',
    why: 'The value comes from lived judgment, original synthesis, and credibility.',
    aiCanHelp: 'Stress-test arguments, structure drafts, find references, and clarify wording.',
    humanOwns: 'Belief, judgment, responsibility, and whether the work is worth publishing.',
    movementSignals: 'Generic commentary will flood, but credible original perspective should remain scarce.',
  },
  'basic-prompt-engineering': {
    meaning: 'Writing prompts or instructions to get useful output from AI tools.',
    why: 'Prompting is still useful, but many patterns are becoming built into products.',
    aiCanHelp: 'Suggest prompt structures, rewrite instructions, and create task-specific variants.',
    humanOwns: 'Goal definition, evaluation, context, and deciding whether the tool output is useful.',
    movementSignals: 'As interfaces improve, standalone prompt craft becomes less scarce.',
  },
  'ml-ops': {
    meaning: 'Operating model workflows, deployment, monitoring, data quality, and reliability loops.',
    why: 'AI helps with configuration and diagnosis, but production ownership remains high stakes.',
    aiCanHelp: 'Generate configs, summarize logs, compare tooling, and propose runbooks.',
    humanOwns: 'Reliability standards, incident judgment, governance, and production accountability.',
    movementSignals: 'Managed platforms and agentic ops could automate more routine maintenance.',
  },
  'agent-architecture': {
    meaning: 'Designing agent systems, tool boundaries, memory, orchestration, and failure handling.',
    why: 'This requires systems thinking, safety judgment, and knowing where autonomy should stop.',
    aiCanHelp: 'Map architectures, generate tests, simulate failure modes, and propose coordination patterns.',
    humanOwns: 'Autonomy boundaries, evaluation, escalation policy, and consequences of agent actions.',
    movementSignals: 'Better agent frameworks will help, but safe delegation design remains high ground.',
  },
  'evaluation-design': {
    meaning: 'Defining what good means and building checks that reveal whether AI behavior is reliable.',
    why: 'Evaluation is upstream of trust. Without good judgment, automation only moves faster in the wrong direction.',
    aiCanHelp: 'Generate test cases, adversarial prompts, rubrics, and analysis summaries.',
    humanOwns: 'Success criteria, risk tolerance, representative data, and final interpretation.',
    movementSignals: 'Automated eval tooling will improve, but choosing the right target remains scarce.',
  },
  'smart-contract-auditing': {
    meaning: 'Inspecting contract code for bugs, exploit paths, and incorrect assumptions.',
    why: 'AI can spot patterns, but adversarial reasoning and accountability keep this at the waterline.',
    aiCanHelp: 'Flag suspicious code, summarize known patterns, and generate targeted test ideas.',
    humanOwns: 'Threat modeling, economic context, proof of exploitability, and final security judgment.',
    movementSignals: 'Formal tools plus AI assistants may flood narrower audit checks over time.',
  },
  'protocol-design': {
    meaning: 'Designing blockchain rules, incentives, governance, and upgrade paths.',
    why: 'The work depends on strategic trade-offs across code, economics, and human coordination.',
    aiCanHelp: 'Compare designs, surface failure cases, and model stakeholder incentives.',
    humanOwns: 'Governance judgment, incentive design, trust assumptions, and responsibility for the network.',
    movementSignals: 'Tooling can support analysis, but protocol judgment remains high ground.',
  },
  'mechanism-design': {
    meaning: 'Designing incentives so independent actors produce the intended system behavior.',
    why: 'Mechanisms fail when they ignore human incentives, edge cases, or adversarial adaptation.',
    aiCanHelp: 'Generate scenarios, compare incentive structures, and test assumptions.',
    humanOwns: 'Choosing objectives, accounting for social behavior, and accepting trade-offs.',
    movementSignals: 'Simulation tools may improve support, but real-world incentive judgment remains scarce.',
  },
};

export function getIndustryById(industryId: string): IndustryRegion {
  return industryRegions.find((industry) => industry.id === industryId) ?? industryRegions[0];
}

export function getRolesByStatus(industry: IndustryRegion, status: ImpactStatus): Role[] {
  return industry.roles.filter((role) => role.status === status);
}

export function getStatusCount(industry: IndustryRegion, status: ImpactStatus): number {
  return getRolesByStatus(industry, status).length;
}

export function getAllStatusCounts(): Record<ImpactStatus, number> {
  return statusOrder.reduce(
    (counts, status) => ({
      ...counts,
      [status]: industryRegions.reduce((total, industry) => total + getStatusCount(industry, status), 0),
    }),
    { safe: 0, frontier: 0, submerged: 0 } as Record<ImpactStatus, number>,
  );
}

export function getRoleInsight(role: Role): RoleInsight {
  return roleInsights[role.id] ?? fallbackRoleInsight;
}

export function getAdjacentRoles(industry: IndustryRegion, role: Role): Role[] {
  const sameStatus = industry.roles.filter((candidate) => candidate.status === role.status && candidate.id !== role.id);
  const crossStatus = industry.roles.filter((candidate) => candidate.status !== role.status);

  return [...sameStatus, ...crossStatus].slice(0, 4);
}
