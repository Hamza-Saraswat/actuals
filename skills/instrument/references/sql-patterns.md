# SQL Patterns

Cookbook for implementing spec formulas as queries and dbt models. Each pattern is keyed to a formula shape the spec produces (§3 `Formula`: numerator / denominator, filters, window) and to the catalog entry it defends against — VM-xx IDs refer to [../../audit/references/anti-patterns.md](../../audit/references/anti-patterns.md). SQL is generic ANSI with Postgres flavor; non-Postgres notes at the end.

## House rules (apply to every generated model)

1. **Formula verbatim, in a comment.** Every model opens with the metric ID, the spec version, and the formula text copied from the spec. When the deployed SQL and the spec disagree, one of them is lying — the comment makes the comparison mechanical (VM-18 protection; the audit skill checks it).
2. **Rates ship their parts.** Numerator and denominator appear as columns beside every rate (VM-06). A rate whose parts are invisible cannot be sanity-checked.
3. **`nullif` every denominator.** `x / nullif(d, 0)` — a divide-by-zero page at 3am is not a metrics program.
4. **Windowed, never cumulative** (VM-08). **Intention-to-treat, never survivor-only** (VM-10). **No unexplained literals** (VM-02). Patterns below.

## Rate with explicit denominator (VM-06)

Formula shape: `numerator / denominator, filters, window`. The most common spec shape — and the denominator is the load-bearing half.

```sql
-- OM-1: Ticket deflection rate
-- Spec: metrics/MEASUREMENT.md v1.2.0 (§3 OM-1)
-- Formula (verbatim): deflected / eligible tickets, weekly window,
--   excludes internal test accounts; reopens within 48h do not count as deflected
WITH eligible AS (
  SELECT ticket_id, date_trunc('week', created_at) AS week
  FROM tickets
  WHERE channel IN ('email', 'chat')    -- filters, from the spec formula
    AND is_test_account = false
),
deflected AS (
  SELECT t.ticket_id
  FROM tickets t
  WHERE t.resolved_by = 'assistant'
    AND NOT EXISTS (                    -- reopens within 48h do not count (spec v1.2.0)
      SELECT 1 FROM ticket_events e
      WHERE e.ticket_id = t.ticket_id AND e.event = 'reopened'
        AND e.occurred_at < t.resolved_at + interval '48 hours'
    )
)
SELECT
  e.week,
  count(d.ticket_id)  AS deflected,     -- numerator: always a column
  count(e.ticket_id)  AS eligible,      -- denominator: always a column
  round(count(d.ticket_id)::numeric / nullif(count(e.ticket_id), 0), 4) AS deflection_rate
FROM eligible e
LEFT JOIN deflected d USING (ticket_id)
GROUP BY 1 ORDER BY 1;
```

The eligible CTE IS the honest denominator. Deriving it from an exposure event (`assistant_offered`) rather than from successes is what separates "34% of inbound tickets" from "10,000 conversations!".

## Windowed aggregate, not cumulative (VM-08)

Formula shape: any count or sum over time. A number that can only go up carries no information about health.

```sql
-- BAD: monotonic since-launch count — hides decay, churn, and dead weeks (VM-08)
SELECT count(*) AS total_conversations_since_launch FROM conversations;

-- GOOD: windowed rate per unit that can shrink when reality shrinks
SELECT
  date_trunc('week', created_at) AS week,
  count(*)                       AS conversations,
  count(DISTINCT account_id)     AS active_accounts,
  round(count(*)::numeric / nullif(count(DISTINCT account_id), 0), 2)
                                 AS conversations_per_account
FROM conversations
WHERE created_at >= current_date - interval '84 days'  -- trailing 12 weeks, not "since launch"
GROUP BY 1 ORDER BY 1;
```

If the windowed chart embarrasses the cumulative chart, the cumulative chart was the lie. Prefer medians and distributions over single peaks when summarizing (`percentile_cont(0.5)` — a "record week" is VM-09, not a result).

## Intention-to-treat cohort (VM-10)

Formula shape: any per-user or per-account outcome. The cohort is everyone the AI was OFFERED to — including users who disabled it, abandoned it, or churned. Filtering to survivors measures only the people it worked for, by construction.

```sql
-- Cohort from the EXPOSURE event, not a usage event.
WITH cohort AS (
  SELECT account_id, min(occurred_at) AS offered_at
  FROM events
  WHERE name = 'assistant_offered'
  GROUP BY 1
)
SELECT
  date_trunc('month', c.offered_at)                  AS cohort_month,
  count(*)                                           AS offered,            -- honest denominator
  count(*) FILTER (WHERE o.resolved_by_ai)           AS ai_resolved,
  count(*) FILTER (WHERE s.disabled_at IS NOT NULL)  AS disabled_within_30d -- abandonment: a metric, not a filter
FROM cohort c
LEFT JOIN outcomes o USING (account_id)              -- LEFT JOIN: no outcome row ≠ no user
LEFT JOIN user_settings s
  ON s.account_id = c.account_id AND s.disabled_at < c.offered_at + interval '30 days'
GROUP BY 1 ORDER BY 1;
```

Hard rules: never `WHERE churned = false` or `WHERE is_active` in an outcome query's denominator; never INNER JOIN the cohort to an activity table (it silently drops exactly the users the AI failed); report abandonment as its own column or metric, not as an exclusion.

## Pre-launch baseline snapshot (VM-14)

Formula shape: the "before" value of any metric a §7 claim depends on. "Improved 34%" with no pre-period is unfalsifiable — this table is what licenses every future delta claim, and it is the one query that cannot be run retroactively. **Run it BEFORE launch.**

```sql
-- Baseline snapshot — RUN BEFORE LAUNCH or the Claims Ledger stays empty (VM-14).
CREATE TABLE IF NOT EXISTS metric_baselines (
  metric_id    text        NOT NULL,  -- 'OM-1', 'GM-1' — IDs from the spec
  spec_version text        NOT NULL,  -- formula version the value was computed under
  window_start date        NOT NULL,
  window_end   date        NOT NULL,  -- e.g. the 8 weeks before launch
  value        numeric     NOT NULL,
  numerator    numeric,               -- rates ship their parts even here (VM-06)
  denominator  numeric,
  captured_at  timestamptz NOT NULL DEFAULT now(),
  notes        text                   -- concurrent changes, seasonality caveats
);

-- Example: OM-2 (median first-response minutes) over the 8 pre-launch weeks.
INSERT INTO metric_baselines
  (metric_id, spec_version, window_start, window_end, value, numerator, denominator, notes)
SELECT
  'OM-2', '1.0.0', date '2026-07-06', date '2026-08-31',
  percentile_cont(0.5) WITHIN GROUP (ORDER BY first_response_minutes),  -- median, not a peak (VM-09)
  NULL, NULL,
  'pre-launch baseline; no concurrent support-process changes logged'
FROM tickets
WHERE created_at >= date '2026-07-06' AND created_at < date '2026-09-01'
  AND is_test_account = false;
```

Snapshot the metrics the AI is supposed to MOVE (handle time, cost per ticket, resolution rate), over a window long enough to absorb weekly noise (8 weeks is a sane default), and record concurrent changes in `notes` — a baseline with an unlogged process change beside it becomes someone else's improvement wearing this launch's badge (VM-15).

## No magic constants (VM-02)

Formula shape: anything multiplying counts by minutes, rates, or dollars. Any literal like `6` or `72` must trace to a numbered §2 assumption in the spec — an assumption has an owner and a re-measurement cadence; a literal has neither.

```sql
-- BAD: constants from nowhere. 6 what? Whose $72? Measured when, by whom?
SELECT count(*) * 6 / 60.0 * 72 AS estimated_value_usd
FROM assistant_actions;

-- GOOD: every literal cites a spec assumption; the query reports the operational
-- unit (minutes), not invented dollars.
WITH assumptions(key, value, spec_ref) AS (
  VALUES ('minutes_per_deflected_ticket', 14.0, 'A1 @ spec v1.0.0 — remeasured quarterly')
)
SELECT
  count(*) AS deflected_tickets,
  count(*) * (SELECT value FROM assumptions WHERE key = 'minutes_per_deflected_ticket')
           AS agent_minutes_avoided   -- minutes, labeled as the estimate it is
FROM tickets WHERE resolved_without_ai_handoff;
```

If no §2 assumption exists to cite, the constant may not exist in SQL either — report the operational metric and let finance do finance. Dollarization is licensed only through real unit costs (cost per resolved ticket from payroll + ticket counts) whose every constant lives in §2 and whose claim status lives in §7.

## dbt skeletons

When `dbt_project.yml` was detected, emit models instead of loose SQL — same house rules, plus tests.

```sql
-- models/metrics/om_1_deflection_rate.sql
{{ config(materialized='view') }}
-- OM-1: Ticket deflection rate
-- Spec: metrics/MEASUREMENT.md v1.2.0 (§3 OM-1)
-- Formula (verbatim): deflected / eligible tickets, weekly window,
--   excludes internal test accounts; reopens within 48h do not count as deflected
select ...   -- body per the rate pattern above, sources via {{ source(...) }} / {{ ref(...) }}
```

```yaml
# models/metrics/schema.yml
version: 2
models:
  - name: om_1_deflection_rate
    description: >
      OM-1 Ticket deflection rate. Formula (verbatim, spec v1.2.0): deflected /
      eligible tickets, weekly window, excludes internal test accounts; reopens
      within 48h do not count as deflected. Change the spec first, then this model.
    columns:
      - name: deflection_rate
        tests: [not_null]
      - name: eligible
        tests: [not_null]   # denominator ships beside every rate (VM-06)
```

Keep one model per metric ID so `Instrumentation-Status` maps one-to-one, and put the spec version in the model description — dbt docs then carry the definition provenance for free.

## Postgres flavor notes

Used above and worth translating deliberately: `date_trunc` (BigQuery: `TIMESTAMP_TRUNC`; Snowflake: `DATE_TRUNC` works), `count(*) FILTER (WHERE ...)` (ANSI fallback: `sum(CASE WHEN ... THEN 1 ELSE 0 END)`), `::numeric` casts (ANSI: `CAST(x AS numeric)`), `interval '48 hours'` literals (Snowflake/BigQuery: `DATEADD`/`TIMESTAMP_SUB`), `percentile_cont` (BigQuery: `APPROX_QUANTILES`). `nullif` is portable everywhere — use it everywhere.
