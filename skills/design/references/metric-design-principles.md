# Metric Design Principles

The method behind the workshop phase. Four ideas: the causal chain, the three tests, the confidence rubric, and the no-fake-dollars doctrine.

## 1. The causal chain

Every defensible AI metric sits on an explicit chain:

```
AI feature → behavior change → driver metric → north star
```

Worked example (Acme Deskflow, a 50-person B2B SaaS adding "Ava," an AI support assistant):

```
Ava answers tier-1 tickets
  → agents stop touching tier-1, spend time on tier-2/3
    → first-response time falls · tickets resolved per agent rises
      → support cost per account falls while CSAT holds
        → gross margin improves · churn risk from slow support drops (north star: net revenue retention)
```

Rules:
- The north star is the company's EXISTING top metric. Never invent one for the spec — link to what leadership already steers by.
- Outcome metrics live at the "driver" link — close enough to the AI to move within a quarter, close enough to money to matter.
- Anything left of "driver" (usage, acceptance, volume) is a **diagnostic**: useful for explaining movement, never for claiming value (VM-03/VM-04/VM-05).
- If a proposed metric can't be placed on the chain, it doesn't go in the spec.

## 2. The three tests

Every metric must pass all three (these are also the audit skill's core tests — same doctrine, one source: the catalog at [../../audit/references/anti-patterns.md](../../audit/references/anti-patterns.md)):

1. **Decision-relevance** — a specific person would act differently at different values. (Fails: "good to know" metrics.)
2. **Honest denominator** — the base includes everyone the AI was *offered to*, not just survivors or fans; the time window is fixed, not since-launch. (Fails: VM-06, VM-08, VM-10.)
3. **Causal warrant** — the claim the metric supports matches the evidence behind it: measured-with-baseline claims need a baseline; causal claims need a control or holdout; everything weaker is labeled correlation. (Fails: VM-14, VM-15.)

## 3. The confidence rubric

Stamp every metric honestly:

| Confidence | Meaning | What it licenses |
|---|---|---|
| `proven` | measured against a baseline, holdout, or experiment | causal language: "the AI reduced X" |
| `plausible` | measured, causality assumed on the chain's logic | descriptive language: "X fell after launch" |
| `assumed` | not yet measured | planning language only; the Claims Ledger holds the receipt-debt |

Confidence upgrades are earned by evidence, recorded in the changelog. A spec full of `assumed` metrics is honest; a deck full of unlabeled `assumed` numbers is VM-14.

## 4. The no-fake-dollars doctrine

The fastest way to lose a CFO is a dollar figure that dies under one question.

The cautionary tale: Microsoft's Copilot dashboard computes "assisted value" as actions × a flat 6 minutes × a default $72/hour — assumption arithmetic in a dollar costume. The number even undercounted silently for two months before anyone noticed, *because unfalsifiable numbers can't look wrong* (catalog VM-02, receipts in [../../audit/references/evidence.md](../../audit/references/evidence.md)).

House rules:
1. Default: **no dollar figures in the spec.** Report the operational outcome (cost per resolved ticket, hours of measured handle time) and let finance convert.
2. If a dollar figure must exist, every constant in its formula appears as a numbered §2 assumption with a source and a re-measurement date. "$72/hour" is banned; "fully-loaded support cost per hour = $41 (payroll, Q2, re-measure quarterly) — A3" is allowed.
3. Unit-cost dollarization beats time dollarization: "cost per resolved ticket fell $1.75" survives questioning; "we saved 1,240 hours" invites VM-01 and VM-07.

## Guardrail selection

For each outcome metric ask: **"what would a cynic say got worse?"** The canonical case: AI coding assistants raised PR throughput (headline ↑) while review time rose 91% and PR size 154% (guardrails, unmeasured almost everywhere). Standard pairings:

| Outcome metric | Cynic's answer | Guardrail |
|---|---|---|
| Ticket deflection rate | it deflects badly; users rage-quit the bot | reopen rate within 48h · escalation rate · CSAT on deflected tickets (all-offered denominator) |
| Resolution time | quality dropped | reopen rate · QA sample score |
| Dev cycle time | review burden shifted downstream | review time per PR · PR size · change-failure rate |
| Content produced per marketer | slop | edit-distance before publish · engagement per piece |
| Cost per case | risk moved to customers | complaint rate · compliance flags |

Every guardrail gets a **tripwire**: the threshold that triggers investigation ("reopen rate >8% for 2 consecutive weeks → pause expansion, review transcripts").

## Relation to other frameworks

- **DX Core 4 / AI Measurement Framework**: good utilization/impact/cost structure for engineering orgs; its known weakness is leaning on self-reported time savings (VM-01). Borrow the structure, replace the self-reports with system measures.
- **McKinsey guidance**: pair leading indicators with lagging business KPIs — same as the chain: diagnostics feed drivers feed the north star.
- **Experimentation platforms** (Statsig/Eppo school): the gold standard for causal warrant. When the Decision is big enough (pricing, headcount), recommend a real holdout — the spec's Claims Ledger is where that requirement is recorded.
