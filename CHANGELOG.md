# Changelog

## 0.1.0 — 2026-08-01

Initial release.

- Five skills: `/actuals:design`, `/actuals:audit`, `/actuals:instrument`, `/actuals:connect`, `/actuals:scorecard`
- MEASUREMENT.md spec format (v1) with lint-enforced schema
- 20-pattern vanity-metrics anti-pattern catalog (VM-01..VM-20) with published evidence
- Deterministic scripts: `spec-lint.mjs`, `vanity-scan.mjs`, `render-scorecard.mjs`
- Bundled MCP server exposing `spec_lint` and `vanity_scan`
- Curated MCP connector registry (data-in via the user's own `.mcp.json`)
- PostHog publish step in instrument (definitions out; PostHog computes)
- Two test fixtures with audit answer keys (SaaS AI feature + internal AI rollout)
