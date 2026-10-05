#!/usr/bin/env bash
# Run this inside your app repo (KMP, iOS, Android, web, JVM service, or a mix).
# It writes repo-context.md, which contains
# everything needed to turn the generic house rules into your house rules.
#
# It reads only structure and config. No source, no secrets, no customer data.
# Read it before you send it.

set -euo pipefail
OUT="${1:-repo-context.md}"
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

{
  echo "# repo-context for $(basename "$ROOT")"
  echo
  echo "generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo

  echo "## Stacks (tracked files by type)"
  echo '```'
  for ext in kt kts java swift ts tsx js jsx storyboard xib; do
    n=$(git ls-files "*.$ext" | grep -vc '/node_modules/' || true)
    [ "$n" -gt 0 ] && printf '%-12s %s\n' ".$ext" "$n"
  done
  for marker in AndroidManifest.xml Package.swift pom.xml package.json tsconfig.json .nvmrc; do
    n=$(git ls-files "*$marker" | grep -vc '/node_modules/' || true)
    [ "$n" -gt 0 ] && printf '%-20s %s\n' "$marker" "$n"
  done
  git ls-files '*.xcodeproj/project.pbxproj' | sed 's|/project.pbxproj||'
  git ls-files '*package-lock.json' '*pnpm-lock.yaml' '*yarn.lock' | grep -v '/node_modules/' || true
  echo '```'
  echo

  if [ -x ./gradlew ]; then
    echo "## Gradle projects"
    echo '```'
    ./gradlew -q projects 2>/dev/null || echo "(gradlew projects failed - paste settings.gradle.kts instead)"
    echo '```'
    echo
  fi

  if [ -f pom.xml ]; then
    echo "## Maven modules"
    echo '```'
    grep -oE '<module>[^<]+</module>' pom.xml || echo "(single-module build)"
    echo '```'
    echo
  fi

  echo "## package.json scripts and dependency names (no versions)"
  git ls-files '*package.json' | grep -v '/node_modules/' | while read -r f; do
    echo "### $f"
    echo '```'
    python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print("scripts:", ", ".join(d.get("scripts",{}))); [print(k+":", ", ".join(d.get(k,{}))) for k in ("dependencies","devDependencies") if d.get(k)]' "$f"
    echo '```'
  done
  echo

  echo "## Source set layout"
  echo '```'
  find . -maxdepth 4 -type d \
    \( -name commonMain -o -name androidMain -o -name iosMain -o -name commonTest \) \
    -not -path './build/*' | sort
  echo '```'
  echo

  echo "## Top-level directories"
  echo '```'
  ls -1d */ 2>/dev/null | grep -vE '^(build|\.gradle|\.idea)/' || true
  echo '```'
  echo

  echo "## Existing gates"
  for f in .github/CODEOWNERS .github/pull_request_template.md \
           .editorconfig detekt.yml config/detekt/detekt.yml \
           .swiftformat .swiftlint.yml iosApp/.swiftlint.yml \
           gradle/libs.versions.toml \
           eslint.config.js eslint.config.mjs .eslintrc.json .eslintrc.js \
           .prettierrc .prettierrc.json prettier.config.js tsconfig.json \
           checkstyle.xml config/checkstyle/checkstyle.xml; do
    if [ -f "$f" ]; then
      echo "### $f"
      echo '```'
      # version catalog can be long: structure only
      if [ "$f" = "gradle/libs.versions.toml" ]; then
        grep -E '^\[|^[a-zA-Z0-9_.-]+\s*=' "$f" | head -120
      else
        cat "$f"
      fi
      echo '```'
      echo
    fi
  done

  echo "## Existing workflows"
  echo '```'
  ls -1 .github/workflows/ 2>/dev/null || echo "(none)"
  echo '```'
  for f in .github/workflows/*.y*ml; do
    [ -f "$f" ] || continue
    echo "### $f (job and check names only)"
    echo '```'
    grep -nE '^(name:|jobs:|  [a-zA-Z0-9_-]+:|    name:)' "$f"
    echo '```'
  done
  echo

  echo "## Branch protection currently in force"
  echo '```'
  if command -v gh >/dev/null; then
    REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
    if [ -n "$REPO" ]; then
      gh api "repos/$REPO/branches/main/protection" 2>/dev/null \
        | python3 -c 'import json,sys; d=json.load(sys.stdin); print(json.dumps({"checks": d.get("required_status_checks",{}).get("contexts"), "reviews": d.get("required_pull_request_reviews")}, indent=2))' \
        || echo "(no admin access, or no protection set)"
    fi
  else
    echo "(gh not installed)"
  fi
  echo '```'
  echo

  echo "## Style rules I keep repeating"
  echo
  echo "Paste 2-3 review comments you have left more than once, and one PR you"
  echo "rejected for structure rather than correctness."
  echo
  echo "1. "
  echo "2. "
  echo "3. "
  echo

  echo "## stacy-agent"
  echo
  echo "Paste the agent definition here: prompt, tool allowlist, MCP servers,"
  echo "skills, and which paths it is currently allowed to write to."
  echo '```'
  echo
  echo '```'
} > "$OUT"

echo "wrote $OUT ($(wc -l < "$OUT") lines)"
echo "Review it, then send it over. Structure and config only - no source."
