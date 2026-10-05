---
name: reference-review-bot-config-from-base-branch
description: "AI review bots and pull_request_target workflows read their config from the BASE branch; config changes go live at merge; branch protection is readable via gh api"
metadata:
  type: reference
---

Review bots built on reusable workflows (and anything triggered by `pull_request_target`) read their config file from the **base branch**, not the PR head. Example: a bot kept reviewing on every push even though the PR's own head set `auto_review: first_only`, because `main` still said `always`. Config changes therefore take effect **at merge** and can't be tested from inside the PR that makes them. This repo's room workflows use the same property on purpose: a PR can't loosen its own rules.

Two related facts:

- A bot's check is often **not** a required status check, and comment-only verdicts don't block. Changing bot coverage creates a review-attention gap, not a branch-protection hazard.
- `gh api repos/<org>/<repo>/branches/main/protection` and `.../rulesets` are usually readable. Don't write "cannot determine branch protection" without trying. Read it and quote `required_status_checks.contexts`, `dismiss_stale_reviews`, `require_last_push_approval`, and `strict`.

**How to apply:** When reviewing bot or workflow config changes, say the change goes live at merge, check the required contexts from the API before claiming any gate impact, and check whether the README's prose about the bot went stale. See [[verify-against-origin-main]].
