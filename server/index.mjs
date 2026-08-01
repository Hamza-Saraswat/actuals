#!/usr/bin/env node
// Actuals MCP server — "checks as tools."
// Exposes the plugin's deterministic checks (spec_lint, vanity_scan) over the
// Model Context Protocol so CI bots and other agents can run them without the
// skills loaded. Thin wrapper over the same library functions the skills use —
// one source of truth (see CLAUDE.md).
// Transport: JSON-RPC 2.0, newline-delimited, over stdio. Zero dependencies. Node >= 18.

import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { lintSpec } from '../skills/design/scripts/spec-lint.mjs';
import { scanFiles } from '../skills/audit/scripts/vanity-scan.mjs';

const SERVER_INFO = { name: 'actuals', version: '0.1.0' };
const PROTOCOL_FALLBACK = '2025-06-18';

const TOOLS = [
  {
    name: 'spec_lint',
    description:
      'Validate an Actuals measurement spec (MEASUREMENT.md) against the schema: required header fields, 3-5 outcome metrics with all fields, guardrail coverage, eval-to-outcome mappings, changelog consistency. Returns { valid, errors[], warnings[] }. Path is resolved from the server working directory (typically the project root).',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Path to the MEASUREMENT.md file, e.g. "metrics/MEASUREMENT.md"' } },
      required: ['path'],
    },
  },
  {
    name: 'vanity_scan',
    description:
      'Mechanically scan metrics artifacts (CSV/SQL/JSON/Markdown dashboards, tracking plans, reports) for CANDIDATE vanity-metric findings against the Actuals 20-pattern anti-pattern catalog (VM-01..VM-20). Candidates are not verdicts — adjudicate each in context. Returns { candidates: [{ patternId, name, severity, file, line, excerpt }] }.',
    inputSchema: {
      type: 'object',
      properties: { paths: { type: 'array', items: { type: 'string' }, description: 'Files to scan' } },
      required: ['paths'],
    },
  },
];

function handleToolCall(name, args) {
  if (name === 'spec_lint') {
    if (!args || typeof args.path !== 'string') throw { code: -32602, message: 'spec_lint requires { path: string }' };
    let text;
    try {
      text = readFileSync(args.path, 'utf8');
    } catch (e) {
      return { ok: false, error: `Cannot read ${args.path}: ${e.message}` };
    }
    return lintSpec(text);
  }
  if (name === 'vanity_scan') {
    if (!args || !Array.isArray(args.paths) || args.paths.length === 0 || !args.paths.every((p) => typeof p === 'string')) {
      throw { code: -32602, message: 'vanity_scan requires { paths: string[] } with at least one path' };
    }
    try {
      return { candidates: scanFiles(args.paths), note: 'Candidates, not findings — adjudicate each in context.' };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  throw { code: -32602, message: `Unknown tool: ${name}` };
}

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function respondError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    respondError(null, -32700, 'Parse error');
    return;
  }
  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;

  try {
    switch (method) {
      case 'initialize':
        respond(id, {
          protocolVersion: params?.protocolVersion || PROTOCOL_FALLBACK,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        });
        break;
      case 'notifications/initialized':
      case 'notifications/cancelled':
        break; // notifications get no response
      case 'ping':
        respond(id, {});
        break;
      case 'tools/list':
        respond(id, { tools: TOOLS });
        break;
      case 'tools/call': {
        const result = handleToolCall(params?.name, params?.arguments);
        respond(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: result && result.ok === false,
        });
        break;
      }
      default:
        if (!isNotification) respondError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    if (!isNotification) respondError(id, e.code ?? -32603, e.message ?? String(e));
  }
});

process.stdin.on('close', () => process.exit(0));
