---
name: design
description: This skill should be used when the user wants to design business-outcome metrics for an AI product, tool, or feature — e.g. "what should we measure", "design our AI metrics", "create a measurement spec", "define success metrics for our AI feature", "how do we prove our AI's ROI". It runs a structured interview (what the AI does, who benefits, business model, what decision the metrics must inform, what data exists), then writes a versioned metrics/MEASUREMENT.md spec containing north-star linkage, 3-5 outcome metrics with formula, data source, owner and confidence level, guardrail counter-metrics, eval-to-outcome mapping, an explicit vanity-metrics-to-avoid list, attribution limits ("what you cannot claim without a baseline"), and a review and calibration cadence. Not for critiquing existing dashboards (use the audit skill) and not for generic product-analytics setup.
version: 0.1.0
license: MIT
---

# Design a Measurement Spec

Turn a plain-English description of an AI tool or feature into a defensible measurement system, written to `metrics/MEASUREMENT.md` in the user's repo.

## Contract

- The output is a spec in the exact format of [assets/MEASUREMENT.template.md](assets/MEASUREMENT.template.md) — field labels are parse-exact; downstream tools (`spec-lint`, the audit skill, the scorecard renderer) depend on them.
- The spec starts at version `0.1.0`, status `draft`. It earns `calibrating` after instrumentation exists and `active` only after a first calibration pass against real data. Say this to the user up front: **the spec is a living document. Criteria drift is real** — grading real outputs changes what you think matters (documented in the EvalGen research, cited in the catalog's VM-12). The plan is to iterate on schedule, not to be right on day one.
- Never fabricate values. Unknown baselines are written as "not yet measured — see CL-x", never as guesses.

## Pre-flight

1. Check for an existing `metrics/MEASUREMENT.md`. If present, DO NOT clobber it — switch to update mode: read it, ask what changed, apply edits with a changelog entry and the right version bump (patch = statuses/owners, minor = metric added/changed, major = north star or Decision changed).
2. If the user's real request is "are our current metrics any good?", that is the audit skill's job (`/actuals:audit` where available) — offer it and stop.
3. `$ARGUMENTS`, if provided, names the product/feature — use it to seed the interview.
4. If the repo has obvious context (README, PRD, analytics config), read it first and confirm inferences instead of asking cold questions.

## Headless mode (no interactive user)

When no user can answer questions (CI, scheduled runs, `-p` sessions): derive the interview answers from the repo's own documentation instead. Treat every derived answer as an assumption and log all of them — with source and a risk note — in a section titled `## Interview assumptions (headless run)` appended after §9. Mark the load-bearing guesses (especially The Decision) as high-risk and name what would confirm them. Never fabricate baselines; targets proposed without an owner are labeled proposals. The resulting spec stays `draft` until a human reviews the assumptions.

## The interview

Run five phases. Rules of engagement (full question bank and branch logic: [references/interview-guide.md](references/interview-guide.md)):

- **One question at a time.** Never send a questionnaire wall.
- **Mirror back** what was heard before moving phases ("So: Ava answers tier-1 tickets so the 6-person support team stays flat while accounts grow — right?").
- **Push back on vague answers.** "We want to measure engagement" gets probed: engagement doing what, for whom, feeding which decision?
- Adapt depth to the user: a founder gets plainer language than a data lead. Skip questions already answered by repo context.

### Phase 1 — Business context
What the AI does (2-3 sentences), who benefits (persona + count), how money moves. For internal tools: which budget feels the impact.

### Phase 2 — The Decision
The load-bearing question: **"What will be done differently at different values of these metrics?"** Expand seats or roll back? Renew the license or cut it? Hire fewer agents or keep hiring? If no decision can be named, say plainly: metrics that inform no decision are decoration, and the interview should pause until a real decision exists. Do not proceed to metrics without a Decision.

### Phase 3 — Data inventory
What sources exist (product analytics, billing, support platform, warehouse, eval logs), what each holds, and access status: `have | need | blocked`. Do not design metrics that require data nobody can get without marking the dependency honestly.

### Phase 4 — Draft-metrics workshop
Propose 3-5 outcome metrics and their guardrails using the method in [references/metric-design-principles.md](references/metric-design-principles.md): place each metric on the causal chain (AI feature → behavior change → driver → north star), one metric per link that the Decision needs. For every outcome metric ask the cynic's question — "what would a cynic say got worse?" — and add that as the guardrail. Iterate with the user; five metrics maximum, and fewer is better.

### Phase 5 — Anti-vanity pass
Walk the metrics the user *instinctively* wanted (adoption! hours saved! NPS!) against the catalog at [../audit/references/anti-patterns.md](../audit/references/anti-patterns.md). Each rejected metric goes in the spec's §6 table with its VM-id and what replaces it — pre-commitment against future exec pressure. If the catalog file cannot be read (standalone install, restricted session), apply the short test from the principles reference — decision-relevance, honest denominator, causal warrant — and **never cite a numeric VM-id that was not verified against the catalog**: use plain-language pattern names or local labels (VM-A, VM-B…) instead, and log the limitation as an assumption. A fabricated citation is the catalog's own definition-rot sin.

## Drafting the spec

1. Copy the structure of [assets/MEASUREMENT.template.md](assets/MEASUREMENT.template.md) exactly. Fill every section; delete guidance comments.
2. Every outcome metric carries all eight fields. A field that cannot be filled honestly gets the honest value (`Baseline: not yet measured — see CL-1`) and `Confidence: assumed`.
3. **The no-fake-dollars rule:** no dollar figure anywhere in the spec unless every constant in its formula appears as a numbered assumption in §2 — and prefer no dollar figure at all (the reasoning and the Microsoft cautionary tale are in [references/metric-design-principles.md](references/metric-design-principles.md)).
4. The Claims Ledger (§7) gets one row per claim the user *wants* to make ("the AI reduced cost") with the evidence that would license it (baseline, holdout, experiment) and status `blocked` until it exists.
5. §8 schedules the recurring audit (monthly default) and the first calibration pass (grade ~30 real outputs at week 2).

## Lint and write

1. If Node is available, validate: `node <skill-root>/scripts/spec-lint.mjs metrics/MEASUREMENT.md` — fix every error it reports ([scripts/spec-lint.mjs](scripts/spec-lint.mjs) checks required fields, metric counts, eval mappings, changelog consistency). If Node is unavailable, verify manually against the template's starred fields.
2. Show the user the final draft. On confirmation, write to `metrics/MEASUREMENT.md` (create the `metrics/` directory if needed).

## Hand-offs

Offer, in order:
- **Instrument it** — turn the spec into events, SQL, and an eval harness (the instrument skill / `/actuals:instrument`).
- **Connect sources** — wire up anything marked `need` in the Data Inventory (the connect skill / `/actuals:connect`).
- **Render the scorecard** — a shareable `metrics/dashboard.html` (the scorecard skill / `/actuals:scorecard`).
- **Schedule the re-audit** — if the environment supports scheduled or recurring tasks, schedule a monthly `/actuals:audit`; otherwise tell the user to calendar it. The Next-Review date in the spec header is the commitment either way.
