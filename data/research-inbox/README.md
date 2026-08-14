# Grok Build inbox

Plan next writes a job here. Grok Build (this project chat, or `grok -p`) does the research.

| File | Role |
|------|------|
| `request.json` | Job. Status: `queued` → `claimed` / `running` → `done` / `failed` |
| `prompt.md` | Full instruction for Grok Build |
| `result.json` | Pack path + scores when finished |

Do not commit request/result JSON.
