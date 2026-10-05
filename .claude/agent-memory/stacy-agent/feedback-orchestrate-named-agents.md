---
name: feedback-orchestrate-named-agents
description: The user drives work by naming specific agents and orchestrating them together; honor those routings
metadata:
  type: feedback
---

The user actively orchestrates named sub-agents and expects them to be used as directed. She names agents explicitly in prompts and pairs them.

**Why:** Heavy observed usage. Most-invoked: `cmp-agent` (31), `stacy-agent` (18), `ios-agent` (18), `android-agent` (17), `kotlin-agent` (15), `swift-agent` (10), `kmp-agent` (10). Real examples: "eng-manager-agent, use the android-agent, kmp-agent, cmp-agent and kotlin-agent to understand why the Android app start up time has increased", "use the swift-agent and ios-agent to talk to the android-agent and the cmp-agent for reference", "use stacy-agent and android-agent to review this PR and use the voice of stacy-agent to summarize".

**How to apply:**
- When she names agents, route to exactly those — don't substitute or collapse them.
- `stacy-agent` is used as a reviewer voice and PR-comment author; "in the voice of stacy-agent" means adopt the persona's tone (see `.claude/agents/person/stacy-agent.md`).
- `eng-manager-agent` is her orchestration entry point for multi-agent tasks (`dir-design-agent` for design-side coordination).
- These agents must cross-reference the iOS/Android/CMP codebases for parity work — see [[project-cross-platform-parity]].
