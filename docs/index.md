---
title: Start here
permalink: /
---

# House Rules

Everything promised on the last slide of *The AI Slop Party*: the rules, the
gates, the agents and skills that work inside them, and the team memory they
learn from. Copy what you need. None of it is clever, which is the point.

**The house is your codebase**, or the set of codebases everyone contributes
to. Rooms say how much damage a change can do. Gates make a PR prove it belongs
in the room it touches. Agents follow the same rules as the people.

This site is the repository's own markdown, built by GitHub Pages: the pages
are the files. The [full README](README.md) has every command; this page is the
tour.

## The house map

Every path in the repo lives in a room. The room sets the gate.

| Room | Contents | Gate |
|---|---|---|
| Kitchen | money, auth, regulated, shared contracts, DB migrations, dependency manifests, the gates themselves | two approvals (one senior), named human, no unsupervised agents |
| Living Room | core product, design system, web app, services | normal review, full CI |
| Garage | spikes, prototypes | go nuts; door stays shut; nothing ships from here |
| Driveway | scripts, dashboards, analyses | zero gates, mandatory expiry, towed at 90 days |
| **Safe-room** | cryptography, secure storage, key material — on top of its room | two senior approvals, one from security |

A PR can touch several rooms and must declare each one. Automation labels the
rooms from the diff, so nobody argues about it. Why tiers, and why by blast
radius: [ADR-0001](adr/0001-blast-radius-tiers.md).

## How it fits together

Rules on the fridge, a door that checks them, and guests who read them.

```mermaid
flowchart LR
  subgraph Rules["Rules on the fridge"]
    A[AGENTS.md] --> P["platform/AGENTS.stack.md"]
    ADR[adr/ decisions]
  end
  subgraph Door["The door: .github/"]
    R[house/rooms.config.js] --> W[room workflows]
    CO[CODEOWNERS]
    Q[stack quality workflows]
    G[dependency gate + secret scan + PR hygiene]
  end
  subgraph Guests["Guests: .claude/"]
    H[host-agent] --> E[eng-manager-agent] --> S[specialist agents]
    H --> SK[skills]
    M[(agent-memory)]
  end
  Rules -- read by --> Guests
  Rules -- enforced by --> Door
  PR([pull request]) --> Door
  Guests -- open --> PR
```

**The fridge.** [`AGENTS.md`](AGENTS.md) is the short, generic rulebook.
[Platform rules](platform/README.md) add a page per stack: Kotlin, Android, KMP,
Swift, iOS, Java, Spring, TypeScript, React. [Decisions](adr/README.md) record
why the rules are what they are.

**The door.** Workflows in `.github/` label PRs by room, fail PRs that do not
declare every room they touch, require the right approvals, and tow expired
Driveway files. A PR cannot loosen its own rules; the door reads the base
commit.

**The guests.** [41 agents](agents/README.md) by domain, hosted by `host-agent`
and orchestrated by `eng-manager-agent`. [Skills](skills/README.md) such as
`architecture-review` give them a procedure to follow. Each agent carries a
House practices section built from team memory.

## Pick your path

| You want… | Start with | Then read |
|---|---|---|
| the agents and skills everywhere you work | [A personal agent set](README.md#a-personal-agent-set) | [Agents](agents/README.md), [Skills](skills/README.md) |
| one repo to follow the house rules | [One repository](README.md#one-repository) | [Assumptions](ASSUMPTIONS.md), [House rules](AGENTS.md), [Platform rules](platform/README.md) |
| the same house across several repos | [A set of repositories](README.md#a-set-of-repositories) | [Decisions](adr/README.md), [Agents](agents/README.md) |
| a tool other than Claude Code | [Other AI systems](PORTABILITY.md) | [Which system reads what](README.md#which-system-reads-what) |

## Before you install

Read [Assumptions](ASSUMPTIONS.md) first. It lists every guess v1 makes about
your repo and how to check each one. The install script copies the rules and
gates, but only you know where your Kitchen is.

Codex, Copilot, Cursor, Gemini CLI and the OpenAI Agents SDK get the same rules,
skills and agents in their own layouts, generated from one source.
[Other AI systems](PORTABILITY.md) says what each one reads and what it cannot do.
