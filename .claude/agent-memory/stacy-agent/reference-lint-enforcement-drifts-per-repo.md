---
name: reference-lint-enforcement-drifts-per-repo
description: "Whether lint (ktlint, ESLint, SwiftLint, dart analyze…) fails the build differs per repo and changes over time — check the config before calling a violation build-breaking or new"
metadata:
  type: reference
---

Lint enforcement is a per-repo setting that drifts. Two sibling repos can share a ruleset and still disagree on whether it fails the build.

Example: an Android repo applied ktlint to every subproject but set `ignoreFailures.set(true)` ("report-only until a cleanup pass"), and no workflow ran ktlint as a gate. Its sibling multiplatform repo flipped ktlint to build-failing in a single PR (2026-09-30); after that, `./gradlew check` failed in CI on violations. Days later, a long-lived branch that merged `main` started failing on a method chain it hadn't touched. The ruleset had changed under it.

Other traps from the same audit: lint filters that exclude `src/test/` entirely, a root-level block that only covers root build scripts, and a formatter (Spotless) applied to 3 modules instead of all of them.

**How to apply:**
- Before calling a lint violation "build-breaking", read the repo's lint config (`ignoreFailures`, `--max-warnings`, `continue-on-error`) and the CI workflow that runs it.
- When a PR that merged `main` newly fails lint, check whether the violation predates the merge before blaming the author.
- Re-verify per repo. Don't assume siblings stay in sync.

Related: [[verify-against-origin-main]].
