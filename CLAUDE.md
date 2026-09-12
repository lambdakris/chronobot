# CLAUDE.md — ChronoBot

Operating manual for coding agents and contributors. The filename is what
Claude Code loads automatically, but nothing here is Claude-specific —
[AGENTS.md](AGENTS.md) points other agents here.

ChronoBot is a **conversational Histomap**: a synchronoptic canvas
(`prototype/canvas.html` — the whole app in one self-contained file) driven by
a copilot chat through eight JSON-schema'd view tools. Product concept:
[CONCEPT.md](CONCEPT.md).

## Where truth lives

| Question | Document |
|---|---|
| Why does this exist? What is it? | [CONCEPT.md](CONCEPT.md) |
| How does it work *right now*? | [docs/architecture.md](docs/architecture.md) — the living map; never trails reality |
| What's next / parked / shipped / decided? | [BACKLOG.md](BACKLOG.md) — the roadmap ledger |
| What's the contract for a feature? | `docs/specs/<name>.md` — status line `Proposed → Agreed → Built (date)` |
| What belongs in the dataset, at which tier? | [docs/significance-rubric.md](docs/significance-rubric.md) — the editorial contract |
| What are the view-tool schemas? | [tools.mjs](tools.mjs) — the one registry; both servers derive from it |

## Session start (handoff norms)

- **The curator (repo owner) edits files and data between sessions.** Re-read
  any file before editing it; never trust a stale mental copy of this repo.
- **Read BACKLOG.md → "Decisions applied" before proposing work.** Settled
  questions (retired lane lifecycle, parked MCP variant, deferred knowledge
  management…) are not relitigated without new evidence — each entry records
  its why.
- Check the status line of any spec you touch; specs are living documents and
  get updated when the built feature evolves.

## Commands

| Task | Command |
|---|---|
| Run the copilot server | `npm start` → http://localhost:8437. **For agent testing use `PORT=8438 node server.mjs`** — the curator often has 8437 running; stop your instance when done |
| Validate + re-inline data | `npm run build-data` — **mandatory after any `data/*.json` edit**; errors on taxonomy, lane-coverage, lane-children, and thread-rule violations |
| Standalone canvas | open `prototype/canvas.html` (file:// works; zero dependencies, no build) |
| Parked MCP variant | `npm run mcp` (stdio) |
| Drive the canvas in tests | agent-browser (or any browser automation) + the debug handle: `window.chronobot = { state, applyTool, render, viewStateText }` — `applyTool` is the same single entry point the copilot uses; `viewStateText()` returns exactly what the model sees |

## How we work (agreed 2026-08-15)

**The hand-rolled agentic loop is deliberate.** We are experimenting with
agentic behavior designed to this exact use case (tools = canvas mutations,
loop in the browser). The stopping rule: if we notice we are converging on
Claude Code — rebuilding sessions, memory, skills, subagents feature by
feature — surface that observation and revisit the Agent SDK (or the
designated Variant C harness, CopilotKit — see BACKLOG) instead of continuing
to hand-roll. The architectural invariants in docs/architecture.md exist to
keep that migration cheap; do not violate them without an explicit decision.

**Spec first, then build:**

- **New copilot tools** are documented before they are implemented: add the
  tool to the registry section of docs/architecture.md (purpose, input schema,
  validation, state mutation, motion, result string, edge cases) and get
  agreement on the doc before writing code.
- **Major features** get a spec in `docs/specs/<name>.md` before
  implementation. A spec contains:
  1. *Why* — the problem, one paragraph.
  2. *BDD features and scenarios* — Gherkin style (`Feature:` / `Scenario:` /
     `Given` / `When` / `Then`), covering the happy path, each failure mode,
     and edge cases.
  3. *Architecture diagrams* — dataflow or sequence, Mermaid, in the style of
     docs/architecture.md.
  4. *Out of scope* — what this version deliberately does not do.
  - Spec status line at top: `Proposed → Agreed → Built (date)`. Specs are
    living: update them when the built feature evolves, and record a build
    verification note + implementation deviations when flipping to Built.
- **docs/architecture.md is updated in the same change** that alters
  generation, tools, HTTP endpoints, or data tiers — it must never trail
  reality. Ship the ledger update (BACKLOG.md) in the same change too.

**Verification norm:** browser-verify canvas changes with screenshots — drive
tools through `window.chronobot.applyTool(...)`, wait out the ~650ms glide
before capturing, and actually look at the result. When server/generation
behavior changes, live-test the copilot end to end (the server loads DeepInfra
credentials from `.env` itself — run on a spare PORT, stop it after).
**Never read or print `.env`.**

## Data rules

`data/*.json` is curator-maintained canon governed by the rubric — events,
threads, and lane children alike. After editing it, run `npm run build-data`.
**The model cannot write to the dataset** — realtime knowledge additions were
deliberately deferred 2026-08-15 (docs/specs/promotion-workflow.md); do not
reintroduce them without a new agreed spec. The one sanctioned write path is
the curator channel: hand-authored edits reviewed against the rubric.

## Deferred / retired — do not reintroduce without a new agreed decision

- **Realtime AI event additions** (add → vet → promote) — deferred with
  reopening criteria: docs/specs/promotion-workflow.md. One channel of the
  broader knowledge-management domain (map in docs/architecture.md).
- **MCP App variant** — parked, zero maintenance obligation: the shared
  registry keeps it compiling, nothing is verified there. Verdict:
  docs/specs/mcp-app.md.
- **Lane lifecycle** — retired 2026-08-16 as misfit-by-design (BACKLOG →
  Decisions applied); the surviving residue is the parked "era bands within
  lanes" idea.

## Diagram convention

Mermaid, in docs and specs alike (GitHub- and VS Code-renderable); wrap
example payloads one field per line.
