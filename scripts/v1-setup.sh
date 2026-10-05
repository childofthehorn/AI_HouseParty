#!/usr/bin/env bash
# Land the house rules in a repo. Run from the root of this repo.
#
#   ./scripts/v1-setup.sh ../myapp-multiplatform your-org
#
# Copies the file set, substitutes your org handles, installs hooks, creates
# labels. It does NOT change branch protection - that step is deliberate and
# separate, because wrong check names can lock merges.
set -euo pipefail

TARGET="${1:?usage: v1-setup.sh /path/to/repo org-handle}"
ORG="${2:?usage: v1-setup.sh /path/to/repo org-handle}"
SRC=$(cd "$(dirname "$0")/.." && pwd)

[ -d "$TARGET/.git" ] || { echo "not a git repo: $TARGET" >&2; exit 1; }

# Quality workflows are per stack; only install the ones whose files exist.
# Tracked and untracked (not ignored) files, so a fresh checkout detects its stacks too.
has() { [ -n "$(git -C "$TARGET" ls-files -co --exclude-standard -- "$@")" ]; }
wants() {
  case "$1" in
    jvm-quality.yml)        has '*.kt' '*.kts' '*.java' '*pom.xml' ;;
    android-quality.yml)    has '*AndroidManifest.xml' ;;
    shared-kmp-quality.yml) has 'shared/src/commonMain/*' ;;
    swift-quality.yml)      has '*.swift' ;;
    ios-quality.yml)        has '*.xcodeproj/*' ;;
    web-quality.yml)        has '*.ts' '*.tsx' '*.jsx' ;;   # a lone tooling package.json is not a web app
    AGENTS.kotlin.md)       has '*.kt' '*.kts' ;;
    AGENTS.android.md)      has '*AndroidManifest.xml' ;;
    AGENTS.kmp.md)          has 'shared/src/commonMain/*' ;;
    AGENTS.swift.md)        has '*.swift' ;;
    AGENTS.ios.md)          has '*.xcodeproj/*' ;;
    AGENTS.java.md)         has '*.java' '*pom.xml' ;;
    AGENTS.spring.md)       grep -rqs 'springframework' "$TARGET"/pom.xml "$TARGET"/*/pom.xml "$TARGET"/build.gradle.kts "$TARGET"/*/build.gradle.kts "$TARGET"/gradle/libs.versions.toml ;;
    AGENTS.typescript.md)   has '*.ts' '*.tsx' '*.js' '*.jsx' ;;
    AGENTS.react.md)        grep -qs '"react"' "$TARGET"/package.json "$TARGET"/*/package.json ;;
    *)                      true ;;
  esac
}

echo "==> copying gates"
mkdir -p "$TARGET/.github/workflows" "$TARGET/config/detekt" "$TARGET/scripts" "$TARGET/adr" "$TARGET/platform"
for f in "$SRC/.github/"*; do
  [ "$(basename "$f")" = workflows ] || cp -r "$f" "$TARGET/.github/"
done
for f in "$SRC/.github/workflows/"*.yml; do
  name=$(basename "$f")
  if wants "$name"; then cp "$f" "$TARGET/.github/workflows/"; else echo "    skipping $name (no matching files)"; fi
done
cp "$SRC/config/detekt/detekt.yml" "$TARGET/config/detekt/"
cp "$SRC/scripts/pre-commit" "$SRC/scripts/install-hooks.sh" "$SRC/scripts/branch-protection.sh" \
   "$SRC/scripts/setup-labels.sh" "$SRC/scripts/collect-repo-context.sh" "$TARGET/scripts/"
cp -r "$SRC/adr/." "$TARGET/adr/"
for f in "$SRC/platform/"*.md; do
  name=$(basename "$f")
  if wants "$name"; then cp "$f" "$TARGET/platform/"; else echo "    skipping platform/$name (no matching files)"; fi
done
cp "$SRC/AGENTS.md" "$SRC/ASSUMPTIONS.md" "$TARGET/"

# Platform rules as Cursor auto-attach rules (Copilot's copy travels inside .github/).
if [ -d "$SRC/.cursor/rules" ]; then
  mkdir -p "$TARGET/.cursor/rules"
  for f in "$SRC/.cursor/rules/"*.mdc; do
    stack=$(basename "$f" .mdc)
    if wants "AGENTS.$stack.md"; then cp "$f" "$TARGET/.cursor/rules/"; fi
  done
fi
for f in "$SRC/.github/instructions/"*.instructions.md; do
  stack=$(basename "$f" .instructions.md)
  wants "AGENTS.$stack.md" || rm -f "$TARGET/.github/instructions/$(basename "$f")"
done
# Copilot custom agents (generated from agents/) only on request: WITH_COPILOT_AGENTS=1
if [ "${WITH_COPILOT_AGENTS:-0}" != 1 ]; then
  rm -rf "$TARGET/.github/agents"
  echo "    skipping .github/agents (set WITH_COPILOT_AGENTS=1 to install Copilot agents)"
fi

echo "==> config files (only if absent, so yours win)"
for f in .editorconfig .swiftformat .swiftlint.yml .gitleaks.toml; do
  if [ -e "$TARGET/$f" ]; then
    echo "    keeping existing $f"
  else
    cp "$SRC/$f" "$TARGET/$f"
  fi
done

echo "==> substituting @your-org -> @$ORG"
grep -rl '@your-org' "$TARGET/.github" "$TARGET/AGENTS.md" 2>/dev/null | while read -r f; do
  sed -i.bak "s/@your-org/@$ORG/g" "$f" && rm -f "$f.bak"
done

echo "==> installing hooks"
(cd "$TARGET" && ./scripts/install-hooks.sh)

echo "==> labels"
if command -v gh >/dev/null; then
  REPO=$(cd "$TARGET" && gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
  if [ -n "$REPO" ]; then (cd "$TARGET" && ./scripts/setup-labels.sh "$REPO"); else echo "    skipped (no gh repo context)"; fi
else
  echo "    skipped (gh not installed)"
fi

cat <<'NEXT'

Done. Not yet enforced. Next, in order:

1. Read ASSUMPTIONS.md and fix the module map in AGENTS.md against your build
   (./gradlew projects, ./mvnw help:evaluate, package.json workspaces); check
   the platform/ files installed match your stacks
2. Replace the team handles in .github/CODEOWNERS with real teams, and the
   reviewer logins in .github/house/rooms.config.js (teams)
3. Open a PR with just these files and let the workflows run on it. That is the
   cheapest way to find out which check names are wrong.
4. Add a SWEEP_TOKEN secret (GitHub App) for the Driveway tow PR
5. Only once that PR is green:
     ./scripts/branch-protection.sh OWNER/REPO main
   Diff what is already there first:
     gh api repos/OWNER/REPO/branches/main/protection
NEXT
