# Event Design

How to turn a spec metric into the smallest honest set of tracking events. Every rule here serves one of three goals: events stay computable (formulas can actually be evaluated from them), private (no PII leaks into the analytics pipeline), and consumed (nothing is tracked that no metric reads). VM-xx IDs refer to the catalog at [../../audit/references/anti-patterns.md](../../audit/references/anti-patterns.md).

## Derive events from metrics, never the reverse

Start from the spec formula, not from "what could we track". For each metric, list what the numerator counts, what the denominator counts, and what the filters and window need — then define exactly the events and properties that supply those, and stop.

The denominator usually needs its own event. A deflection rate needs `assistant_offered` (every eligible ticket) as much as `ticket_deflected` (the successes) — exposure events are what make honest denominators (VM-06) and intention-to-treat cohorts (VM-10) computable later. If only success events exist, only vanity rates can be built.

## Naming: object_action

- Format: `object_action`, snake_case, lowercase, action verb in past tense: `ticket_deflected`, `suggestion_accepted`, `thread_escalated`, `assistant_offered`.
- Object first (the noun the metric counts), action second — events sort and group by the thing they describe.
- No gerunds or present tense (`deflecting_ticket`), no UI-frame names (`button_clicked` records where something happened, not what happened), no team or product prefixes (`ava2_new_ticket_final`).
- One event per user action. Two events firing for the same underlying action double-counts everything downstream — a detection signal for VM-07.

## Property taxonomy: actor / object / context

Give every property a home in one of three groups. A property that fits none of them is usually bloat.

| Group | Carries | Examples |
|---|---|---|
| actor | who or what initiated — always pseudonymous | `account_id` (hashed), `user_role`, `seat_type` |
| object | the thing acted on — what formulas count and filter | `ticket_id`, `channel`, `model_version`, `tokens_out` |
| context | where and under what conditions | `app_version`, `surface`, `session_id`, `experiment_arm` |

- Property names: snake_case, no abbreviations that need a decoder ring.
- Types from a small vocabulary: `string`, `number`, `boolean`, `enum(...)`, `timestamp`. Prefer `enum` over free text everywhere a value set is known.

## PII rules

- **No raw content in events, by default.** Message text, prompts, completions, and uploaded documents do not belong in analytics events. Content needed for quality grading goes to the eval sample store (see [eval-harness.md](eval-harness.md)) under its own access controls — the analytics pipeline gets counts, durations, and categories.
- **Identifiers are pseudonymous.** Hashed or opaque IDs only; never email, name, or phone number as a property value. Hash upstream, before the SDK call, so raw identifiers never leave the application.
- **Data minimization.** A property no metric formula or filter consumes is not collected. Collecting it "in case" creates liability now for a maybe later.
- **Free-text properties are PII magnets.** A `notes:string` property will eventually contain a customer's email signature. Enumerate or drop.

## Versioning event names for breaking changes

When an event's meaning or trigger point changes — not a new optional property, but a semantic change to what the event asserts — mint a versioned name: `ticket_deflected_v2`. Never silently redefine an existing event: a trend spanning two definitions is fiction (VM-18).

- Keep the old event flowing through a migration window when call sites cannot flip atomically, and record the cutover date.
- Annotate the series break in the spec §9 Changelog and anywhere the metric is charted.
- Additive changes (a new optional property) do not need a new name — removed or re-typed properties do.

## The anti-bloat rule

**An event no metric consumes is deleted (VM-20).** The tracking plan's `Maps-to-metric` column is mandatory precisely so this rule is enforceable: every event answers to a named OM/GM, and audits delete the ones that answer to nothing. Deletion is a feature — tracking-plan sediment is where definition rot and PII risk accumulate. Keep a graveyard table of deleted events so zombies do not get re-added next quarter.

## Typed constants

String literals at call sites are how definitions drift: `'ticket_deflected'` here, `'ticket-deflected'` there, and the metric quietly splits in two. Generate one module that owns every event name and property shape; call sites import from it and nothing else. The `track` function is injected, keeping the module SDK-agnostic — it works unchanged whether the project uses PostHog, Segment, or a homegrown pipe.

TypeScript:

```typescript
// events.ts — generated from metrics/MEASUREMENT.md v1.0.0. One module owns all names.
export const EVENTS = {
  TICKET_DEFLECTED: 'ticket_deflected',   // → OM-1 (numerator)
  ASSISTANT_OFFERED: 'assistant_offered', // → OM-1 (denominator), GM-1
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export interface TicketDeflectedProps {
  ticket_id: string;
  account_id: string; // hashed upstream, never raw
  channel: 'email' | 'chat';
  model_version: string;
}

// One wrapper per event: call sites cannot misspell a name or omit a property.
export function trackTicketDeflected(
  track: (name: EventName, props: TicketDeflectedProps) => void,
  props: TicketDeflectedProps,
): void {
  track(EVENTS.TICKET_DEFLECTED, props);
}
```

Python:

```python
# events.py — generated from metrics/MEASUREMENT.md v1.0.0. One module owns all names.
from typing import Callable, Literal, TypedDict

TICKET_DEFLECTED = "ticket_deflected"    # → OM-1 (numerator)
ASSISTANT_OFFERED = "assistant_offered"  # → OM-1 (denominator), GM-1

class TicketDeflectedProps(TypedDict):
    ticket_id: str
    account_id: str                      # hashed upstream, never raw
    channel: Literal["email", "chat"]
    model_version: str

def track_ticket_deflected(
    track: Callable[[str, TicketDeflectedProps], None],
    props: TicketDeflectedProps,
) -> None:
    """One wrapper per event: call sites cannot misspell a name or omit a property."""
    track(TICKET_DEFLECTED, props)
```

Rules around the module:

- Adding an event means adding its tracking-plan row FIRST — the plan is the source of truth, the module is generated from it.
- The `→ OM-x` comments are not decoration; they are the anti-bloat rule made greppable. A constant with no metric comment is a deletion candidate.
- Regeneration replaces the module wholesale; hand edits belong in the tracking plan, then regenerate.
