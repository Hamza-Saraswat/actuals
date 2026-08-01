# Actuals

**Honest metrics for AI tools and features.**

Your AI metrics are probably lying to you. Microsoft's Copilot dashboard values every action at a flat 6 minutes × $72/hour. A randomized trial (METR, 2025) found developers were 19% *slower* with AI while believing they were 20% faster. McKinsey finds only 39% of companies can attribute any profit impact to AI at all. The numbers on the dashboard and the value in the business have quietly stopped talking to each other.

Actuals is a free Claude Code plugin that closes that gap:

- **`/actuals:design`** — interviews you about your business (what the AI does, who benefits, what decision the metrics must inform), then writes a versioned `metrics/MEASUREMENT.md` spec: 3–5 outcome metrics with formulas and owners, a guardrail for every metric, evals mapped to outcomes, a list of vanity metrics you pre-commit to *not* using, and a claims ledger recording what you can't claim without a baseline.
- **`/actuals:audit`** — points at your existing dashboards, tracking plans, SQL, or ROI decks and flags findings against a catalog of **20 named anti-patterns** (self-reported time savings, minutes-times-wage dollarization, adoption-as-impact, survivor-only funnels, uncalibrated LLM judges…), each with severity, published evidence, and a concrete fix. Re-run it monthly and it also checks spec drift, definition rot, and stale owners.
- **`/actuals:instrument`** — turns the spec into working instrumentation: event schemas with typed constants, SQL/dbt models implementing each formula verbatim, a pre-launch baseline snapshot query, and an eval harness with judge–human calibration built in. Detects PostHog and can publish your metric *definitions* as insights/dashboards there (your data, their compute).
- **`/actuals:connect`** — wires up the data sources you already use (PostHog, Langfuse, Braintrust, Stripe, GitHub, your warehouse…) by merging vetted MCP server configs into your project — non-destructively, with `${ENV_VAR}` placeholders, never literal secrets.
- **`/actuals:scorecard`** — renders a self-contained `metrics/dashboard.html`: outcome metrics vs baselines and targets, guardrail tripwires, open audit findings, the claims ledger. No live queries, and the footer says so.

It works for both sides of the AI measurement problem: **teams shipping AI features** (is the AI support assistant actually deflecting tickets, or just having conversations?) and **teams rolling out AI tools internally** (is the Copilot spend working, or is the ROI deck extrapolating a survey of 37 enthusiasts?).

## Install

In Claude Code:

```
/plugin marketplace add Hamzas-Aigentic/actuals
/plugin install actuals@actuals-marketplace
```

Then start with either end of the problem:

- "What should we measure for our new AI support bot?" → the design interview
- "Here's our AI dashboard export — are these numbers real?" → the audit

## Try the demo fixture

The repo ships a complete worked example — [examples/acme-support-ai/](examples/acme-support-ai/) — a 50-person SaaS whose AI-assistant dashboard is deliberately riddled with anti-patterns:

```
/actuals:audit examples/acme-support-ai/
```

Compare the result against [the answer key](examples/acme-support-ai/expected-audit-findings.md), then read [the corrected spec](examples/acme-support-ai/MEASUREMENT.md) for the "after" picture. There's a second fixture for internal AI rollouts: a [$15.2M Copilot ROI deck](examples/internal-ai-rollout/copilot-roi-report.md) that does not survive contact with the catalog.

## The anti-pattern catalog

The audit's backbone is [20 named patterns](skills/audit/references/anti-patterns.md) with [published receipts](skills/audit/references/evidence.md) — from VM-01 *Self-Reported Time Savings* (the METR perception gap) to VM-20 *Orphan Metric*. Stable IDs, detection signals, severity, and a concrete fix each. Cite them in code review like you'd cite a CVE.

## Bundled MCP server

The plugin ships its own MCP server exposing the deterministic checks as tools — callable from CI, other agents, or any MCP client, no skills required:

- **`spec_lint`** — validate a `MEASUREMENT.md` against the schema (returns `{valid, errors, warnings}`)
- **`vanity_scan`** — mechanically flag candidate anti-patterns in CSV/SQL/JSON/Markdown artifacts

Both wrap the same library functions the skills use ([spec-lint.mjs](skills/design/scripts/spec-lint.mjs), [vanity-scan.mjs](skills/audit/scripts/vanity-scan.mjs)) — one source of truth. The scripts also run standalone:

```
node skills/audit/scripts/vanity-scan.mjs your-dashboard-export.csv --json
```

## What Actuals will not do

- **Print a dollar figure it can't defend.** No flat-multiplier "value" math — every constant must trace to a re-measured assumption, or the number doesn't exist.
- **Claim causation without a baseline.** The spec's claims ledger records what you *can't* say yet and what evidence would license it.
- **Track you.** No telemetry. The plugin's own measurement spec ([metrics/MEASUREMENT.md](metrics/MEASUREMENT.md)) runs on user interviews, lists installs and stars as explicit vanity metrics, and eats its own cooking.

## Portability

Skills follow the open [Agent Skills](https://agentskills.io) format — the skill bodies degrade gracefully outside Claude Code (manual fallbacks where Node or MCP aren't available). The slash commands, bundled MCP server, and marketplace install are Claude Code conveniences, not requirements.

## Docs & meta

- Landing page: https://hamzas-aigentic.github.io/actuals/
- Dev notes: [CLAUDE.md](CLAUDE.md) · Changelog: [CHANGELOG.md](CHANGELOG.md)
- Market research behind the product: [MARKET-RESEARCH.md](MARKET-RESEARCH.md)
- License: [MIT](LICENSE)
