# Answer key: expected audit findings — acme-support-ai

An audit run over `dashboard-export.csv`, `tracking-plan.csv`, and `queries.sql` MUST catch **at least 10 of the 13 distinct seeded patterns** below, must never endorse the dollarized "estimated value" metric, and must write its report in the audit-report template format.

`scan` = mechanically detectable by `vanity-scan.mjs` (regression-test the scanner against these).
`judgment` = only the model's judgment pass can catch it (scanner stays silent — that's expected).

## dashboard-export.csv

| Seeded pattern | Where | Detectability |
|---|---|---|
| VM-06 Denominator-Free Count | "Total Ava conversations 152,340" | scan |
| VM-08 Cumulative-Ever Metric | "since launch" | scan |
| VM-01 Self-Reported Time Savings | "Hours saved per week (agent survey)" | scan |
| VM-02 Minutes-times-Wage Dollarization | "$89,280 / month … 1,240 hrs × $72/hr" | scan |
| VM-03 Adoption-as-Impact | "87% of support team using Ava" | scan |
| VM-05 Acceptance-Rate Theater | "64% acceptance rate" | scan |
| VM-04 Activity Volume Proxy | "3.1x more messages" / "Messages per agent per day" | scan |
| VM-09 Peak Cherry-Pick | "hit 41% (week of Mar 3)" / "best week" | scan |
| VM-14 Baseline-Free Delta | "improved 34%" with no pre-period anywhere | scan |
| VM-10 Survivor-Only Funnel | "CSAT among active Ava users … excludes churned" | scan |
| VM-16 Sentiment-as-Outcome | "Agent NPS +62 … the team loves it" | scan |
| VM-19 Composite Value-Score Opacity | "AI Productivity Index 8.2 … weighted composite" | scan |
| VM-17 Missing Counter-Metric | whole file: no reopen/cost/escalation/review metric anywhere | scan (file-level) |

## tracking-plan.csv

| Seeded pattern | Where | Detectability |
|---|---|---|
| VM-20 Orphan Metric | owners "TBD" / "N/A" on 5 rows | scan |
| VM-07 Double-Counted Value | `chat_started` vs `conversation_begun` vs `widget_opened` — three events, one user action; `ticket_deflected` vs `ticket_deflected_strict` both feeding "deflection" | judgment |

## queries.sql

| Seeded pattern | Where | Detectability |
|---|---|---|
| VM-01 | comment "assume 6 min saved per conversation" | scan |
| VM-02 | `* 72 … 6 min × $72/hr fully loaded` | scan |
| VM-10 | `WHERE a.churned = false AND a.ava_disabled = false` | scan |
| VM-14 | "improved 34% … whatever last quarter felt like" | scan |

## Also acceptable (bonus findings, not required)

- VM-18 on `ava_replied` vs `ava_reply_v2` (metric continuity across pipeline change).
- VM-13 if the audit notes the board-deck framing extrapolates the best week.

## Hard requirements

1. ≥10 of the 13 distinct patterns above (dedup by VM id across files).
2. Zero endorsements: the report must not praise or keep "Estimated value $89,280" or "hours saved" in any recommended metric set.
3. Every critical finding carries a concrete replacement (the `MEASUREMENT.md` in this directory shows the canonical ones).
