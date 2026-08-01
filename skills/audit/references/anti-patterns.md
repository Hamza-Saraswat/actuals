# The Vanity-Metrics Anti-Pattern Catalog

Twenty named ways AI metrics lie. Each entry: what to look for, why it lies (with published evidence — see [evidence.md](evidence.md) for full receipts), default severity, and the fix. IDs are stable — cite them in findings (`VM-07`), specs (§6), and reports.

Severity meanings: **critical** = the number is wrong or unfalsifiable, remove or replace it · **warning** = misleading without context, demote or pair it · **info** = hygiene, fix when touched.

Adjudication note: `vanity-scan.mjs` flags *candidates* mechanically using the detection tokens below. A candidate is not a finding — confirm each against the context before reporting. A metric can match a token innocently (a guardrail that tracks acceptance rate to *distrust* it is fine).

---

### VM-01 · Self-Reported Time Savings — critical

- **Detects:** survey-sourced "hours saved", "time saved per week", "developers report saving…", "self-reported productivity". Tokens: `hours saved`, `time saved`, `hrs/week saved`, `self-reported`.
- **Why it lies:** perception inverts reality. The METR randomized trial found experienced developers were **19% slower** with AI assistance while *believing* they were 20% faster — a ~39-point gap between feeling and fact. [evidence: METR]
- **Fix:** measure the thing itself — task cycle time, handle time, resolution time — from system data. If you can't, drop the claim; do not average the vibes.
- **Before → After:** "Agents report saving 6 hrs/week with Ava" → "Median ticket handle time: 14.2 → 9.8 min (system-measured, 8-week window, all agents)".

### VM-02 · Minutes-times-Wage Dollarization — critical

- **Detects:** dollar values computed as `actions × minutes-per-action × hourly rate`. Tokens: `× $`, `* 72`, `$/hr`, `per hour rate`, `assisted value`, `estimated value: $`.
- **Why it lies:** every constant is an assumption wearing a number's costume. Microsoft's Copilot dashboard values every action at a flat 6 minutes × $72/hr — and the figure silently undercounted for two months (Sept–Nov 2025) before anyone noticed, because unfalsifiable numbers can't look wrong. [evidence: MSFT-COPILOT]
- **Fix:** dollarize only through outcomes with real unit costs (cost per resolved ticket, infra cost per account) where every constant traces to a spec assumption (§2) that gets re-measured. Otherwise report the operational metric and let finance do finance.
- **Before → After:** "AI generated $89,280 in value (1,240 hrs × $72)" → "Support cost per resolved ticket: $8.10 → $6.35 (fully-loaded, from payroll + ticket counts)".

### VM-03 · Adoption-as-Impact — warning

- **Detects:** seats, DAU/WAU/MAU, "% of team using AI", license utilization, adoption rate — presented as *value* rather than as a diagnostic. Tokens: `adoption rate`, `active users`, `seats active`, `% using`.
- **Why it lies:** usage is a precondition of value, not evidence of it. McKinsey's State of AI: most companies use AI; only 39% can attribute *any* EBIT impact. Everyone has adoption charts; almost nobody has outcome charts. [evidence: MCKINSEY]
- **Fix:** keep adoption as a diagnostic (it explains outcome movement, it isn't one) and pair it with the outcome metric it's supposed to enable. Headline the outcome.
- **Before → After:** "87% of support now uses Ava ✅" → "87% adoption (diagnostic) · deflection rate 22% (OM-1) · CSAT unchanged (GM-1)".

### VM-04 · Activity Volume Proxy — warning

- **Detects:** counts of AI-touched activity as the headline: PRs merged, completions, messages, chats, queries, "3.1× more messages per agent". Tokens: `PRs per dev`, `messages per`, `queries processed`, `total chats`.
- **Why it lies:** AI inflates activity by construction. Faros telemetry across ~10k developers: tasks and PRs up — while review time rose 91%, PR size rose 154%, and org-level DORA outcomes stayed flat. More motion, same distance. [evidence: FAROS]
- **Fix:** measure downstream throughput and quality (cycle time, change-failure rate, resolved-per-agent, rework), not upstream volume.
- **Before → After:** "Devs merge 40% more PRs with Copilot" → "Cycle time and change-failure rate, AI-assisted vs not, adjusted for PR size".

### VM-05 · Acceptance-Rate Theater — warning

- **Detects:** "% suggestions accepted", "lines of AI code accepted", accept-rate trends as success. Tokens: `acceptance rate`, `accept rate`, `suggestions accepted`, `lines accepted`.
- **Why it lies:** accepted ≠ kept ≠ correct. Accepted code gets rewritten in review (invisible), bloats PRs (VM-04's +154%), and acceptance is trivially gamed by accepting-then-editing. It measures the *offer*, not the *outcome*.
- **Fix:** code-survival rate (accepted lines still present after N weeks), rework rate, escaped defects.
- **Before → After:** "64% acceptance rate" → "Survival: 41% of accepted lines unchanged after 30 days; rework time per accepted suggestion: 3.1 min".

### VM-06 · Denominator-Free Count — warning

- **Detects:** raw counts with no base, rate, or cohort: "10,000 AI conversations!", "152k queries processed". Tokens: big standalone integers, `total`, `processed`, `handled` with no `per`, `rate`, `%`, or denominator column nearby.
- **Why it lies:** a numerator without a denominator is a press release, not a metric. 10,000 conversations out of how many tickets? Growing how, per what?
- **Fix:** attach the honest denominator and window: share of eligible volume, per-account rate, cohort trend.
- **Before → After:** "152,340 Ava conversations since launch" → "Ava handles 34% of inbound tickets (weekly, eligible-ticket denominator)".

### VM-07 · Double-Counted Value — critical

- **Detects:** the same saved hour/dollar claimed by multiple programs; overlapping "impact" rows summing across initiatives; two events tracking one user action. Tokens: `combined savings`, `total impact across`, duplicate event names for the same trigger.
- **Why it lies:** when the AI program, the process-improvement program, and the new-hire class each claim the same efficiency gain, leadership is triple-buying one improvement. Sums exceed reality; trust dies at reconciliation.
- **Fix:** an attribution ledger — every claimed delta has exactly one owner; overlapping claims must name their split and how it was estimated.
- **Before → After:** "AI saved 400 hrs + workflow redesign saved 380 hrs (same quarter, same team)" → one reconciled delta with an explicit split and a named owner per share.

### VM-08 · Cumulative-Ever Metric — warning

- **Detects:** monotonic since-launch charts: "total since launch", "all-time", "cumulative", "to date", "lifetime". Tokens: `since launch`, `all-time`, `cumulative`, `to date`, `lifetime`.
- **Why it lies:** a number that can only go up cannot carry information about health. Cumulative charts hide decay, churn, and dead weeks — they're how declining products look like winners.
- **Fix:** windowed rates and cohort trends. If the weekly rate embarrasses the cumulative chart, the cumulative chart was the lie.
- **Before → After:** "1.2M cumulative AI actions 📈" → "Weekly actions per active account, trailing 12 weeks, by cohort".

### VM-09 · Peak Cherry-Pick — warning

- **Detects:** best-week/best-team/record numbers presented as typical: "peak", "record", "best week", "top team achieved". Tokens: `best week`, `peak`, `record`, `up to`.
- **Why it lies:** selecting the maximum of a noisy series is selection on the dependent variable — every noisy metric produces impressive peaks by chance. "Up to 41%" is a lottery ad, not a measurement.
- **Fix:** medians and distributions over fixed windows; report the typical case with the spread.
- **Before → After:** "Deflection hit 41% (week of Mar 3)!" → "Median weekly deflection: 23% (IQR 19–27%, last 12 weeks)".

### VM-10 · Survivor-Only Funnel — critical

- **Detects:** metrics computed only on retained/active/power users: "among active users…", "excluding churned", `WHERE churned = false` on an outcome query. Tokens: `active users only`, `excluding churned`, `power users`, retention filters in SQL.
- **Why it lies:** the people the AI failed left the denominator. CSAT among users who didn't quit is CSAT among people it worked for — by construction. This is the classic survivorship error in product clothing.
- **Fix:** intention-to-treat denominators — everyone who was *offered* the AI, including those who abandoned it; report abandonment as its own metric.
- **Before → After:** "CSAT 4.7/5 among active Ava users" → "CSAT 4.1 across all AI-offered tickets · 18% of users disabled Ava within 30 days (tracked)".

### VM-11 · Eval-Pass-Rate as Business Value — critical

- **Detects:** eval/quality scores in business reporting with no mapped outcome: "94% eval pass rate", "hallucination score 0.03" as headline impact. Tokens: `eval pass`, `pass rate`, `quality score` in exec-facing docs.
- **Why it lies:** an eval is a *prediction* of value, not value. A 94% pass rate on criteria nobody tied to retention, cost, or resolution is a quality metric cosplaying as a business one — the exact gap between the evals layer and the P&L that keeps CFOs unconvinced. [evidence: MCKINSEY, GARTNER]
- **Fix:** every eval maps to the outcome metric it predicts (spec §5 `Maps-To-Outcome`); report the pair, and validate the mapping when both have data.
- **Before → After:** "94% response-quality pass rate" → "Response quality 94% (EV-1) → predicts deflection-without-reopen (OM-1), correlation checked quarterly".

### VM-12 · Uncalibrated LLM Judge — critical

- **Detects:** LLM-as-judge scores with no human agreement stated: "GPT-graded", "judge score", "autograded" and no `agreement`, `kappa`, or graded-sample size anywhere. Tokens: `llm judge`, `judge score`, `autograde`, absence of `agreement`/`calibrat`.
- **Why it lies:** an unchecked judge grades its own homework. EvalGen documented *criteria drift* — even the humans' criteria change as they grade real outputs — so a judge aligned to nothing in particular measures nothing in particular. [evidence: EVALGEN]
- **Fix:** periodically grade a real sample (n≥30) by hand, report judge–human agreement next to every judge score, recalibrate on drift (spec §5 Calibration).
- **Before → After:** "Helpfulness 8.7/10 (LLM-judged)" → "Helpfulness 8.7/10 · judge–human agreement 82% on n=50 (last calibrated Jul 2026)".

### VM-13 · Pilot-to-Enterprise Extrapolation — critical

- **Detects:** small-pilot results multiplied across the org/year: "× 52 weeks × 400 developers", "annualized", "rolled out company-wide this equals…". Tokens: `annualized`, `extrapolat`, `× 52`, `across all`, `company-wide`.
- **Why it lies:** pilots select enthusiastic users, run on novelty effects, and get white-glove support — none of which multiplies. Gartner expects >40% of agentic AI projects canceled by 2027, "unclear business value" leading — much of that value was pilot math. [evidence: GARTNER]
- **Fix:** staged rollout claims with confidence bounds per stage; re-measure at each expansion; never multiply a pilot by the org.
- **Before → After:** "Pilot saved 11 hrs/dev/wk → $16.8M/yr across engineering" → "Pilot cohort (n=24, self-selected): X. Next: 100-dev staged rollout with pre-registered metrics".

### VM-14 · Baseline-Free Delta — critical

- **Detects:** "improved/reduced/increased by X%" with no pre-period, control, or holdout named. Tokens: `improved`, `reduced by`, `% faster` with no `baseline`, `pre-`, `control`, `holdout` in the document.
- **Why it lies:** improved relative to *what*? Without a baseline the delta is unfalsifiable; with seasonality, mix shifts, and simultaneous launches, it's usually someone else's improvement wearing your badge.
- **Fix:** minimum: a dated pre-launch baseline snapshot (instrument generates one). For causal claims: holdout or experiment. The spec's Claims Ledger (§7) exists exactly for this.
- **Before → After:** "Resolution time improved 34% since Ava launched" → "Resolution time 34% below the pre-launch 8-week baseline; concurrent changes: none logged (see CL-2 for causal claim status)".

### VM-15 · Correlation Dressed as Causation — warning

- **Detects:** adopter-vs-non-adopter comparisons stated causally: "developers who use AI ship 30% more", "AI users close deals faster". Tokens: `users who use`, `adopters are`, comparative claims across self-selected groups.
- **Why it lies:** adopters differ — seniority, task mix, enthusiasm, team. The 30% was probably true before the AI arrived. Composition, not causation.
- **Fix:** control for composition (within-person pre/post, matched cohorts) or label it plainly as correlation and move on.
- **Before → After:** "Copilot users merge 40% more PRs" → "Within-person: same devs' cycle time ±0% after adoption, PR size +150% (composition explained the gap)".

### VM-16 · Sentiment-as-Outcome — warning

- **Detects:** NPS, satisfaction, "devs love it" as the primary value metric. Tokens: `NPS`, `satisfaction`, `love`, `sentiment` in the headline slot.
- **Why it lies:** people liked the tool that made them 19% slower (METR again — they *believed* 20% faster). Sentiment measures experience, and experience routinely diverges from effect. [evidence: METR]
- **Fix:** sentiment is a fine guardrail (a tool people hate gets abandoned) — never the outcome. Pair it with a measured effect.
- **Before → After:** "Dev NPS +62 — Copilot is working" → "NPS +62 (guardrail: adoption sustainability) · cycle time and CFR: see OM-1/OM-2".

### VM-17 · Missing Counter-Metric — warning

- **Detects:** dashboards where every metric is an upside; nothing tracks cost, quality, load, or risk. Signal: no `review time`, `rework`, `defect`, `error rate`, `cost`, `escalation`, `complaint` anywhere in a metrics doc.
- **Why it lies:** hidden by construction. The +91% review time and +154% PR bloat existed the whole time — dashboards without guardrails just couldn't see them. [evidence: FAROS]
- **Fix:** the spec mandates ≥1 guardrail per outcome metric (§4), chosen by asking "what would a cynic say got worse?" — with a tripwire that triggers investigation.
- **Before → After:** a 9-metric all-green dashboard → the same dashboard plus review-time, reopen-rate, and cost-per-resolution with tripwires.

### VM-18 · Definition Rot — critical

- **Detects:** a metric redefined mid-series without annotation: "as of March we now count…", trend lines spanning a definition change, formula in SQL ≠ formula in the deck. Tokens: `now counts`, `redefined`, `updated methodology`, silent formula edits.
- **Why it lies:** a trend across two definitions is fiction. Microsoft's "assisted hours" silently undercounted for two months — nobody noticed because nobody owned the definition. [evidence: MSFT-COPILOT]
- **Fix:** versioned definitions (that's the spec's whole job): formula changes bump the version, annotate the series break, and appear in the changelog. Audit compares spec formula vs deployed SQL.
- **Before → After:** one unbroken "deflection" line across a definition change → annotated break: "v1.2: reopens within 48h no longer count as deflected (Mar 2026)".

### VM-19 · Composite Value-Score Opacity — warning

- **Detects:** blended single scores: "AI Productivity Index: 8.2", "Impact Score", weighted composites with unstated weights. Tokens: `index`, `composite`, `score` (0–10 or 0–100) covering multiple dimensions.
- **Why it lies:** the weights ARE the conclusion, smuggled in. A composite that's 60% adoption by weight is an adoption chart with a costume budget. Nobody can falsify, decompose, or act on 8.2.
- **Fix:** unbundle. Report the components; if leadership insists on one number, publish the weights and who chose them.
- **Before → After:** "AI Value Index: 8.2/10 ↑" → the four components, each with its own owner, baseline, and direction.

### VM-20 · Orphan Metric — info

- **Detects:** metrics with no owner, no formula anyone can state, no review date; tracking-plan rows with `owner: TBD`; dashboards nobody can explain. Tokens: `TBD`, `N/A` in owner fields; formula absent.
- **Why it lies:** unowned metrics rot silently (see VM-18) and unauditable numbers accumulate as dashboard sediment. If nobody can state the formula, the number is folklore.
- **Fix:** every metric gets a named human owner and a review cadence (spec header) — or gets deleted. Deletion is a feature.
- **Before → After:** 23 tracked events, 9 with owner "TBD" → 11 events, each consumed by a named metric with a named owner; 12 deleted.

---

## Quick severity index

| Critical (remove/replace) | Warning (demote/pair) | Info |
|---|---|---|
| VM-01, VM-02, VM-07, VM-10, VM-11, VM-12, VM-13, VM-14, VM-18 | VM-03, VM-04, VM-05, VM-06, VM-08, VM-09, VM-15, VM-16, VM-17, VM-19 | VM-20 |
