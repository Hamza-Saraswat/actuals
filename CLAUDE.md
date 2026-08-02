# Actuals — developer notes

This repo is a Claude Code plugin AND its own marketplace (`.claude-plugin/marketplace.json` points at `./.`). GitHub repo name is `actuals`; the local folder name doesn't matter.

## Dev loop

- **Iterating:** `claude --plugin-dir /path/to/this/repo` loads the plugin ephemerally — edits take effect on the next session, nothing is registered.
- **Headless runs:** always pair `--plugin-dir` with `--add-dir <this repo>` — plugin loading does NOT grant file reads into the plugin dir, and without it skills can't read the catalog/templates (they fall back to lint-guided reconstruction; works, but degraded — see README "Headless / CI usage").
- **Cache gotcha:** after a real `/plugin install`, Claude Code loads the snapshot in `~/.claude/plugins/cache/`, NOT this repo. Edits require a `version` bump in BOTH `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, then `/plugin marketplace update actuals-marketplace` + reinstall.
- **Version policy:** bump on every published change. Patch = docs/copy, minor = skill behavior or schema change, major = breaking spec-format change.

## Architecture rules

- `skills/` is the product. No `commands/` directory — skills ARE the slash commands. Frontmatter names are BARE (`name: design`, matching the directory); Claude Code prepends the plugin name automatically, yielding `/actuals:design`. Never put the plugin prefix in a skill's `name` — it double-prefixes on current Claude Code and the colon breaks the Agent Skills charset.
- **One source of truth:** the anti-pattern catalog lives ONLY in `skills/audit/references/anti-patterns.md` (design's vanity pass reads it cross-skill). Deterministic logic lives ONLY in `skills/design/scripts/spec-lint.mjs` and `skills/audit/scripts/vanity-scan.mjs`; the MCP server (`server/index.mjs`) imports their `lintSpec()`/`scanText()` exports — never duplicate a rule in two places (that's VM-18, definition rot, and we'd be hypocrites).
- **Portability:** skill bodies must work outside Claude Code (Agent Skills standard). Anything Claude-Code-specific (MCP config writes, `${CLAUDE_PLUGIN_ROOT}`, scheduled tasks) is phrased "if available" with a manual fallback.
- **Scripts:** Node 18+, zero dependencies, ESM (.mjs). Each is a library (named exports) + CLI (`node script.mjs <args> --json`). System Python here is 3.9 — don't add Python.
- **Fixtures are oracles:** `examples/*/expected-audit-findings.md` are answer keys. If you change a rule in vanity-scan or the catalog, re-run it against both fixtures and update the keys deliberately, never silently.

## User-facing artifact contract (what skills write into USER repos)

- `metrics/MEASUREMENT.md` — the versioned spec (schema in `skills/design/assets/MEASUREMENT.template.md`; validated by spec-lint)
- `metrics/audits/YYYY-MM-DD-audit.md` — dated audit reports
- `metrics/instrumentation/` — staged generated code
- `metrics/dashboard.html` — rendered scorecard (deterministic, recorded values only — no live queries)
