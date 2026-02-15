# PRD: The Continent of Ergon — Future Minimap Vision

**Status:** PARKED — Retry when models/tooling improve  
**Date:** 2026-02-15  
**Branch archive:** `feature/tsunami-minimap` (commits 5c5a623..b9d20c7)

---

## Vision

A visual representation of how AI disrupts different job sectors, integrated into the Tsunami Tracker. The metaphor: a continent of human labor ("Ergon" = Greek for work) being progressively flooded by AI capability.

## Approaches Attempted

### 1. 3D Terrain (commit 4e332fe)
- 28 cone-shaped mountains in Three.js, colored by sector
- Integrated into the existing 3D ocean scene
- Problem: too complex, cones looked geometric/primitive, hard to read

### 2. Iceberg Cross-Section SVG (commit 9e5a180)
- 2D SVG side-view of mountain range with waterline cutting through
- Above water: vivid labels. Below water: ghostly/blue-tinted
- Problem: visual execution didn't land, labels cluttered, not engaging enough

### 3. Pure Tier Showcase (proposed, not built)
- Drop waterline/day entirely, make it pure "What's your AI tier?" identity quiz
- Ships become the whole product. Shareable, clean.

### 4. Comparative Benchmarks (proposed, not built)
- Real job roles as elevation markers: "At 80, you're with senior AI-augmented engineers"
- Ship sails past markers as score changes

### 5. Growth Tracker (proposed, not built)
- Save scores over time (localStorage), show personal progression
- "You went from 72 → 80 in 2 weeks. Ship upgraded."

## Data Model (reusable)

### 28 Land Pieces Across 8 Sectors

**Customer Success** (#44aa99): Basic CS Atoll (200m), CS Ops Ridge (500m), Strategic CS Peak (800m)  
**Software Engineering** (#6699ff): Junior Dev Sandbar (400m), Mid-Level Plateau (900m), Senior Architect Ridge (1400m), Principal Peak (1800m)  
**Film & Video** (#ff66aa): Stock Footage Shore (150m), Editor's Bay (550m), Director's Overlook (1100m)  
**Legal** (#ffaa66): Paralegal Flats (300m), Associate Ridge (750m), Partner Summit (1500m)  
**Content & Copywriting** (#66ccff): SEO Beach (100m), Editorial Hills (600m), Voice Summit (1200m)  
**Finance & Accounting** (#ffcc66): Bookkeeper Bay (250m), Analyst Plateau (700m), CFO Heights (1600m)  
**Design** (#cc66ff): Template Reef (200m), UX Research Valley (650m), Design Vision Peak (1300m)  
**Physical/Healthcare** (#66ff99): Admin Lowlands (350m), Nurse's Plateau (1700m), Surgeon's Peak (2600m), Tradecraft Summit (2400m)

### Flood Formula (Sigmoid)
```
L = 0.85 (max 85% of continent floods)
k = 0.008 (steepness)
d0 = 365 (midpoint at 1 year)
floodElevation = MAX_ELEVATION * L / (1 + e^(-k * (days - d0)))
```

### Data Reliability Plan
- **Phase 1:** Sigmoid time formula (AI adoption S-curve baseline)
- **Phase 2:** Weekly cron scans AI news → per-sector flood level adjustments
- **Phase 3:** Per-piece flood driven by news cache, click piece → see headlines

## Geographic Features (flavor)
- Data River, Automation Canyon, Silicon Shelf, Hype Bay, Apprentice Strait

## Key Learnings
- 3D terrain inside an existing 3D scene adds too much visual complexity
- 2D cross-sections need very high visual polish to feel engaging (not a simple SVG)
- The iceberg metaphor is strong conceptually but execution needs better design tools
- Labels on 28 items will always be cluttered — need a different information architecture
- Consider: start with fewer sectors (3-4) and expand, rather than 28 at once
- The ship tiers + sliders are the strong core — don't dilute them with a secondary visualization

## When to Retry
- When AI image generation can create the terrain texture/map
- When better SVG/canvas libraries with built-in label collision avoidance exist
- When the core tracker has more traction (users, shares) to justify the investment
- Consider hiring a designer for the visual execution

## Files Reference
- `src/data/terrain-data.ts` — full data model with 28 pieces
- `src/components/tsunami/Terrain3D.tsx` — 3D terrain (archived)
- `docs/PRD-MINIMAP.md` — original PRD v2
