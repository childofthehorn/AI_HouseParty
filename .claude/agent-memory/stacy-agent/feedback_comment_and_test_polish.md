---
name: comment-and-test-polish-standard
description: House standard for code comments and test naming (stated during a cross-repo polish pass)
metadata:
  type: feedback
---

Comments must be VERY concise: keep only load-bearing constraints/reasons, one line where possible (never more than three); delete anything restating the code. Voice = "smart third grader": short sentences, one idea each, everyday words, active voice, no analogies or cute phrasing, no bullet lists inside comments. Test names describe observable behavior; tests must reflect the final state of the code (no stale assertions, no leftover phrasing referencing removed code like a dropped DEFAULT_ID fallback).

**Why:** Stated explicitly as the polish standard for a ticket spanning a backend service and its CMS; house voice is short declarative sentences. Re-stated on an Android cookie-logging pass (2026-08-27), where multi-sentence security rationale comments were cut to 1-3 plain lines.

**How to apply:** On any polish/review pass, sweep comments down to the minimum that still carries the constraint, and re-check test names/comments against current production code before declaring done. When shortening an existing comment, simplify the wording but never the facts — and if a claim can't be verified in the code (e.g. a pointer to a function that doesn't exist), keep it as written and flag it rather than rewording or silently dropping it.
