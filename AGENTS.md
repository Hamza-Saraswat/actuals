# Actuals — agent notes

Contributor, architecture, and release notes live in [CLAUDE.md](CLAUDE.md) — read that file before changing anything here.

The invariants that matter most: `skills/` is the product (open Agent Skills format — the repo layout is also the distribution format); the anti-pattern catalog (`skills/audit/references/anti-patterns.md`) and the deterministic rules (`spec-lint.mjs`, `vanity-scan.mjs`) each live in exactly one place — never duplicate a rule; scripts are zero-dependency Node 18+ ESM; and `examples/*/expected-audit-findings.md` are answer keys — if a rule change alters scan results, update the keys deliberately, never silently.
