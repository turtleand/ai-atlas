# AI Archipelago Explorer -- Standalone App

## Context

The existing AI Tools Map (`turtleand-blog/src/components/labs/AIToolsMap.tsx`) is a D3 force graph -- functional but visually plain. We're building a completely new **fantasy island archipelago** as a standalone Vite + React app, deployed to its own subdomain. Each tool category is an island on an animated ocean. The map grows as you explore new AI tools.

The app lives at `turtleand-universe/ai-archipelago/` alongside the existing projects (ai-lab, turtleand-blog, portal, etc.), and is linked from both the blog and AI Lab as a "portal" experience.

---

## Step 1: Scaffold the App

Create a new Vite + React + TypeScript project at `turtleand-universe/ai-archipelago/`.

```bash
npm create vite@latest ai-archipelago -- --template react-ts
```

Minimal dependencies:
- `react`, `react-dom` (from template)
- No other libraries needed -- SVG + CSS for all visuals

---

## Step 2: Create the Markdown Data File

`src/data/ai-tools.md` -- the **sole input**. Adding a tool = adding a line. Adding a category = adding a heading.

```markdown
## Chatbot
- ChatGPT | https://chat.openai.com/ | OpenAI's conversational AI
- Claude | https://claude.ai/ | Anthropic's AI assistant
- Grok | https://grok.x.ai/ | xAI's chatbot
- Gemini | https://gemini.google.com/ | Google's AI assistant
- Sesame | https://www.sesame.com/ | Voice-based AI companion

## Images
- DALL-E 3 | https://openai.com/dall-e-3/ | OpenAI's image generation
- Reve | https://reve.art/ | Free text-to-image generator
- Gemini Drawing | https://gemini.google.com/ | Collaborative AI drawing

## Video Generation
- Sora | https://openai.com/sora | OpenAI's text-to-video model

## Code
- GitHub Copilot | https://github.com/features/copilot | AI pair programmer
- Claude Code | https://claude.ai/ | AI coding assistant in terminal

## General
- Google AI Studio | https://aistudio.google.com/ | Google's AI dev platform

## Research
- ChatGPT Deep Search | https://chat.openai.com/ | Advanced AI research

## Education
- NotebookLM | https://notebooklm.google/ | AI-powered learning notebook
- Gamma | https://gamma.app/ | AI presentation creation

## Local & Infrastructure
- llama.cpp | https://github.com/ggerganov/llama.cpp | Local LLM inference engine
- Hugging Face | https://huggingface.co/ | Model repository & community hub
- ntfy | https://ntfy.sh/ | Push notifications for AI agents
```

Create `src/utils/parseTools.ts` to parse this markdown at build time (Vite raw import) into structured data:
```ts
interface Tool { id: string; name: string; url: string; description: string; }
interface Category { id: string; name: string; tools: Tool[]; }
```

---

## Step 3: Ocean Background & Map Container

`src/components/ArchipelagoMap.tsx` -- the root component:

- **Full-viewport** (`100vw x 100vh`, no scrollbars)
- **Ocean background**: Deep gradient (`#0a1628` to `#1a3a5c`) with 3 layered CSS wave animations at different speeds -- created using `background-position` animation on subtle repeating linear gradients. This creates a convincing parallax water effect with zero JS cost.
- **Inner SVG canvas**: A large SVG element (~3000x2000) containing all islands
- **Zoom/pan**: Track pointer events (mousedown/move/up + wheel) to update a CSS `transform: translate(x,y) scale(z)` on the SVG. This gives smooth pan/zoom with no library needed.
- **Initial view**: Auto-fit to show all islands with some ocean padding

---

## Step 4: Self-Configuring Island Layout & Rendering

The layout is **fully automatic** -- computed algorithmically from the markdown data. No manual coordinates to maintain. When you add, remove, or update tools in `ai-tools.md`, the map reconfigures itself:

### Auto-Layout Algorithm (`src/utils/layoutEngine.ts`)

1. **Island positioning**: Categories are arranged in a circular/radial layout around the map center. The angle spacing is equal (`360° / numCategories`). The radius from center varies slightly per island to avoid a rigid circle feel (deterministic offset using a hash of the category name).

2. **Island sizing**: Each island's radius scales with its tool count: `baseRadius + (toolCount * scaleFactor)`. A category with 5 tools gets a bigger island than one with 1 tool. Min/max bounds prevent islands from being too tiny or too massive.

3. **Beacon positioning within islands**: Tools are placed in a circular arrangement within the island boundary, evenly spaced. For 1 tool: centered. For 2-3: triangle. For 4+: evenly around an inner ring. Positions are computed relative to the island center.

4. **When tools change**: The entire layout recomputes from the data. Because the layout is deterministic (based on category names and tool counts, not random), the same data always produces the same layout. Adding a tool makes its island grow slightly and repositions its beacons. Adding a category inserts a new island and re-spaces all islands. Removing all tools from a category removes that island entirely.

5. **Vite HMR**: The markdown file is imported as a raw string via Vite's `?raw` import. During development, editing `ai-tools.md` triggers hot module replacement -- the map updates instantly without a full page reload.

### Island Component (`src/components/Island.tsx`)
Each island is an SVG `<g>` element containing:

1. **Island shape**: An organic blob SVG `<path>` generated procedurally. Uses a seeded noise function based on the category name to create a unique but stable shape. The shape scales with tool count. Same category name → same shape every time.

2. **Terrain fill**: Layered SVG fills:
   - Base fill: category color (lighter shade for coastline ring)
   - Interior: slightly darker gradient toward center (mountains/terrain)
   - Coastline: a lighter stroke around the perimeter

3. **Category colors** (auto-assigned from a palette, or overridden per category):
   - Chatbot: Gold/amber `#D4A03A` / `#8B6914`
   - Images: Purple/magenta `#9B59B6` / `#6C3483`
   - Video: Indigo/silver `#5B6DAD` / `#2C3E6B`
   - Code: Emerald `#27AE60` / `#1A7A42`
   - Education: Warm amber `#E8A838` / `#A67C2E`
   - Research: Cyan/steel `#2E86C1` / `#1B4F72`
   - Local/Infra: Volcanic red `#E74C3C` / `#922B21`
   - General: Neutral port `#95A5A6` / `#7F8C8D`
   - **New categories**: Auto-assigned from remaining palette colors

4. **Category label**: Centered text in a fantasy font ("Cinzel" from Google Fonts)

5. **Tool beacons**: Positioned by the layout engine. Small glowing circles with:
   - A pulsing glow (CSS animation on SVG `filter: drop-shadow`)
   - Tool name label beside the beacon
   - Hover: flare + tooltip
   - Click: open detail panel

---

## Step 5: Interactions

### Tooltip (`src/components/ToolTooltip.tsx`)
- Appears on tool beacon hover near the cursor
- Shows: tool name + short description
- Styled as a nautical card (dark background, gold border, subtle shadow)

### Journal Panel (`src/components/JournalPanel.tsx`)
- Slides in from the right on tool click
- Styled as a weathered sea captain's journal page:
  - Parchment-tinted background
  - Tool name in calligraphic header
  - Category badge with color dot
  - Description paragraph
  - "Set Sail" button (opens tool URL in new tab)
- Closes on X button or clicking the ocean background

### Legend (`src/components/MapLegend.tsx`)
- Bottom-left corner, semi-transparent panel
- Lists all categories with color dots and tool counts
- Click a category to pan/zoom to that island
- Top shows: "X tools charted across Y islands"

### Compass Rose
- SVG decorative compass in bottom-right corner
- Purely decorative (sepia-toned, fantasy style)
- Optional: click to reset zoom/pan to initial view

---

## Step 6: Fog & Edge Treatment

- The ocean edges (beyond all islands) fade into a misty fog using a radial CSS gradient overlay centered on the map -- transparent in the center, progressively opaque white/gray toward edges
- Subtle "Here Be Dragons" text in SVG, placed in the fog area, styled in faded italic serif
- The fog naturally recedes as more islands appear (since the map content area grows)
- No "undiscovered but hinted" tools -- **if it's in the markdown, it's on the map**

---

## Step 7: Sailing Routes

- Dotted SVG `<path>` lines connecting neighboring islands based on proximity in the auto-layout
- Styled as subtle dashed lines with low opacity (`stroke-dasharray: 4 8; opacity: 0.3`)
- Routes auto-reconfigure when islands move (new categories added/removed)
- Optional: support explicit routes via markdown syntax (e.g., `<!-- route: Chatbot <-> Research -->`)
- Optional future enhancement: small animated ship icon traveling along a route

---

## Step 8: Visual Polish & Animations

- **Ocean waves**: 3 CSS animated gradient layers (different speeds: 8s, 12s, 20s) creating gentle water motion
- **Island breathing**: Subtle `transform: scale()` oscillation (0.99 to 1.01) on a slow cycle per island
- **Beacon pulse**: Tool beacon glows expand and contract using CSS `@keyframes`
- **Entry animation**: On page load, islands fade in sequentially with a slight upward drift (staggered by 200ms)
- **Title cartouche**: Top center banner: "The AI Archipelago" in Cinzel font with decorative border
- **Fantasy typography**: "Cinzel" (Google Font) for island/map names, system sans-serif for tool labels and descriptions
- **Ambient clouds**: 2-3 very subtle, slow-drifting semi-transparent white SVG ellipses across the ocean

---

## Step 9: Link from Blog & AI Lab

Add "Explore the AI Archipelago" links from:
- AI Lab navigation or index page
- Blog labs section

These are simple `<a>` tags pointing to the deployed URL (e.g., `https://explore.turtleand.com`).

---

## File Structure

```
ai-archipelago/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx                    # App entry
│   ├── App.tsx                     # Root: full-screen map wrapper
│   ├── data/
│   │   └── ai-tools.md            # THE sole input file
│   ├── utils/
│   │   └── parseTools.ts          # Markdown → structured data
│   ├── components/
│   │   ├── ArchipelagoMap.tsx      # Ocean + SVG canvas + zoom/pan
│   │   ├── Island.tsx             # Single island (shape + beacons)
│   │   ├── ToolBeacon.tsx         # Glowing tool dot
│   │   ├── ToolTooltip.tsx        # Hover tooltip
│   │   ├── JournalPanel.tsx       # Detail panel (slide-in)
│   │   ├── MapLegend.tsx          # Category legend + counter
│   │   ├── CompassRose.tsx        # Decorative SVG compass
│   │   └── MapTitle.tsx           # Top banner cartouche
│   ├── hooks/
│   │   └── useMapControls.ts      # Zoom/pan state & pointer handlers
│   └── styles/
│       ├── global.css             # Reset, fonts, full-screen setup
│       ├── ocean.css              # Wave animations
│       ├── island.css             # Island terrain, beacon glow
│       └── journal.css            # Detail panel parchment style
└── public/
    └── (optional static assets)
```

---

## Verification

### Core functionality
1. `npm run dev` -- app loads full-screen with ocean + islands
2. All tools from `ai-tools.md` appear as labeled beacons on their category islands
3. Pan by dragging, zoom by scrolling -- smooth and responsive
4. Hover a tool beacon: tooltip with name + description appears
5. Click a tool beacon: journal panel slides in with details + "Set Sail" link
6. "Set Sail" opens the correct URL in a new tab
7. Legend shows all categories with correct colors and counts

### Self-configuring behavior (the key feature)
8. Add a new tool line to `ai-tools.md` → dev server hot-reloads → new beacon appears on correct island, island grows slightly, beacons reposition
9. Add a new `## Category` heading with tools → new island appears, all islands re-space automatically
10. Remove a tool → beacon disappears, island shrinks, beacons reposition
11. Remove all tools from a category → island disappears, remaining islands re-space
12. Rename a category → island updates its label, gets a new shape (deterministic from name)
13. Reorder tools within a category → no visual change (order doesn't affect layout)

### Platform & build
14. Mobile: touch pan/zoom works, tap replaces hover
15. `npm run build` produces a static SPA (`dist/`) ready to deploy
