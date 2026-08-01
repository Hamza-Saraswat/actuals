# Metrics Audit — {scope} — {YYYY-MM-DD}

- **Auditor:** Actuals (actuals:audit v0.1.0)
- **Inputs reviewed:** {files / dashboards / decks, listed}
- **Mode:** {standalone | spec-aware (spec v{X.Y.Z})}
- **Catalog:** VM-01..VM-20

## Verdict

{One paragraph, plain language. Lead with the most consequential finding and its practical effect on decisions being made with these numbers. If things mostly held up, say that with equal directness.}

## Findings

{Critical first, then warning, then info. One block per finding:}

### {n}. {VM-xx · Pattern name} — {critical|warning|info}

- **Where:** {file:line / dashboard tile / slide — quote the exact number or text}
- **Why it lies:** {one sentence tied to this artifact, not generic}
- **Receipt:** {evidence key + one-line citation, within what the source licenses}
- **Fix:** {concrete replacement with formula/source; smallest change that makes the number honest}

## The three numbers to delete first

1. {metric} → replace with {replacement + formula}
2. {metric} → replace with {…}
3. {metric} → replace with {…}

## What survives

{Metrics that passed the three tests (decision-relevance, honest denominator, causal warrant), named. If nothing survives, say so.}

## Spec updates {spec-aware mode only — delete otherwise}

- Version: {old} → {new} ({patch|minor|major}) — {reason}
- Changelog entry added: {yes}
- Next-Review: {date}

## Next actions

1. {ordered, assignable, smallest-first}
2. {…}
