# Decision records

Coasters: short records of decisions, so nobody re-argues them from memory.
Copy [`0000-template.md`](0000-template.md) for a new one, and give it the next
number.

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-blast-radius-tiers.md) | Code is tiered by blast radius, not by team | accepted |
| [0002](0002-driveway-expiry.md) | Everything in the Driveway has an expiry date | accepted |
| [0003](0003-room-labels-and-safe-room.md) | Room labels are set by automation; people may only add Safe-room | accepted |

The `architecture-review` skill treats accepted ADRs as part of the architecture
of record. When it returns ESCALATE, the escalation packet ends with a new ADR
to write. A superseded ADR is history, not law: mark it `superseded by
ADR-XXXX` instead of deleting it.
