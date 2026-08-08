---
name: instrument
description: >-
  This skill should be used when the user wants a measurement spec turned into working instrumentation — e.g. "instrument these metrics", "generate the tracking events", "wire up MEASUREMENT.md", "write the SQL for our metrics", "build the eval harness", "implement the measurement plan". It reads metrics/MEASUREMENT.md, detects the stack (analytics SDKs such as PostHog, Amplitude, Mixpanel or Segment, dbt projects, warehouse configs, eval platforms such as Langfuse or Braintrust, and available MCP servers), then generates event schemas with typed tracking constants, SQL or dbt models implementing each metric formula plus a baseline snapshot query, and eval harness stubs mapped to outcome metrics. It emits plain portable code when no platform is detected, stages output under metrics/instrumentation/ by default, and asks before writing into application source trees. Requires an existing spec and offers the design skill when none exists.
license: MIT
compatibility: Best with the full Actuals skill set installed — cites the audit skill's catalog and can run the design skill's linter from sibling directories; degrades gracefully standalone. Optional scripts need Node 18+.
metadata:
  version: "0.2.0"
---

# Instrument

Turn a measurement spec into working instrumentation: tracking events with typed constants, SQL or dbt models implementing each formula verbatim, a pre-launch baseline snapshot, and a local-first eval harness. The spec drives everything — the generated code is its executable form, never a source of new metrics.

## Overview and contract

- **Consumes:** `metrics/MEASUREMENT.md` — the versioned spec the design skill produces (schema: the design skill's `assets/MEASUREMENT.template.md`; field labels are parse-exact).
- **Produces:** staged, reviewable code under `metrics/instrumentation/`, plus spec status updates and an optional PostHog publish.
- **Never invents metrics.** No spec, no instrumentation. Generating trackers and queries ad hoc — events no metric consumes, formulas nobody owns — recreates the exact vanity problem this plugin exists to fix (VM-20, orphan metrics). VM-xx IDs throughout refer to the anti-pattern catalog at [../audit/references/anti-patterns.md](../audit/references/anti-patterns.md).

Boundaries, so scope stays honest:

- Does not compute current metric values or query live data sources — it writes the definitions that make computing possible. (The scorecard renders recorded values; live reporting is out of scope for v1.)
- Does not create dashboards inside analytics platforms except through the gated PostHog step below.
- Does not modify application source trees without an explicit ask (placement protocol below).

Default staged layout (created on first run):

```
metrics/instrumentation/
├── tracking-plan.md      # filled from assets/tracking-plan.template.md
├── events/               # typed tracking-constants module, repo's primary language
├── sql/                  # one model per metric + baseline-snapshot.sql
├── dbt/                  # used instead of sql/ when a dbt project is detected
├── evals/                # criteria files, samples, human-grades CSV, run script
└── posthog/              # insight-definition JSON — fallback publish path only
```

The flow: pre-flight → stack detection → generation, one spec metric at a time → optional PostHog publish → placement → close the loop → hand over a verification checklist.

## Pre-flight

### Load the spec

Read `metrics/MEASUREMENT.md` from the repo root. If it does not exist:

1. Stop. Generate nothing — no "placeholder metrics" as a compromise. Instrument turns an existing spec into code; without one there is nothing sound to implement.
2. Offer the design skill (`/actuals:design` in Claude Code): its interview produces the spec first.

If the user names a spec at a different path, use it — and note that `metrics/MEASUREMENT.md` is the standard location the other Actuals skills look for.

### Resolve scope

Parse invocation arguments when provided (the text after the skill name): a whitespace-separated list of metric IDs (`OM-2 GM-1 EV-1`) limits generation to those metrics. Unrecognized arguments → ask rather than guess. Default scope is every metric in the spec.

### Parse the spec

Field labels are parse-exact — read them as written, do not fuzzy-match. What generation consumes:

| Spec location | Labels read | Feeds |
|---|---|---|
| Header | `Spec-Version`, `Status`, `Last-Updated` | comment headers, sanity checks, close-the-loop |
| §1 Data Inventory table | `Source`, `What it holds`, `Access` (`have`/`need`/`blocked`) | source availability flags |
| §2 Assumptions | numbered `A1`, `A2`, … | the only licensed origin for literal constants in SQL (VM-02) |
| §3, headings `### OM-n: {name}` | `Definition`, `Formula`, `Source(s)`, `Owner`, `Baseline`, `Target`, `Confidence`, `Instrumentation-Status` | events + model per metric; status updates |
| §4, headings `### GM-n: {name} (guards OM-n)` | same, with `Tripwire` in place of `Target` | events + model per guardrail |
| §5, headings `### EV-n: {name}` | `Grades`, `Method` (`rule`/`human`/`llm-judge`), `Maps-To-Outcome`, `Calibration` | eval harness stubs |
| §7 Claims Ledger | `CL-n` rows, `Required evidence`, `Status` | baseline-snapshot urgency (claims blocked on baselines) |

### Sanity checks

1. Header `Status`: `draft` is fine — instrumentation is how a draft reaches calibration. `stale` → recommend an audit first; proceed only if the user confirms.
2. Every in-scope metric needs a computable `Formula` (numerator, denominator, filters, window) and named `Source(s)`. A metric whose formula is empty or still a `{placeholder}` is skipped and reported by ID — never guess a formula.
3. If Node 18+ is available, optionally validate with the design skill's linter (`../design/scripts/spec-lint.mjs`, relative to this skill's install directory). If Node or the script is unavailable, the manual check above suffices.
4. Note §1 `Access` values. Sources marked `need` or `blocked` do not block generation — SQL and events are definitions, runnable once access lands — but flag them in the final summary, and mention the connect skill (`/actuals:connect` in Claude Code; otherwise manual MCP or credential setup) for wiring sources up.

## Stack detection

Detect before generating, so output lands in the user's dialect instead of a generic one. Detection is read-only: read manifests and config files, never execute project code.

1. Scan dependency manifests (`package.json`, `pyproject.toml`, `requirements.txt`, `Gemfile`, `go.mod`) for the signals below.
2. Look for `dbt_project.yml` at the repo root and immediate subdirectories.
3. Scan env conventions for warehouse hints — variable NAMES only, never read or echo values.
4. Note eval-platform dependencies.
5. If the environment exposes MCP servers, note which are available — a PostHog server enables the publish step below; warehouse or analytics servers help later verification. In environments without MCP support, skip this check; nothing downstream requires it.

| Signal | Where to look | Implication |
|---|---|---|
| `posthog-js`, `posthog-node`, `posthog` (py) | dependency manifests | PostHog SDK — emit its capture idioms |
| `@segment/analytics-node`, `@segment/analytics-next`, `segment-analytics-python` | dependency manifests | Segment — emit track() idioms |
| `@amplitude/analytics-browser`, `@amplitude/analytics-node`, `amplitude-analytics` | dependency manifests | Amplitude idioms |
| `mixpanel-browser`, `mixpanel` (js/py) | dependency manifests | Mixpanel idioms |
| `dbt_project.yml` | root, immediate subdirs | dbt project — models + `schema.yml` into `dbt/`; note models path and profile name |
| `DATABASE_URL`, `PG*`, `SNOWFLAKE_*`, `BIGQUERY_*`, `GOOGLE_APPLICATION_CREDENTIALS`, `REDSHIFT_*`, `DATABRICKS_*` | `.env.example`, `.env` names, dbt `profiles.yml` | warehouse flavor for SQL dialect notes |
| `langfuse`, `braintrust` deps or config files | dependency manifests | eval platform — optional wiring notes per the eval reference |

Also determine the **primary language** for the constants module: the language of the application code that will emit events, from manifests and a quick file census. If the repo is polyglot or has no application code, ask which codebase will emit events; default to TypeScript only when the user has no preference.

Precedence: an explicit user statement about the stack beats detection; detection beats defaults.

Show a short detection summary before generating, in this shape:

```
Detected: PostHog (posthog-js in package.json) · dbt (dbt/dbt_project.yml, profile "acme")
          · no eval platform · PostHog MCP server available
Primary language: TypeScript · Warehouse: Postgres (DATABASE_URL in .env.example)
Not detected: Segment, Amplitude, Mixpanel, Langfuse, Braintrust
```

When nothing is detected, say so plainly and emit plain portable code: an SDK-agnostic constants module with an injected `track` function, generic ANSI SQL, and the local eval harness. Portable output is a first-class result, not a degraded one.

## Generation

Work one spec metric at a time, in spec order: §3 outcome metrics (OM-x), then §4 guardrails (GM-x), then §5 evals (EV-x). Per metric, produce and tick off:

- tracking-plan rows + typed constants (OM/GM)
- one SQL or dbt model (OM/GM)
- harness stub (EV)
- baseline coverage: the metric appears in `baseline-snapshot.sql` or the gap is reported

Fidelity beats elegance: the spec is the contract, and silent divergence between spec and implementation is definition rot (VM-18).

### Events and typed tracking constants

Follow [references/event-design.md](references/event-design.md) for naming, property taxonomy, PII rules, and versioning.

1. Derive the smallest event set whose properties can compute the metric's numerator AND denominator. Derivation is mechanical — walk the formula:

   ```
   Formula (OM-1): deflected / eligible tickets, weekly, excluding internal test accounts
   → numerator needs:   ticket_deflected  (ticket_id, account_id, channel, model_version)
   → denominator needs: assistant_offered (ticket_id, account_id, channel) — the exposure event
   → filters need:      nothing new — test-account flag lives on the account record; the join key suffices
   → window needs:      nothing new — timestamps arrive with every event
   ```

   The denominator usually needs its own exposure event; that event is what makes honest rates (VM-06) and intention-to-treat cohorts (VM-10) computable later.
2. Record every event as a row in `metrics/instrumentation/tracking-plan.md`, filled from [assets/tracking-plan.template.md](assets/tracking-plan.template.md). Every row carries `Maps-to-metric`; an event that maps to no OM/GM is not generated (VM-20). Reuse events across metrics where formulas overlap — one user action, one event (VM-07).
3. Generate the typed constants module into `metrics/instrumentation/events/` in the repo's primary language, per the typed-constants pattern in the event-design reference. Call sites import constants — string literals at call sites are how definitions drift.
4. When an analytics SDK was detected, add a short comment in the module showing the SDK-specific call wrapping the constants. When none was detected, the injected-`track` module stands alone.

### SQL and dbt models

Follow [references/sql-patterns.md](references/sql-patterns.md) — patterns are keyed to the formula shapes the spec produces, each tied to the catalog entry it defends against.

1. One model per metric ID, named for it: `sql/om-1-ticket-deflection-rate.sql`, `sql/gm-1-csat-all-offered.sql` (kebab-case slug of the metric name; dbt models use `om_1_ticket_deflection_rate.sql`). One metric, one file — statuses then map one-to-one.
2. Implement the spec formula VERBATIM — same numerator, denominator, filters, and window. Embed the formula text as a comment header including the spec version:

   ```sql
   -- OM-1: Ticket deflection rate
   -- Spec: metrics/MEASUREMENT.md v1.2.0 (§3 OM-1)
   -- Formula (verbatim): deflected / eligible tickets, weekly window,
   --   excludes internal test accounts; reopens within 48h do not count as deflected
   ```

3. If a formula cannot be implemented as written — a named source or column does not exist — stop for that metric and report the gap. Do not improvise a "close enough" formula; a query that quietly differs from the spec is VM-18 with extra steps.
4. Rates always ship numerator and denominator as columns beside the rate (VM-06). Windows are trailing, never since-launch (VM-08). Cohorts are intention-to-treat, churned and abandoned users included (VM-10). Any literal constant traces to a §2 assumption by ID (VM-02) — no assumption, no constant.
5. Guardrail models surface the spec's `Tripwire`: put the threshold in the comment header (citing §4) and emit a `tripwire_crossed` boolean column beside the value, so dashboards read status without re-deriving the threshold.
6. Always generate `baseline-snapshot.sql` per the baseline pattern in the SQL reference, covering every in-scope metric with a `Baseline` still reading "not yet measured". Flag it in the file header and in chat: **run BEFORE launch or the Claims Ledger stays empty** — a post-launch delta with no pre-launch baseline is unfalsifiable (VM-14), and every §7 claim waiting on baseline evidence stays `blocked` forever without this snapshot. Cross-reference the CL-n IDs it unblocks.

### Eval harness stubs

Follow [references/eval-harness.md](references/eval-harness.md). Local-first: the canonical loop runs from files in the repo, with platform wiring only for detected Langfuse/Braintrust installs.

For each in-scope §5 eval, generate into `metrics/instrumentation/evals/`:

1. A criteria file seeded from the eval's `Grades` field, with its `Maps-To-Outcome` metric in the header — an eval that predicts no outcome is VM-11, and the spec's linter already refuses it.
2. A sample-collection stub (real outputs into JSONL — never synthetic-only), an empty human-grades CSV with the header row, and a run script that reports judge–human agreement ALONGSIDE pass rate, never pass rate alone (VM-12). The collect stub documents where real outputs come from (production logs, traces, dogfood transcripts) and refuses to fabricate samples — a synthetic-only set grades a product that does not exist.
3. Respect the `Method` field: `llm-judge` gets the full judge + calibration loop; `rule` gets deterministic assertions in the run script (still validated once against a human-graded sample); `human` gets the grading CSV workflow with no judge. Details in the eval reference.
4. The spec's §5 `Calibration` line is where results land; the §8 schedule is what keeps them honest. Wire the stub's warnings to those fields.

### Re-runs and spec changes

Regeneration is idempotent: running instrument again against an unchanged spec produces the same artifacts and an empty diff. When the spec HAS changed since the last staging:

1. Compare each staged model's comment header (`Spec: ... vX.Y.Z`) against the current `Spec-Version` to find stale artifacts mechanically.
2. Formula changed → regenerate the model with the new version in its header and show the before/after diff. The series break belongs annotated in the spec §9 and on any chart spanning it — a trend across two definitions is fiction (VM-18).
3. Event semantics changed → propose a versioned event name per the event-design reference, never a silent redefinition; update the tracking plan and constants module together.
4. Metric removed from the spec → propose deleting its staged artifacts and moving its tracking-plan rows to the graveyard. Deletion is a feature (VM-20); orphaned instrumentation is how dashboard sediment forms.

## PostHog publish (gated)

Run this step ONLY when a PostHog MCP server is detected or connected in the current session. No PostHog MCP → skip the step entirely, or use the fallback below if the user asks for it. Never a silent default.

1. Offer — never assume — to create in PostHog: one insight per in-scope outcome and guardrail metric, plus one dashboard collecting them. Definitions only: PostHog computes the values from the user's own event data; no numbers are pushed, because inventing values is the business this plugin is against.
2. Each insight definition carries:
   - **Name:** `OM-1 · Ticket deflection rate` — the spec ID stays visible in PostHog.
   - **Description:** `Defined by metrics/MEASUREMENT.md v1.2.0 (§3 OM-1) — do not edit the formula here; change the spec and re-instrument.`
   - **Query:** series built from the tracking-plan events implementing the formula (numerator event over denominator event, e.g. formula mode `A / B`), with the spec's filters and window. Breakdowns only where the spec formula names a segment.
   - **Dashboard:** one, named `{product} — Actuals`, holding the OM and GM insights in spec order.
3. Show the exact list of insights and the dashboard to be created, and confirm before any write.
4. After creation, report what was created with links, and offer to record the dashboard URL in the spec so the scorecard can surface it.
5. **Honest fallback:** if the PostHog MCP server exposes no write endpoints, or creation calls fail, say exactly that — then emit the definitions to `metrics/instrumentation/posthog/insights.json` plus a `manual-checklist.md` with step-by-step creation instructions. The JSON mirrors the fields above per insight (`metric_id`, `name`, `description`, `events`, `formula`, `filters`, `window`) plus one `dashboard` entry. State plainly that definitions were staged because publish was not possible. Never imply a dashboard exists when it does not.

## Placement protocol

- Default destination is `metrics/instrumentation/` — always safe, no confirmation needed to create or update the staging tree. Re-runs regenerate: show a diff of what changes in already-staged files rather than silently overwriting.
- NEVER write into application source trees (`src/`, `app/`, `lib/`, a dbt `models/` directory, or anything outside `metrics/`) unless the user explicitly asks. When they do ask:
  1. Show the intended diff first for any existing file — full contents for new files.
  2. Apply only after confirmation, one file at a time for source edits.
- Staged code is written to be moved: note in file headers that import paths may need adjusting when code is relocated into the app.
- Never write secrets, tokens, or literal API keys into any generated file. Configuration references stay as `${ENV_VAR}` placeholders.

## Close the loop

Instrumentation that does not update the spec creates drift between document and reality — the audit skill would flag it, so do not create it. Exact mechanics:

1. For each §3 metric whose artifacts were staged, update its `Instrumentation-Status` line: `none` → `staged`. Set `staged` → `live` only when the user confirms verified production data (checklist below) — status reflects evidence, not intention. Guardrail metrics carry no status field in the schema; record their staging in the changelog entry instead.
2. Add a §9 Changelog entry, newest first, matching the existing format:

   ```
   - 1.2.1 — 2026-08-01 — OM-1, OM-2, GM-1 instrumentation staged (events, SQL, eval harness) — instrument skill
   ```

3. Bump the header `Spec-Version` patch number (status changes are patch-level per the spec header rules) and set `Last-Updated` to the same date as the changelog entry — the linter fails a `Last-Updated` with no matching entry.
4. Show the spec diff and confirm before writing — the spec is the user's source of truth, treated with the same care as their source code.
5. Offer next steps, each guarded: the connect skill for `need`/`blocked` data sources, and a scorecard refresh (`/actuals:scorecard` in Claude Code; otherwise the scorecard skill's render script) so the new statuses show up.

## Final summary

End every run with a compact report:

- **Staged:** files written, grouped by kind — tracking-plan rows, constants module, models, eval stubs, baseline snapshot.
- **Skipped:** metrics not generated, each with its reason (placeholder formula, missing source or column). Skips are findings, not footnotes — they tell the user exactly what the spec still owes.
- **Flags:** data sources still `need`/`blocked` · baseline urgency, naming the CL-n claims waiting on it · PostHog publish outcome, or the honest fallback if that path was taken.
- **Spec updates:** statuses flipped and the new version number.
- **Next:** the verification checklist below, plus the guarded connect/scorecard offers.

## Verification checklist

Hand the user this checklist at the end. Generated code is a hypothesis until each line is checked — and `Instrumentation-Status: live` waits for all of them.

1. **Events fire.** Trigger each staged event in a dev environment; confirm it arrives in the analytics tool with the property names and types the tracking plan promises.
2. **Row counts reconcile.** Run each SQL model for one known day and compare against a number already trusted (the support tool's own ticket count, the billing system's invoice count). Investigate any material divergence before trusting the model — a query that is wrong by 10% quietly is worse than no query.
3. **Baseline exists before launch.** Confirm `baseline-snapshot.sql` ran and dated rows exist BEFORE the feature ships (VM-14). This is the one step that cannot be done retroactively.
4. **Judge is calibrated.** Human-grade the n≥30 sample; trust judge output only once judge–human agreement meets the target recorded in spec §5 — and never report a pass rate without its agreement number beside it (VM-12).
5. **Then flip to live.** Once verified, update `Instrumentation-Status` to `live` (re-run this skill or edit the spec directly, with a changelog entry and patch bump either way).
