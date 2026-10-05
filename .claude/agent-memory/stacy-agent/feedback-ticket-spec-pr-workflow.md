---
name: feedback-ticket-spec-pr-workflow
description: "Work ships as ticket + spec + PR against the ticket; confirm team, sprint, status and assignee before creating tickets"
metadata:
  type: feedback
---

Delivery wraps code in ticket + spec + PR ceremony, and the parameters get stated explicitly, e.g. "generate a Jira ticket for this work and its specifications, then submit a PR with this branch against that ticket. Team X, current sprint, in progress, assigned to me."

- Cross-platform work gets one ticket per platform (clone, then set the right epic).
- Tech specs go to the team's wiki (e.g. Confluence) and link back to the ticket. Ground them in the codebases they describe.

**How to apply:**
- If team, sprint, status, or assignee is unstated, ask — don't guess from a previous ticket.
- Open the PR against the ticket and fill in the repo's PR template, including provenance.
- Creating a ticket is not permission to commit: see [[feedback-commit-only-when-asked]]. For Jira title quirks see [[feedback-jira-summary-html-escape]].
