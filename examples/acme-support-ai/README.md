# Fixture: Acme Deskflow — "Ava" AI support assistant

The deep test fixture and demo scenario for Actuals.

**Scenario.** Acme Deskflow is a 50-person B2B SaaS ($4M ARR, 2,400 customers, per-seat pricing) selling helpdesk software to property managers. Six support agents handle inbound tickets. In March 2026 Acme launched **Ava**, an AI assistant that answers tier-1 tickets (billing questions, how-tos, password resets) before a human touches them. The CEO is now asking the Head of Support, Dana Reyes: *"Is Ava working? Should we expand it to all plans and hold support headcount flat?"*

**The artifacts:**

| File | What it is |
|---|---|
| `dashboard-export.csv` | The metrics dashboard Acme actually built — deliberately riddled with catalog anti-patterns. Primary audit-demo input. |
| `tracking-plan.csv` | Their event tracking plan — bloated, duplicated, unowned. |
| `queries.sql` | The SQL behind the exec deck — wage-math dollarization, survivor filters, baseline-free deltas. |
| `MEASUREMENT.md` | The "after" picture: a correct Actuals spec for the same company. Passes `spec-lint`. Used as the design skill's exemplar. |
| `expected-audit-findings.md` | **Answer key.** The seeded anti-patterns an audit run must catch. Changing scanner rules or the catalog requires re-validating against this file deliberately. |

**Demo flow:** run the audit skill on the three bad artifacts, compare against the answer key, then show `MEASUREMENT.md` as what replaces them.
