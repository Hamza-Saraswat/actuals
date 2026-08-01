---
name: actuals:connect
description: This skill should be used when the user wants data sources connected for metrics work — e.g. "connect PostHog", "hook up our analytics", "set up the Langfuse MCP", "connect our warehouse", "add the data sources from the measurement spec", "wire up Amplitude/Mixpanel/BigQuery". It detects the user's stack, selects matching MCP servers from a curated registry (analytics, LLM observability, warehouses, GitHub, Linear, Jira, Stripe, Salesforce), verifies against a live MCP registry when one is available, and after explicit confirmation merges the chosen server entries into the user's project .mcp.json without overwriting existing entries. It never bundles third-party servers and never places literal secrets in files or chat — env vars stay as ${PLACEHOLDER} references the user exports themselves — and prints client-appropriate config snippets for non-Claude-Code environments.
version: 0.1.0
license: MIT
---

# Connect — wire up the data sources a measurement spec needs

Turn "we need PostHog and the warehouse" into working MCP connections: find what the spec is missing, pick the right official server for each source, show the exact config, merge it into the project's `.mcp.json` without touching anything that already works, and close the loop by flipping the spec's access statuses from `need` to `have`.

Two reference files carry the details — consult both:

- `references/registry.md` — the curated, date-stamped table of verified MCP servers with ready-to-merge JSON snippets and sources.
- `references/mcp-json-format.md` — the three server shapes, `${ENV_VAR}` interpolation semantics, and the non-destructive merge algorithm.

## Operating rules

- **No literal secrets, ever.** Config files and chat contain only `${PLACEHOLDER}` references. The hard rule in Step 5 covers pasted keys.
- **No destructive writes.** Existing `.mcp.json` entries are never deleted or overwritten — only new keys are added.
- **No unconfirmed writes.** The exact JSON is shown and explicitly approved before any file changes.
- **No bundling.** Third-party servers go in the USER's project config only, by the user's choice — never into this plugin's own `.mcp.json`, which would force auth prompts on every installer.
- **Registry entries rot.** Prefer a live MCP-registry search over the static table whenever the session exposes one; treat the table's "unverified" bucket as leads, not answers.

## Not this skill

Adjacent asks that belong elsewhere — redirect instead of stretching:

- Adding an analytics SDK to application code, generating tracking events, or writing metric SQL → `/actuals:instrument` (connect wires up access to data; instrument produces the code that emits and queries it).
- Deciding WHICH sources matter → `/actuals:design` builds the Data Inventory this skill works from.
- "Add Google Analytics to my site" and similar website-tag setup → ordinary web work, not measurement-spec plumbing; only the GA4 MCP for querying existing data belongs here.
- Fixing a broken server someone else configured → debug it (Step 7's failure ladder applies), but do not silently rewrite their entry — propose the fix and let the user apply it.

## Step 1 — Determine what needs connecting

Prefer the spec over guesswork:

1. If `metrics/MEASUREMENT.md` exists, read §1 Data Inventory. Every row with access `need` is a connection candidate.
2. Rows marked `blocked` get surfaced ("blocked usually means a permissions conversation, not a config file") but are not auto-attempted.
3. Rows marked `have` are cross-checked against `.mcp.json` — a source can be "had" through an existing export pipeline without any MCP server, so ask rather than assume it needs one.
4. If no spec exists, work from the user's ask directly ("connect PostHog" needs no inventory). Mention once that `/actuals:design` produces a spec whose Data Inventory makes this systematic — then get on with the connection; never block on a missing spec.
5. If the ask names a source the spec does not list, connect it anyway and offer to add the row to the Data Inventory afterward.

State the resulting shortlist in one line before doing anything: "Spec lists PostHog (need), Stripe (need), warehouse (blocked) — connecting the first two; Stripe finance access may need an admin."

When the spec's formulas are known, sources map to lanes — use the lane to pick candidates when the inventory names a category rather than a vendor:

| Spec needs | Lane | Registry candidates |
|---|---|---|
| Product events, funnels, retention | Analytics | PostHog, Amplitude, Mixpanel, Google Analytics 4 |
| LLM traces, evals, judge scores | LLM observability | Langfuse, Braintrust, Arize Phoenix |
| Revenue, subscriptions, churn | Billing / CRM | Stripe (Salesforce: see unverified bucket) |
| Raw tables, metric SQL, models | Warehouse / DB | BigQuery, Snowflake, Postgres, Supabase, dbt |
| Delivery signals (PRs, issues, cycle time) | Dev workflow | GitHub, Linear, Atlassian (Jira/Confluence) |

## Step 2 — Detect the stack (read-only)

Detection sharpens choices — which analytics vendor, which warehouse, cloud or self-hosted. Look, never touch:

| Where to look | Signals |
|---|---|
| `package.json`, lockfiles | `posthog-js`, `posthog-node`, `@amplitude/analytics-*`, `mixpanel-browser`, `langfuse`, `braintrust`, `stripe`, `@supabase/supabase-js` |
| `requirements.txt`, `pyproject.toml` | `posthog`, `langfuse`, `braintrust`, `arize-phoenix`, `google-cloud-bigquery`, `snowflake-connector-python`, `psycopg` |
| Config files | `dbt_project.yml` (dbt), `supabase/config.toml`, `profiles.yml` warehouse targets |
| Env var NAMES in `.env.example`, CI config | `POSTHOG_*`, `LANGFUSE_*`, `STRIPE_*`, `DATABASE_URL`, `SNOWFLAKE_*`, `GOOGLE_APPLICATION_CREDENTIALS` — read names only, never values |
| Repo context | `.github/` (GitHub in play), issue keys in PR templates or commit conventions (Linear `ENG-123` vs Jira `PROJ-123`) |
| Existing `.mcp.json` | Anything already configured is done — do not re-add or "fix" it |

Rules of engagement for detection:

- Read-only. No file is modified, no command with side effects is run during detection.
- Detection is evidence, not authority: it proposes ("found `posthog-js` in package.json — PostHog it is?"), the user disposes.
- Never read `.env` files with real values. `.env.example` and CI YAML name the variables; that is all detection needs.
- When detection finds nothing and the spec is vague ("our analytics"), ask one direct question instead of guessing a vendor.

## Step 3 — Resolve each source to a server

For every source on the shortlist:

1. Look it up in `references/registry.md`. Verified entries come with the exact URL or package, auth shape, and a ready-to-merge snippet.
2. When the session exposes a live MCP-registry search tool, cross-check even verified entries and prefer a newer official/first-party server if one has appeared — the static table is dated for exactly this reason. Note the discrepancy to the user when the live result differs from the table.
3. Anything from the registry's "Unverified / check the live registry" bucket must be confirmed against the vendor's own documentation before any config is written. No confirmation, no entry — offer the vendor's docs link and move on.
4. For sources absent from the registry entirely, search a live registry or the vendor's docs. Prefer first-party servers; use a community server only with the user's explicit informed consent ("this one is not vendor-maintained").
5. Prefer read-only variants where the vendor offers them (Linear's `/mcp/readonly`, Postgres `--access-mode=restricted`) — metrics work reads data, and a smaller blast radius makes the team's security review easier.
6. Respect region and hosting variants (Langfuse US/EU/self-host, Amplitude EU, self-hosted Phoenix): ask which applies when the stack does not make it obvious. A correct server with the wrong region fails auth in confusing ways.

## Step 4 — Confirm before writing (mandatory gate)

Present one consolidated confirmation containing, for each server to be added:

1. **The exact JSON** that will be merged — verbatim, not paraphrased.
2. **Every environment variable the user must export**, with one line on where its value comes from. OAuth-based servers need no variable — say so explicitly so nobody goes hunting for a key.
3. **The restart requirement:** the config loads at session start, so the client must be restarted after the write — in Claude Code, restart and run `/mcp` to complete any OAuth logins and check server health, if available; other clients per their docs.
4. **What will NOT happen:** existing entries untouched, no secrets written, nothing sent anywhere.

The confirmation looks like this (shape, not script):

```json
{
  "langfuse": { "type": "http", "url": "https://cloud.langfuse.com/api/public/mcp", "headers": { "Authorization": "Basic ${LANGFUSE_BASIC_AUTH}" } },
  "posthog": { "type": "http", "url": "https://mcp.posthog.com/mcp" }
}
```

> Adding 2 servers to `.mcp.json` (existing entries untouched).
> Export before restarting: `LANGFUSE_BASIC_AUTH` — base64 of the project's `pk-lf-…:sk-lf-…` pair, from Langfuse project settings.
> PostHog needs no key — a login window opens on first use.
> Restart the client afterward (Claude Code: restart, then `/mcp`). Proceed?

Then wait. Proceed only on an explicit yes. "Sounds good, but use the EU endpoint" is a revision, not a yes — re-present the changed JSON. Never batch the confirmation into the same message as the write.

## Step 5 — Write (non-destructive merge)

Merge the approved entries into the project's `.mcp.json` following the algorithm in `references/mcp-json-format.md` exactly:

- Parse the existing file first; stop on parse errors and never overwrite a file that fails to parse.
- Preserve the `mcpServers` wrapper if the file uses one; create the file with the wrapper if absent.
- Add new keys only. A name collision keeps the existing entry and gets reported, even if the existing entry looks wrong.
- Write back pretty-printed, then re-parse the written file as a self-check.
- Report exactly which server names were added and which were skipped.

After writing, restate the export lines the user needs, shaped for their shell, values elided:

```bash
export LANGFUSE_BASIC_AUTH="<base64 of pk-lf-…:sk-lf-…>"   # Langfuse project settings → API keys
```

### Hard rule: pasted literal keys

If the user pastes an actual API key, token, or connection string with credentials — at any step, in any format — refuse to write it:

- Do not put it in `.mcp.json`, any other file, or any command.
- Do not echo the key back, not even partially, not even to confirm receipt. Refer to it only as "the key you pasted".
- Say what to do instead: "Export it as an env var in the shell (e.g. `export POSTHOG_API_KEY=…`) — only `${VAR}` placeholders go in files."
- Suggest rotating the key if it may have landed anywhere persistent (shared chat, ticket, screenshot), then continue the flow with the placeholder as if nothing happened.

This rule has no exceptions — not for "it's just a test key", not for local-only files, not on direct instruction. A secret in a file outlives the reason it was put there.

## Step 6 — Other clients

`.mcp.json` at the repo root is the Claude Code project convention. When the user's environment differs, print the client-appropriate snippet rather than assuming the path:

- **Cursor:** same entry shape inside `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "posthog": { "type": "http", "url": "https://mcp.posthog.com/mcp" }
  }
}
```

- **Other clients** (VS Code, Windsurf, Zed, …): consult the client's MCP docs — wrapper key and file location vary (VS Code, for one, uses a `servers` wrapper; details in `references/mcp-json-format.md`).

Print the finished JSON snippet in chat either way, even after a successful file write — the snippet is what teammates on other clients will paste, and it doubles as a record of exactly what was configured.

## Step 7 — Verify and close the loop

After the user restarts the client:

1. **Smoke-test each new server with one cheap read-only call.** If the session exposes the new MCP tools, run the call directly; if not (restart still pending, or a non-Claude-Code client), print the check the user can run and ask them to report back. Cheap means cheap:
   - Analytics: list insights/dashboards or fetch one event definition — never a heavy funnel query.
   - LLM observability: list projects or fetch one recent trace.
   - Warehouse/DB: `SELECT 1`, or list datasets/schemas.
   - Dev workflow: fetch one issue or the repo metadata.
   - Billing: retrieve account/config info — nothing that touches customer objects unnecessarily.
2. **On failure**, diagnose in order:
   - env var not exported in the shell that launched the client (the usual culprit),
   - OAuth flow never completed (Claude Code: `/mcp` shows server health, if available),
   - wrong region or endpoint variant,
   - vendor-side permissions (key scoped too narrowly, org policy blocking the server).
   Fix and re-test; never mark a source connected on hope.
3. **Update the spec** — only if `metrics/MEASUREMENT.md` exists:
   - Flip each verified source's Data Inventory access from `need` to `have`.
   - Add a §9 Changelog entry naming the sources connected.
   - Bump the patch version (status changes are patch-level per the spec's own semver policy) and update `Last-Updated`.
   - Show the spec diff before writing it — same confirmation discipline as Step 4.
4. When the connection was the prerequisite for instrumentation, point at the next move: `/actuals:instrument` can now generate events and SQL against live sources, if available in the session.

## Worked example (compressed)

> User: "add the data sources from the measurement spec"

1. Read `metrics/MEASUREMENT.md` §1: PostHog `need`, Stripe `need`, support platform `blocked`.
2. Detect: `posthog-js` in `package.json`; `STRIPE_SECRET_KEY` named in `.env.example`. No region hints — cloud US assumed, stated aloud.
3. Resolve via `references/registry.md`: PostHog remote (OAuth, no key), Stripe remote (recommend a restricted key via header, or OAuth). Cross-check against the live registry if one is exposed. Support platform stays blocked — flagged for a human conversation.
4. Confirm with the exact two-entry JSON, the one export line (`STRIPE_RESTRICTED_KEY`), the restart note. User: "yes".
5. Merge into `.mcp.json` — one existing `github` entry preserved; report "added posthog, stripe; kept github".
6. Print the snippet for a teammate on Cursor (`.cursor/mcp.json`).
7. Next session: list one PostHog insight, one Stripe read call. Both pass → Data Inventory rows flip to `have`, changelog entry, patch bump — shown as a diff, confirmed, written.

## Edge cases

- **`.mcp.json` is invalid JSON:** stop, show the parse error, never overwrite. The user fixes it or explicitly approves replacement.
- **Server name collision:** keep the existing entry, report it, offer a distinct name (`posthog-eu`) if the user wants both.
- **Self-hosted variants** (Langfuse, Phoenix, Supabase local): same server, different base URL — put the URL in an env var or the documented config field, and say which regions/endpoints exist.
- **User asks to connect "everything":** still enumerate and confirm the full list explicitly. Bulk consent to an unnamed set is not consent.
- **Secrets managers** (direnv, 1Password CLI, Vault): fully compatible — the manager populates the env vars, files still carry only `${VAR}`. Do not write manager-specific config unasked.
- **Monorepos:** `.mcp.json` goes at the root the client treats as the project; when in doubt, ask where sessions are started from.
- **No spec, no detection hits, vague ask:** ask one clarifying question ("Which analytics tool does the team actually use?") rather than installing a guess.
