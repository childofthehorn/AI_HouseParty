# AGENTS.md — house rules for this repo

Read this before you write code here. It is short on purpose. If a rule needs a
paragraph to justify it, it belongs in an ADR, not in this file.

Platform-specific rules live in `platform/` and are additive. A language file
plus a target file usually both apply:

| Your diff touches | Read |
|---|---|
| any `.kt` / `.kts` | `platform/AGENTS.kotlin.md` |
| Android modules, Jetpack Compose | + `platform/AGENTS.android.md` |
| `shared/`, expect/actual, wire contracts | + `platform/AGENTS.kmp.md` |
| any `.swift`, `Package.swift` | `platform/AGENTS.swift.md` |
| `iosApp/`, SwiftUI, UIKit, Xcode project | + `platform/AGENTS.ios.md` |
| any `.java`, `pom.xml` | `platform/AGENTS.java.md` |
| Spring Boot services (Java or Kotlin) | + `platform/AGENTS.spring.md` |
| any `.ts` / `.tsx` / `.js` / `.jsx`, `package.json` | `platform/AGENTS.typescript.md` |
| React components | + `platform/AGENTS.react.md` |

In this repo most work touches two of these at once. Read the base file plus
every platform file your diff covers.

<!-- ASSUMPTION: this map is the conventional Kotlin Multiplatform layout, since
     the target repo is a KMP app. Verify against `./gradlew projects` and
     replace. See STYLE-RULES-TO-FILL.md. -->

## Where things live

| Path | What it is | Room (blast radius) |
|---|---|---|
| `shared/src/commonMain/` | shared business logic, models, wire contracts | **Kitchen** |
| `shared/src/androidMain/` | Android `actual` implementations | **Kitchen** |
| `shared/src/iosMain/` | iOS `actual` implementations | **Kitchen** |
| `composeApp/` (or `androidApp/`) | Android app shell, DI, navigation | Living Room |
| `iosApp/` | Xcode project, SwiftUI shell, framework consumption | Living Room |
| `core/network/`, `core/auth/` | HTTP, tokens, session | **Kitchen** |
| `core/wallet/`, `core/compliance/` | balances, deposits, withdrawals, regulated flows | **Kitchen** |
| `core/designsystem/` | tokens, Compose + SwiftUI style layer | Living Room |
| `feature/*/` | one feature per module, Compose and/or shared | Living Room |
| `webApp/` (or `web/`) | React / TypeScript front end | Living Room |
| `server/` | Spring Boot services, Java or Kotlin | Living Room |
| `**/db/migration/` | database migrations (Flyway / Liquibase) | **Kitchen** |
| `.claude/agent-memory/` | agent memory; agents write here as they learn | Living Room |
| `agents/`, `skills/`, `.claude/`, `.codex/`, `.gemini/`, `.cursor/`, `.agents/` | agent and skill definitions, one source plus generated copies per runtime | **Kitchen** |
| `sandbox/` | spikes and prototypes | Garage |
| `tools/`, `scripts/oneoff/`, `analyses/`, `dashboards/` | one-off scripts, dashboards, analyses | Driveway |
| `**/crypto/**`, `**/keystore/**`, `**/keychain/**`, `**/core-secure/**`, … | cryptography, secure storage, key material | **Safe-room** (on top of its room) |

**Everything under `shared/` is Kitchen by default.** Two platforms and a server
contract are downstream of every change in there, and a rename in
`commonMain` is a production bug on a device you are not holding.

Rooms are defined in `adr/0001-blast-radius-tiers.md` and mapped, path by path,
in `.github/house/rooms.config.js`. Kitchen and Safe-room paths have extra gates
and cannot be changed by an agent without a named human reviewer.

Room labels are set by automation from the diff (ADR-0003). Tick every room your
PR touches in the template; the only label you may add by hand is
`room/safe-room`.

## Before you say you are done

Run these. Not "the equivalent" — these.

```bash
./gradlew ktlintCheck detekt                              # all Kotlin, every target
./gradlew :shared:allTests                                # if you touched shared/
./gradlew :composeApp:testDebugUnitTest                   # Android side
./gradlew :shared:linkDebugFrameworkIosSimulatorArm64     # catches Swift-facing breakage
(cd iosApp && swiftformat --lint . && swiftlint --strict)  # if you touched Swift
swift test --package-path <package>                       # if you touched a Swift package
./gradlew spotlessCheck test                              # if you touched Java or a JVM service (Maven: ./mvnw -B verify)
(cd webApp && <pm> run lint && <pm> run typecheck && <pm> run format:check && <pm> test)  # if you touched JS/TS
```

If you changed `shared/src/commonMain` you run the iOS framework link too. Not
optional: Kotlin that compiles for Android can still break the Swift API.

A change is done when: the commands above pass, the diff has no unrelated
formatting churn, and you can state in one sentence why the change belongs in
this repo.

## Anti-patterns in THIS codebase

These are the mistakes that actually happen here, not general advice.

<!-- FILL IN from your active style PRs. The point of this section is that it is
     specific and slightly embarrassing. Examples of the right shape: -->

- Do not introduce a second HTTP client. We have one. Use it.
- Do not add a new DI module for a single binding; extend the feature's module.
- Do not reformat files you did not otherwise change. Formatting-only diffs go
  in their own PR, labelled `chore/format`.
- Do not add a dependency to make one call. See the dependency gate.
- Do not put business logic in a Composable, a SwiftUI `View` body, a UIKit
  view controller, a React component, or a Spring controller.

## When you are unsure

Ask. Do not invent. Specifically: if you cannot find an existing pattern for
what you are about to do, stop and open a question on the PR or in the issue
rather than establishing a new pattern silently.

Never do without a human explicitly asking in the current conversation:

- change anything under a **Kitchen** path
- add, upgrade or remove a dependency
- edit CI workflows, signing config, or release tooling
- touch feature flag defaults, or anything under `.github/`
- commit generated code you have not read end to end

## Provenance

Every PR states which model or tool produced the change and roughly how much of
the diff is generated. See `.github/pull_request_template.md`. This is not a
judgement, it is triage information for reviewers.
