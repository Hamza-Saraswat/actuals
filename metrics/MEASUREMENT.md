# Measurement Spec: Actuals (the plugin, measuring itself)

- **Spec-Version:** 0.1.0
- **Status:** draft
- **Spec-Owner:** Hamza Saraswat
- **Created:** 2026-08-01
- **Last-Updated:** 2026-08-01
- **Review-Cadence:** monthly
- **Next-Review:** 2026-09-01

## 1. Business Context

### What the AI does
Actuals is a Claude Code plugin that designs business-outcome metrics for AI tools from an interview, audits existing dashboards against a 20-pattern vanity-metrics catalog, generates instrumentation, and renders a scorecard.

### Who benefits
Teams shipping AI features and teams rolling out AI tools internally (target: 5–10 real design-partner teams in the first validation window); indirectly, the leaders reading their reports.

### Business model
Free, open-source (MIT). No revenue in v1. The validation question is whether the workflow is valuable enough that a hosted/team layer could exist later.

### The Decision
At the 2026-11-01 review: if at least 5 distinct teams have living specs (per A1), continue building Actuals standalone and ship v1.1 (live reporting). If fewer than 5 living specs exist despite meaningful installs, the standalone thesis is weak — fold the method into consulting/templates or pick one vertical, and say so publicly.

### Data Inventory

| Source | What it holds | Access |
|---|---|---|
| GitHub | stars, forks, issues, cloned traffic | have |
| User interviews | whether specs live, what decisions cited them | need |
| Marketplace install counts | plugin installs | blocked |

## 2. North-Star Linkage

### North star
Sustained real-team usage: teams still making measurement decisions from their spec 60 days after creating it. (A free tool's honest equivalent of net revenue retention.)

### Causal chain
Team installs Actuals → design interview produces a spec tied to a real decision → audits and calibration keep the spec alive → the team's AI reporting survives scrutiny → they keep using it and tell others.

### Assumptions
- A1: A "living spec" = a MEASUREMENT.md with ≥2 version bumps within 45 days of creation (drafted, then actually revised — the signature of use rather than ceremony).
- A2: Interviews are the only trustworthy source for outcome data in v1 — there is deliberately no telemetry in the plugin.

## 3. Outcome Metrics

### OM-1: Living-spec count
- **Definition:** Number of distinct teams whose spec meets the living-spec bar.
- **Formula:** count of teams with ≥2 spec version bumps within 45 days of spec creation (per A1), cumulative within the validation window ending 2026-11-01.
- **Source(s):** User interviews (A2)
- **Owner:** Hamza Saraswat
- **Baseline:** 0 (2026-08-01, pre-launch)
- **Target:** ≥5 by 2026-11-01
- **Confidence:** assumed
- **Instrumentation-Status:** none

### OM-2: Re-audit rate
- **Definition:** Share of interviewed teams that ran a second audit (the recurring loop actually recurred).
- **Formula:** teams with ≥2 dated files in metrics/audits/ within 60 days / all interviewed teams with a spec.
- **Source(s):** User interviews
- **Owner:** Hamza Saraswat
- **Baseline:** not yet measured — see CL-1
- **Target:** ≥50% of teams with specs
- **Confidence:** assumed
- **Instrumentation-Status:** none

### OM-3: Decisions citing the spec
- **Definition:** Count of concrete decisions (expand/roll back/renew/hire) that teams attribute to spec numbers in interviews.
- **Formula:** count of interview-reported decisions naming a spec metric, validation window.
- **Source(s):** User interviews
- **Owner:** Hamza Saraswat
- **Baseline:** 0 (2026-08-01)
- **Target:** ≥3 by 2026-11-01
- **Confidence:** assumed
- **Instrumentation-Status:** none

## 4. Guardrail Metrics

### GM-1: Time-to-first-spec (guards OM-1)
- **Definition:** Wall-clock time from install to a lint-passing spec — if the interview is a slog, nobody reaches a living spec.
- **Formula:** median session count (target: 1) reported to produce a first passing spec.
- **Source(s):** User interviews
- **Owner:** Hamza Saraswat
- **Baseline:** not yet measured — see CL-1
- **Tripwire:** median >1 session → shorten the interview; cut phases before cutting rigor.
- **Confidence:** assumed

### GM-2: Audit false-positive rate (guards OM-2)
- **Definition:** Share of audit findings users reject as wrong in context — an audit that cries wolf stops being run.
- **Formula:** findings rejected as incorrect / findings reviewed, per interview.
- **Source(s):** User interviews
- **Owner:** Hamza Saraswat
- **Baseline:** not yet measured — see CL-1
- **Tripwire:** >30% rejected → retune catalog severities and scanner rules against the fixtures.
- **Confidence:** assumed

### GM-3: Claims-ledger honesty (guards OM-3)
- **Definition:** Whether decisions cited to specs respected the ledger — a decision "citing" a blocked claim is the failure mode, not a success.
- **Formula:** decisions citing licensed claims / all spec-cited decisions.
- **Source(s):** User interviews
- **Owner:** Hamza Saraswat
- **Baseline:** not yet measured — see CL-1
- **Tripwire:** any decision citing a blocked claim → tighten the audit skill's ledger-violation check.
- **Confidence:** assumed

## 5. Eval-Layer Metrics

None in v1. The plugin's output quality is tracked through GM-2 (audit false-positive rate) against the fixture answer keys in examples/, which act as the eval set.

## 6. Vanity Metrics We Will Not Use

| Tempting metric | Catalog ID | Why it lies here | What we do instead |
|---|---|---|---|
| GitHub stars / installs | VM-03 | Adoption is a precondition of value, not value | Tracked privately as diagnostics; never claimed as success |
| "Specs generated" | VM-04 | A generated spec nobody revises is activity, not outcome | OM-1 living-spec bar (A1) |
| Landing-page traffic | VM-06 | Numerator with no decision attached | Ignored |
| "Teams love it" quotes | VM-16 | Sentiment diverges from effect | OM-3 decisions actually citing spec numbers |

## 7. Claims Ledger

| ID | Desired claim | Required evidence | Status |
|---|---|---|---|
| CL-1 | "Teams keep their specs alive with Actuals" | ≥5 interview-verified living specs (A1) | blocked |
| CL-2 | "Actuals improved a customer's metrics" | That customer's own baseline + post data, shared with permission | blocked — we will never make this claim without it |
| CL-3 | "The audit catches real vanity metrics" | Fixture answer keys pass + interview-confirmed catches in the wild | in-progress (fixtures pass as of 2026-08-01) |

## 8. Review & Calibration Schedule

- **Recurring audit:** monthly self-audit via the audit skill in review mode, first one 2026-09-01.
- **Calibration passes:** re-validate scanner + catalog against fixture answer keys on every rule change; interview batch monthly once installs exist.
- **Out-of-cycle triggers:** a competitor ships context-to-metric-design · marketplace payment rails appear · an incumbent (Mixpanel/Amplitude) ships the same wedge.

## 9. Changelog

- 0.1.0 — 2026-08-01 — Initial spec, written by running the design method on the plugin itself — dogfood
