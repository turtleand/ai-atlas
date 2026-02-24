# ML Ops
**Status:** Frontier

Managed AI services (OpenAI API, Anthropic API, AWS Bedrock) abstract away much of the traditional MLOps stack. You no longer need to manage training infrastructure or GPU clusters for many use cases. But custom model training, fine-tuning pipelines, and production reliability engineering still require skilled practitioners.

## Latest
- **2026-02-24** -- Singapore's Infocomm Media Development Authority and UC Berkeley's Center for AI Policy jointly publish the first formal governance frameworks specifically addressing agentic AI systems. The frameworks cover autonomous decision-making boundaries, human oversight requirements, and liability allocation for agent actions. Both frameworks emphasize that current AI governance models designed for static models are inadequate for agents that take real-world actions autonomously. Source: Singapore IMDA, UC Berkeley CAIP
- **2026-02-24** -- AWS experiences cascading service degradations as AI inference workloads strain infrastructure capacity. Multiple customers report increased latency and intermittent outages across US-East and EU regions. Internal reports suggest AI workload growth is outpacing infrastructure expansion, with GPU-intensive inference requests competing with traditional compute for shared resources. Source: AWS Status Page, Industry reports
- **2026-02-24** -- Multiple reports emerge that major AI providers are quietly degrading output quality — reducing context windows, simplifying reasoning chains, and increasing response latency — to manage compute costs as demand surges. Users on developer forums document measurable quality regressions in flagship models. The pattern suggests providers face a margin squeeze between user expectations and GPU costs. Source: Developer forums, Industry analysis
- **2026-02-21** -- Mirantis VP Randy Bias predicts AI agents will autonomously manage infrastructure in 2026, not just assist humans. Agents will respond to production events, extend their own capabilities by writing and deploying code, all without waiting for human action. The goal is autonomous management of every layer of an AI factory from bare metal to cluster orchestration. He sees MCP (Model Context Protocol) becoming the default standard for agentic ecosystems. "A general-purpose agent can write the code with rules and actions that create triggers for automated actions like triage events and update that code regularly." MCP servers become dynamically extensible, shaped in real time by what agents decide they need. Source: [TFIR](https://tfir.io/ai-agents-autonomous-ops-mcp-mirantis/)
- **2026-02-20** -- CIO.com analysis warns agentic AI systems don't fail suddenly but "drift over time" in ways traditional testing can't catch. Unlike stateless models, agents operate through decision sequences that evolve as prompts change, tools are added, and dependencies shift. A credit adjudication pilot showed income verification steps dropped from 100% to 70-80% reliability over time despite no obvious failures. Production agentic systems require continuous behavioral monitoring, not just point-in-time demos. Source: [CIO.com](https://www.cio.com/article/4134051/agentic-ai-systems-dont-fail-suddenly-they-drift-over-time.html)
- **2025-12** -- Traditional MLOps (training pipelines, feature stores) commoditizes; focus shifts to evaluation and reliability. Source: Industry reports
- **2025-07** -- Open-source model deployment becomes plug-and-play with tools like vLLM and Ollama. Source: Tech community

## History
- **2025-01** -- "MLOps engineer" roles shift toward "AI platform engineer" focused on orchestration. Source: Job market data
- **2024-06** -- Managed fine-tuning (OpenAI, Anthropic) simplifies custom model workflows. Source: OpenAI, Anthropic
- **2024-01** -- API-first AI services reduce need for in-house ML infrastructure. Source: Industry consensus

## Sources
- [Chip Huyen's blog](https://huyenchip.com/)
- [Pragmatic Engineer newsletter](https://newsletter.pragmaticengineer.com/)
