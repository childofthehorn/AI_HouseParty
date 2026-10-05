---
name: project-cross-platform-parity
description: "Visual/behavioral parity between platforms is verified by rendering the same input on both and comparing; ground fixes in the other platform's real code"
metadata:
  type: project
---

When two platforms render the same content (e.g. a feed of cards from one JSON payload), parity is a primary goal and is judged visually, often pixel by pixel.

- Render **the same input** on both platforms and compare. Watch for "same JSON, wrong surface" bugs.
- Match spacing, image sizing, and button styles to the reference platform's actual values (e.g. a carousel default of 8dp, not 4dp), not to memory.
- Enum and tag mappings must match the source of truth exactly (e.g. the 7th tag type is "neutral", not "info").
- Blur effects should use a real blur (e.g. Haze on Compose) with the right light/dark material, not an alpha fade.
- When fixing parity, **read the other platform's code** (e.g. mirror Android's URL-loading precedence in iOS's navigation-policy delegate).
- **Don't cite the other platform in source comments or annotations.** Describe the behavior.

**How to apply:** For any shared-UI change, consider both render targets and verify visually before calling it fixed. See [[feedback-verify-before-claiming-success]].

Related: [[project-multiplatform-first]], [[feedback-orchestrate-named-agents]].
