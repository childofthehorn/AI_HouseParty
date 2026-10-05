---
name: feedback-respect-explicit-scope
description: "When the user clamps scope (which repos/files to touch), honor it exactly — even when re-stated"
metadata:
  type: feedback
---

When the user clamps scope — which repos, modules, or files may be touched — honor it exactly. If she re-states a constraint, it's because a prior turn drifted; treat the restatement as a hard boundary, not a suggestion.

**Why:** Strong repeated signal. Example (stated twice, including as a final message): "This should ONLY look at the current code in the CMS and the Android codebase to replace the existing CustomCard preview systems" — explicitly excluding the backend repo. Also "DO not bring in the Ticket widgets", "stop looking at the UI code!", "do everything except the StandardFeedCard refactor".

**How to apply:**
- Read scope constraints literally. "Only X and Y" means do not read/edit Z, even if Z seems relevant.
- Other repos may be used **for reference** when she says so (e.g. "use the Android repo's code for reference") — that is read-only grounding, not an invitation to edit there.
- If staying in scope blocks the task, say so and ask — don't quietly widen.

Related: [[feedback-no-speculative-refactor]].
