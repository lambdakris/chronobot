#!/usr/bin/env node
// Inlines data/*.json into prototype/canvas.html between the __DATA__ markers,
// validating the dataset against the taxonomy and lane queries first.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const taxonomy = read('taxonomy.json');
const lanes = read('lanes.json');
const events = read('events.json');
const threads = read('threads.json');

const errors = [];
const ids = new Set();
const lanesFor = ev => lanes.filter(ln =>
  ln.query.regions.some(p => ev.region === p || ev.region.startsWith(p + '.')));
for (const e of events) {
  if (ids.has(e.id)) errors.push(`duplicate id: ${e.id}`);
  ids.add(e.id);
  if (!taxonomy.regions[e.region]) errors.push(`${e.id}: unknown region "${e.region}"`);
  for (const t of e.themes ?? []) if (!taxonomy.themes[t]) errors.push(`${e.id}: unknown theme "${t}"`);
  if (!(e.themes?.length >= 1)) errors.push(`${e.id}: needs at least one theme`);
  if (!(e.tier >= 1 && e.tier <= 4)) errors.push(`${e.id}: tier out of range`);
  if (!Number.isInteger(e.start)) errors.push(`${e.id}: non-integer start`);
  if (e.end !== undefined && e.end <= e.start) errors.push(`${e.id}: end not after start`);
  const m = lanesFor(e);
  if (m.length === 0) errors.push(`${e.id}: no lane query matches region "${e.region}"`);
  if (m.length > 1) errors.push(`${e.id}: multiple lanes match (${m.map(l => l.id).join(', ')})`);
}
// Lane children (docs/specs/lane-split.md): sub-region columns a lane splits
// into. Child queries must partition the parent's events cleanly (an event
// matching the parent but no child is legal — the center-anchor rule).
const matches = (ev, q) => q.regions.some(p => ev.region === p || ev.region.startsWith(p + '.'));
for (const ln of lanes) {
  if (!ln.children) continue;
  const cids = new Set();
  for (const c of ln.children) {
    if (cids.has(c.id)) errors.push(`lane ${ln.id}: duplicate child id ${c.id}`);
    cids.add(c.id);
    const inParent = c.query.regions.every(p => ln.query.regions.some(q => p === q || p.startsWith(q + '.')));
    if (!inParent) errors.push(`lane ${ln.id}: child ${c.id} query escapes the parent's regions`);
    for (const p of c.query.regions) if (!taxonomy.regions[p]) errors.push(`lane ${ln.id}: child ${c.id} unknown region "${p}"`);
    if (!events.some(e => matches(e, c.query))) errors.push(`lane ${ln.id}: child ${c.id} matches no events`);
  }
  for (const e of events) {
    if (!matches(e, ln.query)) continue;
    const owners = ln.children.filter(c => matches(e, c.query));
    if (owners.length > 1) errors.push(`${e.id}: matches ${owners.length} children of lane ${ln.id} (${owners.map(c => c.id).join(', ')})`);
  }
}

// Threads (docs/specs/cross-lane-threads.md): ordered chains of canon events
// spanning ≥2 lanes, strictly chronological — curator intent, never auto-sorted.
const evById = new Map(events.map(e => [e.id, e]));
const tids = new Set();
for (const t of threads) {
  if (tids.has(t.id)) errors.push(`thread ${t.id}: duplicate id`);
  tids.add(t.id);
  for (const th of t.themes ?? []) if (!taxonomy.themes[th]) errors.push(`thread ${t.id}: unknown theme "${th}"`);
  if (!(t.members?.length >= 2)) { errors.push(`thread ${t.id}: needs at least 2 members`); continue; }
  const ms = t.members.map(id => {
    if (!evById.has(id)) errors.push(`thread ${t.id}: unknown member "${id}"`);
    return evById.get(id);
  }).filter(Boolean);
  for (let i = 1; i < ms.length; i++)
    if (ms[i].start <= ms[i - 1].start)
      errors.push(`thread ${t.id}: members not strictly chronological ("${ms[i].id}" after "${ms[i - 1].id}")`);
  if (new Set(ms.map(e => lanesFor(e)[0]?.id)).size < 2)
    errors.push(`thread ${t.id}: members span only one lane — threads are cross-lane by definition`);
}

if (errors.length) {
  console.error('Data validation failed:\n' + errors.map(s => '  - ' + s).join('\n'));
  process.exit(1);
}

const data = { themes: taxonomy.themes, regions: taxonomy.regions, lanes, events, threads };
const file = join(root, 'prototype', 'canvas.html');
const html = readFileSync(file, 'utf8');
const START = '// __DATA_START__', END = '// __DATA_END__';
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < 0 || b < a) {
  console.error('__DATA__ markers not found in canvas.html');
  process.exit(1);
}
const block = START + '\nconst DATA = ' + JSON.stringify(data) + ';\n' + END;
writeFileSync(file, html.slice(0, a) + block + html.slice(b + END.length));

const t1 = lanes.map(ln => {
  const n = events.filter(e => e.tier === 1 && lanesFor(e)[0] === ln).length;
  return `${ln.id}:${n}`;
}).join(' ');
console.log(`ok: ${events.length} events, ${lanes.length} lanes, ${threads.length} threads inlined · tier-1 per lane → ${t1}`);
