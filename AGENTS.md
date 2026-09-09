# AGENTS.md - ai-atlas

See `CLAUDE.md` for tool-data publishing requirements. This file gives repository-level guidance for Codex automatic PR reviews and other AI agents.

## Scope

Applies only to `ai-atlas/`.

## Ecosystem role

- AI Atlas is the tool cartography and orientation layer of Turtleand.
- Its job is to reduce tool confusion by mapping categories, options, trade-offs, and source confidence.
- Keep AI Atlas as a map, not a hype feed, ranking farm, or generic product blog.
- Route curriculum to `ai-lab/`, engineering craft to `build/`, operating principles to `handbook/`, ecosystem routing to `portal/`, and agent operations to `hermes-lab/`.
- `turtleand/openclaw-lab` is archived and deprecated as of 2026-09-06. Preserve historical references, but exclude it from maintenance, audits, and new work unless explicitly reactivated.

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

## Home archipelago interaction invariants

- SVG is the default. Load the 3D renderer only after explicit selection; preserve category/tool selection, geographic framing, and turtle pose across renderer switches.
- Keep WebGL initialization and rendering in the optional worker so navigation stays responsive. Bound queued pose updates, retain the latest pending selection, and terminate cancelled workers.
- Category and tool navigation responds immediately. Turtle travel never delays navigation, opens details, steals focus, or drives the camera.
- Keep journeys in navigable water and redirect from the current pose. SVG and 3D share one scene model and journey controller.
- Preserve direct tool discovery and free map exploration. Category navigation must not force a zoom change in the organic home; keep manually explored center and scale through resize.
- Map emphasis follows hover, keyboard focus, or explicit tap/click selection, never autonomous turtle travel. Keep inactive islands and annotations subdued; hovering must not redirect the turtle or camera, and drags/pinches must not select a shore.
- Keep complete keyboard-accessible tool navigation independent of either renderer. Preserve readable overview labels, mobile sheet scrolling, and detail-dialog focus restoration.
- Pause hidden, reduced-motion, and user-paused animation. Recover from cancelled loading or WebGL failure in 2D without losing navigation state.
- Keep category palettes consistent across terrain, landmarks, HTML labels, and both renderers. Pair color with category names and landmark glyphs.
- Sea features are named, noninteractive scenery. Keep tools visually primary and route around padded feature footprints; never turn hazards into navigation gates or automatic encounters.
- Run the focused atlas tests and `npm run verify:atlas` after home rendering or bundle changes. Preserve the existing tsunami regressions.

## Tsunami tracker interaction invariant

- Selecting a ship is an ephemeral tier preview. The ship, score card, tier text, profile label, and all five sliders must update together to the selected tier floor.
- Every tier must be previewable, including the tier that matches the saved score. Clicking the selected tier again or using "Back to saved score" restores the saved profile.
- Previewing must not write to `tsunami-tracker-scores` in `localStorage`. Editing a preview slider exits preview mode and saves the displayed reference profile with that edit.
- Changes to `src/components/tsunami/` or `src/data/tsunami-data.ts` must keep the ship profile regression tests passing.

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
- Test: `npm test`
- Full validation: `npm run check`
- Preview: `npm run preview`
