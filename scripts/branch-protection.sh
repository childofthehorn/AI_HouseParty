#!/usr/bin/env bash
# Branch protection as code. Run once per repo, re-run after changing checks.
# Requires: gh auth login with admin on the repo.
#
# Only checks that run on every PR are required. The path-filtered workflows
# (jvm, android, shared kmp, swift, ios, web, dependency gate) never report when skipped, so
# requiring them would block unrelated PRs. Gate those with a ruleset that
# targets their paths, or make the workflows always run and exit early.
# Contexts are check-run (job) names, plus the room-approval-gate commit status.
set -euo pipefail

REPO="${1:?usage: branch-protection.sh owner/repo [branch]   e.g. your-org/your-app}"
BRANCH="${2:-main}"

gh api -X PUT "repos/$REPO/branches/$BRANCH/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "gitleaks",
      "mobile_specific",
      "pr-hygiene",
      "rooms-declared",
      "room-approval-gate"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true,
    "dismiss_stale_reviews": true,
    "require_last_push_approval": true
  },
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "restrictions": null
}
JSON

echo "protected $REPO@$BRANCH"
echo
echo "Kitchen and Safe-room approvals come from room-approval-gate (.github/house/rooms.config.js)"
echo "plus require_code_owner_reviews above. Verify with:"
echo "  gh api repos/$REPO/branches/$BRANCH/protection | jq '.required_pull_request_reviews'"
