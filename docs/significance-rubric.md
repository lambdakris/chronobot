# ChronoBot — Significance Rubric

*The editorial contract for the event dataset. Every event's `tier` is assigned against this document; changing this document implies re-reviewing the data. Drafted 2026-07-24 (phase 2).*

## Why this exists

The significance function **is** the product's editorial voice (CONCEPT.md). "What deserves to be on the poster" is a judgment call; this rubric makes the judgment repeatable, criticizable, and revisable instead of vibes-per-event.

## Tiers

### Tier 1 — Era-defining
Marks a turn in the trajectory of a civilization or the world: foundations and collapses of major states, births of world religions, transformative technologies, continental-scale catastrophes, first contacts between worlds.

- **Test:** would omitting this leave a visible hole in the *world* story at full zoom-out?
- **Budget (the anti-inflation mechanism):** before 1500 CE, ~1–3 per lane per millennium; after 1500 the acceleration of recorded history is real, so the unit shrinks — max ~2 per lane per century. When a century over-claims (the 20th will), demote the least structural to tier 2 (applied 2026-07-24: Russian Revolution, Berlin Wall, and the Web are tier 2 so the World Wars hold tier 1).

### Tier 2 — Major
Shapes its region for centuries: dynasty foundings and falls, major wars and conquests, key cultural, religious, and scientific milestones.

- **Test:** necessary for the *regional* story, not the world story.

### Tier 3 — Notable
Textbook events that color the period: famous battles, monuments, movements, figures, works.

- **Test:** enriches the story; omitting loses texture, not structure.

### Tier 4 — Local / fine-grained
Reserved for deep zoom and future granular data: individual reigns, city-level events, single works. The schema allows it; the current dataset and renderer intentionally hold none.

## Date conventions

- `start` / `end`: integer years; **negative = BCE** (no year-zero handling at this precision).
- `circa: true` on traditional or approximate dates (Rome's founding, the Buddha, migrations). Display prefix: "c."
- Events that *are* spans (a plague, a war fought to a finish) may carry `end`; "X begins"-style events stay points. Span events render as lane-colored capsules from `start` to `end` (shipped 2026-07-25), and the time ruler rings a span wherever it crosses it.

## Themes (exactly one list, tag 1+ per event)

| id | covers |
|---|---|
| `politics` | states founded/unified/fallen, rulers, revolutions, independence |
| `war` | wars, conquests, invasions, decisive battles |
| `religion` | religions founded/spread/split, religious institutions |
| `culture` | cities, monuments, art, literature, scholarship, exploration |
| `tech` | science, technology, engineering, medicine |
| `crisis` | plagues, collapses, famines, catastrophes (natural or man-made) |

## Regions (hierarchical ids; lanes query by prefix)

Tag each event with the **most specific** region that fits; a continent-level tag (e.g. `africa`) is legitimate for genuinely continent-wide events (the Scramble, decolonization). Lane queries match a region id or any of its descendants — this is the lanes-as-queries mechanism, and re-grouping is a query change, not a data change.

Current taxonomy (labels in `data/taxonomy.json`): `americas{.mesoamerica,.andes,.north}`, `europe`, `africa{.west,.north,.east,.central-southern}`, `middle-east`, `asia{.south,.east{.china,.japan},.southeast,.steppe}`.

## Vetting

- `vetted` (default **false**): true only after date and core facts are checked against at least one cited source recorded in `sources`. The whole current dataset is curator-reviewed but citation-pending — honestly `false`.
- AI-generated knowledge is a **deferred** concept (2026-08-15): a v1 realtime `add_events` pipeline was built 2026-07-25 and retired the same month — the full add→vet→promote question awaits a considered design (`docs/specs/promotion-workflow.md`). Until then the model cannot write to the dataset, and this section's vetting bar is what any future design must promote *to*.

## Editorial guardrails

- **Balance is enforced by budget, not quota:** the tier-1 budget applies per lane, which structurally resists the gravitational pull of European/near-modern sources.
- **Known gaps (deliberate, tracked in BACKLOG.md):** no Oceania lane; Central Asia/steppe grouping unresolved (parked in East Asia's query); Southeast Asia parked in East Asia's query; per-event lat/lon locations not yet authored; pre-11,000 BCE (Paleolithic) out of scope — the 11,000–4000 BCE Neolithic band is in scope as of 2026-07-25 (renderer draws it 10× time-compressed below an axis break; dates there are always `circa`, and the tier-1 budget applies per lane per *span*, not per millennium, since the whole band reads as one poster stripe).
