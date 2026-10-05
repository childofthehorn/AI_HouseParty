# Assumptions in this v1

Everything here was inferred, not read. I had no access to the repo, so these are
the places v1 is guessing. Fix these first; the rest works as-is.

## Structure

| Assumed | Verify with | Where it appears |
|---|---|---|
| Shared module is `shared/` with `commonMain` / `androidMain` / `iosMain` | `./gradlew projects` | AGENTS.md, CODEOWNERS, shared-kmp-quality.yml |
| Android entry point is `composeApp/` (fallback `androidApp/`) | `ls -d *App*` | CODEOWNERS, android-quality.yml |
| iOS project lives in `iosApp/` | `find . -name '*.xcodeproj'` | CODEOWNERS, ios-quality.yml, .swiftlint.yml |
| Kitchen paths: `core/network`, `core/auth`, `core/wallet`, `core/compliance`, all of `shared/` | your judgement | rooms.config.js, CODEOWNERS, ADR-0001 |
| Safe-room paths: `**/crypto/**`, `**/keystore/**`, `**/keychain/**`, `**/core-secure/**`, … | `git ls-files \| grep -iE 'crypt\|secure\|key(store\|chain)'` | rooms.config.js, CODEOWNERS |
| Core modules rule: `app/`, `data/`, `navigation/`, `design/theme/` | your module list | rooms.config.js |
| Xcode scheme is `App` | `xcodebuild -list` | ios-quality.yml |
| Version catalog at `gradle/libs.versions.toml` | `ls gradle/` | dependency-gate.yml, rooms.config.js |
| Driveway dirs: `tools/`, `scripts/oneoff/`, `analyses/`, `dashboards/` | `ls -d */` | rooms.config.js, CODEOWNERS |
| Web app in `webApp/` (or `web/`), or at the root | `git ls-files '*package.json'` | AGENTS.md, CODEOWNERS, web-quality.yml (`working-directory`) |
| JVM services in `server/` | your module list | AGENTS.md, CODEOWNERS |
| DB migrations under `**/db/migration/` (Flyway default) | `git ls-files '*migration*'` | rooms.config.js (Kitchen), CODEOWNERS |
| Root `package.json`, lockfiles and `pom.xml` are Kitchen | your judgement | rooms.config.js, CODEOWNERS |

## Tooling

- **ktlint, detekt and Spotless are wired into `check`** by your convention
  plugin (their Gradle plugins do this by default). `jvm-quality` runs
  `./gradlew check -x lint`, so the build defines its own gates.
- **swiftformat and swiftlint via Homebrew** on the macOS runner. Using Mint or an
  SPM plugin? Swap the install step.
- **Java 21** in CI (`setup-java`). A build with `jvmToolchain(17)` needs the
  foojay toolchain resolver, or change the version in the three JVM workflows.
- **Java formatting via Spotless** (`spotlessCheck` / `spotless:check`). Using
  Checkstyle or nothing? Change the task in jvm-quality.yml.
- **Gradle or Maven wrapper at the root** (`./gradlew` or `./mvnw`).
- **Web means TypeScript or JSX files exist.** `v1-setup.sh` installs
  `web-quality.yml` only then; a plain-JS web app copies it by hand.
- **Web: one package with `.nvmrc`** and the scripts `lint`, `format:check`,
  `test`, plus `typecheck` when there is a `tsconfig.json`. web-quality fails if
  one is missing, on purpose. Yarn means Yarn Berry (`--immutable`).
- **ESLint and Prettier configs are yours.** None is shipped. Recommended
  rules the house relies on: `@typescript-eslint/no-explicit-any`,
  `no-non-null-assertion`, `no-floating-promises`, `react-hooks/*`, `jsx-a11y`.
- **Swift packages build on the macOS host.** iOS-only packages are skipped by
  `swift test` and covered by xcodebuild. Linux runs only for packages listed in
  the `SWIFT_LINUX_PACKAGES` repository variable.
- **detekt `maxIssues: 0` with no baseline.** On an existing codebase run
  `./gradlew detektBaseline` first, or CI is red on day one.

## Policy numbers, picked as defaults

- PR size cap: **400 changed lines** before a written reason is required
- Driveway expiry: **90 days**
- Kitchen: **two approvals** from `mobile`, one from `senior`; Safe-room: **two senior**, one from `security`.
  `mobile` is the Kitchen pool for every stack: in a multi-stack house put your
  backend and web leads in it too, or split the Kitchen rule by path
- Driveway tow PR: **two weeks** to promote or renew
- detekt LongMethod 60, MaxLineLength 120; SwiftLint file_length 300/500

These are the ones your team should argue about. The structure matters more.

## Other runtimes

- `scripts/export-agents.py` assumes the `AGENTS.md` layout for its path globs
  (`PLATFORM_GLOBS`); change both together.
- Gemini CLI needs `context.fileName` to include `AGENTS.md`; Codex loads
  `.codex/` only for trusted projects; Copilot caps agent prompts at 30,000
  characters (seven agents ship a short form there). See PORTABILITY.md.

## Still empty on purpose

The "anti-patterns in THIS codebase" sections. Those need your repeated review
comments. Run `scripts/collect-repo-context.sh` and see STYLE-RULES-TO-FILL.md.

## Placeholders you must replace

- Reviewer logins in `teams` (`.github/house/rooms.config.js`) and `@your-org`
  handles in CODEOWNERS. The approval gate cannot pass until `teams` is real.
- `SWEEP_TOKEN`: a GitHub App token secret. Without it the tow PR is opened with
  `GITHUB_TOKEN`, which does not trigger the required checks on that PR.
  Add the App's bot login to `labelBots`.

## Not attempted

- Matching your existing CI check names - `branch-protection.sh` writes the names
  from this set, which may not exist yet. Run it last, after a green PR.
