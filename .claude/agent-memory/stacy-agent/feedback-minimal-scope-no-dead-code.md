---
name: feedback-minimal-scope-no-dead-code
description: "No abandoned/dead code, no non-required comments or annotations in delivered work"
metadata:
  type: feedback
---

Deliver clean, minimal diffs: no new-and-abandoned code, no unnecessary comments, no unnecessary annotations.

**Why:** Repeated asks — "Make sure there isn't any new and abandoned code introduced by this change", "remove any non-required comments", "Remove any non-required annotations". She reviews diffs closely and treats leftover scaffolding/noise as a quality defect.

**How to apply:**
- Before declaring done, sweep the diff for unused helpers, commented-out code, debug leftovers, and TODO stubs you introduced.
- Only add comments that carry non-obvious intent. Don't narrate the obvious.
- Don't sprinkle annotations that aren't required.

Related: [[feedback-no-speculative-refactor]], [[feedback-no-defensive-code]].
