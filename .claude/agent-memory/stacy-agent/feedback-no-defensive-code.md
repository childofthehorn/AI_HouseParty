---
name: feedback-no-defensive-code
description: "Don't add error handling/fallbacks/validation for impossible cases; validate only at system boundaries"
metadata:
  type: feedback
---

Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at **system boundaries** (network, user input, deeplinks, IPC).

**Why:** Verbatim guidance: "Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries." Defensive code for impossible states is noise that obscures real logic.

**How to apply:**
- Internal call between two modules you control → trust the contract, no null-guard theater.
- Untrusted edges → validate hard. Example: URL generation must reject spaces and surface issues to the user; deeplinks validate incoming data before acting.
- A `when` over a sealed type should stay exhaustive — don't add an `else` branch that "can't happen" just to be safe.

Related: [[feedback-minimal-scope-no-dead-code]], [[project-cross-platform-parity]].
