#!/usr/bin/env node
// vanity-scan: mechanical pass that flags CANDIDATE vanity-metric findings by
// pattern-matching the detection tokens of the Actuals anti-pattern catalog
// (skills/audit/references/anti-patterns.md). Candidates are not findings —
// the audit skill adjudicates each one in context.
// Library: import { scanText, scanFiles, RULES } from './vanity-scan.mjs'
// CLI:     node vanity-scan.mjs <files...> [--json]
// Zero dependencies. Node >= 18.

import { readFileSync } from 'node:fs';

// Line-level rules: any regex hit on a line raises a candidate.
export const RULES = [
  { id: 'VM-01', name: 'Self-Reported Time Savings', severity: 'critical', res: [
    /\b(hours?|hrs?|min(?:ute)?s?|time)\s+saved\b/i,
    /\bsav(?:ed|ing|ings)\b.{0,24}\b(hours?|hrs?|minutes?)\b/i,
    /\bself[- ]reported\b/i,
    /\b(report|estimate)\w*\s+saving\b/i,
  ]},
  { id: 'VM-02', name: 'Minutes-times-Wage Dollarization', severity: 'critical', res: [
    /\$\s*\d+(?:\.\d+)?\s*(?:\/|per\s*)\s*(?:hr|hour)\b/i,
    /\b(?:minutes?|hours?|hrs?)\s*[×x*]\s*\$?\s*\d+/i,
    /[×x*]\s*\$\s*\d+/i,
    /\bassisted\s+value\b/i,
    /\bestimated\s+(?:value|savings)\s*:?\s*\$/i,
  ]},
  { id: 'VM-03', name: 'Adoption-as-Impact', severity: 'warning', res: [
    /\badoption\s+rate\b/i,
    /\b\d{1,3}\s*%\s*(?:of\s+\w+\s+)?(?:team|org|company|employees|devs|developers|agents|staff)?\s*(?:now\s+)?(?:use|using|adopted|onboarded)\b/i,
    /\b(?:seats?|licenses?)\s+(?:active|assigned|utilized)\b/i,
    /\blicense\s+utilization\b/i,
  ]},
  { id: 'VM-04', name: 'Activity Volume Proxy', severity: 'warning', res: [
    /\b(?:PRs?|pull\s+requests?|commits?|messages?|completions?|queries|chats?|conversations?|tickets?)\s+(?:per|\/)\s*(?:dev|developer|agent|user|day|week)\b/i,
    /\b\d+(?:\.\d+)?\s*[×x]\s+more\s+(?:PRs?|messages?|chats?|output|code)\b/i,
    /\b(?:queries|chats?|conversations?|requests?|actions?)\s+(?:processed|handled|generated)\b/i,
  ]},
  { id: 'VM-05', name: 'Acceptance-Rate Theater', severity: 'warning', res: [
    /\baccept(?:ance)?\s+rate\b/i,
    /\bsuggestions?\s+accepted\b/i,
    /\blines?\s+(?:of\s+)?(?:AI\s+)?code\s+accepted\b/i,
  ]},
  { id: 'VM-06', name: 'Denominator-Free Count', severity: 'warning', res: [
    /\btotal\s+(?:\w+\s+){0,2}(?:chats?|conversations?|queries|messages?|actions?|sessions?|users?|tickets?|completions?|requests?)\b/i,
    /\b\d{1,3}(?:,\d{3})+\s+(?:chats?|conversations?|queries|messages?|actions?|interactions?|completions?)\b/i,
    /\b\d+(?:\.\d+)?\s*[MKmk]\b\s+(?:completions?|conversations?|queries|messages?|chats?|since)/i,
  ]},
  { id: 'VM-07', name: 'Double-Counted Value', severity: 'critical', res: [
    /\bcombined\s+(?:savings|impact|value)\b/i,
    /\btotal\s+(?:savings|impact)\s+across\b/i,
  ]},
  { id: 'VM-08', name: 'Cumulative-Ever Metric', severity: 'warning', res: [
    /\bsince\s+(?:launch|rollout|go[- ]live|inception|day\s+one)\b/i,
    /\ball[- ]time\b/i,
    /\bcumulative\b/i,
    /\bto[- ]date\b/i,
    /\blifetime\s+(?:total|value|count|usage)\b/i,
  ]},
  { id: 'VM-09', name: 'Peak Cherry-Pick', severity: 'warning', res: [
    /\b(?:best|peak|record)\s+(?:week|month|day|team|quarter)\b/i,
    /\bup\s+to\s+\d{1,3}\s*%/i,
    /\bhit\s+\d{1,3}\s*%\b.{0,30}\(week/i,
  ]},
  { id: 'VM-10', name: 'Survivor-Only Funnel', severity: 'critical', res: [
    /\b(?:among|of)\s+(?:active|retained|power|engaged)\s+users\b/i,
    /\bexclud(?:es?|ing|ed)\s+(?:churned|inactive|abandoned|disabled)\b/i,
    /\bchurned\s*=\s*(?:false|0)\b/i,
    /\bactive\s+users\s+only\b/i,
  ]},
  { id: 'VM-11', name: 'Eval-Pass-Rate as Business Value', severity: 'critical', res: [
    /\beval\s+pass(?:\s+rate)?\b/i,
    /\b\d{1,3}\s*%\s+(?:eval\s+)?pass\s+rate\b/i,
    /\bquality\s+score\b.{0,30}\b(?:roi|value|impact)\b/i,
  ]},
  { id: 'VM-12', name: 'Uncalibrated LLM Judge', severity: 'critical', fileLevel: true, res: [
    /\bllm[- ]judge\b/i, /\bjudge\s+scores?\b/i, /\bautograd/i, /\bgpt[- ]?graded\b/i, /\bai[- ]graded\b/i,
  ], absentRes: [/\bagreement\b/i, /\bcalibrat/i, /\bkappa\b/i] },
  { id: 'VM-13', name: 'Pilot-to-Enterprise Extrapolation', severity: 'critical', res: [
    /\bannualiz/i,
    /\bextrapolat/i,
    /[×x*]\s*52\b/,
    /\b(?:across|for)\s+all\s+\d*\s*(?:devs?|developers|employees|agents|users|staff)\b/i,
    /\bcompany[- ]wide\b.{0,40}\b(?:equals?|would|project)/i,
  ]},
  { id: 'VM-14', name: 'Baseline-Free Delta', severity: 'critical', fileLevel: false, res: [
    /\b(?:improv|reduc|increas|decreas|cut|dropp?)\w*\s+(?:by\s+)?\d{1,3}\s*%/i,
    /\b\d{1,3}\s*%\s+(?:faster|slower|better|fewer|more|less)\b/i,
  ], absentRes: [/\bbaseline\b/i, /\bpre[- ](?:launch|period|deploy)/i, /\bcontrol\s+group\b/i, /\bholdout\b/i] },
  { id: 'VM-15', name: 'Correlation Dressed as Causation', severity: 'warning', res: [
    /\b(?:users?|devs?|developers|agents|teams)\s+(?:who|that)\s+use[ds]?\b.{0,40}\b(?:\d{1,3}\s*%|more|faster|higher)\b/i,
    /\b(?:AI|copilot|assistant)\s+users\s+(?:are|ship|close|resolve|merge)\b/i,
    /\badopters\s+(?:are|show|have)\b/i,
  ]},
  { id: 'VM-16', name: 'Sentiment-as-Outcome', severity: 'warning', res: [
    /\bNPS\b/,
    /\bsatisfaction\s+(?:score|rate|is)\b/i,
    /\b(?:love|loving)\s+(?:it|the\s+tool|the\s+ai)\b/i,
    /\bsentiment\b/i,
  ]},
  { id: 'VM-17', name: 'Missing Counter-Metric', severity: 'warning', wholeFile: true,
    minNumericLines: 5,
    absentRes: [/\breview\s+time\b/i, /\brework\b/i, /\bdefect/i, /\berror\s+rate\b/i, /\bcomplaint/i, /\bescalat/i, /\breopen/i, /\bcost\b/i, /\bguardrail/i, /\btripwire\b/i] },
  { id: 'VM-18', name: 'Definition Rot', severity: 'critical', res: [
    /\b(?:now\s+counts?|redefined|updated\s+methodology|we\s+now\s+(?:count|measure|define))\b/i,
    /\bas\s+of\s+\w+\s+\d{0,4},?\s+(?:we\s+)?(?:count|measure|include|exclude)/i,
  ]},
  { id: 'VM-19', name: 'Composite Value-Score Opacity', severity: 'warning', res: [
    /\b(?:productivity|value|impact|ai)\s+(?:index|score)\b\s*[:=]?\s*\d/i,
    /\bweighted\s+(?:composite|score|index)\b/i,
    /\bcomposite\s+(?:score|metric|index)\b/i,
  ]},
  { id: 'VM-20', name: 'Orphan Metric', severity: 'info', res: [
    /\bowner\s*[:,]?\s*(?:tbd|n\/a|none|\?|unassigned)\b/i,
    /(?:^|,)\s*(?:tbd|n\/a)\s*(?:,|$)/i,
  ]},
];

const EXCERPT_MAX = 120;

export function scanText(text, file = '(input)') {
  const findings = [];
  const lines = text.split(/\r?\n/);
  const whole = text;

  const numericLines = lines.filter((l) => /\d/.test(l)).length;

  for (const rule of RULES) {
    // Whole-file absence rules (VM-17): fires when the doc is metric-dense but no counter-metric token exists.
    if (rule.wholeFile) {
      if (numericLines >= (rule.minNumericLines ?? 5) && rule.absentRes.every((re) => !re.test(whole))) {
        findings.push({ patternId: rule.id, name: rule.name, severity: rule.severity, file, line: 0,
          excerpt: `document has ${numericLines} numeric lines and no counter-metric/guardrail token anywhere` });
      }
      continue;
    }
    // Presence rules, optionally gated on absence of exculpatory tokens elsewhere in the file (VM-12, VM-14).
    const exculpated = rule.absentRes ? rule.absentRes.some((re) => re.test(whole)) : false;
    if (rule.absentRes && exculpated) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      for (const re of rule.res) {
        if (re.test(line)) {
          findings.push({ patternId: rule.id, name: rule.name, severity: rule.severity, file, line: i + 1,
            excerpt: line.trim().slice(0, EXCERPT_MAX) });
          break; // one candidate per rule per line
        }
      }
    }
  }

  // Dedupe identical (id, line) pairs, keep first.
  const seen = new Set();
  return findings.filter((f) => {
    const key = `${f.patternId}:${f.file}:${f.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function scanFiles(paths) {
  const all = [];
  for (const p of paths) {
    const text = readFileSync(p, 'utf8');
    all.push(...scanText(text, p));
  }
  return all;
}

// ---------------- CLI ----------------
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter((a) => a !== '--json');
  if (files.length === 0) {
    console.error('Usage: node vanity-scan.mjs <files...> [--json]');
    process.exit(2);
  }
  let findings;
  try {
    findings = scanFiles(files);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  if (json) {
    console.log(JSON.stringify({ candidates: findings, note: 'Candidates, not findings — adjudicate each in context.' }, null, 2));
  } else {
    if (findings.length === 0) {
      console.log('No candidates flagged. (The judgment pass can still find what regexes cannot.)');
    } else {
      let currentFile = null;
      for (const f of findings) {
        if (f.file !== currentFile) { currentFile = f.file; console.log(`\n${f.file}`); }
        console.log(`  ${f.patternId} ${f.severity.padEnd(8)} L${String(f.line).padStart(4)}  ${f.name}: ${f.excerpt}`);
      }
      console.log(`\n${findings.length} candidate(s). Candidates are not findings — adjudicate each in context.`);
    }
  }
  process.exit(0);
}
