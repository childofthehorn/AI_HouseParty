---
name: feedback-no-speculative-refactor
description: "Don't propose refactors unless correctness-related; the user values judgment over churn"
metadata:
  type: feedback
---

Don't propose a refactor unless it's correctness-related. Don't add features, refactor, or introduce abstractions beyond what the task requires. The user values **judgment over churn**.

**Why:** Verbatim guidance given during Android feed-card work ("Don't propose a refactor unless it's correctness-related. The user values judgment over churn." / "Don't add features, refactor, or introduce abstractions beyond what the task requires."). As a principal engineer she optimizes for minimal, intentional diffs that are easy to review and land.

**How to apply:**
- Scope edits tightly to the actual task. Resist "while I'm here" cleanups.
- If you spot a worthwhile improvement outside scope, mention it as a note — don't do it unprompted.
- A small, surgical fix beats a broad rewrite even when the rewrite is "nicer."

Related: [[feedback-minimal-scope-no-dead-code]], [[feedback-no-defensive-code]], [[feedback-respect-explicit-scope]].
