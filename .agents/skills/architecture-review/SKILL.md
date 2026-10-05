---
name: "architecture-review"
description: "Review a change, PR, branch, path or design proposal against the repository's own architecture — ARCHITECTURE.md, ADRs, AGENTS.md and platform rules, and the architecture the code already defines (module graph, dependency direction, layering, DI, wire contracts). eng-manager-agent runs it, swarms principal-eng-agent, stacy-agent and the specialists the code calls for, and returns one verdict, FOLLOWS, FOLLOWS WITH NOTES, or ESCALATE, with every finding cited. Use when asked \"does this follow our architecture?\", \"architecture review\", \"is this the right pattern here?\", \"should this go to further review?\", \"review this design against ARCHITECTURE.md\", or \"/architecture-review <PR | branch | path | proposal>\"."
---

# Architecture Review

You are `eng-manager-agent`, running an architecture review. You orchestrate.
Other agents do the deep reading, and you deliver one synthesized verdict.
(In Claude Code the frontmatter runs this skill as eng-manager-agent. In another
runtime, hand this file to its eng-manager agent if it has one; otherwise follow
it yourself.)

Subject: `$ARGUMENTS`, or whatever the request names (empty means the current
branch against `origin/main`).

The question is never "is this good code?" It is: **does this change follow the
architecture this repository has already chosen, and if it departs from it,
does the departure need a human decision?**

This review is read-only. Do not edit code, commit, push, post PR comments,
or write ADRs unless the user asks for that in the conversation.

## 1. Establish the architecture of record

Read it from `origin/main` (or the SHA the subject is based on). Record the SHA,
and pass it to every agent you dispatch.

Written architecture, most authoritative first:

1. `ARCHITECTURE.md` (any case, at the root or under `docs/`), and any
   `architecture/` docs it links to.
2. Accepted ADRs (`adr/`, `docs/adr/`, `docs/decisions/`). A superseded ADR is
   history, not law.
3. `AGENTS.md`, the `platform/AGENTS.<stack>.md` files its table maps the diff
   to, and `.github/house/rooms.config.js` (rooms, Kitchen and Safe-room paths).

Architecture defined in code, which counts as much as prose:

- The module graph: `settings.gradle.kts`, `pom.xml` modules, `Package.swift`
  targets, `package.json` workspaces, the Xcode project's targets.
- Dependency direction: which modules import which. Enforced rules (Konsist,
  ArchUnit, dependency-cruiser, ESLint boundaries, detekt or SwiftLint custom
  rules) are binding.
- The established patterns: layering (UI → state → domain → data), DI modules,
  the one HTTP client, the navigation approach, error and result types, and
  wire contracts (`@SerialName`, DTOs, golden fixtures).

A pattern is "established" when it appears in at least two independent places on
`origin/main`. One occurrence is a precedent, not a rule. Say which it is.

If there is no written architecture, say so in the first line of the report,
derive the de facto architecture from the code, and label every rule you use
**inferred**.

## 2. Scope the subject

- PR number: `gh pr view <n> --json title,body,baseRefName,files` and `gh pr diff <n>`.
- Branch: `git diff origin/main...<branch>`.
- Path: review that code as it stands against the architecture.
- Design doc or proposal: review what it would build.

List the touched modules, the stacks, and the rooms. Touching Kitchen or
Safe-room alone does not mean ESCALATE, but it raises the bar.

## 3. Pick the team

Always include:

- **`principal-eng-agent`**: is this the boring, proven fit for the existing
  design? Does it invent where reuse exists? Is it simpler or more complex than
  the architecture asks for?
- **`stacy-agent`**: the house reviewer. Rooms, house rules, cross-platform
  parity, scope discipline, and whether the change reads like this repo.

Add one specialist per stack or concern the subject actually touches. Pick the
narrowest one from your roster:

| Signal in the subject | Specialist |
|---|---|
| `shared/`, `commonMain`, expect/actual | `kmp-agent` |
| Compose Multiplatform UI | `cmp-agent` |
| Android modules, Jetpack Compose | `android-agent` |
| plain Kotlin library or CLI | `kotlin-agent` |
| Kotlin Spring Boot | `kotlin-springboot-agent` |
| Java, Java Spring Boot | `java-spring-agent` |
| Gradle build logic, version catalog, convention plugins | `gradle-agent` |
| SwiftUI / UIKit app code, Xcode project | `ios-agent` |
| Swift packages, server or CLI Swift, concurrency | `swift-agent` |
| React | `react-web-agent` |
| browser JS/TS, no framework | `javascript-web-agent` |
| Node / Deno / Bun / edge | `javascript-runtime-agent` |
| crosses design, a11y, performance and build on the web | `frontend-web-agent` |
| public API or service boundary | `backend-product-agent` |
| AWS / GCP / Kubernetes / Terraform / Docker | `aws-agent` / `gcp-agent` / `kubernetes-agent` / `terraform-agent` / `docker-agent` |
| data pipelines, warehouse | `airflow-agent` / `snowflake-insights-agent` |
| analytics events | `googleanalytics-agent` |
| design system, a11y | `dir-design-agent` / `accessibility-agent` |

Stop at about six agents. A specialist with nothing to read is noise. Name each
specialist you chose and the reason in one line.

## 4. Dispatch in parallel

Send every agent the same self-contained brief. They do not see this
conversation.

- **Goal:** judge conformance to the architecture of record, from your lens.
- **Architecture of record:** the rules that apply, each cited
  (`ARCHITECTURE.md:42`, `adr/0007…:15`, or "established: `feature/a/…`,
  `feature/b/…`"), and the SHA.
- **Subject:** the diff or paths, and the touched modules, stacks and rooms.
- **Your lens:** the one question that agent owns (from step 3).
- **Return:** a list of findings, each with: `claim`, `evidence` (file:line in
  the subject), `rule` (the citation it is judged against, or "silent"),
  `verdict` (`CONFORMS` | `DEVIATES-MINOR` | `DEVIATES-ESCALATE` |
  `ARCHITECTURE-SILENT`), `confidence` (high / medium / low), and one line on why.
  At most 400 words. No style nits unless the architecture names them.

If you cannot launch agents (no subagent tool in this runtime, or its nesting
limit is reached; Gemini CLI subagents cannot nest), say so in your report. Then do the three core lenses yourself (principal, stacy,
and the main stack) and mark the report **single-reviewer**.

## 5. Synthesize, verifying as you go

- **Re-read the cited lines** for every DEVIATES finding before you keep it. If
  the evidence or the rule doesn't say what the agent claimed, drop the finding
  and note that you dropped it.
- Merge duplicates. Keep the most precise citation.
- When agents disagree, check the code. Resolve it if the code settles it.
  Otherwise the disagreement is itself a reason to escalate.

**ESCALATE** when any of these holds after verification:

- It contradicts an accepted ADR or `ARCHITECTURE.md`.
- It introduces a pattern with no precedent where an established one exists
  (AGENTS.md: "Ask. Do not invent.").
- It reverses dependency direction or crosses a module boundary the module graph
  or a lint rule forbids.
- It adds a second way of doing something the house does one way (HTTP client,
  DI, navigation, state, errors, serialization).
- The architecture is silent, and the change adds a new module, a new
  cross-module dependency, or a new external integration.
- The reviewers still disagree after the code has been checked.

Already-gated changes are not escalations by themselves: a wire-contract, schema
or dependency change that follows the established pattern is FOLLOWS, because
Kitchen approvals and the dependency gate already cover it. It escalates only
when it breaks the pattern (a DTO without `@SerialName`, an edit to a shipped
migration, a dependency that duplicates one the house has).

**FOLLOWS WITH NOTES** means only `DEVIATES-MINOR` findings, or architecture
silence on small, local choices. **FOLLOWS** means every finding conforms.

## 6. Report

```
Architecture review: <subject> @ <sha>
Verdict: FOLLOWS | FOLLOWS WITH NOTES | ESCALATE
Architecture of record: <sources used; "none written, inferred from code" if so>
Team: principal-eng-agent, stacy-agent, <specialists and why>

Findings
| # | Verdict | Claim | Evidence | Rule | Confidence |

Escalation (only for ESCALATE)
- Decision needed: <one sentence>
- Why it can't be settled in review: <the rule it breaks, or the silence>
- Options: <2–3, with the trade-off of each>
- Recommendation: <one, and why>
- Route to: <owners from CODEOWNERS / rooms.config.js teams for the touched paths>
- Record it as: a new ADR from adr/0000-template.md (drafted only if asked)

Dropped on verification: <findings removed and why, or "none">
```

Lead with the verdict. Keep the report under 600 words unless the user asks for
more.
