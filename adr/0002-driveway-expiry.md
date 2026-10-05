# ADR-0002: Everything in the Driveway has an expiry date

- **Status:** accepted
- **Date:** YYYY-MM-DD  <!-- FILL IN -->
- **Deciders:** @your-handle
- **Room:** Driveway

## Context

Self-serve tooling means anyone can produce a dashboard, a script, or a one-off
analysis. Most are useful for a week. None of them announce when they stop being
useful, and nobody deletes someone else's work voluntarily.

## Decision

Driveway PRs declare an expiry date in the PR body (enforced by
`.github/workflows/room-cleanliness.yml`). The room labeler marks them
`driveway`. Every Monday `.github/workflows/driveway-sweep.yml` finds files
from merged Driveway PRs past expiry (or merge date + 90 days when none was
declared) and opens one tow PR deleting them. A later Driveway PR touching a file
renews it. The tow PR states a two-week expiry: promote or renew within that
window, or it merges.

"Not stop." Never stop. Everything in the driveway gets towed.

## Consequences

- Sprawl becomes a sweep, not an argument.
- Anything genuinely load-bearing gets promoted into a real room instead of
  living forever in `tools/`.
- Cost: the sweep needs an owner on rotation.

## Alternatives considered

- **Ban ad-hoc tooling** — pushes it into personal accounts where nobody can
  see it. Worse.
- **Review Driveway like Living Room** — kills the speed that makes it valuable.
