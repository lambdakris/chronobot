# AGENTS.md

This repo's operating manual for coding agents lives in **[CLAUDE.md](CLAUDE.md)**
— agent-agnostic despite the filename (that name is what Claude Code loads
automatically). Read it before changing anything.

The five essentials, if you read nothing else:

1. **Spec first.** New copilot tools are documented in docs/architecture.md's
   registry before implementation; major features get a `docs/specs/<name>.md`
   (BDD + Mermaid, status `Proposed → Agreed → Built`) before code.
2. **docs/architecture.md never trails reality** — update it (and BACKLOG.md)
   in the same change that alters generation, tools, endpoints, or data tiers.
3. **The model never writes the dataset.** `data/` is curator canon governed by
   docs/significance-rubric.md; run `npm run build-data` after any data edit.
4. **tools.mjs is the single tool registry** — both servers derive from it; no
   side doors around `applyTool`.
5. **Verify for real:** drive the canvas via the `window.chronobot` debug
   handle and screenshot it; live-test the server on a spare `PORT` (8438) and
   stop it after. **Never read or print `.env`.**

Settled decisions live in BACKLOG.md → "Decisions applied" — read them before
proposing work; they are not relitigated without new evidence.
