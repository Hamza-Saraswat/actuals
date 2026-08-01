---
name: scorecard
description: This skill should be used when the user wants a visual scorecard of their measurement spec — e.g. "generate the metrics dashboard", "update the scorecard", "render our metrics status", "make a dashboard from MEASUREMENT.md". It runs a deterministic renderer turning metrics/MEASUREMENT.md and the latest metrics/audits/ report into a self-contained metrics/dashboard.html: each outcome metric with recorded baseline, current and target values and confidence, guardrail tripwire status, instrumentation status, open audit findings by severity, and spec version. It renders only values recorded in the spec — it does not query live data sources. Not for creating dashboards inside analytics platforms (the instrument skill handles PostHog publishing).
version: 0.1.0
license: MIT
---

# Render the Scorecard

Produce `metrics/dashboard.html` — a self-contained, shareable status page for the measurement spec.

## What it is and is not

The scorecard is a **deterministic render of recorded state**: the spec's metrics with their recorded baselines and targets, guardrail tripwires, eval calibration status, the latest audit's findings, the vanity pre-commitments, the claims ledger, and the changelog. It performs **no live data queries** — the page's own footer says so. Live numbers belong in the user's analytics platform (the instrument skill can publish definitions there); this page is the honest summary layer on top.

## Run it

1. Confirm `metrics/MEASUREMENT.md` exists. If not, offer the design skill and stop — there is nothing truthful to render without a spec.
2. If Node is available, run the renderer ([scripts/render-scorecard.mjs](scripts/render-scorecard.mjs)):

```
node <skill-root>/scripts/render-scorecard.mjs metrics/MEASUREMENT.md
```

Options: `--audits-dir <dir>` (default: `metrics/audits` next to the spec) and `--out <file>` (default: `metrics/dashboard.html`). The renderer lints the spec first and prints any errors — relay them to the user; a scorecard over a broken spec is decoration.

3. If Node is unavailable, do not hand-build lookalike HTML — the scorecard's value is that it is deterministic and identical for everyone. Say the renderer needs Node and offer the spec's §3/§4 tables inline as a text summary instead.

## After rendering

- Tell the user where the file landed and offer to open it.
- The page is self-contained (inline CSS, no external requests, light/dark aware) — safe to attach to an email, drop in Slack, or publish on an internal wiki as-is.
- If the render revealed staleness (old audit, overdue Next-Review), point it out and offer the audit skill.
- Re-render after every spec change or audit; the design and audit skills both offer this hand-off.
