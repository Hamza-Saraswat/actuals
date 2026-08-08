---
name: audit
description: >-
  This skill should be used when the user wants existing metrics, dashboards, tracking plans, KPI reports, or AI ROI claims critically reviewed — e.g. "audit our metrics", "are these numbers real", "review our AI dashboard", "find vanity metrics", "is this ROI claim defensible", "sanity check this tracking plan" — including when the user pastes or attaches a dashboard export, SQL, or metrics screenshot and asks for an opinion. Also used for recurring re-audits of an existing metrics/MEASUREMENT.md spec ("re-audit", "metrics review", "metrics health check"): it then also checks spec-vs-reality drift, definition rot, stale owners and overdue calibrations, and bumps the spec version. Flags findings against a catalog of 20 named anti-patterns (self-reported time savings, minutes-times-wage dollar figures, adoption-as-impact, uncalibrated LLM judges, and more), each with severity, published evidence, and a concrete fix, then writes a dated report to metrics/audits/.
license: MIT
metadata:
  version: "0.2.0"
---

# Audit Metrics

Critically review metrics, dashboards, tracking plans, and AI ROI claims against the 20-pattern anti-pattern catalog, and produce a dated report with concrete fixes.

## Posture

Adversarial but constructive. Every metric is presumed misleading until it survives three tests:

1. **Decision-relevance** — someone would act differently at different values.
2. **Honest denominator** — includes everyone the AI was offered to; fixed window, not since-launch.
3. **Causal warrant** — the claim matches the evidence (baseline for deltas, control for causation).

Two symmetrical failures to avoid: softening a `critical` to be polite, and sneering without a fix. Every finding ships with its replacement — the fix is the point. When something survives all three tests, say so plainly; an audit that flags everything is as useless as one that flags nothing.

## Intake

Accepted inputs: CSV/JSON exports, SQL or dbt files, tracking plans, PRD metric sections, exec decks, pasted tables, screenshots (read them as ordinary images). Invocation arguments (the text after the skill name) may carry file paths and/or the word `review` to force spec-aware mode.

**Mode select:** if `metrics/MEASUREMENT.md` exists in the repo, run spec-aware mode (standalone checks PLUS the drift checks in [references/review-mode.md](references/review-mode.md)). Otherwise run standalone mode and, at the end, offer the design skill — an audit without a spec finds problems; a spec prevents them.

## Pass 1 — mechanical scan

If inputs are machine-readable files and Node is available:

```
node <skill-root>/scripts/vanity-scan.mjs <files...> --json
```

`<skill-root>` is the directory containing this SKILL.md, wherever it is installed. [scripts/vanity-scan.mjs](scripts/vanity-scan.mjs) pattern-matches the catalog's detection tokens and returns candidate findings with file/line/excerpt. **Candidates are not findings.** Adjudicate every one against context — a guardrail that tracks acceptance rate in order to distrust it is not VM-05. If Node is unavailable, skip to Pass 2; the judgment pass covers everything the scanner does, slower.

## Pass 2 — judgment pass

Read [references/anti-patterns.md](references/anti-patterns.md) in full, then test every metric, chart, and claim in the input against every pattern. For each confirmed finding record:

- **Pattern ID and name** (VM-xx)
- **Severity** — `critical` (number is wrong or unfalsifiable), `warning` (misleading without context), `info` (hygiene). Start from the catalog's default; escalate when the metric is headline-placed or feeds a named decision.
- **The evidence in THEIR artifact** — quote the row, cell, SQL line, or slide text.
- **The receipt** — the published evidence key from [references/evidence.md](references/evidence.md), staying inside what each source licenses.
- **The fix** — a concrete replacement with a formula, not "consider improving." Prefer fixes computable from data the user already has.

Also run the two absence checks, which no scanner can catch: VM-17 (no counter-metrics anywhere?) and VM-20 (metrics with no owner or statable formula?).

## Pass 3 — spec-aware extras (only when a spec exists)

Follow [references/review-mode.md](references/review-mode.md): drift between spec formulas and deployed reality, definition rot, stale owners, overdue calibrations, Claims Ledger violations. Conclude with the version bump and changelog entry it prescribes.

## The report

Fill [assets/audit-report.template.md](assets/audit-report.template.md). Mandatory sections, in order:

1. **Verdict** — one paragraph, plain language, leading with the most consequential finding.
2. **Findings by severity** — critical first, each with pattern, evidence, receipt, fix.
3. **The three numbers to delete first** — the highest-damage metrics and what replaces each.
4. **What survives** — metrics that passed, named, so trust is earned.
5. **Next actions** — ordered, assignable.

Write to `metrics/audits/YYYY-MM-DD-audit.md` (create directories as needed) after confirming with the user; if there is no repo context to write into, deliver the report inline in the same structure.

## Hand-offs

- No spec existed → offer the design skill (`/actuals:design` in Claude Code).
- Fixes require new events or queries → offer the instrument skill.
- Spec-aware run finished → offer a scorecard refresh, and restate the Next-Review date. If the environment supports scheduled tasks, offer to schedule the next audit; otherwise tell the user to calendar it.
