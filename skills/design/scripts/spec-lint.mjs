#!/usr/bin/env node
// spec-lint: validates a metrics/MEASUREMENT.md against the Actuals spec schema.
// Library: import { lintSpec } from './spec-lint.mjs'
// CLI:     node spec-lint.mjs <path/to/MEASUREMENT.md> [--json]
// Zero dependencies. Node >= 18.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STATUS_ENUM = ['draft', 'calibrating', 'active', 'stale'];
const CONFIDENCE_ENUM = ['proven', 'plausible', 'assumed'];
const ACCESS_ENUM = ['have', 'need', 'blocked'];
const REQUIRED_HEADER = ['Spec-Version', 'Status', 'Spec-Owner', 'Created', 'Last-Updated', 'Review-Cadence', 'Next-Review'];
const OM_REQUIRED_FIELDS = ['Definition', 'Formula', 'Source(s)', 'Owner', 'Baseline', 'Target', 'Confidence'];
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PLACEHOLDER_RE = /\{[^}]*\}/;

export function stripComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

export function headerFields(text) {
  const fields = {};
  for (const m of text.matchAll(/^- \*\*([A-Za-z-]+):\*\*\s*(.*)$/gm)) {
    if (!(m[1] in fields)) fields[m[1]] = { value: m[2].trim(), index: m.index };
  }
  return fields;
}

// Split into metric blocks: "### OM-1: Name" ... until next ### or ##
export function metricBlocks(text, prefix) {
  const blocks = [];
  const re = new RegExp(`^### (${prefix}-\\d+):?\\s*(.*)$`, 'gm');
  const matches = [...text.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const lineEnd = text.indexOf('\n', start);
    const searchFrom = lineEnd === -1 ? text.length : lineEnd;
    const nextHeading = text.slice(searchFrom).search(/^#{2,3} /m);
    const end = nextHeading === -1 ? text.length : searchFrom + nextHeading;
    blocks.push({ id: matches[i][1], title: matches[i][2].trim(), body: text.slice(start, end) });
  }
  return blocks;
}

export function fieldValue(block, field) {
  const esc = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = block.match(new RegExp(`^- \\*\\*${esc}:\\*\\*\\s*(.*)$`, 'm'));
  return m ? m[1].trim() : null;
}

export function section(text, headingRe) {
  const m = text.match(headingRe);
  if (!m) return null;
  const start = m.index + m[0].length;
  const next = text.slice(start).search(/^#{2,3} /m);
  return text.slice(start, next === -1 ? text.length : start + next);
}

export function lintSpec(text) {
  const errors = [];
  const warnings = [];
  const err = (code, message) => errors.push({ code, message });
  const warn = (code, message) => warnings.push({ code, message });

  const t = stripComments(text);

  // --- Header ---
  const h = headerFields(t.slice(0, t.indexOf('## 1') === -1 ? 2000 : t.indexOf('## 1')));
  for (const f of REQUIRED_HEADER) {
    if (!h[f] || h[f].value === '') err('header-missing', `Missing required header field: ${f}`);
  }
  if (h['Spec-Version'] && !SEMVER_RE.test(h['Spec-Version'].value)) {
    err('version-format', `Spec-Version must be semver (got "${h['Spec-Version'].value}")`);
  }
  if (h['Status'] && !STATUS_ENUM.includes(h['Status'].value)) {
    err('status-enum', `Status must be one of ${STATUS_ENUM.join('|')} (got "${h['Status'].value}")`);
  }
  for (const f of ['Created', 'Last-Updated', 'Next-Review']) {
    if (h[f] && h[f].value && !DATE_RE.test(h[f].value)) err('date-format', `${f} must be YYYY-MM-DD (got "${h[f].value}")`);
  }
  if (h['Spec-Owner'] && (PLACEHOLDER_RE.test(h['Spec-Owner'].value) || /^(tbd|n\/a|team|nobody)$/i.test(h['Spec-Owner'].value))) {
    err('owner-placeholder', `Spec-Owner must be a named human (got "${h['Spec-Owner'].value}") — orphan specs rot (VM-20)`);
  }

  // --- §1 The Decision ---
  const decision = section(t, /^### The Decision\s*$/m);
  if (decision === null) {
    err('decision-missing', 'Section "### The Decision" not found — it is the load-bearing field');
  } else {
    const body = decision.trim();
    if (body.length < 40) err('decision-empty', 'The Decision is empty or too thin (<40 chars) — a metric that informs no decision is decoration');
    else if (PLACEHOLDER_RE.test(body)) err('decision-placeholder', 'The Decision still contains a {placeholder}');
  }

  // --- §1 Data Inventory access values ---
  const inv = section(t, /^### Data Inventory\s*$/m);
  if (inv) {
    for (const row of inv.matchAll(/^\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|\s*$/gm)) {
      const access = row[3].trim().toLowerCase();
      if (access && !['access', '---', ''].includes(access) && !access.startsWith('-') && !ACCESS_ENUM.includes(access)) {
        warn('access-enum', `Data Inventory access "${row[3].trim()}" for source "${row[1].trim()}" is not have|need|blocked`);
      }
    }
  } else {
    warn('inventory-missing', 'No "### Data Inventory" table found in §1');
  }

  // --- §2 ---
  const northStar = section(t, /^### North star\s*$/m);
  if (northStar === null || northStar.trim().length < 5) err('north-star-missing', '§2 North star is missing or empty — link to the company\'s existing top metric');
  const assumptions = section(t, /^### Assumptions\s*$/m) || '';
  const assumptionIds = [...assumptions.matchAll(/^- (A\d+):/gm)].map((m) => m[1]);
  if (assumptionIds.length === 0) warn('assumptions-empty', '§2 has no numbered assumptions (A1, A2…) — formulas with constants will have nothing to cite');

  // --- §3 Outcome metrics ---
  const oms = metricBlocks(t, 'OM');
  if (oms.length < 3 || oms.length > 5) {
    err('om-count', `Outcome metrics: found ${oms.length}, need 3-5. Fewer forces focus; more means nobody looks at any of them`);
  }
  for (const om of oms) {
    for (const f of OM_REQUIRED_FIELDS) {
      const v = fieldValue(om.body, f);
      if (v === null || v === '') err('om-field-missing', `${om.id} is missing field "${f}"`);
      else if (PLACEHOLDER_RE.test(v)) err('om-field-placeholder', `${om.id} field "${f}" still contains a {placeholder}`);
    }
    const conf = fieldValue(om.body, 'Confidence');
    if (conf && !CONFIDENCE_ENUM.includes(conf.split(/\s/)[0])) {
      err('confidence-enum', `${om.id} Confidence must be ${CONFIDENCE_ENUM.join('|')} (got "${conf}")`);
    }
    const formula = fieldValue(om.body, 'Formula') || '';
    if (/\$\s*\d/.test(formula) && !/A\d+/.test(om.body)) {
      warn('dollar-no-assumption', `${om.id} formula contains a dollar constant with no A-number assumption reference — the no-fake-dollars rule (VM-02)`);
    }
  }

  // --- §4 Guardrails ---
  const gms = metricBlocks(t, 'GM');
  const guarded = new Set();
  for (const gm of gms) {
    for (const m of gm.body.matchAll(/guards\s+(OM-\d+)/gi)) guarded.add(m[1].toUpperCase());
    if (!fieldValue(gm.body, 'Tripwire')) warn('tripwire-missing', `${gm.id} has no Tripwire — a guardrail without a threshold is a chart, not a guardrail`);
  }
  for (const om of oms) {
    if (!guarded.has(om.id)) warn('om-unguarded', `${om.id} has no guardrail metric ("guards ${om.id}") — ask what a cynic would say got worse (VM-17)`);
  }

  // --- §5 Evals ---
  const evs = metricBlocks(t, 'EV');
  const omIds = new Set(oms.map((o) => o.id));
  for (const ev of evs) {
    const maps = fieldValue(ev.body, 'Maps-To-Outcome');
    if (!maps) err('eval-unmapped', `${ev.id} has no Maps-To-Outcome — an unmapped eval in reporting is VM-11`);
    else if (!omIds.has(maps.split(/[,\s]/)[0])) err('eval-bad-mapping', `${ev.id} maps to "${maps}" which is not a defined outcome metric`);
    if (!fieldValue(ev.body, 'Calibration')) warn('eval-no-calibration', `${ev.id} has no Calibration line — an uncalibrated judge is VM-12`);
  }

  // --- §6 / §7 ---
  if (!/^## 6\./m.test(t)) warn('vanity-section-missing', 'No §6 "Vanity Metrics We Will Not Use" — the pre-commitment table is half the point');
  if (!/^## 7\./m.test(t)) err('claims-ledger-missing', 'No §7 Claims Ledger — nothing records what cannot be claimed yet (VM-14)');

  // --- §9 Changelog vs Last-Updated ---
  const changelog = section(t, /^## 9\.[^\n]*$/m) || '';
  const lastUpdated = h['Last-Updated']?.value;
  if (lastUpdated && DATE_RE.test(lastUpdated) && !changelog.includes(lastUpdated)) {
    err('changelog-stale', `Last-Updated is ${lastUpdated} but §9 Changelog has no entry for that date — silent edits are definition rot (VM-18)`);
  }
  const specVersion = h['Spec-Version']?.value;
  if (specVersion && SEMVER_RE.test(specVersion) && !changelog.includes(specVersion)) {
    warn('changelog-version', `Spec-Version ${specVersion} has no matching §9 Changelog entry`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ---------------- CLI ----------------
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter((a) => a !== '--json');
  if (files.length !== 1) {
    console.error('Usage: node spec-lint.mjs <path/to/MEASUREMENT.md> [--json]');
    process.exit(2);
  }
  let text;
  try {
    text = readFileSync(files[0], 'utf8');
  } catch (e) {
    console.error(`Cannot read ${files[0]}: ${e.message}`);
    process.exit(2);
  }
  const result = lintSpec(text);
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const e of result.errors) console.log(`ERROR   [${e.code}] ${e.message}`);
    for (const w of result.warnings) console.log(`warning [${w.code}] ${w.message}`);
    console.log(result.valid ? `\nOK — spec passes (${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'})` : `\nFAIL — ${result.errors.length} error(s), ${result.warnings.length} warning(s)`);
  }
  process.exit(result.valid ? 0 : 1);
}
