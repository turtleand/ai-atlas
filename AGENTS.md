# AGENTS.md — ai-atlas

See `CLAUDE.md` for tool-data publishing requirements.

## Scope

Applies only to `ai-atlas/`.

## Ecosystem role

- AI Atlas is the tool cartography and orientation layer of Turtleand.
- Its primary function is to reduce tool confusion by mapping categories, options, and the surrounding AI landscape.
- It should stay focused on navigational clarity and curation rather than becoming a general essay or curriculum surface.

## Project summary

- Stack: React + Vite + TypeScript
- Status: Active
- Primary data surface: `src/data/ai-tools.yaml`

## Workflow

1. Follow `CLAUDE.md` first for AI tool catalog requirements.
2. Prefer source edits in `src/`, data edits in `src/data/`, and public artifact updates only when required.
3. Keep generated output in `dist/` out of scope unless explicitly requested.
4. Preserve the map, navigation, and orientation model unless the task explicitly changes product direction.

## Content and data guidance

- Prioritize curation, categorization, and wayfinding.
- Tool entries should help readers understand what exists, where it fits, and when to explore it.
- Keep metadata complete and consistent so the atlas remains both human-readable and machine-readable.

## Cross-project boundaries

- Route step-by-step builder education to `ai-lab/`.
- Route operational agent infrastructure and deployment practices to `openclaw/`.
- Route identity, featured work, and ecosystem navigation to `portal/`.
- Route compact principles and doctrine to `handbook/`.

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Preview: `npm run preview`
