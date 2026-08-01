# .mcp.json — shapes, interpolation, and the non-destructive merge

The project-level MCP config is a JSON file at the repo root named `.mcp.json`. Claude Code's canonical form wraps all servers in a single `mcpServers` object:

```json
{
  "mcpServers": {
    "<server-name>": { }
  }
}
```

Server names are lowercase, short, and stable (`posthog`, `bigquery`) — tools surface under the server name, so pick the obvious one.

## The three server shapes

**stdio** — a local process the client spawns. Secrets and settings ride in `env`:

```json
{ "phoenix": { "command": "npx", "args": ["-y", "@arizeai/phoenix-mcp@latest"], "env": { "PHOENIX_API_KEY": "${PHOENIX_API_KEY}" } } }
```

**http** (streamable HTTP) — a remote endpoint. `type` is required; `headers` is optional (omit it for OAuth servers, which open a browser login on first use):

```json
{ "langfuse": { "type": "http", "url": "https://cloud.langfuse.com/api/public/mcp", "headers": { "Authorization": "Basic ${LANGFUSE_BASIC_AUTH}" } } }
```

**sse** — legacy remote transport, same shape with `"type": "sse"` (and optional `headers`). Only use it when a vendor documents no streamable-HTTP endpoint; most have migrated, and several (e.g. Linear) explicitly deprecate their `/sse` URLs.

```json
{ "legacy-server": { "type": "sse", "url": "https://example.com/sse" } }
```

Notes that apply to all three shapes:

- One server = one key. Everything about a connection lives inside its entry; there is no cross-entry state.
- `headers` keys are sent verbatim — vendors are case-tolerant on `Authorization` but exact on custom headers (`Stripe-Account`).
- Prefer `env` over CLI args for anything secret in stdio servers: process args are visible in `ps` output, environment variables are not passed to the process list.

## `${ENV_VAR}` interpolation

- `${VAR}` inside `command`, `args`, `env` values, `url`, and `headers` is expanded by the client at launch from the environment the client was started in. Claude Code also supports the `${VAR:-default}` fallback form.
- This is the entire secrets story: the user runs `export LANGFUSE_BASIC_AUTH=…` in their shell (or shell profile), and the file only ever contains the reference. The file stays safe to commit; the secret never does.
- If the variable is unset, the server typically fails to authenticate at startup — that shows up in the client's MCP status (in Claude Code: `/mcp`, if available), not as a silent misconfiguration.
- Changing an exported variable requires restarting the client; the file is read and expanded at session start.

## The non-destructive merge algorithm

Never regenerate `.mcp.json` from scratch. Merge:

1. **Read** the existing `.mcp.json` if present. If it does not exist, start from `{ "mcpServers": {} }`.
2. **Parse** it as JSON. If parsing fails, STOP — show the parse error and ask the user to fix or approve replacement. Never overwrite a file that fails to parse; it may contain hand-edited entries worth saving.
3. **Locate the server map.** If the file has an `mcpServers` key, that object is the map — preserve the wrapper and every sibling key untouched. If the file is a bare map of server entries (some hand-rolled files skip the wrapper), treat the top level as the map and keep that style.
4. **Add new keys only.** For each server to add: if the name is absent, insert it. If the name already exists, do NOT touch it — even if its config looks wrong or outdated. Report the collision ("`posthog` already configured — leaving the existing entry alone") and let the user decide; on request, add the new one under a distinct name (e.g. `posthog-eu`).
5. **Never delete or rewrite** any existing entry, key ordering aside. Existing servers, comments-via-unknown-keys, and unrelated top-level keys all survive verbatim.
6. **Write back pretty-printed** (2-space indent, trailing newline) and re-parse the written file as a self-check. A one-liner works when Node is available: `node -e "JSON.parse(require('fs').readFileSync('.mcp.json','utf8'))"` — otherwise eyeball the balanced braces.
7. **Report the diff**: list exactly which server names were added and which were skipped.

The same algorithm applies to `.cursor/mcp.json` or any other client file the user asks to be written: read, parse, add-only, pretty-print.

## Project scope vs user scope

- **Project scope** (`.mcp.json` at the repo root) is the default for this skill: connections belong to the project, are shared with teammates via version control, and contain no secrets thanks to `${VAR}` references. Claude Code asks each user to approve a project's servers on first use.
- **User scope** (personal config covering all projects — in Claude Code, `claude mcp add --scope user …`, if available) suits personal tokens or servers the user wants everywhere. Do not write user-scope config files directly; print the command or snippet and let the user run it.

## Other clients

The server entry itself is portable; only the file location and wrapper key vary:

- **Cursor** — `.cursor/mcp.json` in the project (or `~/.cursor/mcp.json` globally), same `mcpServers` wrapper, same entry shape.
- **Other clients** (VS Code, Windsurf, Zed, …) — consult the client's MCP docs; some rename the wrapper (VS Code uses `servers`) or nest it in a larger settings file.

Either way, print the finished snippet in chat so the user can paste it wherever their client expects it — the JSON entry is the deliverable, the file write is a convenience.
