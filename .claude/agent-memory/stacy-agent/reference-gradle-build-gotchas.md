---
name: reference-gradle-build-gotchas
description: "Gradle/Android build gotchas — variant compile tasks, KMP vs plain-JVM modules, debug source-set merging, daemon OOM, per-framework compose resources"
metadata:
  type: reference
---

Build facts learned the hard way on multi-module Android / KMP apps:

- **Variant compile tasks:** verify Kotlin changes with the variant task (e.g. `./gradlew :app:compileDevDebugKotlin`). Plain-JVM modules have no `compileAndroidMain` ("task not found"); use their `compileKotlin`.
- **Build-type source sets:** `src/debug` merges into **every** `*Debug` variant across flavors, never into release. Gate debug-only tooling accordingly.
- **Daemon OOM during big merges:** "Gradle build daemon disappeared unexpectedly" is usually the daemon running out of memory, not a compile error. Raise `-Xmx` or use `--no-daemon` for that module. On backend services, ParallelGC on JDK 21 and test JVMs at `-Xmx512m`/`1g` cause GC churn while Spring contexts load.
- **ktlint coverage:** audit which modules actually apply it. Enforcement level drifts: [[reference-lint-enforcement-drifts-per-repo]].
- **Compose Multiplatform resources on iOS:** fonts must land in each framework's `compose-resources`. A `MissingResourceException` for a font usually means Compose looked in the wrong framework.
- **iOS simulators:** pin a concrete simulator ID rather than relying on "active."

Related: [[feedback-verify-before-claiming-success]], [[project-multiplatform-first]].
