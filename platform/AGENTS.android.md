# AGENTS.android.md — Android / Jetpack Compose

Additive to `../AGENTS.md` and `AGENTS.kotlin.md`. Android-specific rules only.

## Build and check

```bash
./gradlew ktlintCheck detekt                # must pass
./gradlew :feature:<module>:testDebugUnitTest
./gradlew assembleDebug                     # only if you touched build config
```

## Jetpack Compose rules

- Composables are stateless and take a state object plus lambdas. Hoist state to
  the ViewModel.
- No business logic, no `LaunchedEffect` doing network calls, in a Composable.
- Collect ViewModel flows with `collectAsStateWithLifecycle()`, not
  `collectAsState()`.
- Every new component in `core/designsystem` needs a `@Preview` and must consume
  design tokens, never hardcoded `Color(0xFF...)` or `dp` values that duplicate a
  token.
- Use existing components before adding a new one. If you add one, note in the PR
  which existing component you considered and why it did not fit.
- `Modifier` is always the first optional parameter and is passed through.
- User-facing text comes from string resources, never literals. Icons that act
  get a `contentDescription`; decorative ones get `null`.
- New navigation destinations use type-safe `@Serializable` routes, not strings.

## Android rules

- A ViewModel exposes one `StateFlow<UiState>`. No `LiveData` in new code.
- No `Activity`, `Fragment` or `View` context held in a ViewModel or singleton.
  If you need a `Context`, inject the application context.
- Views collect flows inside `repeatOnLifecycle`, never in a bare
  `lifecycleScope.launch`.
- A new permission in `AndroidManifest.xml` needs a stated reason in the PR.

## Testing

- Paparazzi or screenshot tests for design system components. Compose UI tests
  (`createComposeRule`) for interaction.
- Kotlin testing rules, including the bug-fix rule, are in `AGENTS.kotlin.md`.

## Anti-patterns seen in this repo

<!-- FILL IN from your active formatting/style PRs. Paste the review comments you
     have found yourself leaving twice — those are the real rules. -->

- Mixed `Flow`/`LiveData` in the same feature. New code is `Flow`.
- Blocking calls inside `init {}` of a ViewModel.
