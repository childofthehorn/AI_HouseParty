# Memory index

## User
- [Stacy Devino — Principal Engineer](user-stacy-principal-eng.md) — who the user is, role, strengths, trajectory to Sr. Principal

## Feedback (how to work)
- [Commit only when asked](feedback-commit-only-when-asked.md) — no commits/pushes/hook-skips/destructive git without explicit ask
- [No speculative refactor](feedback-no-speculative-refactor.md) — refactor only for correctness; judgment over churn
- [Minimal scope, no dead code](feedback-minimal-scope-no-dead-code.md) — no abandoned code, unneeded comments/annotations
- [Comment & test polish standard](feedback_comment_and_test_polish.md) — one-line load-bearing comments only; test names = observable behavior, no stale phrasing
- [No defensive code](feedback-no-defensive-code.md) — validate only at system boundaries; trust internal contracts
- [Respect explicit scope](feedback-respect-explicit-scope.md) — honor which repos/files may be touched, exactly
- [Verify before claiming success](feedback-verify-before-claiming-success.md) — compile/run/visually confirm before "done"
- [Verify against origin/main](feedback_verify_against_origin_main.md) — read origin/main; pin audits to the doc's SHA or drift fakes off-by-one "errors"; orphan `build/` dirs fake modules
- [Absence claims: enumerate, don't AND-grep](feedback_absence_claims_enumerate.md) — never prove "zero X" with a two-token grep; list the broad set and classify every hit
- [Tests must call the changed function](feedback_tests_must_call_the_changed_function.md) — wrapper fixes often get tests that exercise only the inner collaborator; bots mis-praise these as end-to-end
- [Orchestrate named agents](feedback-orchestrate-named-agents.md) — route to the specific agents she names; stacy-agent as reviewer voice
- [Resume without preamble](feedback-resume-without-preamble.md) — pick up after a break with no recap
- [Ticket + spec + PR workflow](feedback-ticket-spec-pr-workflow.md) — confirm team, sprint, status, assignee before creating tickets; PR against the ticket
- [Secret handling](feedback-secret-handling.md) — shared tokens = compromised; secrets server-side/SSM; never commit local-only config
- [Jira summary HTML-escapes angle brackets](feedback_jira_summary_html_escape.md) — createJiraIssue stores `<Android>` as `&lt;Android&gt;`; verify the response, re-edit summary if escaped

## Project
- [Multiplatform first](project-multiplatform-first.md) — prefer shared paths and in-repo cross-platform helpers over platform-only APIs
- [Cross-platform parity](project-cross-platform-parity.md) — render the same input on both platforms and compare; ground fixes in the other platform's code

## Reference
- [Lint enforcement drifts per repo](reference-lint-enforcement-drifts-per-repo.md) — whether lint fails the build differs per repo and over time; read the config before calling a violation build-breaking
- [Gradle build gotchas](reference-gradle-build-gotchas.md) — variant compile tasks, KMP vs JVM modules, debug source sets, daemon OOM, compose resources
- [Decompile vendor AARs from Gradle cache](reference_decompile_vendor_aars_from_gradle_cache.md) — javap closed-source SDK internals; resolve the version from libs.versions.toml, not from prior reviews
- [Review bots read config from the base branch](reference-review-bot-config-from-base-branch.md) — config changes go live at merge; bot checks often non-blocking; branch protection is gh-api readable
