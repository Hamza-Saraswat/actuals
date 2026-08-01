# AI Metrics/Evals Tool — Market Research

**Date:** 2026-08-01
**Question:** Is there room for a tool that takes your business context and generates the *right* metrics/evals for your AI tools — then actually calculates them — instead of the bloated/vanity metrics everyone has today? What shape should it take (skill, plugin, app, extension)?

**Verdict (short):** The problem is real and loudly documented. The two obvious versions of this idea — another LLM-evals platform, or another AI-ROI dashboard — are crowded, well-funded, and consolidating; do not build those. But the specific layer described (business context in → designed metric system out → instrumented) verifiably does not exist as a product. The right first shape is a Claude Code skill/plugin that orchestrates existing platforms via MCP, not a standalone app. Window is real but narrowing.

---

## 1. Is the problem real?

Yes — "companies can't measure AI value" is one of the best-documented pains in enterprise software right now:

- **MIT NANDA "GenAI Divide" (July 2025):** 95% of enterprise GenAI pilots show zero measurable P&L return. Heavily contested methodology (not peer-reviewed, loose failure definition) — but the loudness of the fight over the number is itself evidence nobody has trustworthy measurement. [Report PDF](https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf) · [Criticism](https://arnon.dk/mits-95-ai-failure-rate-is-wrong/)
- **McKinsey State of AI 2025:** only 39% of companies can attribute *any* EBIT impact to AI; most of those say <5%. [Source](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai)
- **Gartner (June 2025):** >40% of agentic AI projects will be canceled by end of 2027 — top causes include "unclear business value." [Source](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)
- **METR RCT (July 2025):** experienced devs were 19% *slower* with AI tools while believing they were 20% faster (~39-point perception gap). This discredits the self-reported "time saved" numbers that most corporate AI ROI claims rest on.
- **PwC 2026 CEO Survey:** 56% of CEOs report no revenue or cost benefit from AI. **Kyndryl (Feb 2026):** 61% of leaders under more ROI-proof pressure than a year ago.
- **The "false metrics" instinct is literally verified:** Microsoft's Copilot Dashboard computes "assisted value ($)" as a flat 6 minutes per Copilot action × a default $72/hour rate — and the number silently broke (undercounted) for two months in late 2025 without most customers noticing. [Methodology](https://techcommunity.microsoft.com/blog/viva_insights_blog/copilot-dashboard-update-%E2%80%93-features-and-data-interpretation-guide/4165494)
- **Faros AI's own telemetry (10k devs):** AI-assisted teams merge more PRs, but review time +91%, PR size +154%, and org-level DORA metrics flat — activity up, outcomes flat. Vendors' own data shows the proxy metrics are lying.

---

## 2. What already exists (three crowded lanes)

### Lane A — LLM eval/observability platforms (very crowded, consolidating)

All of these: start from traces (you must already be instrumented), stop at *quality* metrics (pass rate, hallucination, relevance, latency, cost), and target AI engineering teams.

| Product | Notes |
|---|---|
| [Braintrust](https://www.braintrust.dev) | Category leader. $80M Series B @ $800M valuation (Feb 2026). "Loop" AI assistant auto-generates scorers/datasets — but only inside an already-instrumented deployment. |
| [LangSmith](https://www.langchain.com/langsmith) | "Align Evals" (July 2025) calibrates LLM judges against human labels. Doesn't design your metric suite. |
| [Langfuse](https://langfuse.com) | Leading OSS option; reported acquired by ClickHouse (Jan 2026). Native MCP server. |
| [Arize](https://arize.com) | Phoenix OSS + "Alyx" copilot; debugs traces, suggests fixes. |
| [Galileo](https://galileo.ai) | Luna-2 judge models; Insights Engine auto-surfaces failure modes from traces. |
| [Freeplay](https://freeplay.ai) | Most PM/domain-expert-friendly; no-code eval creation (July 2026). Still per-eval, inside their SaaS. |
| [HoneyHive](https://www.honeyhive.ai) | Pivoted to observability *of* coding agents (June 2026) with ROI funnels (spend per merged PR) — one of the only eval→business-outcome links, but coding-agents only. |
| Platform-native | OpenAI Evals/Graders, Google Stax + Vertex eval service, Azure AI Foundry evaluators, Databricks MLflow 3 `make_judge` + Judge Builder — commoditizing the judge layer from below. |

Consolidation signals: Humanloop → Anthropic acqui-hire (Aug 2025, platform shut down); Statsig → OpenAI **$1.1B** (Sept 2025); W&B → CoreWeave; Gentrace (the "evals for non-engineers" play, $14M raised) down to 3 employees by May 2026.

**Key methodology fact — EvalGen / "criteria drift"** ([arXiv:2404.12272](https://arxiv.org/abs/2404.12272)): you cannot fully define eval criteria a priori; grading real outputs changes your criteria. Any credible product must build in an iterative human-grading loop — one-shot "generate my evals from a description" produces misaligned evals. (This is also why "2–3 iterations every time" happens with Claude: it's inherent, not a prompting failure. The product opportunity is *structuring* the iteration, not eliminating it.)

The Hamel Husain / Shreya Shankar "AI Evals for Engineers & PMs" course is the #1 course on Maven — huge demand signal that non-experts want to learn what to measure, and tooling ignores them.

### Lane B — AI impact dashboards for engineering (crowded, enterprise, fixed taxonomies)

- [DX](https://getdx.com) — AI Measurement Framework (utilization/impact/cost) + Core 4. The most-cited serious framework. Still leans on self-reported time savings (the thing METR discredited). Enterprise.
- [Faros AI](https://www.faros.ai), [Jellyfish](https://jellyfish.co), [LinearB](https://linearb.io), [Swarmia](https://www.swarmia.com) — adoption + spend + delivery metrics (DORA, cycle time) for Copilot/Cursor/Claude Code. Fixed metric taxonomies, engineering-only, sold to eng execs/CFOs.
- Native: GitHub Copilot Metrics API (GA Feb 2026) + impact dashboard (July 2026); [Claude Code Analytics](https://code.claude.com/docs/en/analytics) (lines accepted, accept rate, spend, OTel export); Cursor team analytics; ChatGPT Enterprise workspace analytics. All usage proxies. Even Anthropic recommends pairing with DORA — i.e., the vendor's own metrics don't answer "did this help?"

### Lane C — Workplace AI "value" dashboards (the vanity-metric factory)

- Microsoft Copilot Analytics (the 6-min × $72/hr construct), Glean ROI content with no computable methodology, Writer "ROI dashboard," Moveworks (semi-honest because ticket deflection has known unit costs).

### The experimentation angle (the honest answer, owned by giants)

- OpenAI bought Statsig ($1.1B) and Datadog bought Eppo (~$220M) — the industry's serious players concluded A/B testing is the honest attribution method for AI features. But these are generic experimentation platforms that require a data team; neither is an "AI value" product.

### Near-misses (fragments of the idea, none complete)

- **Mixpanel + DoubleLoop** (acquired Oct 2025): AI-generated KPI/metric trees from strategy context — the one true "AI designs your metrics" pioneer, now platform-locked into Mixpanel and partly still roadmap.
- **[Accoil Product Tracking Skills](https://github.com/Accoil/product-tracking-skills)** (Claude plugin, official directory): business-case → tracking plan → generated instrumentation code for 24+ destinations. **Its README explicitly states "Define KPIs or success metrics" is what it does NOT do.** ~36 GitHub stars. The gap, stated in a competitor's own README.
- **[ChatPRD](https://www.chatprd.ai)** (100k+ PMs): generates success-metrics sections in PRDs — template-depth prose, no analytics integration; the metrics die in the document. But proves a solo founder can win a PM-workflow wedge.
- **[Workhelix](https://www.workhelix.com)** (Brynjolfsson, $15M Series A): task-based AI opportunity scoring + ROI tracking — enterprise-only, high-touch, top-down.
- **[Tability](https://www.tability.io)** / OKR tools: generate OKR *prose* from a prompt; zero connection to data.
- **Amplitude AI Plugin** (May 2026) / **PostHog Claude plugin**: real auto-instrumentation from inside Claude Code/Cursor — for their own platforms, event-level only, no business-metric design.
- 2026 "value realization" long tail (TargetBoard, KPI Tree, Unframe): marketing-stage, fixed frameworks, no verified deployments.

---

## 3. The verified gap

Nobody does this chain end-to-end:

> Plain-English business/feature context → designed metric system (north star → driver metrics → guardrail/counter-metrics → eval metrics, with formulas and explicit "vanity metrics to avoid") → generated instrumentation (events, SQL, eval harness) → computed from your data → periodically re-audited.

Specifically unoccupied:
1. **The judgment layer** ("what should we measure, given OUR business") — today this is consultants or blog posts. Every tool assumes you already know.
2. **Joining the AI-quality layer (evals) with the business-outcome layer (KPIs)** — eval platforms stop at quality; analytics platforms don't know about evals; nobody connects "eval pass rate" to "support resolution cost."
3. **SMB/mid-market and non-engineering AI deployments** — a 50-person SaaS adding AI features has literally nothing except blog posts.
4. **Metrics auditing** — "look at my existing dashboard/tracking and tell me which numbers are bloated/false/double-counted" exists nowhere as a product, despite Microsoft's $72/hour construct making the case for it weekly.

Why the gap persists (honest): metric *ideas* are cheap — any LLM generates plausible KPIs. The hard parts are trust/context (consulting-shaped), reliable joins between AI usage data and outcome data, and causal attribution (needs baselines/experiments). A tool that only generates metric definitions is thin; the value is the full loop.

---

## 4. Packaging: what shape should this take?

| Shape | Verdict |
|---|---|
| Standalone SaaS / dashboard | ❌ Dead on arrival as a first move. Crowded, undifferentiated, slowest validation, incumbents ship weekly. |
| Chrome extension | ❌ Wrong surface. The work happens in codebases and data warehouses, not browser tabs. No precedent in this category. |
| MCP server alone | ❌ Plumbing, not product. No revenue precedent. |
| Prompt/template pack | ❌ Commodity; this is what "just give it to Claude" already is. |
| **Claude Code skill → plugin** | ✅ Right first move. Hours-to-days to ship, portable across ~40 tools via the Agent Skills open standard (Dec 2025), distributable via the official plugin directory, and can orchestrate existing platforms via their MCP servers instead of rebuilding them. |
| Hosted/team layer later | 💰 The monetization path — marketplaces have zero payment rails as of mid-2026. Free skill = validation + distribution; revenue comes from a hosted version (continuous re-audit, exec reports, team features) or productized consulting. |

Composable pieces that already exist (a skill rebuilds nothing):
- Analytics read/write MCPs: PostHog, Amplitude, Mixpanel (incl. Lexicon/tracking-plan writes), Avo (governed tracking plans)
- Eval platform MCPs: Langfuse (native), Braintrust, Arize Phoenix
- Usage data: Claude Code Analytics API/OTel, Copilot Metrics API, Cursor admin API
- Instrumentation codegen patterns: Amplitude's paste-a-prompt flow; Accoil's MIT-licensed skills as reference

Precedents that the channel works: Superpowers (~941k reported installs), PostHog/Amplitude vendor plugins, Accoil in the official directory. ChatPRD proves the adjacent solo-founder SaaS path once validated.

---

## 5. Recommended MVP: "metrics-architect" skill

Four capabilities, in priority order:

1. **Interview → Measurement Spec.** Structured intake (what the AI tool does, business goals, available data sources) → a versioned `MEASUREMENT.md`: 3–5 outcome metrics tied to business value with formulas and data sources, guardrail/counter-metrics, eval definitions, explicit anti-vanity checklist, and an honest "what you can't claim without a baseline/experiment" section. Bake in the EvalGen lesson: the spec is a draft that improves through structured grading of real outputs, not a one-shot oracle.
2. **Metrics audit mode.** Point it at existing dashboards/tracking/queries → it flags bloated, double-counted, self-reported, and vanity metrics with reasons. Distinctive, demo-able, nobody does it, and it's the emotional hook ("your numbers are lying — here's where").
3. **Instrumentation generation.** Emit the tracking events, SQL/dbt models, and eval harness — wiring into whatever the user has via MCPs (PostHog/Amplitude/Langfuse/Braintrust) or plain code.
4. **Recurring re-audit.** Scheduled run that re-checks metric health, drift, and definition rot — this is the seed of the paid/hosted layer.

**Validation bar:** 5–10 real teams using it; do they keep the spec alive and cite its numbers in decisions? Installs + interviews (no payment rails anyway). If teams generate a spec once and never return, the standalone thesis is weak — fold it into consulting or kill it.

---

## 6. Honest risks / how this fails

1. **The advice layer is thin on its own.** Good prompting of vanilla Claude gets 70% of the spec. Defensibility must come from the workflow (audit mode, instrumentation, re-audit loop, per-vertical templates), not the advice.
2. **Incumbents are marketing toward this.** Mixpanel (DoubleLoop metric trees) and Amplitude (agent suite) both gesture at it; neither has verifiably shipped context→metric-system design as of Aug 2026, but the window narrows.
3. **Gentrace's corpse:** "non-engineers run evals" as a standalone buyer thesis already failed once. Ship where engineers/AI-builders already work (hence the skill), let PMs/leaders consume the outputs.
4. **Honest attribution needs plumbing.** Real causal claims need baselines/experiments; small customers may not have the data. Wedge = opinionated design + lightweight causal checks on data they already have, and being explicit about confidence levels — never printing a fake dollar number (that's the Microsoft failure mode, and the differentiator).
5. **Consulting-shaped economics.** Every business is different; if per-customer customization doesn't compress into templates/verticals, this is a services business wearing a product costume. A vertical focus (e.g., SMB SaaS adding AI features, or field-service/trades software) is the likeliest way to make templates compound.

---

## 7. Sources / further reading

- Research threads (Aug 1, 2026): LLM evals landscape, AI ROI measurement landscape, metric-design tools + Claude ecosystem packaging. Key links inline above.
- Frameworks worth stealing from: DX AI Measurement Framework ([guide](https://getdx.com/blog/ai-measurement-framework-guide/)), Hamel/Shreya error-analysis-first evals doctrine ([FAQ](https://hamel.dev/blog/posts/evals-faq/)), EvalGen paper, McKinsey's leading-indicators+business-KPIs pairing, Statsig/Eppo on experiments as honest attribution.
