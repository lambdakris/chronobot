// ChronoBot dev server — serves the prototype and proxies the copilot chat.
//
//   node server.mjs        (reads DEEPINFRA_TOKEN from .env; shell env overrides the file)
//
// Inference runs on DeepInfra, which exposes an Anthropic-Messages-compatible
// endpoint — so this still speaks the Messages API through @anthropic-ai/sdk,
// just pointed at a different base URL with a DeepInfra model id.
//
// The agentic loop runs in the browser (the tools mutate the canvas), so this
// server is deliberately thin: it adds the system prompt (with the dataset)
// and the tool definitions, holds the credentials, and forwards one Messages
// API call per round trip.
import Anthropic from '@anthropic-ai/sdk';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEW_TOOLS, toAnthropic } from './tools.mjs';

const root = dirname(fileURLToPath(import.meta.url));
// Credentials live in .env (gitignored). Vars already set in the shell win.
try { process.loadEnvFile(join(root, '.env')); } catch { /* no .env — rely on the shell */ }
const read = f => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const taxonomy = read('taxonomy.json');
const lanes = read('lanes.json');
const events = read('events.json');
const threads = read('threads.json');

// DeepSeek V4 Flash on DeepInfra: $0.09/$0.18 per MTok, 1M-token context —
// cheap enough that the whole dataset can ride in every system prompt.
// Override with CHRONOBOT_MODEL=<any DeepInfra model id>.
const MODEL = process.env.CHRONOBOT_MODEL || 'deepseek-ai/DeepSeek-V4-Flash-0731';
const BASE_URL = process.env.CHRONOBOT_BASE_URL || 'https://api.deepinfra.com/anthropic';
const PORT = process.env.PORT || 8437;

const datasetLines = events
  .map(e => `${e.id} | ${e.circa ? 'c.' : ''}${e.start}${e.end ? '–' + e.end : ''} | ${e.title} | ${e.region} | tier ${e.tier} | ${e.themes.join(',')}`)
  .join('\n');
const threadLines = threads
  .map(t => `${t.id} | ${t.title} | ${t.members.join(' → ')}`)
  .join('\n');

const SYSTEM = [
  {
    type: 'text',
    text: `You are the ChronoBot copilot, embedded beside a synchronoptic chart of world history: a world map anchors space along the x-axis, lanes rise through time (past at bottom), and a draggable time ruler highlights what happened everywhere at one moment. The lanes are: ${lanes.map(l => l.name).join(' · ')}.

Every user message begins with a <view_state> block describing what they currently see (visible year range, detail tiers, theme filter, ruler position, active thread, any split lane, any selected event). Use it to ground your answers — "here", "this", and "now" refer to that view.

You control the canvas through tools. Use them whenever reconfiguring the view would help: highlight the events you discuss, move the time ruler to a moment you explain, zoom to the era in question. Prefer showing over telling; then give a brief text answer. Negative years are BCE.

The canvas dataset (event id | date | title | region | tier 1=era-defining..4=local | themes):
${datasetLines}

Curated cross-lane threads (thread id | title | member events in order) — chains of related events spanning lanes, drawn as one path on the canvas:
${threadLines}

Thread doctrine: when a curated thread fits the story, call show_thread. To connect events across lanes in your own narration, call connect_events — it draws a dashed, clearly ad-hoc path through existing events; it is a visual suggestion and does not add anything to the dataset.

Lane splitting: ${lanes.filter(l => l.children?.length).map(l => `${l.id} (${l.children.map(c => c.name).join(' · ')})`).join('; ')} can split into sub-region columns via split_lane. Events from the same lane render in one column and visually stack (aztec-empire and inca-expansion nearly overlap at world zoom) — so whenever you compare developments within one of those continents (Mesoamerica vs the Andes, Egypt vs West Africa, China vs Japan), split the lane first so they appear side by side, then zoom to the era. Only one lane splits at a time; collapse it (split=false) when returning to world-scale narration.

Grounding rules: when discussing events, reference and highlight them by id. You may draw on general historical knowledge for explanations and context, but when something you mention is not on the canvas, say so briefly — the canvas dataset is fixed and curated; you cannot add to it.

Style: this is a narrow chat sidebar that renders your reply as plain text, so markdown syntax shows up literally — never use it. No headings, bullet lists, or **bold**/*italic* markers. Answer in plain conversational prose, usually 2–6 sentences. Lead with the answer.`,
    // DeepInfra accepts the cache breakpoint but reports no cache_* fields in
    // usage, so treat any prefix-cache discount as a bonus, not a guarantee.
    cache_control: { type: 'ephemeral' },
  },
];

// Tool definitions live in the shared registry (tools.mjs) so Variant A and
// the MCP server (mcp-server.mjs) cannot drift apart.
const TOOLS = VIEW_TOOLS.map(toAnthropic);

let client = null;
function getClient() {
  if (!client) client = new Anthropic({ baseURL: BASE_URL, apiKey: process.env.DEEPINFRA_TOKEN });
  return client;
}

const readBody = req => new Promise((resolve, reject) => {
  let body = '';
  req.on('data', c => { body += c; if (body.length > 2_000_000) reject(new Error('body too large')); });
  req.on('end', () => resolve(body));
  req.on('error', reject);
});

const describeErr = err =>
  err?.status === 401 || err?.status === 403
    ? 'DeepInfra rejected the credentials — check DEEPINFRA_TOKEN in .env and restart the server.'
    : err instanceof Anthropic.APIError ? `${err.status} ${err.name}: ${err.message}`
      : /apiKey|auth/i.test(String(err?.message))
        ? 'No API credentials — set DEEPINFRA_TOKEN in .env and restart the server.'
        : String(err?.message || err);

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    let messages;
    try {
      ({ messages } = JSON.parse(await readBody(req)));
      getClient(); // constructing early surfaces missing credentials as a plain JSON error
    } catch (err) {
      const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: describeErr(err) }));
      return;
    }
    // Stream the reply as SSE so text renders in the panel while the model
    // writes it; the browser still applies tool calls from the final message.
    // No output_config/effort and no server-side refusal fallback — both are
    // Anthropic-platform features DeepInfra doesn't honour.
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    const send = obj => res.write('data: ' + JSON.stringify(obj) + '\n\n');
    const stream = getClient().messages.stream({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      tools: TOOLS,
      messages,
    });
    req.on('close', () => { try { stream.controller.abort(); } catch {} });
    stream.on('text', t => send({ type: 'text', text: t }));
    try {
      const final = await stream.finalMessage();
      send({ type: 'done', content: final.content, stop_reason: final.stop_reason });
    } catch (err) {
      send({ type: 'error', error: describeErr(err) });
    }
    res.end();
    return;
  }
  if (req.method === 'GET' && (req.url === '/' || req.url === '/canvas.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(join(root, 'prototype', 'canvas.html')));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`ChronoBot at http://localhost:${PORT}  (model: ${MODEL}, ${events.length} events)`);
  if (!process.env.DEEPINFRA_TOKEN) console.warn('⚠  DEEPINFRA_TOKEN is not set — the canvas works, but the copilot chat will 401.');
});
