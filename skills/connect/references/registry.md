# MCP server registry (curated, verified)

Last verified: 2026-08-01 — entries rot; when a live MCP registry search tool is available in the session, prefer it over this table.

How to read this file:

- **Verified** means the URL/package and auth shape were confirmed against vendor documentation (or the vendor's official repository) on the date above. Sources are linked under each snippet.
- Every snippet is a ready-to-merge entry for the `mcpServers` object in the user's project `.mcp.json` (merge rules: `references/mcp-json-format.md`). Snippets show only the inner entry — preserve the `mcpServers` wrapper when merging.
- `${PLACEHOLDER}` values are environment-variable references the user exports in their shell before starting the client. Never replace them with literal keys in any file.
- "OAuth" auth means no secret goes in the config at all — the client opens a browser login on first use (in Claude Code: restart, then run `/mcp` to complete the flow, if available).

## Verified servers

| Tool | Server | Transport | Auth | Notes |
|---|---|---|---|---|
| PostHog | `https://mcp.posthog.com/mcp` | http | OAuth login on first use | Auth server routes to US/EU region automatically |
| Langfuse | `https://cloud.langfuse.com/api/public/mcp` | http | Basic — base64 of `pk-lf-…:sk-lf-…` | US: `us.cloud.langfuse.com`; self-host: `<base-url>/api/public/mcp` |
| Braintrust | `https://api.braintrust.dev/mcp` | http | OAuth (SSO-compatible) or API key | BTQL queries over experiments and logs, docs search |
| Arize Phoenix | `@arizeai/phoenix-mcp` (npm) | stdio | `PHOENIX_API_KEY` env | Set `PHOENIX_HOST` to the cloud or self-hosted base URL |
| GitHub | `https://api.githubcopilot.com/mcp/` | http | OAuth or PAT bearer header | Local Docker image `ghcr.io/github/github-mcp-server` also exists |
| Linear | `https://mcp.linear.app/mcp` | http | OAuth 2.1 (browser) or API-key bearer | Read-only endpoint: `https://mcp.linear.app/mcp/readonly` — prefer it for metrics work |
| Atlassian (Jira/Confluence) | `https://mcp.atlassian.com/v1/mcp/authv2` | http | OAuth 2.1 (API token optional) | One server covers Jira, Confluence, Bitbucket with existing permissions |
| Stripe | `https://mcp.stripe.com` | http | OAuth or bearer with restricted API key | Optional `Stripe-Account` header for connected accounts |
| Supabase | `https://mcp.supabase.com/mcp` | http | OAuth (dynamic client registration) or PAT bearer | Local dev via CLI: `http://localhost:54321/mcp` |
| dbt | `dbt-mcp` (uvx) | stdio | `DBT_TOKEN` + host/env-id vars | Hosted remote MCP also exists on the dbt platform (see docs) |
| Amplitude | `https://mcp.amplitude.com/mcp` | http | OAuth login on first use | EU residency: `https://mcp.eu.amplitude.com/mcp` |
| Mixpanel | `https://mcp.mixpanel.com/mcp` | http | OAuth; service accounts (beta) for automation | Query funnels, cohorts, metrics conversationally |
| Snowflake | `snowflake-labs-mcp` (uvx) | stdio | Snowflake connection config | Official Snowflake-Labs; requires a service-config YAML (see repo) |
| Google BigQuery | `@toolbox-sdk/server` (npx) | stdio | Application Default Credentials | Google's MCP Toolbox, `--prebuilt bigquery` mode |
| Google Analytics 4 | `analytics-mcp` (pipx) | stdio | ADC with `analytics.readonly` scope | Official Google Analytics server |
| Postgres | `postgres-mcp` (pipx or Docker) | stdio | `DATABASE_URI` env | Maintained community server (Crystal DBA); use `--access-mode=restricted` |

### PostHog

```json
{ "posthog": { "type": "http", "url": "https://mcp.posthog.com/mcp" } }
```

No secret in the file: a login prompt appears on first use and routes to the correct region. PostHog also ships a setup wizard (`npx @posthog/wizard mcp add`) as an alternative.
Source: https://posthog.com/docs/model-context-protocol

### Langfuse

```json
{ "langfuse": { "type": "http", "url": "https://cloud.langfuse.com/api/public/mcp", "headers": { "Authorization": "Basic ${LANGFUSE_BASIC_AUTH}" } } }
```

`LANGFUSE_BASIC_AUTH` = base64 of `<public-key>:<secret-key>` (project-scoped `pk-lf-…`/`sk-lf-…` pair). US region uses `https://us.cloud.langfuse.com/api/public/mcp`; self-hosted uses `<your-base-url>/api/public/mcp`.
Source: https://langfuse.com/docs/api-and-data-platform/features/mcp-server

### Braintrust

```json
{ "braintrust": { "type": "http", "url": "https://api.braintrust.dev/mcp" } }
```

OAuth on first use (works with SSO). API-key auth is also supported: add `"headers": { "Authorization": "Bearer ${BRAINTRUST_API_KEY}" }` for non-interactive use.
Source: https://www.braintrust.dev/docs/integrations/developer-tools/mcp

### Arize Phoenix

```json
{ "phoenix": { "command": "npx", "args": ["-y", "@arizeai/phoenix-mcp@latest"], "env": { "PHOENIX_API_KEY": "${PHOENIX_API_KEY}", "PHOENIX_HOST": "${PHOENIX_HOST}" } } }
```

`PHOENIX_HOST` is the Phoenix base URL (cloud or self-hosted). The package also accepts `--baseUrl`/`--apiKey` flags — prefer the env form so the key never appears in a file.
Source: https://github.com/Arize-ai/phoenix/tree/main/js/packages/phoenix-mcp

### GitHub

```json
{ "github": { "type": "http", "url": "https://api.githubcopilot.com/mcp/", "headers": { "Authorization": "Bearer ${GITHUB_PAT}" } } }
```

Omit `headers` entirely to use the browser OAuth flow instead of a PAT, in clients that support it. A local Docker option (`ghcr.io/github/github-mcp-server`, env `GITHUB_PERSONAL_ACCESS_TOKEN`) exists for orgs that block the remote endpoint.
Source: https://github.com/github/github-mcp-server

### Linear

```json
{ "linear": { "type": "http", "url": "https://mcp.linear.app/mcp" } }
```

OAuth 2.1 with dynamic client registration — browser login on first use; a Linear API key as a bearer header also works. For metrics work prefer the read-only endpoint: `https://mcp.linear.app/mcp/readonly`. Legacy SSE endpoint `/sse` is deprecated.
Source: https://linear.app/docs/mcp

### Atlassian (Jira / Confluence)

```json
{ "atlassian": { "type": "http", "url": "https://mcp.atlassian.com/v1/mcp/authv2" } }
```

OAuth 2.1 browser flow on first use (API-token auth optional). Grants tools across Jira, Confluence, and Bitbucket with the user's existing permissions — scope access deliberately.
Source: https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/

### Stripe

```json
{ "stripe": { "type": "http", "url": "https://mcp.stripe.com" } }
```

OAuth consent on connect. For header auth use `"headers": { "Authorization": "Bearer ${STRIPE_RESTRICTED_KEY}" }` — Stripe recommends a restricted API key, never the full secret key. Connected accounts add a `"Stripe-Account"` header.
Source: https://docs.stripe.com/mcp

### Supabase

```json
{ "supabase": { "type": "http", "url": "https://mcp.supabase.com/mcp" } }
```

OAuth via dynamic client registration (browser login). For CI/non-interactive use add `"headers": { "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}" }` (personal access token). Local development via the Supabase CLI exposes `http://localhost:54321/mcp`.
Source: https://supabase.com/docs/guides/getting-started/mcp

### dbt

```json
{ "dbt": { "command": "uvx", "args": ["dbt-mcp"], "env": { "DBT_HOST": "${DBT_HOST}", "DBT_TOKEN": "${DBT_TOKEN}", "DBT_PROD_ENV_ID": "${DBT_PROD_ENV_ID}" } } }
```

Platform-connected mode shown; local-project mode uses `DBT_PROJECT_DIR` instead. Full variable list: https://docs.getdbt.com/docs/dbt-ai/mcp-environment-variables. A hosted remote MCP endpoint also exists on the managed dbt platform — check the dbt docs for its current URL before preferring it.
Source: https://docs.getdbt.com/docs/dbt-ai/about-mcp

### Amplitude

```json
{ "amplitude": { "type": "http", "url": "https://mcp.amplitude.com/mcp" } }
```

Hosted remote server, login on connect; available on all plans. EU data residency uses `https://mcp.eu.amplitude.com/mcp`.
Source: https://amplitude.com/docs/amplitude-ai/amplitude-mcp

### Mixpanel

```json
{ "mixpanel": { "type": "http", "url": "https://mcp.mixpanel.com/mcp" } }
```

OAuth for interactive use; service accounts (beta) exist for CI and shared setups — see the vendor docs for that variant.
Source: https://docs.mixpanel.com/docs/mcp

### Snowflake

```json
{ "snowflake": { "command": "uvx", "args": ["snowflake-labs-mcp", "--service-config-file", "${SNOWFLAKE_MCP_CONFIG}"] } }
```

Official Snowflake-Labs server (Cortex agents/search/analyst, object management, SQL). `SNOWFLAKE_MCP_CONFIG` is the path to a tools/service config YAML the user writes first; Snowflake connection settings (account, user, auth) are supplied per the repo README — follow it before merging this entry.
Source: https://github.com/Snowflake-Labs/mcp

### Google BigQuery

```json
{ "bigquery": { "command": "npx", "args": ["-y", "@toolbox-sdk/server", "--prebuilt", "bigquery", "--stdio"], "env": { "BIGQUERY_PROJECT": "${BIGQUERY_PROJECT}" } } }
```

Google's MCP Toolbox for Databases in prebuilt-BigQuery mode. Auth is Application Default Credentials — run `gcloud auth application-default login` first; the account needs BigQuery User (or equivalent). A downloadable `toolbox` binary and `brew install mcp-toolbox` are alternatives to npx.
Source: https://docs.cloud.google.com/bigquery/docs/pre-built-tools-with-mcp-toolbox

### Google Analytics 4

```json
{ "google-analytics": { "command": "pipx", "args": ["run", "analytics-mcp"], "env": { "GOOGLE_APPLICATION_CREDENTIALS": "${GOOGLE_APPLICATION_CREDENTIALS}", "GOOGLE_PROJECT_ID": "${GOOGLE_PROJECT_ID}" } } }
```

Official Google Analytics server. Uses ADC with the read-only scope `https://www.googleapis.com/auth/analytics.readonly`; `GOOGLE_APPLICATION_CREDENTIALS` is a path to a credentials JSON, not a key value.
Source: https://github.com/googleanalytics/google-analytics-mcp

### Postgres (community)

```json
{ "postgres": { "command": "postgres-mcp", "args": ["--access-mode=restricted"], "env": { "DATABASE_URI": "${DATABASE_URI}" } } }
```

Maintained community server (Crystal DBA, `pipx install postgres-mcp`; Docker image `crystaldba/postgres-mcp`). `restricted` mode is read-only with resource limits — the right default for metrics; `unrestricted` exists for dev databases. `DATABASE_URI` is a full connection string and contains the password — it stays in the environment, never in a file.
Source: https://github.com/crystaldba/postgres-mcp

## Unverified / check the live registry

Could not be confirmed end-to-end from vendor docs on the date above. Confirm against vendor documentation (or a live MCP registry search) before writing any config for these.

- **Salesforce** — an official server exists (`@salesforce/mcp`, the Salesforce DX MCP Server; auth rides on locally authenticated `sf` CLI orgs, explicitly allowlisted at startup — no secrets in config), but the exact startup flags (org allowlist, toolset selection) were not confirmed. Search "Salesforce DX MCP server" and read the `@salesforce/mcp` README before writing an entry.
- **Anything not in the table** — search a live MCP registry (query: the vendor name + "MCP server official"), prefer entries documented on the vendor's own domain, and treat community servers as requiring explicit user consent plus a note that they are not first-party.
