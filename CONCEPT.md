# ChronoBot — Product Concept

*Founding document. Drafted 2026-07-19 from the initial discovery session. This is the "what and why"; implementation planning comes later.*

## One-liner

**A conversational Histomap** — an interactive synchronoptic chart of world history where a map anchors space, lanes rise through time, and an AI copilot curates, explains, and reshapes the view.

## The problem

The hardest part of learning history is building a durable mental model of **when and where things happened relative to each other**. Books and Wikipedia serialize history into isolated threads; you can know Rome and know the Maya and still be shocked they overlapped. Static synchronoptic wall charts (Histomap 1931, Adams' Synchronological Chart) solve exactly this — and still sell today — but they are frozen: one curation, one grouping, one zoom level, no way to ask "why?"

## The concept

A single canvas with three cooperating parts:

```
        ▲ time (present)
   ┃Aztec┃   ┃Mali┃  ┃Ottoman┃ ┃Ming┃      ┌───────────┐
   ┃Tolt.┃   ┃Ghana┃ ┃Byzant.┃ ┃Song┃      │   CHAT    │
   ┃Maya ┃   ┃Aksum┃ ┃E.Rome ┃ ┃Tang┃      │ (copilot, │
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │ expandable│
   [═══════ world map (docked) ═══════]     │  panel)   │
        (past, near the "soil")             └───────────┘
```

1. **The map** — a world-map "poster" docked along the bottom. The x-axis of the entire canvas *is* geography.
2. **The lanes** — vertical columns rising from the map, one per civilization/region/polity. **Strict geo-anchoring:** each lane's x-position and width are its actual territory's place and extent on the map below. Time flows along the vertical axis at a **constant scale across all lanes**, so any horizontal line through the canvas is a moment in time, everywhere at once.
3. **The chat** — an expandable panel on the right. Not a Q&A sidebar: the **view controller and tutor** (see below).

### Core interactions

- **Horizontal scan** — the signature move. Read across at any height: "meanwhile, what was happening everywhere else?"
- **Time ruler** — a draggable horizontal line that highlights what every lane contains at that moment; the physical gesture for synchronicity.
- **Semantic zoom (vertical)** — events carry significance tiers (era-defining → major → notable → local). Zooming in reveals finer tiers. Scale stays constant across lanes at every zoom level — comparability is never sacrificed. No log scale, ever.
- **Click-to-reference (deixis)** — select an event, lane, or time-span; the chat knows what you mean ("why did *this* happen?").

### Making strict geo-anchoring work

The two known failure modes, and their mitigations:

- **Crowding (the Europe problem):** solved by **horizontal zoom + lane aggregation**. The map is a viewport, not a static image. At world zoom, colliding lanes coalesce into an aggregate lane ("Europe"); zoom into a region and the map re-renders to that extent, the aggregate splits, and its constituent lanes get the full canvas width. Lanes have an aggregation hierarchy (world → continent → region → polity) tied to horizontal zoom — the same semantic-zoom idea applied to space instead of time.
- **Empty oceans:** an ocean-trimmed projection — compress the open Atlantic/Pacific with explicit visual break marks (like axis breaks on a chart). An honest, labeled distortion that reclaims canvas width for land.
- **Pragmatic deviations (amended 2026-07-24):** geo-anchoring is the default, not a dogma. Where longitude-only anchoring misleads or crowds (Europe and West Africa share longitudes at different latitudes), lanes may reorder pragmatically — decided: all of Africa groups into one block placed between Europe and the Middle East — with leader lines / hover highlighting carrying the lane→map link in the deviated stretch.

### The chat is the view controller

The configuration surface (how to slice, group, filter, zoom) is enormous — building UI for all of it would sink the project. The chat absorbs it, with **two-way binding** between conversation and canvas:

- **View → chat:** the current view state (visible lanes, time window, zoom, selection) is always legible to the AI.
- **Chat → view:** the AI mutates the view through tools — add/remove/split lanes, filter event types, zoom to a range, highlight synchronicities, draw annotations.

Roles the copilot plays: *explain* (why did this happen?), *compare* (what was Egypt doing while Rome fell?), *reconfigure* (slice by religion instead of region), *extend* (generate a new lane on demand — visually marked as unvetted), *quiz* (active-recall prompts against the canvas).

### Lane lifecycle & threads (the depth features)

- **Lane lifecycle** — civilizations are born, split, merge, die (Rome → Byzantium + the West). v1: lanes can start and end mid-canvas. Later: Histomap-style flowing streams where width tracks extent/power. *(Retired 2026-08-16: this predates the lanes-are-queries decision below — lanes became queries over regions, and regions don't end. The band fade-in already renders "history begins here", and lanes appearing mid-canvas would make layout a function of scroll position. Polity rise-and-fall lives at other grains: span capsules, threads, split columns, and the parked "era bands within lanes" idea — see BACKLOG.md.)*
- **Cross-lane threads** — the Silk Road, the spread of Buddhism, the Black Death: arcs that span lanes are where the deepest "aha"s live. Post-MVP, but the data model accommodates them from day one. *(Shipped 2026-08-15 — docs/specs/cross-lane-threads.md.)*

## Data model: lanes are queries, not containers

The way out of the "how do you group civilizations" nightmare — grouping is contested, and any fixed taxonomy is wrong for someone:

- **One event pool.** Each event: title, date (point or range, with uncertainty), location (point or region), tags (polity, culture, theme: military | political | tech | religion | culture | science | disaster), significance tier (1–4), sources, `vetted` flag.
- **A lane is a saved query** over the pool, plus a geographic anchor (territory geometry, potentially time-varying). Re-slicing by region vs. civilization vs. religion is a re-bin, not a new dataset.
- **Threads** are edges: event↔event links or diffuse phenomena with a time extent and a lane set.

### Data strategy: curated spine + AI extension

- A **vetted core dataset** seeds the default view — bootstrapped from Wikidata/Wikipedia, human-reviewed, checked into the repo as plain data files. The significance rubric *is* the product's editorial voice; it deserves care.
- The **chat generates additional lanes/events on demand**, rendered in a visibly distinct "unvetted" style. A promotion path (user reviews + cites → vetted) lets the spine grow through use.
- Rationale: pure AI-generation would poison the core promise (an *accurate* mental model); pure curation would make curation the whole project.

## Audience & posture

**v1 is a personal learning instrument for its author.** Opinionated defaults, no onboarding funnel, accuracy over polish, fast iteration. If the core magic proves out on one demanding user, broadening (enthusiasts → students/educators) is a later decision.

Secondary value: strong portfolio fit — chat-as-view-controller is a showcase of agentic UI patterns (tool-use-driven state mutation, context-aware assistants), aligned with the portfolio North Star in `~/source/PROJECTS.md`.

## Differentiation

| Alternative | What it lacks |
|---|---|
| Histomap / wall posters | Frozen: one curation, one grouping, no zoom, no "why?" |
| ChronoZoom (MSR, †) | Interactivity without narrative or curation — the part people actually loved about posters |
| Wikipedia / timeline sites | Serial threads; no synchrony, no space, no comparison |
| Asking an LLM directly | No persistent spatial canvas; the mental model evaporates with the scroll |

The unique compound: **geo-anchored synchronoptic canvas × conversational curation.** Neither half is novel alone.

## MVP slice

The smallest version that delivers the core magic (horizontal scan + time ruler + ask-why):

**In:**
- Full time span (~3000 BCE → present), **tiers 1–2 events only** (~200–400 events), curated, checked into the repo
- ~8–12 seed lanes at coarse grain (Mesoamerica, Andes, West Africa, Egypt/North Africa, Europe, Middle East, the Steppe, South Asia, East Asia, …) — coarse enough that world-zoom crowding stays manageable without lane aggregation
- Canvas: docked map, strict geo-anchored lanes, constant vertical time scale, vertical zoom/pan with semantic zoom by tier, time ruler
- Chat v1: reads view state, answers/explains with the selection as context, executes a small set of view commands (filter by theme, zoom to range, highlight a moment across lanes)

**Out (deliberately):**
- Horizontal zoom + lane aggregation (v2 — the mitigation is designed, not yet needed at coarse grain)
- Cross-lane threads (v2 — data model ready)
- Lane splits/merges beyond simple start/end (v2)
- AI-generated unvetted lanes/events (v2 — chat is read-and-reconfigure only in v1)
- Accounts, sharing, mobile (not before the magic is proven)

## v0 prototype findings (2026-07-19)

A thin canvas prototype (`prototype/canvas.html`) surfaced three things worth recording:

1. **Longitude-only anchoring collapses latitude.** Europe and West Africa occupy the same longitudes at different latitudes; v0 fudges their anchor ranges apart. The real answer is the already-planned lane-aggregation + horizontal-zoom mechanic; until then, coarse-grain lanes need non-overlapping longitude bands.
2. **Labels are the scarce resource, not space.** At poster zoom, full event titles don't fit between lane columns. Terse poster labels (with full titles in the tooltip/detail layer) + global collision-aware placement (era-defining first, dots for the suppressed) is the workable pattern.
3. **Lane headers double as the legend.** Permanent name-plus-color-chip headers at the top of each lane satisfy the "identity never by color alone" rule with no separate legend box; they stagger into two rows where geography crowds them.

## Open questions

1. **Time direction** — **Resolved 2026-07-24:** past at bottom (lanes grow up from the map), settled by feel with the v0 prototype; the direction toggle was removed.
2. **Projection choice** for the docked map + where the ocean breaks go.
3. **Significance rubric** — the working definition of tiers 1–4; draft alongside the seed dataset.
4. **Era-varying lane width** (power/extent streams) — later, but affects how territory geometry is stored.
5. **Tech stack** — deliberately not chosen here; first implementation-planning session decides (likely shape: web app, canvas/SVG rendering, data as static files, LLM with tool use for the chat).
