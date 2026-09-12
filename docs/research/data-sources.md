# ChronoBot — Open Data Sources for History (Research Report)

*Research handoff document. Compiled 2026-08-31 from a three-track web survey; every
source below was verified alive by live fetch on that date (endpoints called, licenses
read from the source, dumps confirmed downloadable). Status claims decay — re-verify
anything load-bearing before building on it if significant time has passed.*

**Purpose:** answer "what open/public datasets, databases, feeds, or APIs exist that
ChronoBot could use as data sources?" — and hand the answer to whichever session
implements data ingestion. Nothing here has been implemented; no pipeline exists yet.

---

## 1. What the project needs (fit criteria used throughout)

Derived from CONCEPT.md and docs/significance-rubric.md:

1. **Event spine bootstrap** — candidate events for expanding the curated core
   (~200–400 events, world coverage ~11,000 BCE → present). Each event needs: title,
   integer-year date (negative = BCE, `circa` support), region, themes
   (politics/war/religion/culture/tech/crisis), and ideally a **significance signal**
   to help assign tiers 1–4. Citable sources are required for the `vetted` flag.
2. **Lane territory geometry** — time-varying polity/region extents to anchor lanes
   to the map (CONCEPT.md: "territory geometry, potentially time-varying"), plus
   historical place-name → coordinate resolution for future per-event lat/lon.
3. **Vetting cross-checks & future layers** — authoritative datasets to check dates
   and facts against, and quantitative series (population, GDP, conflict deaths) for
   possible later visual layers.

**Licensing constraint:** personal project now, possible public portfolio later —
prefer CC0 / CC BY / public domain; flag NC (non-commercial) and no-redistribution
terms. Data ships as static files in the repo, so bulk download beats rate-limited
APIs.

---

## 2. Recommended stack (the actionable summary)

Everything in this stack is CC0, CC BY, or public domain — safe for a public repo.

| Need | Source | License | Why |
|---|---|---|---|
| Event candidate pool + significance signal | **Wikidata**, extracted via **QLever** | CC0 | ~47k dated+located occurrence events, BCE-native, sitelink count = tier-bootstrap signal |
| Tier refinement (2nd signal) + citations | **Wikipedia pageviews API + article URLs** | CC BY-SA (facts fine; don't copy text) | current-attention signal; article = citation of record for `vetted` |
| Lane territory geometry | **Cliopatria** (Seshat) | CC BY 4.0 | ~1,600 polities 3400 BCE–2024 CE, GeoJSON with `FromYear`/`ToYear` (negative = BCE), Wikidata crosswalks |
| Pre-3400 BCE geometry tail + era world-slices | **historical-basemaps** (aourednik) | GPL-3.0 | GeoJSON world snapshots 123,000 BCE–2010 CE |
| Docked modern basemap | **Natural Earth** | Public domain | zero-risk baseline vector/raster |
| Ancient place geocoding | **Pleiades** (+ **World Historical Gazetteer** post-classical) | CC BY | daily JSON dump; WHG has free-token API |
| Crisis-theme authority & pool | **NOAA NCEI hazards (HazEL API)** | Public domain | earthquakes/volcanoes/tsunamis back to 2150 BCE, keyless JSON API |
| Modern-conflict authority | **UCDP** | CC BY 4.0 | conflicts 1946–2025, CSV downloads |
| Quantitative layers (future) | **Maddison / HYDE / Our World in Data** | CC BY | GDP 1 CE+, population 10,000 BCE+, tidy CSV-per-chart API |

**Shape of the pipeline this implies** (consistent with CONCEPT.md's "curated spine +
AI extension" and the static-files architecture): a build-time extraction script runs
one QLever SPARQL query → writes a candidate-pool file (id, title, year, precision,
coords, sitelinks, Wikidata QID) → curator reviews candidates against the rubric →
accepted events are hand-written into `data/events.json` with citations. The model
still never writes to the dataset; this changes nothing about the promotion-workflow
deferral.

---

## 3. Event data & knowledge graphs (detail)

### Wikidata — top pick, CC0

- **Coverage:** full timeline; BCE dates are first-class negative ISO years (Battle
  of Salamis → `-0479-…`), nearly matching the project's negative-integer-year model.
- **Scale (measured 2026-08-31):** 12,765 battles with dates; **47,262 occurrences
  with both a date (P585) and coordinates (P625)**.
- **Useful ontology:** root event class `occurrence` (Q1190554) with `event`, `battle`,
  `war`, `founding` etc. beneath; P585 point-in-time, P580/P582 start/end, P625
  coordinates, P276 location, P17 country. (P793 "significant event" links an entity
  *to* its events — useful for pulling a country's event list, not an event class.)
- **Significance proxy — verified:** sitelink count (`wikibase:sitelinks`, one integer
  inline per item) rank-orders sensibly: Waterloo 93, Pearl Harbor 88, Salamis 83,
  Hastings 80. Measures cross-cultural fame; works for ancient events (pageviews
  don't, being modern-attention-biased and only available since 2015).
- **Citations:** per-statement references exist but are uneven (many "imported from
  Wikipedia") — vetting leads, not vetting authority.
- **Access:** SPARQL `https://query.wikidata.org/sparql`; REST
  `https://www.wikidata.org/w/rest.php/wikibase/v1/…` (v1 — v0 is dead); weekly JSON
  dumps (~130 GiB compressed) at `https://dumps.wikimedia.org/wikidatawiki/entities/`.

**Extraction gotchas (all hit in practice during verification):**

1. **The public WDQS endpoint 502s on subclass-tree scans** (`wdt:P31/wdt:P279*` over
   `battle` with sitelinks exceeded the 60 s public timeout). **Use QLever instead:**
   `https://qlever.dev/api/wikidata` (Uni Freiburg, free, keyless, regularly
   refreshed) ran the identical query in 86 ms; the 47k-occurrence count took 933 ms.
   QLever requires explicit `PREFIX wd:/wdt:/wikibase:` declarations (WDQS
   pre-registers them; QLever errors without).
2. **Dedupe on QID** — multi-valued P585 duplicates result rows.
3. **Preserve date precision qualifiers** — truthy triples flatten circa/year/century
   precision into fake day precision ("July 1, 479 BCE" for a year-only date). Read
   the precision qualifier from the full statement or ancient dates lose their
   `circa`-ness.
4. Wikipedia/Wikidata inherit a Eurocentric/recency bias — the rubric's per-lane
   tier budget is the designed counterweight; use sitelinks as input, never arbiter.

### Wikipedia APIs — significance/citation layer

- **Pageviews API** (`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/…`):
  good second significance signal for refining tiers on a shortlist (one call per
  article — refine, don't scan). Data since mid-2015 only.
- **On This Day feed** (`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/…`):
  alive, but anniversary-organized, no BCE, heavy modern bias — a serendipity source
  at best, not a systematic one.
- **Licensing note:** CC BY-SA attaches to copied *text*, not restructured facts.
  Write our own titles/blurbs, cite the article URL, and `data/events.json` stays
  cleanly licensed.

### YAGO 4.6 — fallback cross-check

`https://yago-knowledge.org/downloads/yago-4-6` — Wikidata rebuilt on a cleaned
schema.org taxonomy, Turtle dumps, **CC BY** (4.6 relaxed from 4.5's CC BY-SA).
Worth using only if raw Wikidata's class hierarchy proves too noisy; loses the
sitelink signal and long-tail items.

### Investigated and rejected

- **EventKG** — effectively dead: primary domain DNS-dead, mirror SPARQL returns 500,
  last release v3.0 (2020), funding project ended 2023. Content derives from
  Wikidata/DBpedia anyway. Zenodo dump exists (5.4 GB, CC BY-SA) — not worth mining.
- **DBpedia** — alive and maintained, but messier dates (string-typed), stricter
  license (CC BY-SA 3.0 + GFDL), adds nothing over Wikidata for events.
- **"On this day" APIs** (muffinlabs, byabbe.se, ZenQuotes, API Ninjas) — all alive,
  all Wikipedia-derived anniversary trivia: day-of-year organized, essentially no
  BCE, no coordinates, no significance signal, no bulk access. API Ninjas free tier
  is additionally non-commercial. Skip.
- **GDELT** — starts January 1979, news-media events; irrelevant to the timeline.
- **Kaggle "world events" datasets** (e.g. saketk511's) — columns suggest
  LLM-generated content, no per-event citations; fails the vetting bar. Avoid.
- **Histography** (live-scrapes Wikipedia, no dataset) and **ChronoZoom** (dead, no
  salvageable data) — confirmed non-sources.

---

## 4. Historical geometry, places, periods (detail)

### Cliopatria (Seshat) — the headline find

- **What:** open geospatial dataset of worldwide political entities, published in
  *Nature Scientific Data* (2025): ~1,600 polities, ~14,000 dated shape records,
  **3400 BCE – 2024 CE**, in **one GeoJSON**. Each record carries
  **`FromYear`/`ToYear` integers (negative = BCE)** — the exact time-varying
  territory model lanes need — plus Wikidata IDs and Seshat polity IDs.
- **Access:** `https://github.com/Seshat-Global-History-Databank/cliopatria`
  (`cliopatria.geojson.zip` in-repo; versioned releases + Zenodo record 13363121;
  docs at seshat-global-history-databank.readthedocs.io).
- **License:** **CC BY 4.0** (attribution only — verified in LICENSE.md and Zenodo).
- **Fit:** near purpose-built for lane geographic anchors; "Rome's territory over
  centuries" is literally rows in this file. Polity rise/fall dates double as a
  citable candidate pool for non-European lanes.
- **Gotchas:** starts 3400 BCE (Neolithic band needs historical-basemaps); shapes
  digitized from hand-drawn maps — illustrative, not survey-grade (fine for a
  Histomap register); per-polity sampling timesteps vary; full GeoJSON is large —
  split/simplify per lane at build time.

### historical-basemaps (aourednik) — pre-3400 tail + world slices

`https://github.com/aourednik/historical-basemaps` — 72 GeoJSON world snapshots,
123,000 BCE–2010 CE (irregular intervals), ~0.7–3 MB each, `index.json` maps
years→files; maintained (last human commit Jan 2026). **License GPL-3.0** (unusual
for data; fine for an open personal repo). README warns boundaries are
approximate/disputed; ancient "borders" are anachronistic zones; coastlines modern.

### Place gazetteers (for future per-event lat/lon)

- **Pleiades** (`https://pleiades.stoa.org/downloads`) — ancient places, ~40k+,
  daily comprehensive JSON dump + GIS CSV + community GeoJSON derivative, **CC BY**.
  Strong classical Mediterranean/Near East; weak ancient East Asia/Americas/Africa.
- **World Historical Gazetteer** (`https://whgazetteer.org`) — post-classical/global
  complement; **CC BY 4.0**; Swagger API (free registration token); per-dataset
  downloads rather than one canonical dump — treat as lookup service, not shippable
  file.
- **PeriodO** (`https://perio.do`, canonical dataset
  `http://n2t.net/ark:/99152/p0d.json`) — **CC0** gazetteer of scholarly *period
  definitions* with fuzzy start/stop bounds per authority. Nice-to-have for labeling
  era bands on lanes with citable bounds; not geometry.

### Basemap

**Natural Earth** — public domain confirmed
(`https://www.naturalearthdata.com/about/terms-of-use/`), vector shapefiles (GeoJSON
via the `nvkelso/natural-earth-vector` GitHub mirror) at 1:10m/50m/110m; 110m is
plenty for a docked overview map.

### Watch list / rejected

- **OpenHistoricalMap** — **CC0** (deliberately not ODbL), OSM-style with true
  per-feature `start_date`/`end_date`, dedicated Overpass instance
  (`https://overpass-api.openhistoricalmap.org/api/`) with a documented
  boundaries-at-a-date query recipe, planet dumps, QLever SPARQL. Data model beats
  Cliopatria's; **global pre-modern coverage is still too patchy** (community
  importer efforts ongoing 2025–26). **Re-check in a year or two.**
- **CShapes 2.0** (`https://icr.ethz.ch/data/cshapes/`) — rigorous state borders
  1886–2019, but **CC BY-NC-SA** and covers ~1% of the timeline. QA reference only.
- **Euratlas** (paid, €150–600, publication needs written consent, Europe-only) and
  **GeaCron** (view-only, commercial licensing) — dead ends for a public repo.
- **Chronas** (chronas.org) — alive, 50M+ data points, but largely derivative of the
  sources above and data licensing unpublished. Inspiration/cross-check only.
- **Harvard WorldMap** — long dead.

---

## 5. Vetting authorities & quantitative series (detail)

### Theme-specific authorities

- **NOAA NCEI natural hazards** — Significant Earthquake Database **2150 BCE–present**
  plus volcano and tsunami companions. **HazEL REST API verified live and keyless:**
  `https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/earthquakes` (also
  `/volcanoes`, `/tsunamis/events`) — returned the Thera eruption and the 2150 BCE
  Bab-a-Daraa quake. US government work = **public domain**; cite DOI
  10.7289/V5TD9V7K. The crisis theme's citable authority *and* candidate pool.
  Gotcha: filter `publish: false` records; some fields are order-of-magnitude
  (`deathsAmountOrder`), not exact counts.
- **UCDP** (`https://ucdp.uu.se/downloads/`) — armed conflicts **1946–2025**,
  battle-deaths, peace agreements; CSV/Excel + REST API; **CC BY 4.0** (cleanest
  conflict license). Use conflict-level tables, not incident-level GED.
- **Brecke Conflict Catalog**
  (`https://brecke.inta.gatech.edu/research/conflict/`) — 3,708 conflicts (32+
  deaths) **1400 CE–present**, all regions; Excel still served. **No formal license**
  (cite Brecke); single-scholar, self-described unfinished — treat dates as leads to
  verify, not vetting authority. The only cross-regional bridge over the 1400–1816
  pre-COW gap.
- **Correlates of War** (`https://correlatesofwar.org/data-sets/`) — gold-standard
  wars/MIDs **1816+**, free CSVs, but **non-commercial AND redistribution prohibited
  without written permission**. Private cross-check only; never ship COW-derived
  columns.
- **EM-DAT** — disasters 1900+, registration + **non-commercial**. Private
  cross-check only; NOAA covers the need with none of the friction.

### Quantitative series (future layers)

- **Maddison Project Database 2023** (rug.nl) — GDP per capita, 169 countries,
  headline 1820+ with benchmarks back to 1 CE; **CC BY 4.0**; DOI 10.34894/INZBF2.
- **HYDE 3.3** (Utrecht/PBL) — population & land use **10,000 BCE–2023**, gridded +
  country CSV; **CC BY 4.0**. The only population series matching the full timeline.
- **Our World in Data** — OWID-produced data **CC BY**; per-chart CSV/JSON Chart Data
  API (docs.owid.io); already harmonizes Maddison/HYDE/UCDP/Brecke. Gotcha:
  third-party series keep upstream licenses — check per-series, cite the upstream.

### Other

- **Pantheon** (`https://pantheon.world/data/datasets`) — MIT dataset of ~historical
  figures ranked by Historical Popularity Index (multilingual-Wikipedia-derived);
  2025 CSV; **CC BY-SA**, cite Yu et al. 2016. Not an event source; valuable as (a)
  published precedent for Wikipedia-derived significance ranking (cite when
  defending tier methodology), (b) people enrichment data. Inherits Wikipedia bias.
- **World History Encyclopedia** (worldhistory.org) — no API/export; articles
  **CC BY-NC-SA**; genuinely good non-Western antiquity coverage. Use as a *cited*
  human vetting reference (citing ≠ redistributing); don't ingest text.
- **Seshat Equinox-2020** (Zenodo 10.5281/zenodo.6642229) — polity social-complexity
  variables ~7000 BCE–1919 CE; **CC BY-NC-SA**. Background reading for tiering
  judgment; prefer Cliopatria for anything redistributed.
- **Library/heritage APIs** (enrichment only, all alive): Library of Congress
  (keyless JSON via `?fo=json`), Europeana (CC0 metadata, per-item media licenses),
  DPLA (api.dp.la/v2, US-centric). **Clio Infra** (1500–2010, archival, vague
  licensing) and **D-PLACE** (CC BY-NC) — weak fits.

---

## 6. License quick-reference

| Safe for public repo | Caution | Avoid shipping |
|---|---|---|
| Wikidata (CC0), OHM (CC0), PeriodO (CC0), Natural Earth (PD), NOAA (PD) | Wikipedia text (CC BY-SA — cite, don't copy) | COW (NC + no redistribution) |
| Cliopatria, Pleiades, WHG, UCDP, Maddison, HYDE, YAGO 4.6, OWID-produced (all CC BY) | Pantheon (CC BY-SA), historical-basemaps (GPL-3), Brecke (no license — cite) | EM-DAT, CShapes, Equinox, D-PLACE, WHE text (all NC) |

---

## 7. Suggested next steps (for the implementing session)

None of this is committed work — it's the natural sequence if the recommendations are
accepted:

1. **Candidate-pool extraction script** (`prototype/` or a new `tools/` script):
   one QLever query over occurrence subclasses pulling QID, label, date + precision,
   coords, sitelinks → static JSON checked into the repo (not into
   `data/events.json`). Respect gotchas §3: QLever prefixes, QID dedupe, precision
   qualifiers.
2. **Tiering assist:** sort candidates by sitelinks per region; curator reviews
   against the rubric's per-lane budgets. Optionally refine the shortlist with the
   pageviews API.
3. **Citations for the `vetted` backlog:** current events are curator-reviewed but
   citation-pending; Wikipedia article URLs + theme authorities (NOAA, UCDP, WHE)
   are the fastest path to real `sources` entries.
4. **When lane geometry work starts:** prototype lane anchors from Cliopatria
   (filter by Seshat/Wikidata polity, union shapes per era, simplify); Natural Earth
   110m for the docked map; historical-basemaps for the Neolithic band.
5. **Per CLAUDE.md:** any of these becoming a build step or tool touches
   docs/architecture.md in the same change; a realtime ingestion feature would need
   a spec first (and the promotion-workflow deferral still stands).

*Survey conducted 2026-08-31 by three parallel research agents (structured event
data; historical GIS/places; academic databanks), each verifying sources by live
fetch. Full per-source URLs are inline above.*
