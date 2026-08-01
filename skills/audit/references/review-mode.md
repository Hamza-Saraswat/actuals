# Review Mode — the recurring spec-aware re-audit

Runs on top of the standard audit whenever `metrics/MEASUREMENT.md` exists (or `$ARGUMENTS` contains `review`). This is the maintenance loop that keeps a spec from becoming the thing it was written to prevent.

## Checklist

Work through all six; report per finding like any other audit finding (severity + evidence + fix).

1. **Formula drift** — for each spec metric with live instrumentation, compare the spec's formula against the deployed artifact (SQL model, dashboard definition, tracked event). Any divergence is VM-18 (`critical`): either the spec is stale (fix the spec, minor bump) or the implementation silently changed the metric (fix the implementation, annotate the series break).
2. **Definition rot in the wild** — scan provided dashboards/queries for redefinitions not reflected in the changelog ("as of March we count…"). Same VM-18 handling.
3. **Stale owners** — every Owner in §3/§4 still real and responsive? Unclaimed metrics become VM-20 findings; propose a named replacement or deletion.
4. **Calibration overdue** — §5 evals: is `last calibrated` older than the §8 cadence? Overdue judge = VM-12 (`warning`, escalate to `critical` if judge scores appeared in any exec-facing artifact since).
5. **Claims Ledger violations** — did anyone claim, in decks/docs provided, something §7 marks `blocked`? Quote it; severity `critical`; the fix is a retraction or the evidence work that licenses the claim.
6. **Cadence health** — if `Next-Review` is more than two cadence periods in the past, set spec `Status: stale` and say so in the verdict. A stale spec is honest; a confidently wrong one is not.

## Version bump and changelog

Close every review by updating the spec:

- **patch** — statuses, owners, calibration dates, access statuses.
- **minor** — metric added, formula changed, guardrail added, eval remapped.
- **major** — north star or the Decision changed. A major bump means the spec should be re-derived: recommend a fresh design interview rather than in-place surgery.

Changelog entry format (newest first): `- <version> — YYYY-MM-DD — <change> — <reason: audit finding VM-xx | drift | calibration | business change>`. Update `Last-Updated` and `Next-Review`. Run spec-lint if Node is available.

## Drift review vs re-design

Review mode edits the spec; it does not redesign it. If review findings imply the chain itself is wrong (the AI's role changed, the Decision evaporated, the north star moved), stop patching and recommend `/actuals:design` in update mode — that is the major-bump path.
