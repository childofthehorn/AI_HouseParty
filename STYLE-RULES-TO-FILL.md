# Style rules to extract from your active PRs

`AGENTS.md` and the platform files are only as good as their "anti-patterns in
THIS codebase" sections, and those have to come from real review comments. Below
is the shape I need. Paste the diffs or review threads from your active
formatting/style PRs and I will convert them into rules in the right files.

## Fastest path

Run this in the repo and send me the output:

```bash
bash scripts/collect-repo-context.sh
```

It dumps the Gradle project list, source-set layout, existing CODEOWNERS and PR
template, lint configs, workflow job names, and current branch protection -
structure and config only, no source. Read it before sending.

## What to send

1. **The formatting PR(s)** — the ruleset itself: `.editorconfig`, ktlint config,
   `detekt.yml`, `.swiftformat`, `.swiftlint.yml`. These become the enforced half.
2. **Two or three review threads** where you left the same comment twice. Those
   are the rules that need writing down.
3. **One PR you rejected** for structure rather than correctness. That tells me
   what "belongs in this house" means here.

## Questions your files currently guess at

- Module naming and boundaries: what is allowed to depend on what? (Do you have
  a dependency-direction rule I should encode as a lint?)
- Ktlint vs detekt split: which one owns import ordering, wildcard imports, max
  line length?
- Compose: do you allow `Modifier` defaults in design system components, or
  require explicit pass-through?
- Do you gate on Compose recomposition metrics or Paparazzi screenshots today?
- iOS: SwiftFormat and SwiftLint both installed, or one of them? Mint, Homebrew,
  or SPM plugin?
- KMP: is the shared module `shared/`, and is the Android app `composeApp/` or `androidApp/`?
- iOS: SwiftUI-first, UIKit-first, or both? Any storyboards you still accept?
- Web: where does the web app live, which package manager, and are ESLint
  `no-explicit-any` / `react-hooks` already errors?
- JVM: Gradle or Maven? Spotless, Checkstyle, or neither for Java? Spring MVC or
  WebFlux? Flyway or Liquibase?
- Which CI checks are already required on `main`, so `branch-protection.sh`
  matches reality instead of overwriting it?

## About stacy-agent

It is in this repo now: `.claude/agents/person/stacy-agent.md` (visible copy in
`agents/person/`), with its team memory in `.claude/agent-memory/stacy-agent/`.
Its working-style defaults and the House practices section in every agent
already carry the review rules learned so far. When a new review comment
repeats, add it to the memory and to the matching agent, then to the
"anti-patterns in THIS codebase" section here.
