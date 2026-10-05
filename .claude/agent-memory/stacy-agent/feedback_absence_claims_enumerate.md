---
name: absence-claims-enumerate
description: Never publish a grep-derived absence claim or count without enumerating and classifying every hit
metadata:
  type: feedback
---

When about to publish an absence claim ("zero X anywhere", "nothing does Y", "no such task exists"), do **not** establish it with a single grep containing two ANDed tokens. Enumerate the full positive set, then read it.

Bad: `grep -rn "gradlew.*[Ii]os" .github/workflows/` to prove no iOS CI builds exist.
Good: `grep -rn "gradlew" .github/workflows/` — list every hit, then classify each one.

**Why:** On a Confluence page about an Android repo's iOS build, I published "zero `./gradlew` invocations targeting any iOS/native task in any workflow." False. The real tasks were `assemble<App>ReleaseXCFramework` and `linkReleaseFrameworkIosArm64` — the first contains neither "gradlew"-adjacent "ios" nor a lowercase match on the same line, so a `gradlew.*ios` pattern cannot see them. The coordinator caught it and I had to publish a correction. A regex requiring two tokens on one line silently fails whenever the domain term is spelled differently (`XCFramework`, `Apple`, `Native`, `Darwin`, `simulator`) or sits on another line of a multi-line YAML `run: |` block.

**How to apply:** Any time the deliverable contains "zero", "none", "never", "no X exists", or "not documented anywhere" — especially in docs an engineer will act on. Two guards:
1. Grep the *broad* anchor alone (the tool name, the file type), then classify every result by hand.
2. Distinguish claims that decompose. "iOS is not built in CI" and "iOS is not tested in CI" are different facts with different evidence; the first was false and the second was true. Splitting them made the warning more useful, not less.

Multi-line YAML/shell blocks defeat line-oriented grep generally — for those use `-A5` or read the file.

**The mirror-image error: counts inflated by mentions.** Same session, same page — I published "63 modules declare a `wasmJs` target" from `grep -rl "wasmJs"`. That counts files that *mention* the string, including a comment in the root `build.gradle.kts` that declares nothing. The real number was 62. Anchor a declaration count to the declaration syntax, not the identifier: `grep -rlE '^\s*wasmJs\s*(\{|\()' --include="build.gradle.kts"`. Then sanity-check the delta between the loose and strict patterns and explain every file in it. A number in a doc is a claim an engineer will plan against, so a count is an absence claim in disguise — "no other module has this target."

Related: [[verify-against-origin-main]] — same family of error, publishing repo-state claims without checking the authoritative source.
