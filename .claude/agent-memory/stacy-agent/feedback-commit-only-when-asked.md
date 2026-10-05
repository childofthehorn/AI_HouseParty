---
name: feedback-commit-only-when-asked
description: Only commit/push when explicitly asked; never skip git hooks or use destructive git ops without approval
metadata:
  type: feedback
---

Only create commits or push when the user **explicitly asks**. When it's unclear, ask first — do not commit proactively after finishing work.

**Why:** Stated repeatedly across Android, iOS, and backend sessions and codified in CLAUDE.md. The user controls when work lands and wants to review/structure PRs (often against a specific Jira ticket) before anything is committed.

**How to apply:**
- Use the commit/PR attribution trailers the harness provides for the current model — never hardcode a model name. PR bodies also state provenance (model/tool, rough % generated) per the PR template.
- Never skip hooks (`--no-verify`, `--no-gpg-sign`, etc.) unless the user explicitly requests it.
- No destructive git operations.
- Finishing a task ≠ permission to commit it. Surface that it's ready and wait.

Related: [[feedback-respect-explicit-scope]], [[feedback-ticket-spec-pr-workflow]].
