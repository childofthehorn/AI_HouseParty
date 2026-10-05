# ADR-0001: Code is tiered by blast radius, not by team

- **Status:** accepted
- **Date:** 2026-01-01  <!-- FILL IN -->
- **Deciders:** @your-handle, @platform-lead
- **Room:** Kitchen (it governs the Kitchen)

## Context

AI-assisted contribution volume rose faster than review capacity. Gating
everything equally made senior reviewers the bottleneck on trivia while genuinely
risky changes moved at the same speed as a copy tweak. Team-based ownership also
went stale on every reorg.

## Decision

Every path in the repo belongs to exactly one of four tiers. Tiers are a property
of the code, not of who wrote it.

| Room | What lives there | Gate |
|---|---|---|
| **Kitchen** | money, auth, regulated flows, shared cross-platform contracts | two approvals, one must be a named human owner from CODEOWNERS; no unsupervised agent changes; every change names what it touches |
| **Living Room** | core product features and design system | normal review, one approval, full CI |
| **Garage** | spikes, prototypes, experiments | no review required to land in `sandbox/`; cannot be imported by shipping code; nothing ships from here without walking through the front door |
| **Driveway** | one-off scripts, dashboards, analyses | no gates; mandatory expiry date declared in the PR; swept after 90 days |

**Safe-room** stacks on top of a path's tier for the most sensitive code:
cryptography, secure storage, key material. Gate: two senior approvals, one from
security.

Tiers are declared in `AGENTS.md` (the map), mapped per path in
`.github/house/rooms.config.js`, enforced in `.github/CODEOWNERS` (the door) and
by `room-approval-gate`. A PR may touch several rooms and must declare each one.

## Consequences

- Seniors spend review time where blast radius is highest.
- The framework survives reorgs and new tools; the kitchen is still the kitchen.
- Cost: every new top-level directory needs a tier assigned, which is one line in
  `rooms.config.js` and one in CODEOWNERS.
- Driveway sweeping needs an owner or it will not happen. See ADR-0002.

## Alternatives considered

- **Per-team CODEOWNERS only** — went stale at the first reorg and told us
  nothing about risk.
- **Gate everything equally** — what we had. Made the senior engineers the
  bottleneck on formatting.
- **Trust-based, no tiers** — works until the first incident, then overcorrects
  into gating everything.
