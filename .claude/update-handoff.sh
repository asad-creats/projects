#!/usr/bin/env bash
# Auto-generates HANDOFF.md at the repo root. Invoked by the SessionEnd hook
# so the handoff refreshes at the end of every Claude Code session.
# Pure git-derived state — safe to run anytime, never blocks session end.

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 0

OUT="$ROOT/HANDOFF.md"
NOW="$(date '+%Y-%m-%d %H:%M:%S')"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'n/a')"
AHEAD="$(git rev-list --count @{u}..HEAD 2>/dev/null || echo '?')"

{
  # Narrative section (hand-maintained). Prepended verbatim if present.
  if [ -f "$ROOT/HANDOFF-NOTES.md" ]; then
    cat "$ROOT/HANDOFF-NOTES.md"
    echo
    echo "---"
    echo
  fi
  echo "# Git State (auto-generated)"
  echo
  echo "_Refreshed at the end of each Claude Code session._"
  echo
  echo "- **Last updated:** $NOW"
  echo "- **Branch:** \`$BRANCH\`"
  echo "- **Unpushed commits:** $AHEAD"
  echo
  echo "## Recent commits"
  echo
  echo '```'
  git log --oneline -10 2>/dev/null || echo "no git history"
  echo '```'
  echo
  echo "## Uncommitted changes"
  echo
  echo '```'
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    git status --short 2>/dev/null
  else
    echo "working tree clean"
  fi
  echo '```'
  echo
  echo "## Files touched in the last commit"
  echo
  echo '```'
  git show --stat --oneline HEAD 2>/dev/null | tail -n +2 || echo "n/a"
  echo '```'
} > "$OUT"
