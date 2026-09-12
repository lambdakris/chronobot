# CLAUDE.md — ChronoBot

An AI tool to help visualize, investigate, and understand history. Product concept:
CONCEPT.md. Roadmap ledger: BACKLOG.md. Editorial contract for data:
docs/significance-rubric.md. **Living architecture map: docs/architecture.md.**

## How we work (agreed 2026-08-15)

**The hand-rolled agentic loop is deliberate.** We are experimenting with agentic
behavior designed to this exact use case (tools = canvas mutations, loop in the
browser). The stopping rule: if we notice we are converging on Claude Code —
rebuilding sessions, memory, skills, subagents feature by feature — surface that
observation and revisit the Agent SDK instead of continuing to hand-roll. The
architectural invariants in docs/architecture.md exist to keep that migration cheap;
do not violate them without an explicit decision.

**Spec first, then build:**

- **New copilot tools** are documented before they are implemented: add the tool to
  the registry section of docs/architecture.md (purpose, input schema, validation,
  state mutation, motion, result string, edge cases) and get agreement on the doc
  before writing code.
- **Major features** (sessions, memory, threads, promotion, aggregation…) get a spec
  in `docs/specs/<name>.md` before implementation. A spec contains:
  1. *Why* — the problem, one paragraph.
  2. *BDD features and scenarios* — Gherkin style (`Feature:` / `Scenario:` /
     `Given` / `When` / `Then`), covering the happy path, each failure mode, and
     edge cases.
  3. *Architecture diagrams* — dataflow or sequence, ASCII, in the style of
     docs/architecture.md.
  4. *Out of scope* — what this version deliberately does not do.
  - Spec status line at top: `Proposed → Agreed → Built (date)`. Specs are living:
    update them when the built feature evolves.
- **docs/architecture.md is updated in the same change** that alters generation,
  tools, HTTP endpoints, or data tiers — it must never trail reality.

**Verification norm:** browser-verify canvas changes with agent-browser screenshots;
when server/generation behavior changes, live-test the copilot end to end (the
server loads DeepInfra credentials from `.env` itself — run on a spare PORT, stop it
after). Never read or print `.env`.

**Data rules:** `data/events.json` is curator-maintained canon governed by the
rubric; after editing it, run `node prototype/build.mjs`. The model cannot write to
the dataset — realtime knowledge additions were deliberately deferred 2026-08-15
(see docs/specs/promotion-workflow.md); do not reintroduce them without a new
agreed spec.

**Diagram convention:** Mermaid, in docs and specs alike (GitHub- and VS Code-
renderable); wrap example payloads one field per line.
