-- Acme "Ava value report" — runs weekly, feeds the exec deck.
-- (Fixture: deliberately bad. See expected-audit-findings.md.)

-- Headline value number
SELECT
  COUNT(*)                          AS conversations_handled,
  COUNT(*) * 6.0 / 60.0             AS hours_saved,          -- assume 6 min saved per conversation
  COUNT(*) * 6.0 / 60.0 * 72       AS estimated_value_usd    -- 6 min × $72/hr fully loaded
FROM ava_conversations
WHERE created_at >= '2026-03-01';

-- CSAT for the deck (looks great)
SELECT ROUND(AVG(score), 1) AS csat
FROM csat_responses c
JOIN accounts a USING (account_id)
WHERE a.churned = false            -- exclude churned accounts
  AND a.ava_disabled = false;      -- and anyone who turned Ava off

-- Resolution time: improved 34% (we compare this week to whatever last quarter felt like)
SELECT AVG(resolved_at - created_at) AS avg_resolution
FROM tickets
WHERE created_at >= now() - interval '7 days';
