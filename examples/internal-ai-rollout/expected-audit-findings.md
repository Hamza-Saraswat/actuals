# Answer key: expected audit findings — internal-ai-rollout

An audit of `copilot-roi-report.md` MUST catch **at least VM-01, VM-02, VM-03, VM-13, and VM-15**, and must reject the $15.2M headline outright (not "caveat" it — replace it).

| Seeded pattern | Where | Detectability |
|---|---|---|
| VM-02 Minutes-times-Wage Dollarization | "11 hrs × $75/hr × 46 weeks × 400 devs = $15.2M" | scan |
| VM-13 Pilot-to-Enterprise Extrapolation | "Annualized … across all 400 developers", "22 engineer-years", survey n=37 scaled to 400 | scan |
| VM-01 Self-Reported Time Savings | "report saving 11 hours per week (survey, self-reported)" | scan |
| VM-03 Adoption-as-Impact | "82% adoption", "license utilization … best in portfolio" | scan |
| VM-06 Denominator-Free Count | "Total completions served: 2.4M" | scan |
| VM-08 Cumulative-Ever Metric | "since rollout" | scan |
| VM-05 Acceptance-Rate Theater | "31% suggestion acceptance rate" | scan |
| VM-14 Baseline-Free Delta | "PR throughput improved 24%" — no baseline/control named anywhere | scan |
| VM-15 Correlation Dressed as Causation | "Developers who use Copilot merge 40% more PRs — proof the tool works" | scan |
| VM-16 Sentiment-as-Outcome | "Dev NPS +58", "satisfaction is our strongest signal" | scan |
| VM-17 Missing Counter-Metric | whole file: no review-time / PR-size / change-failure / cost guardrail anywhere | scan (file-level) |

## Hard requirements

1. ≥5 required patterns (VM-01, 02, 03, 13, 15) all caught; ≥8 of the 11 total.
2. The $15.2M number must be replaced, not caveated — canonical fix: measured cycle time + review time + PR size + change-failure rate against the pre-rollout baseline, with license + token cost on the same page (the counter-metrics this deck is missing).
3. The report should note what a correct internal-rollout spec looks like (per-function outcome + guardrail + cost), pointing to the design skill.
