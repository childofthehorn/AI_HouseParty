---
title: Start here
permalink: /
---

<section class="hero">
  <div>
    <h1>House Rules</h1>
    <p class="lede">Shoes off. Apron on.</p>
    <ul>
      <li>The game is <strong>your product</strong>.</li>
      <li>The TV is <strong>GitHub</strong>.</li>
      <li>The food and drink is <strong>the AI</strong>.</li>
    </ul>
  </div>
  <img src="{{ '/assets/img/host-robot.png' | relative_url }}" width="480" height="480" alt="A green robot host in a white apron, waving, in front of a pink sunburst.">
</section>

The house is your codebase, or every codebase your team contributes to. Rooms
say how much damage a change can do. Gates make a PR prove it belongs in the
room it touches. Agents follow the same rules as the people. This site is the
repository's own markdown, rendered; the [README](README.md) has every command.

## The house

<figure class="figure">
  <img src="{{ '/assets/img/house-rooms.png' | relative_url }}" width="1280" height="720" alt="Cross-section of a house: a red kitchen top-left, a sky-blue living room with a TV top-right, a yellow garage bottom-left and an orange driveway with a car bottom-right.">
</figure>

Every path in the repo lives in a room. The room sets the gate.

<div class="grid">
  <article class="room room--kitchen">
    <div class="room__head"><img src="{{ '/assets/img/room-kitchen.png' | relative_url }}" width="112" height="104" alt=""><h3>Kitchen</h3></div>
    <div class="room__body"><p>Money paths. Auth. Anything regulated.</p><p>No unsupervised guests. Ever. Two-key changes.</p></div>
  </article>
  <article class="room room--living-room">
    <div class="room__head"><img src="{{ '/assets/img/room-living-room.png' | relative_url }}" width="112" height="104" alt=""><h3>Living Room</h3></div>
    <div class="room__body"><p>Core product. The game's on in here.</p><p>Normal review, normal gates. Everybody sees it break.</p></div>
  </article>
  <article class="room room--garage">
    <div class="room__head"><img src="{{ '/assets/img/room-garage.png' | relative_url }}" width="112" height="104" alt=""><h3>Garage</h3></div>
    <div class="room__body"><p>Prototypes, spikes, weird ideas. Go nuts.</p><p>One rule: the garage door stays shut.</p></div>
  </article>
  <article class="room room--driveway">
    <div class="room__head"><img src="{{ '/assets/img/room-driveway.png' | relative_url }}" width="112" height="104" alt=""><h3>Driveway</h3></div>
    <div class="room__body"><p>Dashboards, scripts, Thursday's analysis.</p><p>Zero gates. Mandatory expiry. 90 days, then it gets towed.</p></div>
  </article>
  <article class="room room--safe-room">
    <div class="room__head"><h3>Safe-room</h3></div>
    <div class="room__body"><p>Cryptography, secure storage, key material. It sits on top of whatever room the path is already in.</p><p>Two senior approvals, one from security.</p></div>
  </article>
</div>

A PR can touch several rooms and must tick every one. Automation labels the
rooms from the diff, so nobody argues about it. Why tiers, and why by blast
radius: [ADR-0001](adr/0001-blast-radius-tiers.md).

## The door policy

<div class="grid" markdown="1">
<div class="card" markdown="1">

### Rules on the fridge

Short, generic, read before you cook: [AGENTS.md](AGENTS.md), plus one page of
[platform rules](platform/README.md) per stack.

</div>
<div class="card" markdown="1">

### The door

CODEOWNERS, the dependency gate and the room workflows read the base commit, so
a PR cannot loosen its own rules: [room automation](README.md#room-automation)
and [quality gates](README.md#quality-gates).

</div>
<div class="card" markdown="1">

### Coasters

Every rule stands on a [decision](adr/README.md) that says why, so nobody has to
relitigate it at the party.

</div>
</div>

## Reading the room

<div class="split" markdown="1">
<figure>
  <img src="{{ '/assets/img/detective.png' | relative_url }}" width="480" height="480" alt="A detective in a deerstalker hat looking through a magnifying glass.">
</figure>
<div markdown="1">

The guests read the fridge before they touch anything. [41 agents](agents/README.md)
by domain, hosted by `host-agent` and orchestrated by `eng-manager-agent`.
[Skills](skills/README.md) such as `architecture-review` give them a procedure to
follow. Each agent carries a House practices section built from team memory, so
the mistakes made here once stay made once.

</div>
</div>

## How it fits together

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

## Take the files home

Read [Assumptions](ASSUMPTIONS.md) first. It lists every guess v1 makes about
your repo and how to check each one; only you know where your Kitchen is.

| You want… | Start with | Then read |
|---|---|---|
| the agents and skills everywhere you work | [A personal agent set](README.md#a-personal-agent-set) | [Agents](agents/README.md), [Skills](skills/README.md) |
| one repo to follow the house rules | [One repository](README.md#one-repository) | [House rules](AGENTS.md), [Platform rules](platform/README.md) |
| the same house across several repos | [A set of repositories](README.md#a-set-of-repositories) | [Decisions](adr/README.md), [Agents](agents/README.md) |
| a tool other than Claude Code | [Other AI systems](PORTABILITY.md) | [Which system reads what](README.md#which-system-reads-what) |
