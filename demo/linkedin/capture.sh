#!/usr/bin/env bash
# Runs the real perfekt CLI in a throwaway repo and saves what each command prints to output/.
# The video shows these files verbatim. Fixed names and dates keep the commit hashes stable.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
perfekt="${PERFEKT:-$here/../../dist/cli.js}"
sandbox="$(mktemp -d)"
trap 'rm -rf "$sandbox"' EXIT

export HOME="$sandbox" GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME=Dev GIT_AUTHOR_EMAIL=dev@example.com
export GIT_COMMITTER_NAME=Dev GIT_COMMITTER_EMAIL=dev@example.com

commit() {
  export GIT_AUTHOR_DATE="2026-10-0$1T10:00:00Z" GIT_COMMITTER_DATE="2026-10-0$1T10:00:00Z"
  echo "$2" >>log.txt
  git add .
  git commit -qm "$2"
}

mkdir "$sandbox/acme" && cd "$sandbox/acme"
git init -q -b master
echo '{ "name": "acme", "version": "1.2.0" }' >package.json
commit 1 "chore(release): 1.2.0"
git tag v1.2.0
commit 2 "feat(api): add rate limits per token"
commit 3 "fix(auth): refresh expired sessions"
commit 4 "feat(cli): add --json output"
commit 5 "docs: explain the config file"
commit 6 "perf(db): batch the nightly writes"

out="$here/output"
mkdir -p "$out"
git log --oneline v1.2.0..HEAD >"$out/log.txt"
node "$perfekt" changelog >"$out/changelog.txt"
node "$perfekt" release new >"$out/release.txt"
node "$perfekt" lint "Added new stuff." >"$out/lint.txt" 2>&1 || true
