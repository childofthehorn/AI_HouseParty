---
name: reference-decompile-vendor-aars-from-gradle-cache
description: How to verify closed-source SDK internals (Android AAR/JAR) by decompiling from ~/.gradle/caches with javap — and to pin the claim to the version the catalog actually uses
metadata:
  type: reference
---

Closed-source vendor SDK behavior can be verified rather than guessed. Artifacts are
already on disk in the Gradle cache:

```
find ~/.gradle/caches/modules-2/files-2.1 -ipath '*<vendor>*' -name '*.aar'
```

Unzip the `.aar`, unzip its inner `classes.jar`, then `javap -p -c -classpath <dir>
<fqcn>`. Bytecode answers the questions that matter for review: what collection backs a
listener registry (`Collections.newSetFromMap(ConcurrentHashMap)` = `equals`-keyed), whether
a public method is a pure forward or has side effects, whether a constructor is safe to
call in a host test (pure field assignment vs. network/platform init), and whether an
interface is small enough to stub.

**Always resolve the version from the project's own catalog first**
(`gradle/libs.versions.toml`), not from what a previous review said. On one PR the
body and two prior reviews all reasoned about vendor SDK `0.17.3` while the catalog
pinned `0.17.4`; both versions were in the cache, so it was easy to verify the wrong one.
Conclusions happened to survive, but the habit is: cite the version you actually read, and
say so in the review.

Related: [[verify-against-origin-main]], [[tests-must-call-the-changed-function]].
