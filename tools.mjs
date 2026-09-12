// ChronoBot — shared view-tool registry (architecture invariant 2, extended
// across variants: one definition, both servers derive from it).
//
//   server.mjs      (Variant A, custom loop)  → toAnthropic()  — JSON Schema
//   mcp-server.mjs  (Variant B, MCP App)      → toZodShape()   — zod raw shape
//
// Neutral param spec per tool: { type, description, required?, items?, enum? }.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const taxonomy = JSON.parse(readFileSync(join(root, 'data', 'taxonomy.json'), 'utf8'));
const threads = JSON.parse(readFileSync(join(root, 'data', 'threads.json'), 'utf8'));
const lanes = JSON.parse(readFileSync(join(root, 'data', 'lanes.json'), 'utf8'));
export const THEME_IDS = Object.keys(taxonomy.themes);
export const REGION_IDS = Object.keys(taxonomy.regions);
export const THREAD_IDS = threads.map(t => t.id);
export const SPLITTABLE_LANE_IDS = lanes.filter(l => l.children?.length).map(l => l.id);

export const VIEW_TOOLS = [
  {
    name: 'set_theme_filter',
    description: 'Filter the canvas to events of the given themes. An empty list clears the filter and shows all themes.',
    params: {
      themes: { type: 'array', items: { type: 'string', enum: THEME_IDS }, description: 'Theme ids to show; empty = all', required: true },
    },
  },
  {
    name: 'zoom_to_range',
    description: 'Zoom the canvas so the given year range fills the view. Negative years are BCE. Zooming in reveals finer event tiers.',
    params: {
      start_year: { type: 'integer', description: 'Earlier bound (negative = BCE)', required: true },
      end_year: { type: 'integer', description: 'Later bound', required: true },
    },
  },
  {
    name: 'set_time_ruler',
    description: 'Move the time ruler to a year. The ruler rings every event near that moment across all lanes — the "meanwhile, elsewhere" gesture.',
    params: {
      year: { type: 'integer', description: 'Year to place the ruler at (negative = BCE)', required: true },
    },
  },
  {
    name: 'highlight_events',
    description: 'Highlight specific events on the canvas by id (halo + guaranteed label, even if their tier is below the current zoom detail). Replaces any previous highlights. Use this for every event you discuss.',
    params: {
      ids: { type: 'array', items: { type: 'string' }, description: 'Event ids from the dataset', required: true },
    },
  },
  {
    name: 'show_thread',
    description: 'Show a curated cross-lane thread: an ordered chain of related canon events spanning multiple lanes, drawn as one path rising through time. The view glides to fit the thread. Replaces any active thread.',
    params: {
      id: { type: 'string', enum: THREAD_IDS, description: 'Curated thread id', required: true },
    },
  },
  {
    name: 'connect_events',
    description: 'Draw an ad-hoc dashed thread through the given events in chronological order, with a short label — a narrative gesture connecting events across lanes as you discuss them. It does not add knowledge to the dataset. The view glides to fit. Replaces any active thread.',
    params: {
      ids: { type: 'array', items: { type: 'string' }, description: 'Event ids to connect (at least 2 known ids)', required: true },
      label: { type: 'string', description: 'Short label for the connection', required: true },
    },
  },
  {
    name: 'split_lane',
    description: 'Split a lane into its sub-region columns (horizontal zoom) to compare what happened within a continent — e.g. Mesoamerica vs the Andes, or China vs Japan. Only one lane can be split at a time; splitting another collapses the previous. split=false collapses the lane.',
    params: {
      lane: { type: 'string', enum: SPLITTABLE_LANE_IDS, description: 'Lane to split or collapse', required: true },
      split: { type: 'boolean', description: 'true = split into sub-regions, false = collapse', required: true },
    },
  },
  {
    name: 'reset_view',
    description: 'Reset the canvas: full time span, all themes, highlights, any thread and any lane split cleared, ruler back to 540 BCE.',
    params: {},
  },
];

export function toAnthropic(tool) {
  const properties = {}, required = [];
  for (const [key, spec] of Object.entries(tool.params)) {
    const { required: isRequired, ...schema } = spec;
    properties[key] = schema;
    if (isRequired) required.push(key);
  }
  return {
    name: tool.name,
    description: tool.description,
    input_schema: { type: 'object', properties, ...(required.length ? { required } : {}) },
  };
}

export function toZodShape(tool, z) {
  const shape = {};
  for (const [key, spec] of Object.entries(tool.params)) {
    let s;
    if (spec.type === 'integer') s = z.number().int();
    else if (spec.type === 'boolean') s = z.boolean();
    else if (spec.type === 'array') s = z.array(spec.items?.enum ? z.enum(spec.items.enum) : z.string());
    else s = spec.enum ? z.enum(spec.enum) : z.string();
    if (spec.description) s = s.describe(spec.description);
    if (!spec.required) s = s.optional();
    shape[key] = s;
  }
  return shape;
}
