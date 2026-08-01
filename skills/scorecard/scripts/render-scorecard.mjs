#!/usr/bin/env node
// render-scorecard: deterministic renderer — MEASUREMENT.md (+ latest audit report)
// → self-contained metrics/dashboard.html. Recorded values only; no live queries.
// CLI: node render-scorecard.mjs [specPath] [--audits-dir <dir>] [--out <file>] [--quiet]
// Zero dependencies. Node >= 18. Parsing reused from spec-lint (one source of truth).

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripComments, headerFields, metricBlocks, fieldValue, section, lintSpec } from '../../design/scripts/spec-lint.mjs';

const VERSION = '0.1.0';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tableRows(sectionText) {
  if (!sectionText) return [];
  const rows = [];
  for (const line of sectionText.split('\n')) {
    const m = line.match(/^\|(.+)\|\s*$/);
    if (!m) continue;
    const cells = m[1].split('|').map((c) => c.trim());
    if (cells.every((c) => /^[-: ]*$/.test(c))) continue; // separator row
    rows.push(cells);
  }
  return rows;
}

export function parseSpec(text) {
  const t = stripComments(text);
  const h = headerFields(t.slice(0, t.indexOf('## 1') === -1 ? 2000 : t.indexOf('## 1')));
  const title = (t.match(/^# Measurement Spec:\s*(.*)$/m) || [, 'Measurement Spec'])[1].trim();
  const get = (k) => h[k]?.value ?? '';
  const metricFields = (b) => ({
    id: b.id,
    title: b.title.replace(/\(guards[^)]*\)/i, '').trim(),
    guards: [...b.body.matchAll(/guards\s+(OM-\d+)/gi)].map((m) => m[1].toUpperCase()),
    definition: fieldValue(b.body, 'Definition'),
    formula: fieldValue(b.body, 'Formula'),
    sources: fieldValue(b.body, 'Source(s)'),
    owner: fieldValue(b.body, 'Owner'),
    baseline: fieldValue(b.body, 'Baseline'),
    target: fieldValue(b.body, 'Target'),
    tripwire: fieldValue(b.body, 'Tripwire'),
    confidence: (fieldValue(b.body, 'Confidence') || '').split(/\s/)[0],
    instrumentation: fieldValue(b.body, 'Instrumentation-Status'),
    method: fieldValue(b.body, 'Method'),
    mapsTo: fieldValue(b.body, 'Maps-To-Outcome'),
    calibration: fieldValue(b.body, 'Calibration'),
    grades: fieldValue(b.body, 'Grades'),
  });
  return {
    title,
    version: get('Spec-Version'),
    status: get('Status'),
    owner: get('Spec-Owner'),
    lastUpdated: get('Last-Updated'),
    cadence: get('Review-Cadence'),
    nextReview: get('Next-Review'),
    decision: (section(t, /^### The Decision\s*$/m) || '').trim(),
    northStar: (section(t, /^### North star\s*$/m) || '').trim(),
    chain: (section(t, /^### Causal chain\s*$/m) || '').trim(),
    oms: metricBlocks(t, 'OM').map(metricFields),
    gms: metricBlocks(t, 'GM').map(metricFields),
    evs: metricBlocks(t, 'EV').map(metricFields),
    vanity: tableRows(section(t, /^## 6\.[^\n]*$/m)).filter((r) => !/^tempting/i.test(r[0])),
    claims: tableRows(section(t, /^## 7\.[^\n]*$/m)).filter((r) => !/^id$/i.test(r[0])),
    changelog: [...(section(t, /^## 9\.[^\n]*$/m) || '').matchAll(/^- (.+)$/gm)].map((m) => m[1]),
  };
}

export function parseLatestAudit(auditsDir) {
  if (!auditsDir || !existsSync(auditsDir)) return null;
  const files = readdirSync(auditsDir).filter((f) => f.endsWith('.md')).sort();
  if (files.length === 0) return null;
  const file = files[files.length - 1];
  const text = readFileSync(join(auditsDir, file), 'utf8');
  const findings = [...text.matchAll(/^### \d+\.\s*(VM-\d+)[^\n—]*·?\s*([^\n—]*)—\s*(critical|warning|info)/gm)]
    .map((m) => ({ id: m[1], name: m[2].replace(/·/g, '').trim(), severity: m[3] }));
  const verdict = (section(text, /^## Verdict\s*$/m) || '').trim().split('\n')[0] || '';
  return { file, findings, verdict };
}

const BADGE = {
  draft: '#8b8fa3', calibrating: '#c78a1d', active: '#2e9e5b', stale: '#c2453a',
  proven: '#2e9e5b', plausible: '#c78a1d', assumed: '#8b8fa3',
  critical: '#c2453a', warning: '#c78a1d', info: '#4a7dbd',
  live: '#2e9e5b', staged: '#c78a1d', none: '#8b8fa3',
};
const badge = (v) => v ? `<span class="badge" style="--b:${BADGE[String(v).toLowerCase()] || '#8b8fa3'}">${esc(v)}</span>` : '';

function metricCard(m, isGuardrail) {
  const rows = [
    m.definition && `<p class="def">${esc(m.definition)}</p>`,
    m.formula && `<div class="kv"><span>Formula</span><code>${esc(m.formula)}</code></div>`,
    `<div class="vals"><div><span>Baseline</span><strong>${esc(m.baseline || '—')}</strong></div><div><span>${isGuardrail ? 'Tripwire' : 'Target'}</span><strong>${esc((isGuardrail ? m.tripwire : m.target) || '—')}</strong></div></div>`,
    `<div class="meta">${badge(m.confidence)}${m.instrumentation ? badge(m.instrumentation) : ''}${m.owner ? `<span class="owner">${esc(m.owner)}</span>` : ''}${isGuardrail && m.guards.length ? `<span class="owner">guards ${esc(m.guards.join(', '))}</span>` : ''}</div>`,
  ].filter(Boolean).join('');
  return `<article class="card"><h3><span class="mid">${esc(m.id)}</span> ${esc(m.title)}</h3>${rows}</article>`;
}

export function renderHtml(spec, audit, generatedOn) {
  const findingCounts = { critical: 0, warning: 0, info: 0 };
  for (const f of audit?.findings ?? []) findingCounts[f.severity] = (findingCounts[f.severity] || 0) + 1;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Scorecard — ${esc(spec.title)}</title>
<style>
:root{--bg:#f6f6f4;--panel:#ffffff;--ink:#1b1d24;--mut:#6a6f7f;--line:#e3e2dc;--acc:#2e5c9e}
@media (prefers-color-scheme:dark){:root{--bg:#14161c;--panel:#1d2027;--ink:#e8e8e3;--mut:#9aa0ae;--line:#2c2f38;--acc:#7ba3dd}}
*{box-sizing:border-box;margin:0}
body{font:15px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--ink);padding:2.5rem 1.25rem 4rem;max-width:1060px;margin:0 auto}
header h1{font-size:1.45rem;letter-spacing:-.01em}
header .sub{color:var(--mut);margin-top:.35rem;display:flex;gap:.9rem;flex-wrap:wrap;align-items:center;font-size:.9rem}
.badge{display:inline-block;padding:.1rem .55rem;border-radius:99px;font-size:.75rem;font-weight:600;color:#fff;background:var(--b);vertical-align:middle}
section{margin-top:2.2rem}
h2{font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin-bottom:.8rem}
.decision,.verdict{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--acc);border-radius:8px;padding:1rem 1.2rem;white-space:pre-wrap}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:.9rem}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:1rem 1.1rem}
.card h3{font-size:.98rem;margin-bottom:.5rem}
.mid{color:var(--acc);font-family:ui-monospace,monospace;font-size:.8rem;font-weight:700;margin-right:.15rem}
.def{color:var(--mut);font-size:.88rem;margin-bottom:.6rem}
.kv{font-size:.82rem;margin:.4rem 0;color:var(--mut)}
.kv span{display:block;text-transform:uppercase;font-size:.68rem;letter-spacing:.06em}
.kv code{color:var(--ink);word-break:break-word;font-size:.8rem}
.vals{display:flex;gap:1.6rem;margin:.6rem 0}
.vals span{display:block;text-transform:uppercase;font-size:.68rem;letter-spacing:.06em;color:var(--mut)}
.vals strong{font-size:.92rem;font-weight:600}
.meta{display:flex;gap:.45rem;flex-wrap:wrap;align-items:center;margin-top:.55rem}
.owner{font-size:.75rem;color:var(--mut)}
table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;font-size:.86rem}
th,td{padding:.55rem .8rem;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--mut)}
tr:last-child td{border-bottom:none}
.tablewrap{overflow-x:auto}
.counts{display:flex;gap:.6rem;margin-bottom:.8rem}
.findings li{margin:.3rem 0 .3rem 1.1rem;font-size:.9rem}
.changelog li{margin:.25rem 0 .25rem 1.1rem;color:var(--mut);font-size:.86rem}
footer{margin-top:3rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--mut);font-size:.8rem}
</style>
</head>
<body>
<header>
  <h1>${esc(spec.title)}</h1>
  <div class="sub">
    ${badge(spec.status)}
    <span>spec v${esc(spec.version)}</span>
    <span>owner: ${esc(spec.owner)}</span>
    <span>updated ${esc(spec.lastUpdated)}</span>
    <span>next review ${esc(spec.nextReview)}</span>
  </div>
</header>

<section>
  <h2>The Decision these metrics inform</h2>
  <div class="decision">${esc(spec.decision) || '—'}</div>
</section>

${spec.northStar ? `<section><h2>North star</h2><div class="decision" style="border-left-color:#2e9e5b">${esc(spec.northStar)}${spec.chain ? `\n\n${esc(spec.chain)}` : ''}</div></section>` : ''}

<section>
  <h2>Outcome metrics</h2>
  <div class="grid">${spec.oms.map((m) => metricCard(m, false)).join('')}</div>
</section>

<section>
  <h2>Guardrails</h2>
  <div class="grid">${spec.gms.map((m) => metricCard(m, true)).join('')}</div>
</section>

${spec.evs.length ? `<section><h2>Eval layer</h2><div class="tablewrap"><table><tr><th>Eval</th><th>Grades</th><th>Method</th><th>Maps to</th><th>Calibration</th></tr>${spec.evs.map((e) => `<tr><td><span class="mid">${esc(e.id)}</span> ${esc(e.title)}</td><td>${esc(e.grades || '—')}</td><td>${esc(e.method || '—')}</td><td>${esc(e.mapsTo || '—')}</td><td>${esc(e.calibration || '—')}</td></tr>`).join('')}</table></div></section>` : ''}

<section>
  <h2>Latest audit${audit ? ` — ${esc(audit.file)}` : ''}</h2>
  ${audit ? `
  <div class="counts">${['critical', 'warning', 'info'].filter((s) => findingCounts[s]).map((s) => `<span class="badge" style="--b:${BADGE[s]}">${findingCounts[s]} ${s}</span>`).join('') || '<span class="badge" style="--b:#2e9e5b">no open findings</span>'}</div>
  ${audit.verdict ? `<div class="verdict">${esc(audit.verdict)}</div>` : ''}
  ${audit.findings.length ? `<ul class="findings">${audit.findings.map((f) => `<li><span class="mid">${esc(f.id)}</span> ${esc(f.name)} ${badge(f.severity)}</li>`).join('')}</ul>` : ''}
  ` : '<div class="decision" style="border-left-color:#8b8fa3">No audits recorded yet. Run the audit skill to populate this section.</div>'}
</section>

${spec.vanity.length ? `<section><h2>Vanity metrics this team will not use</h2><div class="tablewrap"><table><tr><th>Tempting metric</th><th>Pattern</th><th>Why it lies here</th><th>Instead</th></tr>${spec.vanity.map((r) => `<tr>${r.slice(0, 4).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div></section>` : ''}

${spec.claims.length ? `<section><h2>Claims ledger</h2><div class="tablewrap"><table><tr><th>ID</th><th>Desired claim</th><th>Required evidence</th><th>Status</th></tr>${spec.claims.map((r) => `<tr>${r.slice(0, 4).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div></section>` : ''}

${spec.changelog.length ? `<section><h2>Changelog</h2><ul class="changelog">${spec.changelog.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></section>` : ''}

<footer>Renders recorded values only — no live data queries. Generated ${esc(generatedOn)} by Actuals scorecard v${VERSION} from spec v${esc(spec.version)}.</footer>
</body>
</html>`;
}

// ---------------- CLI ----------------
const USAGE = 'Usage: node render-scorecard.mjs [specPath] [--audits-dir <dir>] [--out <file>] [--quiet]';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }
  const KNOWN_FLAGS = ['--audits-dir', '--out', '--quiet'];
  const VALUE_FLAGS = ['--audits-dir', '--out'];
  const unknown = args.filter((a, i) => a.startsWith('-') && !KNOWN_FLAGS.includes(a) && !VALUE_FLAGS.includes(args[i - 1]));
  if (unknown.length) {
    console.error(`Unknown option(s): ${unknown.join(', ')}\n${USAGE}`);
    process.exit(2);
  }
  const getOpt = (name, dflt) => {
    const i = args.indexOf(name);
    return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
  };
  const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--audits-dir' && args[i - 1] !== '--out');
  const specPath = positional[0] || 'metrics/MEASUREMENT.md';
  const auditsDir = getOpt('--audits-dir', join(dirname(specPath), 'audits'));
  const out = getOpt('--out', join(dirname(specPath), 'dashboard.html'));

  let text;
  try {
    text = readFileSync(specPath, 'utf8');
  } catch (e) {
    console.error(`Cannot read spec at ${specPath}: ${e.message}`);
    process.exit(2);
  }
  const lint = lintSpec(text);
  if (!lint.valid) {
    console.error(`Spec has ${lint.errors.length} lint error(s) — rendering anyway, but fix them:`);
    for (const er of lint.errors) console.error(`  [${er.code}] ${er.message}`);
  }
  const spec = parseSpec(text);
  const audit = parseLatestAudit(auditsDir);
  const html = renderHtml(spec, audit, new Date().toISOString().slice(0, 10));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  if (!args.includes('--quiet')) {
    console.log(`Scorecard written: ${out} (spec v${spec.version}, ${spec.oms.length} outcome / ${spec.gms.length} guardrail metrics${audit ? `, audit ${audit.file}` : ', no audits yet'})`);
  }
}
