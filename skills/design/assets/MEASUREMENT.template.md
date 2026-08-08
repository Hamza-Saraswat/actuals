# Measurement Spec: {product or AI feature name}

<!--
This file is the single source of truth for how this AI tool/feature is measured.
It is versioned, owned, and audited. Format is validated by spec-lint
(skills/design/scripts/spec-lint.mjs). Keep the field labels exactly as written —
tools parse them. Guidance comments like this one can be deleted once filled in.
-->

- **Spec-Version:** 0.1.0 <!-- semver. patch = statuses/owners, minor = metric added/changed, major = north star or Decision changed -->
- **Status:** draft <!-- draft | calibrating | active | stale. Stays draft until the first calibration pass against real data. -->
- **Spec-Owner:** {named human} <!-- a person, not a team. Orphan specs rot (VM-20). -->
- **Created:** {YYYY-MM-DD}
- **Last-Updated:** {YYYY-MM-DD} <!-- must have a matching entry in §9 Changelog -->
- **Review-Cadence:** monthly <!-- how often the Actuals audit skill re-runs -->
- **Next-Review:** {YYYY-MM-DD}

## 1. Business Context

### What the AI does
<!-- 2–3 sentences, plain English. What does it do, for whom, inside what product/workflow? -->

### Who benefits
<!-- Persona + rough count. "Support agents (6)" beats "the team". -->

### Business model
<!-- How money moves. Per-seat SaaS? Usage-based? Internal cost center? This decides which outcomes are real. -->

### The Decision
<!--
THE LOAD-BEARING FIELD. What will you do differently at different values of these
metrics? Examples: "expand the AI assistant to all plans vs roll it back",
"renew the $180k/yr license vs cut seats", "hire 2 fewer support agents vs keep hiring".
A metric that informs no decision is decoration — it gets deleted.
spec-lint fails if this is empty or still contains a {placeholder}.
-->

### Data Inventory

| Source | What it holds | Access |
|---|---|---|
| {e.g. PostHog} | product events, funnels | have |
| {e.g. Stripe} | revenue, churn | need |
| {e.g. support platform} | tickets, CSAT, handle time | blocked |

<!-- Access must be one of: have | need | blocked. The Actuals connect skill works this list. -->

## 2. North-Star Linkage

### North star
<!-- The company's EXISTING top metric (net revenue retention, weekly active teams, gross margin…). Never invent a new one here — link to what leadership already steers by. -->

### Causal chain
<!--
AI feature → behavior change → driver metric → north star. One line per arrow. Example:
Ava answers tier-1 tickets → agents spend time on tier-2/3 → first-response and resolution times drop → support cost per account falls + CSAT holds → net revenue retention.
Every outcome metric in §3 must sit somewhere on this chain.
-->

### Assumptions
<!-- Number them. The Claims Ledger (§7) and any constant used in any formula must reference these. -->
- A1: {e.g. a deflected ticket would otherwise have consumed ~14 min of agent time (source: last quarter's handle-time average — remeasure quarterly)}
- A2: {…}

## 3. Outcome Metrics

<!--
3–5 metrics, no more (spec-lint enforces). Each must have ALL eight fields.
If you can't fill a field yet, write the honest value ("not yet measured — see Claims Ledger CL-1")
and set Confidence: assumed. Never a dollar figure whose constants aren't in §2 Assumptions.
Confidence rubric: proven = measured with a baseline/control · plausible = measured, causality assumed · assumed = not yet measured.
-->

### OM-1: {name}
- **Definition:** {one plain sentence a new exec would understand}
- **Formula:** {numerator / denominator, filters, time window — computable from named sources}
- **Source(s):** {from §1 Data Inventory}
- **Owner:** {named human}
- **Baseline:** {value + date, or "not yet measured — see CL-x"}
- **Target:** {value + direction + by-when}
- **Confidence:** assumed <!-- proven | plausible | assumed -->
- **Instrumentation-Status:** none <!-- none | staged | live -->

### OM-2: {name}
- **Definition:**
- **Formula:**
- **Source(s):**
- **Owner:**
- **Baseline:**
- **Target:**
- **Confidence:** assumed
- **Instrumentation-Status:** none

### OM-3: {name}
- **Definition:**
- **Formula:**
- **Source(s):**
- **Owner:**
- **Baseline:**
- **Target:**
- **Confidence:** assumed
- **Instrumentation-Status:** none

## 4. Guardrail Metrics

<!--
At least one per outcome metric (spec-lint warns if fewer). Ask: "what would a cynic
say got worse?" (Canonical example: AI coding assistants raised PR throughput while
review time rose 91% and PR size 154% — the guardrails caught what the headline hid.)
Tripwire = the threshold that triggers investigation, not celebration.
-->

### GM-1: {name} (guards OM-1)
- **Definition:**
- **Formula:**
- **Source(s):**
- **Owner:**
- **Baseline:**
- **Tripwire:** {threshold + what happens when crossed}
- **Confidence:** assumed

## 5. Eval-Layer Metrics

<!--
Only if the AI's output quality is measurable (it usually is). Every eval MUST map to an
outcome metric it predicts — an unmapped eval in an exec deck is VM-11, and spec-lint fails it.
Report judge–human agreement alongside any LLM-judge score, never the score alone (VM-12).
Expect criteria drift: grading real outputs will change your criteria — that's the calibration pass, not a failure.
-->

### EV-1: {name}
- **Grades:** {what aspect of output quality}
- **Method:** llm-judge <!-- rule | human | llm-judge -->
- **Maps-To-Outcome:** OM-1 <!-- which §3 metric this predicts -->
- **Calibration:** {graded sample n=0, judge–human agreement: not yet measured, last: never}

## 6. Vanity Metrics We Will Not Use

<!--
Pre-commitment. List the metrics you'll be tempted to report, with the catalog ID
(see the Actuals anti-pattern catalog, VM-01..VM-20) and what you'll do instead.
Future-you under exec pressure will thank present-you.
-->

| Tempting metric | Catalog ID | Why it lies here | What we do instead |
|---|---|---|---|
| {e.g. "hours saved" survey} | VM-01 | {self-reports invert reality} | {measured handle time, OM-2} |

## 7. Claims Ledger

<!--
What you CANNOT claim yet, and what evidence would license it. House rule: no dollar
figure leaves this spec unless every constant in its formula appears in §2 Assumptions.
Status: blocked | in-progress | licensed.
-->

| ID | Desired claim | Required evidence | Status |
|---|---|---|---|
| CL-1 | {e.g. "Ava reduced support cost per account"} | {pre-launch baseline + 8 weeks post} | blocked |

## 8. Review & Calibration Schedule

- **Recurring audit:** {e.g. monthly, via the Actuals audit skill — checks drift, definition rot, stale owners}
- **Calibration passes:** {e.g. grade 30 real outputs against EV-1 criteria at weeks 2, 6, then quarterly}
- **Out-of-cycle triggers:** {metric moves >20% · model/provider change · pricing change · new data source}

## 9. Changelog

<!-- Newest first. spec-lint fails if Last-Updated has no matching entry. -->

- 0.1.0 — {YYYY-MM-DD} — Initial draft — {produced by the Actuals design interview}
