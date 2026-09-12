# ChronoBot — Roadmap & backlog

The roadmap ledger, in four layers so status is legible at a glance:

1. **Up next** — remaining work, in proposed build order.
2. **Parked / deferred** — real ideas waiting on a named trigger.
3. **Shipped** — the record, newest first, condensed; full detail lives in the
   linked specs and docs.
4. **Decisions applied** — settled questions, so they aren't relitigated.

## 1 · Up next (proposed order — reshuffle as usage demands)

1. **Dataset growth + data passes** — grow beyond 199 events where the
   features above demand density; the vetting + sources pass (add `sources`,
   flip `vetted` per the rubric); per-event lat/lon (unlocks map dots and
   spatial queries). This *is* knowledge management — its curator channel,
   active today (domain map in
   [docs/architecture.md](docs/architecture.md)) — and the vetting/sources
   pass defines the graduated-record schema any future AI-write channel would
   promote into, making it a de facto prerequisite for the parked
   knowledge-management formalization below. Threads and lane children are
   canon too: growing the thread set (Silk Road wants member events that
   don't exist yet) and authoring taxonomy children for Europe, the Middle
   East, and South Asia (so they become splittable) are part of this item.
2. **Sessions / conversation management** — persist, list, name, resume,
   delete conversations (today: one conversation, in RAM, lost on reload).
   **This is a decision point, not just a feature:** hand-rolling sessions is
   the stopping-rule signal (rebuilding Claude Code), so reaching this item
   likely means writing the Variant C spec below instead of building it by
   hand.

## 2 · Parked / deferred (each with its trigger)

- **Variant C — CopilotKit harness** (designated 2026-08-15): first-class app
  with an embedded copilot, without hand-rolling the harness forever. Shape
  per CopilotKit v2 docs: our app owns the page; the chat is a CopilotKit
  component inside it; each view tool registers via `useFrontendTool` (schema
  + client-side handler — exactly today's `applyTool` cases); `useRenderTool`
  draws tool-call cards in the chat; backend = CopilotKit runtime + Claude
  Agent SDK adapter, landing server-side loop, sessions, memory, and web
  search while canvas tools stay client-side. Cost: CopilotKit is React — the
  canvas needs a React shell (the SVG logic can likely live as-is inside a
  wrapper; the hand-rolled chat panel is what gets replaced).
  **Trigger:** roadmap item 2, or knowledge-tool pressure.
  **Prereq:** `docs/specs/copilotkit-harness.md` agreed before build.
- **Claude Agent SDK backend** (2026-07-25): no longer a standalone item — it
  arrives as Variant C's backend. (The plain-SDK Tool Runner remains a smaller
  fallback step if Variant C never fires.)
- **MCP App variant (B)** (parked 2026-08-15): works as a distribution channel
  — tools + dataset + snapshot canvas in any MCP host via `npm run mcp` — but
  failed the primary-UX gate: hosts render each tool call as a separate
  embedded snapshot, putting the app inside the chat instead of the chat
  inside the app. Zero maintenance obligation. Verdict + supersession
  scoring: [docs/specs/mcp-app.md](docs/specs/mcp-app.md).
  **Trigger to revisit:** hosts gain persistent, continuously-driven app
  instances.
- **Knowledge management — formalize the domain** (parked 2026-08-15): the
  "sophisticated take" — one design covering how all knowledge the app uses
  enters, is governed, is represented, and reaches the model (domain map in
  [docs/architecture.md](docs/architecture.md)). **Trigger:** the reopening
  criteria in the promotion spec, or a second knowledge channel going live
  (Variant C's retrieval) and needing unification with the canon.
  **Prereq:** `docs/specs/knowledge-management.md` agreed before any build.
  The domain's sub-items and their standing meanwhile:
  - *Curator channel* — active today; advances as roadmap item 1 (dataset
    growth, vetting + sources pass, lat/lon).
  - *Governance* — the significance rubric; evolves alongside item 1.
  - *Representation* — the event schema; the `sources`/`vetted` placeholders
    are filled by item 1, defining what "graduated" knowledge looks like.
  - *Delivery to the model* — full dataset in the system prompt (Variant A),
    `query_events` + dataset resource (Variant B); needs rethinking when the
    dataset outgrows the prompt.
  - *The model's own knowledge* — ungoverned narration, constrained to
    reference canon ids; whether and how to source it is a question for the
    spec.
  - *Retrieval channel* — none yet; web search / knowledge bases arrive with
    Variant C above.
  - *AI-write channel — realtime AI event additions* (deferred 2026-08-15):
    v1 shipped 2026-07-25, retired; the model cannot write to the dataset
    until a new spec is agreed. Record + reopening criteria:
    [docs/specs/promotion-workflow.md](docs/specs/promotion-workflow.md).
- **Artifact chat** (blocked externally): the published artifact has no LLM
  runtime capability, so its chat panel degrades to a "run the local server"
  notice. **Trigger:** an LLM capability lands in the artifact runtime.
- **Taxonomy gaps** (deliberate): no Oceania lane. The steppe and SE Asia now
  surface as East Asia child columns (lane splitting, shipped 2026-08-16);
  promoting them (or Oceania) to first-class lanes, and authoring children
  for Europe / Middle East / South Asia, is dataset + taxonomy work —
  **trigger:** roadmap item 1.
- **Era bands within lanes** (parked 2026-08-16): the surviving residue of the
  retired lane-lifecycle idea — background band segments *within* a lane or
  child column marking successive polities or eras (Old / Middle / New Kingdom
  in Egypt; Roman / medieval / modern Europe), data-driven from a per-region
  era table. No layout motion: lanes stay stable, the texture changes.
  **Trigger:** roadmap item 1 authors the era data, or usage shows readers
  need within-lane periodization. Spec before build, per methodology.

## 3 · Shipped (newest first)

**2026-08-16**

- **Lane splitting (aggregation v1)** — spec agreed & built same day
  ([docs/specs/lane-split.md](docs/specs/lane-split.md)): `lanes.json` gains
  `children` (Americas → N. America · Mesoamerica · Andes; Africa → West ·
  Egypt & North · East & Horn · Central & Southern; East Asia → Steppe ·
  China · Japan · SE Asia), build-validated (queries ⊂ parent, no event in
  two children, none empty). Explicit split via header ⊞/⊟ or the
  `split_lane` tool (single slot): the lane borrows ≈2.4× width in a 450ms
  slot tween, children take equal columns in family hues, the map swaps to
  child territory boxes with per-child leader lines, and continent-wide
  events center on the stretch. Threads/highlights/ruler re-anchor
  automatically. Side fixes: sequential glides in one tool batch merge into
  one tween (latent ruler-cancels-zoom bug); `viewStateText` exposed
  read-only on the debug handle. Verified: agent-browser suite (flagship
  Aztec/Inca scenario, slot replacement, collapse, errors, thread re-anchor)
  + live DeepInfra run (ruler + zoom + split in one hop after a doctrine
  strengthening that names the stacking problem).

**2026-08-15**

- **Cross-lane threads** — spec agreed & built same day
  ([docs/specs/cross-lane-threads.md](docs/specs/cross-lane-threads.md)):
  `data/threads.json` seeds 4 curated threads (written word · spread of
  Buddhism · Mongol world · Atlantic exchange), build-validated (members
  exist, ≥2 lanes, strictly chronological). One-slot thread state renders a
  smooth overshoot-clamped curve with member rings, forced visibility, a title
  chip, and a past→present draw-on after a glide-to-fit-with-headroom; solid =
  curated canon, dashed = ad-hoc copilot gesture. `show_thread` +
  `connect_events` in the shared registry (both servers), thread lines +
  doctrine in the system prompt, Thread line in `<view_state>`, top-bar
  picker for standalone parity. Verified: agent-browser screenshot suite
  (curated, ad-hoc, picker, filter bypass, error paths) + live DeepInfra runs
  (the model chose `show_thread` for the written word unprompted, and composed
  `connect_events` "Age of Discovery & print" when no curated thread fit).
- **MCP Apps excursion (Phase A)** — `tools.mjs` shared registry (feeds both
  servers), `mcp-server.mjs` (stdio; view tools with merged full-state
  results, `show_canvas`, `query_events`, dataset resource, app-only
  `sync_view_state`), inline host-bridge in canvas.html (hand-rolled `ui/`
  dialect; 2s probe preserves standalone/artifact behavior). Headless-verified
  (stdio smoke, scripted fake host, no-host fallback, Variant A regression),
  then real-host feel-tested and **parked** (see above). Keepers either way:
  the shared registry, the merged full-state result pattern.
- **Streaming chat** — `/api/chat` streams SSE frames (`text` deltas, then
  `done` with full content + stop_reason, or `error`); live bubble; clean
  fallback to plain-JSON responses. Verified live against DeepInfra (multi-hop
  Mongol-century run: streamed prose + zoom, filter, 10 highlights, ruler).
- **Methodology adopted** — spec-first working rules in `CLAUDE.md`; living
  [docs/architecture.md](docs/architecture.md); mermaid diagram convention.

**2026-08-01**

- **Provider → DeepInfra** — Anthropic-compatible Messages endpoint keeps the
  SDK, tool definitions, and browser loop unchanged; only `baseURL`, model id,
  and credentials moved. Default `deepseek-ai/DeepSeek-V4-Flash-0731`
  ($0.09/$0.18 per MTok, 1M context); `DEEPINFRA_TOKEN` in gitignored `.env`;
  `CHRONOBOT_MODEL` / `CHRONOBOT_BASE_URL` override. Dropped as
  Anthropic-platform-only: the refusal-fallback beta and `output_config.effort`
  (accepted by DeepInfra but verified not honoured); `cache_control` is
  accepted but never reported in `usage`. Supersedes the brief
  Sonnet-for-testing default (2026-07-25).

**2026-07-25**

- **Copilot motion** — camera and ruler glide (650ms, log-space zoom), fresh
  highlights pop in, stage glow on every tool call; respects
  `prefers-reduced-motion`; user input cancels a glide in flight;
  `window.chronobot` debug handle.
- **Deep past** — time axis extended to 11,000 BCE; the Neolithic band
  (pre-4000 BCE) drawn 10× time-compressed below an axis break. +31 events
  (Göbekli Tepe, early agriculture, Sumer, Nubia, cultural landmarks from the
  Pillow Book to the Great Wave); 199 total.
- **Range rendering** — events with `end` draw a lane-colored capsule; the
  time ruler rings a span wherever it crosses it.
- **AI-generated unvetted events v1** — full pipeline worked (validated adds,
  dashed styling, pending inbox), retired 2026-08-15 into the deferred
  knowledge-management item above.

**2026-07-24 — roadmap phases 1–3**

- **Canvas v1** — all five v0-feedback items: visible zoom control (top bar,
  with detail-tier dots), pragmatic geo-ordering of lanes, compact theme
  filter in the top bar, time-ruler discoverability, chrome slimming.
- **Data model** — lanes-as-queries over one tagged event pool
  (`data/*.json`), significance rubric drafted
  ([docs/significance-rubric.md](docs/significance-rubric.md)), 168 events.
- **Chat v1** — view-state legibility + core command set (filter,
  zoom-to-range, highlight, explain-with-selection); the thin backend;
  validated live 2026-07-25 ("Pretty neat. I like it so far").

## 4 · Decisions applied

- **Lane lifecycle retired as misfit-by-design** (2026-08-16) — the idea
  predates lanes-as-queries: lanes are queries over *regions*, and regions
  don't end (the lane's occupants change, not the lane). The band fade-in
  already renders the one real lifecycle moment ("history begins here"), no
  region lane ends before the present, and lanes appearing/vanishing
  mid-canvas would make layout a function of scroll position — breaking the
  stable geographic frame that split-on-zoom deliberately preserved. Polity
  rise-and-fall is expressed at other grains: span capsules (empires as
  ranges), threads (succession stories), split columns (the Steppe activating
  with Genghis), and the parked "era bands within lanes" idea above.
  CONCEPT.md annotated in place.
- **MCP Apps is a distribution channel, not the primary UX; CopilotKit is the
  designated Variant C harness** (2026-08-15) — see Parked for both.
- **Spec-first methodology** (2026-08-15) — hand-rolling the agentic loop is a
  deliberate experiment with a stopping rule; architecture.md is the living
  map, updated in the same change; new tools documented before implementation;
  major features get a spec (BDD + diagrams, Proposed→Agreed→Built).
- **Realtime knowledge additions deferred** (2026-08-15) — the model cannot
  write to the dataset until a new spec is agreed.
- **Lane grain merged to continental** (2026-07-24) — Americas, Europe,
  Africa, Middle East, South Asia, East Asia at world zoom; framed as the
  coarse level of the aggregation hierarchy (split-on-zoom reintroduces
  sub-regions). Accepted costs: intra-continental synchronic contrast hidden
  at world zoom (Mesoamerica↔Andes independence; Egypt's Near-East affinity);
  denser bead-strings (Aztec 1428 / Inca 1438 nearly stack).
- **Pragmatic geo-ordering** (2026-07-24) — Africa grouped as one block
  between Europe and the Middle East; where lane order deviates from strict
  vertical map anchoring, leader lines / hover highlighting carry the
  lane→map link. Honestly resolves the v0 fudge where Europe and West Africa
  shared longitudes.
- **Map territory bands are 2D lat×lon boxes** (2026-07-24) — needed once
  Africa's longitudes contained Europe's; a step toward real territory
  geometry.
- **Past-at-bottom is permanent; direction toggle removed** (2026-07-24) —
  CONCEPT.md open question #1 resolved.
- **Strict geo-anchoring stays** where geography is uncrowded (2026-07-24) —
  liked at world zoom, alongside the planned aggregation mitigations.
