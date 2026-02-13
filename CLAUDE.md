# CLAUDE.md — AI Atlas

## Agent-Friendly PR Checklist
Every PR adding/modifying AI tools must:
- [ ] Update `public/llms.txt` with new tool entry
- [ ] Ensure `src/data/ai-tools.yaml` has complete metadata (name, description, category, url)
- [ ] Copy updated YAML to `public/ai-tools.yaml`
- [ ] Author always "Turtleand" (pseudonymous, no real name, no LinkedIn)

## Bot Translation Layer
- `/llms.txt` — Tool directory for AI agents
- `/ai-tools.yaml` — Raw structured data (YAML) for programmatic access
- `/_headers` — Content Signals

## Stack
- Vite + TypeScript + static HTML
- Data: `src/data/ai-tools.yaml`
