---
name: verify-against-origin-main
description: When documenting or asserting repo state, read from origin/main (git show/ls-tree/grep), not the local working tree — local checkouts are routinely stale or on a feature branch
metadata:
  type: feedback
---

When the task is to **document or assert what exists in a repo** (Confluence pages, specs, PR descriptions, "does X exist on main" questions), read from `origin/main` explicitly rather than trusting the working tree:

```
git ls-tree -r --name-only origin/main -- <path>
git show origin/main:<path>
git grep -l <pattern> origin/main
```

**Why:** In an Android documentation task, local HEAD was several commits behind `origin/main` and a merged PR's changes were invisible to normal `Read`/`Grep`. Separately, `ls` showed two module directories (`feed/preview-embed-web/`, `feed/embed-card-builder/`) that looked real but contained **only stale `build/` output** left over from a checkout of a feature branch — no `src/`, no `build.gradle.kts`, and absent from `settings.gradle.kts` on `main`. Both traps produce confidently-wrong documentation.

**Corollary — when auditing a doc that pins a commit, pin every measurement to that commit, and put the SHA in the delegation prompt.** Reviewing a Confluence page that declared `HEAD 3543e7667`, the working tree advanced 12 commits mid-session (a new app module and a root `Package.swift` appeared). Every subagent that measured against the moved HEAD reported a table of off-by-one "errors" — commonMain 1756 vs 1744, desktopMain 96 vs 77, app-shared 67 vs 65 — and *all of them dissolved* when re-measured with `git ls-tree -r --name-only <sha>` / `git show <sha>:<path>`. Two agents also "refuted" claims that were true at the pinned commit. Reporting drift as an authoring error destroys the review's credibility, so re-verify any count a delegate flags before repeating it.

**How to apply:**
- First move in any "what's on main?" investigation: `git log --oneline -1 HEAD` vs `git log --oneline -1 origin/main`. If they differ, switch to `origin/main` reads for everything.
- If the artifact under review names a commit, that SHA — not `main`, not `HEAD` — is the measurement basis, and it belongs in every subagent prompt.
- zsh gotcha when pinning: `$P:feature/...` applies the `:f` history modifier and silently eats characters. Write `"${P}:feature/..."`.
- Treat a directory's existence on disk as **not** evidence it exists on a branch. Confirm with `git ls-tree` and with the build's own module registry (`settings.gradle.kts`, workspace file, etc.).
- Corroborating signal that a module is real: it appears in the build registry AND has source files, not just `build/`.
