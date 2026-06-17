# AGENTS.md - ai-atlas

See `CLAUDE.md` for tool-data publishing requirements. This file gives repository-level guidance for Codex automatic PR reviews and other AI agents.

## Scope

Applies only to `ai-atlas/`.

## Ecosystem role

- AI Atlas is the tool cartography and orientation layer of Turtleand.
- Its job is to reduce tool confusion by mapping categories, options, trade-offs, and source confidence.
- Keep AI Atlas as a map, not a hype feed, ranking farm, or generic product blog.
- Route curriculum to `ai-lab/`, engineering craft to `build/`, operating principles to `handbook/`, ecosystem routing to `portal/`, and agent operations to `openclaw-lab/` or `hermes-lab/`.

## Project summary

- Stack: React + Vite + TypeScript
- Status: Active
- Primary data surface: `src/data/ai-tools.yaml`

## Workflow

1. Follow `CLAUDE.md` first for AI tool catalog requirements.
2. Prefer source edits in `src/`, data edits in `src/data/`, and public artifact updates only when required.
3. Keep generated output in `dist/` out of scope unless explicitly requested.
4. Preserve the map, navigation, and orientation model unless the task explicitly changes product direction.

## Public-safety review

Reject changes that expose secrets, credentials, private infrastructure details, internal paths, specific vulnerabilities, or operational weaknesses. Safe public lessons are allowed when they describe general patterns, architecture trade-offs, defensive principles, or non-sensitive implementation choices.

Keep private things private. Share learnings, not exposure.

## Content and data quality review

- Favor clarity over cleverness and usefulness over novelty.
- Avoid overclaiming, vendor marketing language, stale claims, and ungrounded rankings.
- Preserve Turtleand voice: calm, precise, direct, reflective when useful, practical when needed.
- Do not introduce em dashes in public writing.
- Keep humans responsible for direction, judgment, taste, ethics, and consequences.
- Review category clarity, comparison usefulness, source confidence, and whether the tool entry helps orientation.

## Repository integrity review

- Keep changes focused to the branch purpose.
- Review `src/data/ai-tools.yaml` and public `ai-tools.yaml` consistency when tool data changes.
- Do not silently modify generated or build output unless the repo explicitly tracks it or the change requires regeneration.
- Keep AI-readable artifacts, indexes, routes, sitemaps, and public data files in sync when the repo uses them.
- Run local validation before PR creation.

## PR review checklist

Codex and other agents should check:

- Does the change strengthen AI Atlas as a tool map and orientation surface?
- Are tool claims grounded, current, and free from hype?
- Are categories, tags, links, and public data files still consistent?
- Is anything private, unsafe, or operationally sensitive exposed?
- Are routes, builds, generated files, and data indexes still correct?
- Is the diff small, coherent, and free from unrelated cleanup?

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Preview: `npm run preview`
