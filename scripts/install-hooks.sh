#!/usr/bin/env bash
# One command so nobody has an excuse.
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
install -m 0755 "$ROOT/scripts/pre-commit" "$ROOT/.git/hooks/pre-commit"
echo "installed $ROOT/.git/hooks/pre-commit"
echo "note: this is the screen door. CI is the deadbolt. You need both."
