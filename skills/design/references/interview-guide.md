# Interview Guide

Question bank and branch logic for the design interview. Rules: one question at a time; mirror answers back before switching phases; probe vagueness; stop at five metrics.

## Phase 1 — Business context

Openers (pick what repo context hasn't already answered):
- "In two or three sentences: what does the AI actually do, and where does it sit in the product or workflow?"
- "Who feels the benefit day to day — and roughly how many of them are there?" (Persona + count. "Support agents (6)" beats "the team.")
- "How does money move here — per-seat subscriptions, usage pricing, or is this an internal cost center?"

Branch by shape:
- **B2B SaaS shipping an AI feature:** ask where the feature sits vs the pricing page — is it a retention play, an upsell, or table stakes? That decides whether outcomes live in churn, expansion, or win-rate data.
- **B2C product:** ask about the frequency loop — what behavior would repeat if the AI works? Outcomes live in retention cohorts and conversion, not satisfaction.
- **Internal tool (coding assistants, support copilots, back-office automation):** ask which budget line notices if it works — headcount avoided, hours redeployed to what, vendor spend replaced. Beware: this branch is where VM-01/VM-02 (self-reported hours × wage) breed. Anchor on system-measurable work units (tickets, PRs, cases, invoices processed).
- **Agency/services:** ask whether the AI changes margin per engagement or capacity (engagements per person). Those are different specs.

Vague-answer probes:
- "We want to improve productivity" → "Productivity of whom, doing what, visible in which system?"
- "We want engagement" → "Engagement that leads to what — renewal, expansion, fewer tickets? Which?"

## Phase 2 — The Decision

The load-bearing question, asked directly:
> "Imagine these metrics come back in six months. What would you DO differently if they're great vs terrible?"

Good answers (specific, reversible actions): "expand Ava to all plans vs roll back to enterprise-only" · "renew the $180k Copilot contract vs cut to 50 seats" · "hire 2 fewer support agents next quarter vs keep the hiring plan."

Bad answers and the follow-up:
- "We'd just know it's working" → "Knowing isn't a decision. Who acts, on what threshold?"
- "Leadership wants a dashboard" → "What is leadership deciding with it? Budget? Roadmap? If nothing — this is reporting theater, and the spec should say so."

If no decision survives probing, pause the interview honestly: recommend returning when a real decision exists, or scope the spec to the smallest real decision found (even "keep paying for this tool: yes/no" is enough).

## Phase 3 — Data inventory

- "Where does data about this live today — product analytics, billing, the support platform, a warehouse, eval logs?"
- For each named source: "What's actually in it, and can it be accessed today — have, need, or blocked?"
- "Is there anything measuring the BEFORE state?" (If launch already happened with no baseline: record it — the Claims Ledger will carry the consequences, per VM-14.)

Do not let inventory gaps silently shape the metrics. A metric needing blocked data is written anyway, marked blocked, and the connect skill works the list.

## Phase 4 — Draft-metrics workshop

Method (details in [metric-design-principles.md](metric-design-principles.md)):
1. Draw the causal chain out loud and get agreement: AI feature → behavior change → driver metric → north star.
2. Propose one metric per chain link the Decision needs — usually 3, never more than 5.
3. For each: cynic's question → guardrail with a tripwire.
4. Formulas on the spot, with real denominators, from the Phase 3 inventory. If the user can't name the denominator, the metric isn't ready.

Workshop prompts:
- "If [behavior change] happened, which number in [source] moves first?"
- "What's the honest denominator — all tickets, or just the ones the AI was offered?" (VM-10 check)
- "What would a cynic say got worse while this number improved?" (VM-17 check)

## Phase 5 — Anti-vanity pass

Walk the user's instinctive metrics against the catalog. Typical exchanges:
- "Can we track hours saved?" → VM-01: "Only if measured from system timestamps, not surveys — the METR trial found self-reports off by ~39 points. Otherwise it goes in §6 with handle time replacing it."
- "Adoption rate?" → VM-03: "Kept — as a diagnostic, paired with the outcome it enables. Never the headline."
- "A dollar-value number for the exec deck?" → VM-02: "Only through a unit cost whose constants live in §2 assumptions and get re-measured. Flat minutes-times-wage math is the Microsoft trap."

Every rejected or demoted metric becomes a §6 row: tempting metric · VM-id · why it lies here · replacement. This table is the pre-commitment device — it exists so future exec pressure meets a written decision.

## Closing

Read the draft back at spec speed: north star chain, the 3-5 outcomes with formulas, guardrails, what §7 forbids claiming for now, and the calibration date. Then lint, confirm, write.
