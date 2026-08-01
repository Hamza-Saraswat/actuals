# Measurement Spec: Ava — AI support assistant (Acme Deskflow)

- **Spec-Version:** 1.1.0
- **Status:** calibrating
- **Spec-Owner:** Dana Reyes (Head of Support)
- **Created:** 2026-06-15
- **Last-Updated:** 2026-07-20
- **Review-Cadence:** monthly
- **Next-Review:** 2026-08-20

## 1. Business Context

### What the AI does
Ava answers tier-1 support tickets (billing questions, how-tos, password resets) in the in-app helpdesk widget before a human is involved. Tickets Ava can't resolve are handed to the 6-person support team.

### Who benefits
Support agents (6) — fewer repetitive tickets; customers (2,400 accounts) — faster answers; finance — support headcount can stay flat as accounts grow.

### Business model
B2B SaaS, per-seat pricing, ~$4M ARR across 2,400 property-management customers. Support is a cost center whose quality directly affects renewal.

### The Decision
At sustained deflection ≥25% with guardrails holding: expand Ava from the Pro plan to all plans and hold support headcount flat through 2027 planning. At <15%, or any tripped guardrail for two consecutive reviews: roll Ava back to enterprise-only and resume the paused H2 support hire.

### Data Inventory

| Source | What it holds | Access |
|---|---|---|
| PostHog | widget events, Ava conversations, handoffs | have |
| Zendesk | tickets, reopens, handle time, CSAT surveys | have |
| Stripe | plan, MRR, churn per account | need |
| Ava eval logs | prompts, responses, judge scores | have |

## 2. North-Star Linkage

### North star
Net revenue retention (the metric the exec team already steers by).

### Causal chain
Ava resolves tier-1 tickets → agents spend their time on tier-2/3 → first-response and handle times fall while quality holds → support cost per account falls and slow-support churn risk drops → gross margin and net revenue retention improve.

### Assumptions
- A1: Eligible (tier-1) tickets are the billing / how-to / password categories ≈ 58% of inbound volume (measured Q2 2026; re-measure quarterly).
- A2: Fully-loaded support cost per agent-hour = $41 (finance, Jul 2026 payroll; re-measure semi-annually).

## 3. Outcome Metrics

### OM-1: Deflection-without-reopen rate
- **Definition:** Share of eligible tickets Ava fully resolves with no human handoff and no reopen within 48 hours.
- **Formula:** tickets with `ticket_deflected_strict` / all eligible inbound tickets (per A1), weekly window.
- **Source(s):** Zendesk + PostHog
- **Owner:** Dana Reyes
- **Baseline:** 0% pre-launch (by construction, launch 2026-03)
- **Target:** ≥25% sustained for 8 weeks, by 2026-10
- **Confidence:** plausible
- **Instrumentation-Status:** live

### OM-2: Median handle time on human-touched tickets
- **Definition:** Median minutes of agent-active time on tickets a human worked, all agents, weekly.
- **Formula:** median(agent_active_minutes) over human-touched tickets, weekly window, all agents (no survivor filters).
- **Source(s):** Zendesk
- **Owner:** Dana Reyes
- **Baseline:** 14.2 min (8-week pre-launch average, recorded 2026-05)
- **Target:** ≤11 min by 2026-12
- **Confidence:** plausible
- **Instrumentation-Status:** live

### OM-3: Support cost per resolved ticket
- **Definition:** Fully-loaded support cost divided by all resolved tickets (human and Ava), monthly.
- **Formula:** (total agent-hours on support × A2) / all resolved tickets, calendar month.
- **Source(s):** Zendesk + finance export (Stripe join pending)
- **Owner:** Priya Nair (Finance)
- **Baseline:** $8.10 (2026-05, pre-launch month)
- **Target:** ≤$6.50 by 2026-12
- **Confidence:** assumed
- **Instrumentation-Status:** staged

## 4. Guardrail Metrics

### GM-1: Reopen rate within 48h (guards OM-1)
- **Definition:** Share of Ava-resolved tickets reopened by the customer within 48 hours.
- **Formula:** reopened-within-48h Ava resolutions / all Ava resolutions, weekly.
- **Source(s):** Zendesk
- **Owner:** Dana Reyes
- **Baseline:** 4.1% (2026-06)
- **Tripwire:** >8% for 2 consecutive weeks → pause plan expansion, review 50 transcripts.
- **Confidence:** plausible

### GM-2: CSAT on all Ava-offered tickets (guards OM-1)
- **Definition:** CSAT across every ticket where Ava was offered — including handoffs, abandonments, and accounts that later churned (intention-to-treat; no survivor filter).
- **Formula:** avg(csat_score) over all Ava-offered tickets, monthly.
- **Source(s):** Zendesk surveys
- **Owner:** Dana Reyes
- **Baseline:** 4.3 / 5 (pre-launch, 2026-02)
- **Tripwire:** <4.0 in any month → freeze rollout, sample transcripts by segment.
- **Confidence:** plausible

### GM-3: Escalation latency (guards OM-2, guards OM-3)
- **Definition:** Median time from Ava handoff to first human response — catches cost savings that quietly degrade responsiveness.
- **Formula:** median(first_human_response_at − handoff_at), weekly.
- **Source(s):** Zendesk + PostHog `handoff_clicked`
- **Owner:** Marcus Webb (Support lead)
- **Baseline:** 11 min (2026-06)
- **Tripwire:** >30 min median in any week → rebalance agent staffing before touching headcount plans.
- **Confidence:** plausible

## 5. Eval-Layer Metrics

### EV-1: Resolution correctness
- **Grades:** Whether Ava's answer actually resolved the customer's question (not just responded fluently).
- **Method:** llm-judge
- **Maps-To-Outcome:** OM-1
- **Calibration:** graded sample n=50, judge–human agreement 82%, last 2026-07-18 (next per §8)

## 6. Vanity Metrics We Will Not Use

| Tempting metric | Catalog ID | Why it lies here | What we do instead |
|---|---|---|---|
| "Hours saved" agent survey | VM-01 | Self-reports invert measured reality | OM-2 measured handle time |
| Total conversations since launch | VM-06, VM-08 | Numerator with no denominator, can only go up | OM-1 weekly deflection rate |
| CSAT among active Ava users | VM-10 | Survivor filter deletes the failures | GM-2 intention-to-treat CSAT |
| "$ value" from 6 min × $72/hr | VM-02 | Assumption arithmetic in a dollar costume | OM-3 unit cost with A2, re-measured |
| Suggestion acceptance rate | VM-05 | Accepted ≠ resolved | OM-1, EV-1 |

## 7. Claims Ledger

| ID | Desired claim | Required evidence | Status |
|---|---|---|---|
| CL-1 | "Ava reduced support cost per account" | OM-3 live + 3 post-launch months vs the 2026-05 baseline | in-progress |
| CL-2 | "Ava caused the handle-time drop" | Concurrent-change log clean for the window + within-agent pre/post comparison | blocked |
| CL-3 | Any dollar figure in exec materials | Every constant traceable to A1/A2 with re-measurement dates | licensed (OM-3 only) |

## 8. Review & Calibration Schedule

- **Recurring audit:** monthly (/actuals:audit review) — drift, definition rot, owners, ledger violations.
- **Calibration passes:** EV-1 re-graded on 50 fresh transcripts quarterly; next 2026-10-15. Expect criteria drift; changes go through §9.
- **Out-of-cycle triggers:** any metric moves >20% week-over-week · model/provider change behind Ava · pricing change · Stripe join lands (upgrades OM-3 confidence).

## 9. Changelog

- 1.1.0 — 2026-07-20 — GM-2 denominator switched to intention-to-treat (all Ava-offered tickets) — audit finding VM-10
- 1.0.0 — 2026-06-15 — Initial spec from design interview — baseline capture for OM-2/OM-3 predates launch
