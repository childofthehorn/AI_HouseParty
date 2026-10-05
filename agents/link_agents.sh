#!/usr/bin/env bash
set -euo pipefail

# link_agents.sh — install custom Claude agents into ~/.claude/agents/<set-name>/
#
# Modes:
#   ./link_agents.sh <set-name>                          Link ALL agents (default).
#   ./link_agents.sh --all <set-name>                    Same as above, explicit.
#   ./link_agents.sh --scan <set-name> [project-path]    Scan a project for tech
#                                                        signals, recommend a
#                                                        paired agent set, ask
#                                                        for boundaries, then
#                                                        link only the selected
#                                                        agents. Writes a
#                                                        SYSTEM.md into the set
#                                                        dir documenting the
#                                                        choices.
#   ./link_agents.sh --list                              List available agents
#                                                        grouped by category.
#   ./link_agents.sh --help                              Show this message.
#
# Exit codes:
#   0 ok · 1 usage error · 2 scan error

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CATEGORIES=(kotlin java swift golang python web generic product design conversation person data platform)

usage() {
  sed -n '3,23p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

list_agents() {
  for category in "${CATEGORIES[@]}"; do
    dir="${REPO_ROOT}/${category}"
    [ -d "$dir" ] || continue
    agents=$(find "$dir" -maxdepth 1 -type f -name '*.md' | sort)
    [ -n "$agents" ] || continue
    echo "[$category]"
    while IFS= read -r a; do
      echo "  $(basename "$a" .md)"
    done <<< "$agents"
  done
}

# Read lines from stdin into the named array. Portable replacement for mapfile,
# which macOS's stock bash 3.2 lacks.
read_lines() {
  local _l
  eval "$1=()"
  while IFS= read -r _l; do eval "$1+=(\"\$_l\")"; done
}

# Map a detection signal to recommended agent names (one per line).
# Signals are opaque strings; mappings live here so the logic is reviewable.
map_signal_to_agents() {
  case "$1" in
    kotlin)              echo kotlin-agent ;;
    kmp)                 printf '%s\n' kmp-agent kotlin-agent ;;
    cmp)                 printf '%s\n' cmp-agent kmp-agent kotlin-agent ;;
    android)             printf '%s\n' android-agent kotlin-agent mobile-design-agent accessibility-agent mobile-product-agent ;;
    kotlin-springboot)   printf '%s\n' kotlin-springboot-agent kotlin-agent backend-product-agent ;;
    java-spring)         printf '%s\n' java-spring-agent backend-product-agent ;;
    swift)               echo swift-agent ;;
    ios)                 printf '%s\n' ios-agent swift-agent mobile-design-agent accessibility-agent mobile-product-agent ;;
    golang)              printf '%s\n' golang-agent backend-product-agent ;;
    node-runtime)        echo javascript-runtime-agent ;;
    react-web)           printf '%s\n' react-web-agent frontend-web-agent javascript-web-agent web-design-agent accessibility-agent ;;
    vanilla-web)         printf '%s\n' javascript-web-agent frontend-web-agent web-design-agent accessibility-agent ;;
    docker)              echo docker-agent ;;
    terraform)           echo terraform-agent ;;
    aws)                 printf '%s\n' aws-agent terraform-agent docker-agent ;;
    kubernetes)          printf '%s\n' kubernetes-agent docker-agent ;;
    eks)                 printf '%s\n' kubernetes-agent aws-agent terraform-agent docker-agent ;;
    gcp)                 printf '%s\n' gcp-agent google-api-agent terraform-agent docker-agent ;;
    snowflake-insights)  printf '%s\n' snowflake-insights-agent snowflake-data-agent ;;
    snowflake-data)      echo snowflake-data-agent ;;
    airflow)             printf '%s\n' airflow-agent snowflake-insights-agent ;;
    airtable)            echo airtable-agent ;;
    googleanalytics)     echo googleanalytics-agent ;;
    gradle)              echo gradle-agent ;;
    mobile)              printf '%s\n' mobile-design-agent mobile-product-agent accessibility-agent ;;
    web)                 printf '%s\n' frontend-web-agent web-design-agent accessibility-agent ;;
  esac
}

# Detect tech signals from a project directory. Prints one signal per line.
# Only surfaces signals for which we have mapped agents.
detect_signals() {
  local proj="$1"
  local signals=()

  has_file() { [ -f "$proj/$1" ]; }
  has_glob() {
    # shellcheck disable=SC2086
    compgen -G "$proj/$1" > /dev/null 2>&1
  }
  has_dir()  { [ -d "$proj/$1" ]; }
  grep_in()  {
    # grep -q across known build / config files; silent
    local pattern="$1"; shift
    local found=0
    for f in "$@"; do
      [ -f "$proj/$f" ] || continue
      if grep -q "$pattern" "$proj/$f" 2>/dev/null; then
        found=1; break
      fi
    done
    [ "$found" = "1" ]
  }

  # Kotlin / Android / KMP / CMP / Spring
  if has_file build.gradle.kts || has_file build.gradle || has_file settings.gradle.kts; then
    signals+=(kotlin)
    if grep_in 'org\.jetbrains\.kotlin\.multiplatform\|kotlin("multiplatform")\|commonMain' \
         build.gradle.kts build.gradle settings.gradle.kts libs.versions.toml 2>/dev/null; then
      signals+=(kmp)
    fi
    if grep_in 'org\.jetbrains\.compose\|compose-multiplatform' \
         build.gradle.kts build.gradle libs.versions.toml 2>/dev/null; then
      signals+=(cmp)
    fi
    if has_file AndroidManifest.xml || grep_in 'com\.android\.application\|com\.android\.library' \
         build.gradle.kts build.gradle libs.versions.toml 2>/dev/null; then
      signals+=(android)
      signals+=(mobile)
    fi
    if grep_in 'org\.springframework\.boot' \
         build.gradle.kts build.gradle libs.versions.toml 2>/dev/null; then
      signals+=(kotlin-springboot)
    fi
  fi

  # Java Spring
  if has_file pom.xml; then
    if grep_in 'spring-boot\|org\.springframework\.boot' pom.xml; then
      signals+=(java-spring)
    fi
  fi

  # Swift / iOS
  if has_file Package.swift; then
    signals+=(swift)
  fi
  if has_glob '*.xcodeproj' || has_glob '*.xcworkspace' || has_file Podfile || \
     has_file project.yml || has_dir ios; then
    signals+=(ios)
    signals+=(swift)
    signals+=(mobile)
  fi

  # Go
  if has_file go.mod; then
    signals+=(golang)
  fi

  # JavaScript / TypeScript / React / runtime
  if has_file package.json; then
    signals+=(node-runtime)
    if grep_in '"react"' package.json; then
      signals+=(react-web)
      signals+=(web)
    else
      signals+=(vanilla-web)
      signals+=(web)
    fi
  fi
  if has_file deno.json || has_file deno.jsonc; then
    signals+=(node-runtime)
  fi
  if has_file bunfig.toml; then
    signals+=(node-runtime)
  fi
  if has_file wrangler.toml || has_file wrangler.jsonc; then
    signals+=(node-runtime)
  fi

  # Docker
  if has_file Dockerfile || has_file Containerfile || has_file docker-compose.yml || \
     has_file compose.yaml || has_file compose.yml; then
    signals+=(docker)
  fi

  # Terraform
  if has_glob '*.tf' || has_file versions.tf; then
    signals+=(terraform)
  fi

  # AWS signals (serverless framework, CDK, amplify, SAM)
  if has_file serverless.yml || has_file serverless.yaml || \
     has_file samconfig.toml || has_file cdk.json || has_dir amplify; then
    signals+=(aws)
  fi

  # Kubernetes: manifests, kustomize, Helm, Argo/Flux, skaffold
  if has_file kustomization.yaml || has_file kustomization.yml || \
     has_file Chart.yaml || has_file skaffold.yaml || \
     has_dir manifests || has_dir k8s || has_dir kubernetes || \
     has_dir helm || has_dir charts; then
    signals+=(kubernetes)
  fi
  # Argo CD / Flux GitOps
  if grep_in 'argoproj\.io\|argo-cd\|fluxcd' \
       kustomization.yaml kustomization.yml Chart.yaml skaffold.yaml 2>/dev/null; then
    signals+=(kubernetes)
  fi
  # EKS-specific signals
  if grep_in 'eks\.amazonaws\.com\|aws-auth\|eksctl\|karpenter\|"eks"' \
       Chart.yaml kustomization.yaml kustomization.yml 2>/dev/null; then
    signals+=(eks)
  fi
  if has_file eksctl.yaml || has_file cluster.yaml; then
    if grep_in 'apiVersion: eksctl\.io' eksctl.yaml cluster.yaml 2>/dev/null; then
      signals+=(eks)
    fi
  fi
  # Terraform + EKS module
  if grep_in 'terraform-aws-modules/eks\|module\s*"eks"' \
       main.tf eks.tf versions.tf 2>/dev/null; then
    signals+=(eks)
  fi

  # Snowflake / dbt
  if has_file dbt_project.yml || has_file profiles.yml; then
    signals+=(snowflake-insights)
  fi
  # Cortex / AI SQL usage
  if grep_in 'SNOWFLAKE\.CORTEX\|CORTEX_SEARCH\|CORTEX_ANALYST' \
       dbt_project.yml profiles.yml 2>/dev/null; then
    signals+=(snowflake-data)
  fi

  # Airflow
  if has_file airflow.cfg || has_dir dags; then
    signals+=(airflow)
  fi

  # Airtable (looser — env var names, pyairtable / airtable node deps)
  if grep_in 'AIRTABLE\|pyairtable\|"airtable"' \
       .env .env.example package.json requirements.txt pyproject.toml 2>/dev/null; then
    signals+=(airtable)
  fi

  # Google Analytics / Firebase Analytics
  if has_file GoogleService-Info.plist || has_file google-services.json || \
     has_file firebase.json || has_file .firebaserc; then
    signals+=(googleanalytics)
  fi
  # GCP signals
  if has_file app.yaml || has_file cloudbuild.yaml || has_file cloudbuild.yml || \
     has_file .gcloudignore || has_file service-account.json; then
    signals+=(gcp)
  fi
  if grep_in '@google-cloud/\|google-cloud-\|cloud\.google\.com/go\|googleapis\|com\.google\.cloud\|google\.cloud\.' \
       package.json pom.xml build.gradle build.gradle.kts requirements.txt pyproject.toml go.mod 2>/dev/null; then
    signals+=(gcp)
  fi
  # Terraform + google provider
  if grep_in 'hashicorp/google\|provider\s*"google"' \
       main.tf versions.tf providers.tf 2>/dev/null; then
    signals+=(gcp)
  fi
  if grep_in 'gtag(\|GoogleAnalyticsObject\|@react-native-firebase/analytics\|firebase/analytics\|FirebaseAnalytics\|firebase-analytics\|google-analytics' \
       package.json build.gradle build.gradle.kts Package.swift Package.resolved Podfile pubspec.yaml 2>/dev/null; then
    signals+=(googleanalytics)
  fi
  # GTM container id in HTML
  if grep_in 'GTM-[A-Z0-9]\{4,\}\|www\.googletagmanager\.com/gtag/js' \
       index.html public/index.html src/index.html 2>/dev/null; then
    signals+=(googleanalytics)
  fi

  # Gradle
  if has_file build.gradle || has_file build.gradle.kts || \
     has_file settings.gradle || has_file settings.gradle.kts || \
     has_file gradle.properties || has_file libs.versions.toml || \
     has_dir gradle || has_file gradlew; then
    signals+=(gradle)
  fi

  # Deduplicate while preserving order
  printf '%s\n' ${signals[@]+"${signals[@]}"} | awk '!seen[$0]++'
}

# Collect recommended agents from a list of signals (sorted + unique).
recommend_agents() {
  while IFS= read -r sig; do
    [ -n "$sig" ] || continue
    map_signal_to_agents "$sig"
  done | sort -u
}

# Prompt the user, default value on empty input.
ask() {
  local prompt="$1" default="${2:-}" reply
  if [ -n "$default" ]; then
    read -r -p "$prompt [$default] " reply || true
    echo "${reply:-$default}"
  else
    read -r -p "$prompt " reply || true
    echo "$reply"
  fi
}

ask_yn() {
  local prompt="$1" default="${2:-n}" reply
  case "$default" in
    [Yy]*) read -r -p "$prompt [Y/n] " reply || true ;;
    *)     read -r -p "$prompt [y/N] " reply || true ;;
  esac
  reply="${reply:-$default}"
  case "$reply" in [Yy]*) return 0 ;; *) return 1 ;; esac
}

write_system_md() {
  local target="$1" set_name="$2" project="$3" thinking="$4" timeout="$5"
  shift 5
  local agents=("$@")

  {
    echo "# System boundaries — agent set: ${set_name}"
    echo
    echo "Generated by \`link_agents.sh --scan\` on $(date -u +"%Y-%m-%dT%H:%M:%SZ")."
    echo
    echo "## Scope"
    echo
    if [ -n "$project" ]; then
      echo "- Project scanned: \`${project}\`"
    else
      echo "- No project scanned (manual selection)."
    fi
    echo "- Agent set installed at: \`~/.claude/agents/${set_name}/\`"
    echo
    echo "## Agents paired to this project"
    echo
    for a in "${agents[@]}"; do echo "- \`${a}\`"; done
    echo
    echo "## Operating boundaries"
    echo
    echo "These are hints for Claude Code and the agents in this set. They are"
    echo "not hard limits — use judgment — but should be respected unless the"
    echo "user explicitly raises the budget in-conversation."
    echo
    echo "- **Thinking budget (per agent, per task):** \`${thinking}\`"
    echo "  - \`low\` = answer from direct evidence; no deep speculation"
    echo "  - \`medium\` = standard analysis; verify non-obvious claims"
    echo "  - \`high\` = exhaustive — use for hard architecture / design / research calls"
    echo "- **Task time budget before escalation:** \`${timeout}\`"
    echo "  - If a task is taking longer, agents should stop, report status, and"
    echo "    ask for a scope reduction or more time — not silently keep grinding."
    echo "- **Escalation path when blocked:** ask the user, or (for multi-agent"
    echo "  work) route through \`eng-manager-agent\` / \`dir-eng-agent\` /"
    echo "  \`dir-product-agent\` / \`dir-design-agent\` as appropriate."
    echo
    echo "## How to use this set"
    echo
    echo "Agents are automatically discovered from \`~/.claude/agents/${set_name}/\`"
    echo "when Claude Code starts. Each agent has a \`## Works well with\` section"
    echo "listing its peers — use it to chain handoffs or dispatch via the"
    echo "\`eng-manager-agent\`."
    echo
    echo "Regenerate / re-pair by re-running:"
    echo
    echo "    ./link_agents.sh --scan ${set_name} ${project:-<project-path>}"
  } > "${target}/SYSTEM.md"
}

do_link() {
  local set_name="$1"; shift
  local -a agents=("$@")
  local target="${HOME}/.claude/agents/${set_name}"
  mkdir -p "$target"

  local linked=0 skipped=0
  if [ ${#agents[@]} -eq 0 ]; then
    # No specific list → link all.
    for category in "${CATEGORIES[@]}"; do
      local src_dir="${REPO_ROOT}/${category}"
      [ -d "$src_dir" ] || continue
      while IFS= read -r -d '' agent; do
        local name dest
        name="$(basename "$agent")"
        dest="${target}/${name}"
        if [ -e "$dest" ] || [ -L "$dest" ]; then
          echo "skip: ${category}/${name}" >&2
          skipped=$((skipped + 1))
          continue
        fi
        ln -s "$agent" "$dest"
        echo "link: ${category}/${name}"
        linked=$((linked + 1))
      done < <(find "$src_dir" -maxdepth 1 -type f -name '*.md' -print0)
    done
  else
    # Specific list — resolve each name to its source file.
    for name in "${agents[@]}"; do
      local src=""
      for category in "${CATEGORIES[@]}"; do
        if [ -f "${REPO_ROOT}/${category}/${name}.md" ]; then
          src="${REPO_ROOT}/${category}/${name}.md"
          break
        fi
      done
      if [ -z "$src" ]; then
        echo "warn: agent '${name}' not found in any category, skipping" >&2
        continue
      fi
      local dest="${target}/${name}.md"
      if [ -e "$dest" ] || [ -L "$dest" ]; then
        echo "skip: ${name}" >&2
        skipped=$((skipped + 1))
        continue
      fi
      ln -s "$src" "$dest"
      echo "link: ${name}"
      linked=$((linked + 1))
    done
  fi
  echo "done: ${linked} linked, ${skipped} skipped into ${target}"
}

# ----- main -----

if [ $# -eq 0 ]; then
  usage
  exit 1
fi

case "${1:-}" in
  --help|-h)
    usage
    exit 0
    ;;
  --list)
    list_agents
    exit 0
    ;;
  --all)
    [ $# -ge 2 ] || { usage; exit 1; }
    do_link "$2"
    exit 0
    ;;
  --scan)
    [ $# -ge 2 ] || { usage; exit 1; }
    SET_NAME="$2"
    PROJECT_PATH="${3:-$(pwd)}"
    PROJECT_PATH="$(cd "$PROJECT_PATH" 2>/dev/null && pwd || true)"
    if [ -z "$PROJECT_PATH" ] || [ ! -d "$PROJECT_PATH" ]; then
      echo "error: project path not found" >&2
      exit 2
    fi

    echo
    echo "Scanning project: $PROJECT_PATH"
    read_lines signals < <(detect_signals "$PROJECT_PATH")
    echo "Detected signals:"
    if [ ${#signals[@]} -eq 0 ]; then
      echo "  (none detected — we'll still offer generic + leadership agents)"
    else
      for s in ${signals[@]+"${signals[@]}"}; do echo "  - $s"; done
    fi
    echo

    # Always include the leadership / coordination bench so the set is coherent.
    always_on=(
      host-agent
      stacy-agent
      eng-manager-agent
      principal-eng-agent
      customer-product-agent
      user-researcher-agent
      market-research-agent
    )

    read_lines recommended < <(
      {
        printf '%s\n' ${signals[@]+"${signals[@]}"} | while IFS= read -r s; do
          map_signal_to_agents "$s"
        done
        printf '%s\n' "${always_on[@]}"
      } | awk 'NF && !seen[$0]++' | sort
    )

    echo "Recommended agents (paired to detected skills + always-on bench):"
    for a in "${recommended[@]}"; do echo "  + $a"; done
    echo

    if ask_yn "Add any additional agents by name (comma-separated)?" n; then
      add_list="$(ask 'Agents to add' '')"
      IFS=',' read -r -a extra <<< "$add_list"
      for a in "${extra[@]}"; do
        a="$(echo "$a" | xargs)"  # trim
        [ -n "$a" ] && recommended+=("$a")
      done
    fi

    if ask_yn "Remove any agents from the set?" n; then
      rm_list="$(ask 'Agents to remove' '')"
      IFS=',' read -r -a removed <<< "$rm_list"
      if [ ${#removed[@]} -gt 0 ]; then
        tmp=()
        for a in "${recommended[@]}"; do
          keep=1
          for r in "${removed[@]}"; do
            r="$(echo "$r" | xargs)"
            [ "$a" = "$r" ] && keep=0 && break
          done
          [ "$keep" = "1" ] && tmp+=("$a")
        done
        recommended=("${tmp[@]}")
      fi
    fi

    # Deduplicate one more time
    read_lines recommended < <(printf '%s\n' "${recommended[@]}" | awk 'NF && !seen[$0]++' | sort)

    echo
    echo "Final agent set:"
    for a in "${recommended[@]}"; do echo "  · $a"; done
    echo

    echo "Operating boundaries — these go into SYSTEM.md and help agents avoid"
    echo "over-thinking simple tasks and silently grinding on stuck ones."
    echo
    thinking=$(ask 'Default thinking budget per task (low/medium/high)' 'medium')
    timeout=$(ask 'Task time budget before escalation (e.g. 5m, 15m, 30m)' '15m')

    echo
    if ! ask_yn "Proceed with linking ${#recommended[@]} agents into ~/.claude/agents/${SET_NAME}/?" y; then
      echo "aborted."
      exit 0
    fi

    do_link "$SET_NAME" "${recommended[@]}"
    write_system_md "${HOME}/.claude/agents/${SET_NAME}" "$SET_NAME" \
      "$PROJECT_PATH" "$thinking" "$timeout" "${recommended[@]}"

    echo
    echo "wrote boundaries to ~/.claude/agents/${SET_NAME}/SYSTEM.md"
    exit 0
    ;;
  -*)
    echo "unknown option: $1" >&2
    usage
    exit 1
    ;;
  *)
    # Legacy: positional set-name, link all.
    do_link "$1"
    exit 0
    ;;
esac
