# Evidence: the receipts

Published findings cited by the anti-pattern catalog. Cite these in audit findings so reports are defensible, with the evidence key in brackets (e.g. `[METR]`). Each entry states exactly what the source licenses you to say — do not stretch a claim past its column.

## [METR] — Self-reports invert reality

METR randomized controlled trial (July 2025): 16 experienced open-source developers, real tasks in their own repos, randomized AI-allowed vs not. Result: **19% slower with AI assistance, while participants estimated they were 20% faster** — a ~39-point perception gap.
- Licenses: "self-reported time savings are unreliable"; "perceived speedup can invert measured reality."
- Does NOT license: "AI makes all developers slower" (one setting: experts in familiar codebases).
- https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/

## [FAROS] — Activity up, outcomes flat

Faros AI telemetry study (2025): ~10,000 developers, 1,255 teams. AI-assisted teams completed more tasks and merged more PRs, but **code review time rose 91%, PR size rose 154%, and org-level DORA metrics showed no measurable improvement**.
- Licenses: "activity proxies inflate under AI"; "guardrails (review time, PR size) catch what headline throughput hides."
- Vendor-published research — treat magnitudes as indicative, direction as well-corroborated (DORA 2025 reports similar org-level flatness).
- https://www.faros.ai/research

## [MSFT-COPILOT] — The 6-minutes-times-$72 construct

Microsoft Viva Insights Copilot Dashboard methodology (documented on Microsoft Learn / Tech Community): "Copilot assisted hours" are estimated via **research-derived multipliers — in the Impact template a flat 0.1 hours (6 minutes) per action — and "assisted value" multiplies by a default $72/hour** (editable). A service degradation caused the metric to silently undercount from Sept 6 to Nov 3, 2025 (NHS England advisory).
- Licenses: "flat-multiplier dollarization is assumption arithmetic, not measurement"; "unfalsifiable value metrics can break silently without detection."
- https://learn.microsoft.com/en-us/viva/insights/copilot-analytics-introduction · https://techcommunity.microsoft.com/blog/viva_insights_blog/copilot-dashboard-update-%E2%80%93-features-and-data-interpretation-guide/4165494

## [EVALGEN] — Criteria drift

"Who Validates the Validators? Aligning LLM-Assisted Evaluation of LLM Outputs with Human Preferences" (Shankar, Zamfirescu-Pereira et al., UIST 2024, arXiv:2404.12272). Key finding: **criteria drift** — users cannot fully define evaluation criteria a priori; grading real outputs changes the criteria themselves.
- Licenses: "one-shot eval generation produces misaligned evals"; "judges require periodic human-graded calibration"; "the spec is a living document by necessity, not sloppiness."
- https://arxiv.org/abs/2404.12272

## [MCKINSEY] — Almost nobody can attribute impact

McKinsey, The State of AI (2025 survey, n≈1,900): most organizations use gen-AI, but **only ~39% attribute any EBIT impact to it, and most of those say under 5%**. McKinsey's own prescription: pair leading indicators with tracked business KPIs.
- Licenses: "adoption is nearly universal; attributable impact is rare"; "adoption metrics ≠ impact metrics."
- https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai

## [GARTNER] — Unclear value kills projects

Gartner press release (June 25, 2025): **over 40% of agentic AI projects will be canceled by end of 2027**, citing escalating costs, **unclear business value**, and inadequate risk controls.
- Licenses: "unclear business value is a named project-killer at scale."
- https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027

## [MIT-NANDA] — Use with care

MIT NANDA "The GenAI Divide: State of AI in Business 2025" (July 2025): the widely-cited "**95% of enterprise GenAI pilots show zero measurable P&L return**." Methodology is contested (not peer-reviewed; loose failure definition; small interview base).
- Licenses: ONLY "AI value measurement is broken and loudly disputed" — the fight over this number is itself the evidence.
- Does NOT license: citing 95% as an established failure rate. Never headline it.
- https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/ · critique: https://arnon.dk/mits-95-ai-failure-rate-is-wrong/

## [CEO-SURVEYS] — The pressure is real

PwC 29th Global CEO Survey (2026): **56% of CEOs report no revenue or cost benefit from AI to date.** Kyndryl readiness report (Feb 2026): **61% of leaders report more pressure to prove AI ROI than a year ago.** Secondhand aggregations — verify before quoting precise figures in formal docs.
- Licenses: "leadership pressure to prove AI value is rising while credible proof remains rare."

## House rules for using evidence

1. Cite the key, state the finding, link the source — findings without receipts are opinions.
2. Never stretch past the "licenses" line. Overstated evidence is its own vanity metric.
3. If a source is vendor-published or contested, say so in the finding.
4. Prefer the user's own data over any published stat: "your review time rose 40% (your PostHog)" beats "Faros says 91%."
