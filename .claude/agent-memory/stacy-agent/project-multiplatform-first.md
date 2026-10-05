---
name: project-multiplatform-first
description: "In a shared-code (KMP/CMP, Flutter, React Native) codebase, prefer the shared path and the repo's existing cross-platform helpers over platform-only APIs"
metadata:
  type: project
---

When a codebase shares UI and logic across platforms, the standing rule is: **prefer the shared path over a platform-only path.** Before reaching for a platform API, look for the in-repo cross-platform helper that already wraps it.

Examples from a KMP/CMP app: the repo's multiplatform lifecycle observer instead of an Android-only lifecycle API; its own URL-decoding extension instead of `java.net.URLDecoder`; the typed `track(AnalyticsEvent…)` call instead of ad-hoc string events; the multiplatform navigation artifact in `commonMain` so one NavHost runs on every target.

- Facades and expect/actual seams (analytics, phone-number, vendor SDK wrappers) are deliberate. Don't revert them to direct platform calls.
- Theme from the design system's tokens (`<AppTheme>.colors` / `.dimens`), never raw alphas or hex colors.
- Use the design-system default for dark mode and honor the system theme. Confirm current intent; don't add an "always dark" shim.

**Why:** Platform-only shortcuts quietly fork behavior between targets and undo the shared architecture one call at a time.

**How to apply:** In review, flag any new platform import in shared code and point to the existing helper. Ground the claim in the helper's actual location on `origin/main`.

Related: [[project-cross-platform-parity]], [[feedback-no-defensive-code]].
