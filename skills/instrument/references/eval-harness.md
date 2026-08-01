# Eval Harness

The local-first loop for grading AI output quality without lying about it. Grounded in the EvalGen findings (arXiv:2404.12272, the [EVALGEN] receipt in the audit skill's evidence file): evaluation criteria cannot be fully defined a priori — grading real outputs changes the criteria themselves. The harness treats that drift as the mechanism, not a bug. VM-xx IDs refer to [../../audit/references/anti-patterns.md](../../audit/references/anti-patterns.md).

Two non-negotiables, both spec-enforced:

- Every eval maps to an outcome metric via §5 `Maps-To-Outcome` — an unmapped eval reported as business value is VM-11.
- Judge scores are never reported without judge–human agreement beside them — an uncalibrated judge grades its own homework (VM-12).

## The loop

1. **Collect real outputs.** Sample actual production or dogfood traffic into JSONL — never a synthetic-only set, and never a hand-picked "good examples" file (that is VM-09 applied to evals). Random-sample; stratify by segment or channel when volume allows. Target enough volume to grade at least 30.
2. **Human-grade a sample, n≥30, in a CSV.** Pass/fail plus notes, graded against the criteria file. Two graders on an overlap subset when possible — where graders disagree, that disagreement is criteria material, not noise.
3. **Derive and refine criteria from the grading.** Expect criteria drift: borderline cases will surface rulings nobody anticipated ("links to stale docs count as failures"). Append each ruling to the criteria file. This is the calibration pass working as designed (EvalGen; VM-12) — record it in the spec's §5 `Calibration` block, and expect the criteria file's git history to have commits.
4. **Run the judge** over the sample with the current criteria, deterministic settings.
5. **Report judge–human agreement ALONGSIDE pass rate — never pass rate alone.** Simple percent agreement on the overlap set is the floor; note Cohen's kappa when pass/fail classes are heavily imbalanced (99% agreement is easy when 99% pass). Below the target agreement recorded in §5, the pass rate is not yet a number — it is a draft.
6. **Recalibrate on cadence.** The spec's §8 schedule owns the rhythm (e.g. grade 30 at weeks 2 and 6, then quarterly) with out-of-cycle triggers: model or provider change, prompt change, criteria edit, or an agreement drop below target. Update §5 `Calibration` (graded n, agreement, date) each pass — the close-the-loop step in the skill bumps the spec patch version. If the environment supports scheduled or recurring tasks, offer to schedule the calibration pass; the manual fallback is the spec's `Next-Review` date, which the audit skill checks anyway.

## Layout

Generated into `metrics/instrumentation/evals/`, one criteria file and one grades CSV per spec §5 eval:

```
metrics/instrumentation/evals/
├── criteria/ev-1.md          # judge prompt, versioned in git — it WILL drift, on purpose
├── samples/2026-08-01.jsonl  # {"id", "input", "output", "meta"} — real outputs only
├── grades/ev-1-human.csv     # sample_id,grader,pass,notes — the calibration ground truth
└── run.mjs                   # judge + report (sketch below)
```

Criteria file sketch — seeded from the spec's `Grades` field, `Maps-To-Outcome` in the header (the reason this eval exists at all, per VM-11), and an append-only rulings section that grows during grading:

```markdown
# EV-1: Response helpfulness

- Maps-To-Outcome: OM-1 (deflection-without-reopen — this eval exists to predict it)
- Grades: whether the assistant's answer resolves the ticket without human help

## Pass means
- Addresses the question actually asked, with steps executable in the current product

## Fail means
- Hedging non-answer, wrong product area, or a capability the product does not have

## Edge rulings (append-only — the drift log)
- 2026-08-14: links to stale docs count as FAIL even when the prose is correct
- 2026-08-14: partial answers that correctly escalate count as PASS
```

## Method variants

The spec's §5 `Method` field decides what the stub contains:

- **`llm-judge`** — the full loop above: criteria file, judge, human grades, agreement reporting.
- **`rule`** — deterministic assertions in the run script (regex, schema checks, exact-match); no judge and no ongoing agreement number. Still validate the rules ONCE against a human-graded sample — a rule that disagrees with humans is just a fast wrong judge.
- **`human`** — the grading CSV workflow is the metric itself: no judge, and the reported number is the human pass rate with its n. The calibration block records inter-grader agreement instead of judge–human.

## Minimal runnable harness

Plain Node 22+, zero dependencies, prompts as files, no framework. The one hole to fill is `judge()` — wire it to whatever model access the project already has (SDK, CLI, gateway). Everything else runs as-is.

```javascript
// run.mjs — EV-1 judge runner. Usage: node run.mjs samples/2026-08-01.jsonl
// Reports pass rate AND judge–human agreement — never the first without the second (VM-12).
import { readFileSync } from 'node:fs';

const criteria = readFileSync(new URL('criteria/ev-1.md', import.meta.url), 'utf8');
const samples = readFileSync(process.argv[2], 'utf8').trim().split('\n').map(JSON.parse);

// grades/ev-1-human.csv: sample_id,grader,pass,notes (pass: 1 or 0).
// Naive split is fine because only columns 0 and 2 are read — keep IDs and
// grader names comma-free, or swap in a real CSV parser.
const human = new Map(
  readFileSync(new URL('grades/ev-1-human.csv', import.meta.url), 'utf8')
    .trim().split('\n').slice(1)
    .map((line) => line.split(','))
    .map(([id, , pass]) => [id, pass === '1'])
);

async function judge(criteriaText, sample) {
  // Fill this in: call a model with criteriaText + sample.input + sample.output,
  // using the model access this project already has. Deterministic settings.
  // Must return { pass: boolean, reason: string }.
  throw new Error('judge() not wired to a model yet');
}

let passes = 0, overlap = 0, agree = 0;
for (const sample of samples) {
  const verdict = await judge(criteria, sample);
  if (verdict.pass) passes += 1;
  if (human.has(sample.id)) {
    overlap += 1;
    if (human.get(sample.id) === verdict.pass) agree += 1;
  }
}

const pct = (n, d) => (d ? ((n / d) * 100).toFixed(1) + '%' : 'n/a');
console.log(`EV-1 pass rate:             ${pct(passes, samples.length)} (n=${samples.length})`);
console.log(`EV-1 judge-human agreement: ${pct(agree, overlap)} (graded n=${overlap})`);
if (overlap < 30) {
  console.log('WARNING: fewer than 30 human-graded samples — do not trust the pass rate yet (VM-12).');
}
```

Report both numbers everywhere the eval appears — a status update quoting the pass rate without the agreement line gets the finding it deserves in the next audit.

## Platform wiring (optional paths)

The local loop above is canonical and sufficient. Wire a platform only when its dependency is already in the project (per the skill's stack detection), keep criteria files and the human-grades CSV in git as the source of truth, and describe integrations at the level below — look up exact APIs in the vendor docs at wiring time rather than guessing signatures.

### Langfuse

LLM observability, self-hostable. Conceptual mapping: sampled outputs become a Langfuse dataset (or are pulled FROM its traces, replacing the collect step); the judge attaches a score to each item; human grades enter as annotation-queue scores on the same items, so judge-vs-human comparison is visible in their UI. Current APIs: langfuse.com/docs.

### Braintrust

Eval platform with a first-class eval harness. Conceptual mapping: the samples file becomes a Braintrust dataset; the judge becomes a scorer function; human grades ride along as expected labels or human-review scores; their UI then tracks scorer-vs-human deltas across runs and model versions. Current APIs: braintrust.dev/docs.

Either way, the two non-negotiables travel with the data: the eval stays mapped to its outcome metric, and no pass rate ships without its agreement number.
