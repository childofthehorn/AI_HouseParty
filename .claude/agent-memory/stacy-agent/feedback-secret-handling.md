---
name: feedback-secret-handling
description: Treat shared tokens/secrets as compromised; keep secrets server-side/SSM; never commit local-only config
metadata:
  type: feedback
---

Handle secrets defensively and proactively.

**Why:** Real incidents. A GitHub PAT (`ghp_…`) appeared in `local.properties` via an IDE selection; the right move was to flag it compromised, tell the user to revoke at github.com/settings/tokens, and verify via `git ls-files` / `git log -S` that it never entered tracked history. LaunchDarkly tokens are read server-side only (env / AWS SSM, e.g. `LAUNCHDARKLY_READ_ONLY_TOKEN`), never sent to the browser.

**How to apply:**
- Any secret shared via IDE/system-reminder/paste → treat as compromised; instruct revoke; never echo, commit, or transmit it.
- `local.properties` and similar stay gitignored.
- Temp local-only config must NOT be committed — e.g. `push: false` in `src/payload.config.ts` is local-boot only; add it to run locally, then revert before any commit.
- Secrets resolve server-side from SSM/env, masked, never returned to clients.

Related: [[feedback-commit-only-when-asked]], [[user-stacy-principal-eng]].
