# Changelog

## 0.1.4 — 2026-08-08

- Landing page moved to its canonical home at https://useactuals.netlify.app/ (redesigned; see the actuals_lander repo). Homepage links updated in the manifests and README.

## 0.1.3 — 2026-08-02

Hardening from the first real-world dogfood (all five skills run end-to-end against four production projects, headless).

- **Headless mode is now a documented feature** of the design skill: repo-derived interview answers logged as a risk-annotated assumptions ledger; spec stays `draft` until a human reviews them
- **Fabricated-citation guard**: when the anti-pattern catalog can't be read, skills must use plain-language pattern names or local labels — never unverified numeric VM-ids (one degraded run invented wrong ids; the audit skill's review mode later caught and corrected them)
- README "Headless / CI usage" section + CLAUDE.md note: pair `--plugin-dir` with `--add-dir <plugin-root>` (plugin loading grants skill discovery, not file reads — without it, skills degrade to lint-guided fallbacks)
- Dogfood results: 4/4 specs lint-clean, 4/4 audits hit their ground-truth scoring keys with zero stray writes; three audits surfaced true findings beyond the scoring key (a stale-schema dual definition, a dual-population KPI denominator, a spec-vs-dashboard formula drift)

## 0.1.2 — 2026-08-01

- Landing page moved to its own repo ([actuals_lander](https://github.com/Hamza-Saraswat/actuals_lander)) and fully redesigned; `docs/` removed from this repo. Homepage links updated.

## 0.1.1 — 2026-08-01

Pre-release validation fixes.

- Skill frontmatter names are now bare (`design`, not `actuals:design`) — the plugin prefix is added by Claude Code, and the prefixed form could double-namespace commands on current versions (also restores Agent Skills name-charset conformance)
- Scripts: importing `lintSpec()`/`scanText()` from an entry file whose name suffix-matched the script no longer triggers the CLI (robust path-equality main-module check in all three scripts)
- `render-scorecard.mjs` now rejects unknown flags and supports `--help` instead of silently rendering with defaults
- Fixture fix: a note in the Acme dashboard export accidentally contained a token that exculpated VM-14 file-wide; reworded so the answer key's scan-detectability holds
- Plugin `.mcp.json` now uses the wrapped `mcpServers` form (self-consistent with the connect skill's own format reference)
- Docs consistency: Node floor stated as 18+ everywhere; CLAUDE.md naming guidance corrected; minor numbering/count/link fixes

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
