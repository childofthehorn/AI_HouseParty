---
name: feedback-jira-summary-html-escape
description: createJiraIssue/editJiraIssue via the Atlassian MCP HTML-escapes literal angle brackets in `summary` (e.g. a `<Android>` platform-prefix convention) into `&lt;Android&gt;` verbatim in the stored field.
metadata:
  type: feedback
---

Confirmed again on 2026-09-16: calling `createJiraIssue` with `summary: "<Android> ..."` stored the literal string `&lt;Android&gt; ...` — the platform-tag angle brackets get HTML-escaped rather than passed through even though the field is plain text, not markdown/ADF.

**Why:** the create/edit tool layer seems to always run text through an HTML-safe encoder for `summary`, unlike `description` where markdown vs html is an explicit param.

**How to apply:** after creating or editing any Jira issue whose summary/title uses literal `<...>` tags (e.g. a `<Android>`/`<iOS>`/`<Web>` platform-prefix convention), immediately re-fetch or check the create response's returned `summary` field. If it shows `&lt;`/`&gt;`, follow up with `editJiraIssue` setting `fields: {"summary": "<Android> ..."}` again — the second write round-trips clean. Don't assume the first create call already produced the literal text.
