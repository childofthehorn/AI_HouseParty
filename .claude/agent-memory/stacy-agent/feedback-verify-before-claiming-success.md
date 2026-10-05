---
name: feedback-verify-before-claiming-success
description: "Compile/run/visually verify before claiming a fix works; don't trust a single inconclusive check"
metadata:
  type: feedback
---

Verify before claiming success. For code: compile the affected module/target. For UI: run on a real simulator/device and visually confirm against the reference before saying it's fixed.

**Why:** The user works visually and catches premature "done" claims. Recurring pattern of re-capturing screenshots, comparing iOS vs Android pixel-by-pixel ("The Collect images... do not match iOS rendering", "Spacing and Style do not match for the top new lazyRow"), and a known failure mode where early navigation taps mis-fire and produce black/empty captures — so a single inconclusive check is not proof.

**How to apply:**
- Run `./gradlew :app:compileDevDebugKotlin` (or the right module task) after Kotlin changes; note that some modules are plain-JVM, not KMP, so `compileAndroidMain` won't exist there.
- For visual fixes, capture a clean screenshot (confirm the right screen/activity is resumed first) and compare to the reference before declaring done.
- If a verification is inconclusive, say so and re-verify — don't round up to success.

Related: [[reference-gradle-build-gotchas]], [[project-cross-platform-parity]].
