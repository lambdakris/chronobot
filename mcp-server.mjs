// ChronoBot MCP server — Variant B of the dual-track (docs/specs/mcp-app.md).
//
//   node mcp-server.mjs        (stdio — for Claude Desktop / VS Code / Claude Code)
//
// The canvas ships as an MCP App (ui:// resource); the host brings the model,
// loop, sessions, and knowledge tools. View tools carry the FULL merged view
// state in structuredContent — not deltas — so the canvas renders correctly
// whether the host routes the call to the live instance (animated glide) or
// spawns a fresh iframe (direct render). The canvas reports user-driven state
// back through the app-only sync_view_state tool, closing the drift loop.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { VIEW_TOOLS, THEME_IDS, toZodShape } from './tools.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const read = f => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const events = read('events.json');
const threads = read('threads.json');
const lanes = read('lanes.json');

const YMIN = -11000, YMAX = 2050;
const clampYear = y => Math.max(YMIN, Math.min(YMAX, Math.round(y)));
const fmtYear = y => (y < 0 ? -y + ' BCE' : (y === 0 ? 1 : y) + ' CE');
const eventLine = e =>
  `${e.id} | ${e.circa ? 'c.' : ''}${e.start}${e.end ? '–' + e.end : ''} | ${e.title} | ${e.region} | tier ${e.tier} | ${e.themes.join(',')}`;

const server = new McpServer({ name: 'chronobot', version: '0.1.0' });
const resourceUri = 'ui://chronobot/canvas.html';

// Merged view state — one per server process (a personal, single-conversation
// tool). Every view tool folds its change in and returns the whole thing.
const view = {
  start_year: YMIN, end_year: YMAX, ruler_year: -540,
  themes: [], highlights: [], selected: null, thread: null, split_lane: null,
};

const stateText = () =>
  `viewing ${fmtYear(view.start_year)} – ${fmtYear(view.end_year)}` +
  ` · ruler at ${fmtYear(view.ruler_year)}` +
  ` · themes: ${view.themes.length ? view.themes.join(', ') : 'all'}` +
  ` · highlighted: ${view.highlights.length ? view.highlights.join(', ') : 'none'}` +
  (view.thread ? ` · thread: ${view.thread.kind === 'curated' ? view.thread.id : `"${view.thread.label}" (ad-hoc)`}` : '') +
  (view.selected ? ` · user-selected: ${view.selected}` : '');

const viewResult = text => ({
  content: [{ type: 'text', text: `${text} · now ${stateText()}` }],
  structuredContent: { view: { ...view } },
});

// Mirrors the canvas's applyTool semantics; returns the human/model text.
const APPLY = {
  zoom_to_range(a) {
    view.start_year = clampYear(Math.min(a.start_year, a.end_year));
    view.end_year = clampYear(Math.max(a.start_year, a.end_year));
    return `Zoomed to ${fmtYear(view.start_year)} – ${fmtYear(view.end_year)}`;
  },
  set_time_ruler(a) {
    view.ruler_year = clampYear(a.year);
    return `Ruler moved to ${fmtYear(view.ruler_year)}`;
  },
  set_theme_filter(a) {
    view.themes = (a.themes ?? []).filter(t => THEME_IDS.includes(t));
    return view.themes.length ? `Filtered to ${view.themes.join(', ')}` : 'Theme filter cleared';
  },
  highlight_events(a) {
    const known = (a.ids ?? []).filter(id => events.some(e => e.id === id));
    const unknown = (a.ids ?? []).filter(id => !known.includes(id));
    view.highlights = known;
    return `Highlighted ${known.length} event${known.length === 1 ? '' : 's'}` +
      (unknown.length ? ` (unknown ids: ${unknown.join(', ')})` : '');
  },
  show_thread(a) {
    const t = threads.find(t => t.id === a.id);
    if (!t) return `Unknown thread id "${a.id}" — valid: ${threads.map(t => t.id).join(', ')}`;
    const ms = t.members.map(id => events.find(e => e.id === id)).filter(Boolean);
    view.thread = { kind: 'curated', id: t.id };
    view.start_year = Math.min(...ms.map(e => e.start));
    view.end_year = Math.max(...ms.map(e => e.end ?? e.start));
    return `Thread "${t.title}" shown (${ms.length} events)`;
  },
  connect_events(a) {
    const known = [...new Set(a.ids ?? [])].filter(id => events.some(e => e.id === id));
    if (known.length < 2) return 'connect_events needs at least 2 known event ids';
    const byId = id => events.find(e => e.id === id);
    known.sort((x, y) => byId(x).start - byId(y).start);
    const label = String(a.label || 'connection').slice(0, 60);
    view.thread = { kind: 'adhoc', ids: known, label };
    view.start_year = Math.min(...known.map(id => byId(id).start));
    view.end_year = Math.max(...known.map(id => byId(id).end ?? byId(id).start));
    return `Connected ${known.length} events as "${label}" (ad-hoc)`;
  },
  split_lane(a) {
    const ln = lanes.find(l => l.id === a.lane && l.children?.length);
    if (!ln) return `Unknown or unsplittable lane "${a.lane}" — splittable: ${lanes.filter(l => l.children?.length).map(l => l.id).join(', ')}`;
    if (!a.split) {
      if (view.split_lane === ln.id) view.split_lane = null;
      return `${ln.name} collapsed`;
    }
    view.split_lane = ln.id;
    return `${ln.name} split into ${ln.children.map(c => c.name).join(' · ')}`;
  },
  reset_view() {
    Object.assign(view, { start_year: YMIN, end_year: YMAX, ruler_year: -540, themes: [], highlights: [], thread: null, split_lane: null });
    return 'View reset';
  },
};

for (const tool of VIEW_TOOLS) {
  registerAppTool(server, tool.name, {
    description: tool.description,
    inputSchema: toZodShape(tool, z),
    _meta: { ui: { resourceUri } },
  }, async args => viewResult(APPLY[tool.name](args ?? {})));
}

registerAppTool(server, 'show_canvas', {
  description: 'Render the ChronoBot canvas: an interactive synchronoptic chart of world history — a world map anchors six civilization lanes that rise through time (11,000 BCE at bottom to today), with semantic zoom and a draggable time ruler. Call this to show the chart, then drive it with the view tools. Use query_events to learn what is on it.',
  inputSchema: {},
  _meta: { ui: { resourceUri } },
}, async () => viewResult('ChronoBot canvas rendered'));

// App-only: the canvas reports actual state after user interaction (manual
// pan/zoom, clicks) so the merged state tracks reality between model calls.
registerAppTool(server, 'sync_view_state', {
  description: 'App-only: the canvas reports its actual view state.',
  inputSchema: {
    start_year: z.number().int(),
    end_year: z.number().int(),
    ruler_year: z.number().int(),
    themes: z.array(z.string()),
    highlights: z.array(z.string()),
    selected: z.string().nullable(),
    thread: z.any().optional(),
    split_lane: z.string().nullable().optional(),
  },
  _meta: { ui: { resourceUri, visibility: ['app'] } },
}, async args => {
  Object.assign(view, args);
  return { content: [{ type: 'text', text: 'ok' }] };
});

// Dataset grounding for a host model that doesn't carry the dataset in its
// prompt (unlike Variant A, where all 199 event lines ride in the system block).
server.registerTool('query_events', {
  description: 'Query the ChronoBot event dataset (199 curated events, 11,000 BCE – today). Filter by year range, region prefix (e.g. "europe", "asia.east", "africa.west"), themes, tier ceiling, or title text. Returns matching event lines: id | date (negative = BCE) | title | region | tier (1 era-defining … 4 local) | themes. Use the ids with highlight_events.',
  inputSchema: {
    start_year: z.number().int().optional().describe('Earliest year (negative = BCE)'),
    end_year: z.number().int().optional().describe('Latest year'),
    region: z.string().optional().describe('Region id prefix, e.g. "europe" or "asia.east"'),
    themes: z.array(z.enum(THEME_IDS)).optional().describe('Match any of these themes'),
    max_tier: z.number().int().min(1).max(4).optional().describe('Only events at this tier or more significant (default 4 = all)'),
    text: z.string().optional().describe('Case-insensitive substring of the title'),
  },
}, async (a = {}) => {
  const matches = events.filter(e =>
    (a.start_year === undefined || (e.end ?? e.start) >= a.start_year) &&
    (a.end_year === undefined || e.start <= a.end_year) &&
    (a.region === undefined || e.region === a.region || e.region.startsWith(a.region + '.')) &&
    (a.themes === undefined || e.themes.some(t => a.themes.includes(t))) &&
    (a.max_tier === undefined || e.tier <= a.max_tier) &&
    (a.text === undefined || e.title.toLowerCase().includes(a.text.toLowerCase())));
  const shown = matches.slice(0, 60);
  const text = matches.length === 0
    ? 'No events match. The dataset is curated and sparse by design — try widening the filters.'
    : shown.map(eventLine).join('\n') +
      (matches.length > shown.length ? `\n… ${matches.length - shown.length} more — narrow the query to see them.` : '');
  return { content: [{ type: 'text', text }] };
});

// The whole dataset as a plain resource, for hosts that prefer reading it whole.
server.registerResource('dataset', 'chronobot://dataset', {
  description: 'The full ChronoBot event dataset as text lines.',
  mimeType: 'text/plain',
}, async uri => ({
  contents: [{ uri: uri.href, mimeType: 'text/plain', text: events.map(eventLine).join('\n') }],
}));

// The canvas itself — already a self-contained single file (no build step, no
// external origins, hence no CSP domains). Its inline host-bridge detects the
// MCP host; opened standalone, the same file is Variant A.
registerAppResource(server, 'canvas', resourceUri, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
  contents: [{
    uri: resourceUri,
    mimeType: RESOURCE_MIME_TYPE,
    text: readFileSync(join(root, 'prototype', 'canvas.html'), 'utf8'),
  }],
}));

await server.connect(new StdioServerTransport());
console.error(`ChronoBot MCP server on stdio (${events.length} events)`);
