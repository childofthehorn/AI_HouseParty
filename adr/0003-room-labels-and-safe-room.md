# ADR-0003: Room labels are set by automation; people may only add Safe-room

- **Status:** accepted
- **Date:** 2026-10-04
- **Deciders:** @your-handle
- **Room:** Kitchen (it governs the gates)

## Context

Rooms only work if they match the diff. A hand-picked label drifts: the author
ticks Living Room, the diff touches `core/auth`, and the Kitchen gate never
fires. Labels that anyone can remove are a bypass, not a gate.

## Decision

- `room-labeler.yml` labels every PR from its changed files, using
  `.github/house/rooms.config.js` read from the base commit.
- `room-cleanliness.yml` fails the PR unless the template ticks every room the
  diff touches. Several rooms are allowed; over-declaring is allowed.
- `room-label-guard.yml` reverts any label a person adds or removes. The one
  exception is **adding** `safe-room`: an author who knows the code is
  sensitive can raise the bar, never lower it.
- `room-approval-gate.yml` enforces approvals by room and by file/directory
  path. Dependency sign-off is an approval rule, not a label.

## Consequences

- The label on a PR is a fact about the diff, so reviewers and dashboards can
  trust it.
- A mistaken Safe-room label cannot be removed by its author; it only adds
  approvals.
- Cost: approval pools in `rooms.config.js` are maintained by hand.

## Alternatives considered

- **Author-declared labels only** — what drifts.
- **Branch protection alone** — cannot express "two seniors, one from security,
  only when these paths change".
