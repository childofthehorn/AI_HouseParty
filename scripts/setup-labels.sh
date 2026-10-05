#!/usr/bin/env bash
# Create the non-room labels the workflows expect. Idempotent. The room labels
# are created by the room labeler from .github/house/rooms.config.js.
set -euo pipefail
REPO="${1:?usage: setup-labels.sh owner/repo}"

python3 - "$REPO" <<'PY'
import re, subprocess, sys
repo = sys.argv[1]
entries, cur = [], None
for line in open(".github/labels.yml").read().splitlines():
    if line.startswith("- name:"):
        cur = {"name": line.split(":", 1)[1].strip()}
        entries.append(cur)
    elif cur and re.match(r"\s+(color|description):", line):
        k, v = line.strip().split(":", 1)
        cur[k] = v.strip().strip('"')
for e in entries:
    subprocess.run(["gh", "label", "create", e["name"], "--repo", repo,
                    "--color", e.get("color", "EDEDED"),
                    "--description", e.get("description", ""), "--force"], check=False)
    print("label:", e["name"])
PY
