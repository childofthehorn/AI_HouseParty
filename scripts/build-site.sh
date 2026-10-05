#!/usr/bin/env bash
# Assemble the GitHub Pages source: the docs/ shell plus the repository's own
# markdown, each page given a title from its first heading. Jekyll (run by
# GitHub, see .github/workflows/pages.yml) does the rest. No copies live in git.
#
#   scripts/build-site.sh [out-dir]     # default: _site_src
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT=${1:-"$ROOT/_site_src"}
rm -rf "$OUT"
mkdir -p "$OUT"
cp -R "$ROOT/docs/." "$OUT/"

# add_page <source.md> [permalink]: copy with front matter (title, optional permalink).
add_page() {
  local src=$1 permalink=${2:-} dest="$OUT/$1" title
  mkdir -p "$(dirname "$dest")"
  if head -1 "$ROOT/$src" | grep -q '^---$'; then
    cp "$ROOT/$src" "$dest"
    return
  fi
  title=$(grep -m1 '^# ' "$ROOT/$src" | sed "s/^# //; s/'/''/g")
  {
    echo '---'
    echo "title: '${title:-$src}'"
    [ -n "$permalink" ] && echo "permalink: $permalink"
    echo '---'
    cat "$ROOT/$src"
  } > "$dest"
}

add_page README.md
# /AGENTS/ would differ from /agents/ only by case; a trap on case-insensitive disks.
add_page AGENTS.md /house-rules/
add_page PORTABILITY.md
add_page ASSUMPTIONS.md
add_page STYLE-RULES-TO-FILL.md
# Folder READMEs become the folder's index page, so links to agents/README.md land on /agents/.
add_page platform/README.md /platform/
add_page adr/README.md /adr/
add_page agents/README.md /agents/
add_page skills/README.md /skills/
for f in "$ROOT"/platform/AGENTS.*.md "$ROOT"/adr/0*.md; do
  [ "$(basename "$f")" = 0000-template.md ] && continue   # the template is not a page
  add_page "${f#"$ROOT"/}"
done

echo "assembled $(find "$OUT" -name '*.md' | wc -l | tr -d ' ') pages into $OUT"
