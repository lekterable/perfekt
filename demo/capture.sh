#!/usr/bin/env bash
# Runs the real perfekt CLI in a throwaway repo and saves what each command prints to output/.
# The video shows these files verbatim. Fixed names and dates keep the commit hashes stable.
# Also fetches the Apple emoji images the video uses into assets/emoji/; they are Apple's
# artwork, so they stay out of git.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
perfekt="${PERFEKT:-$here/../dist/cli.js}"
out="$here/output"
sandbox="$(mktemp -d)"
trap 'rm -rf "$sandbox"' EXIT

mkdir -p "$here/assets/emoji" "$out"
emoji=(ok-hand_1f44c package_1f4e6 seedling_1f331 hook_1fa9d broom_1f9f9 check-mark-button_2705)
printf '%s\n' "${emoji[@]}" | xargs -P 6 -I {} sh -c \
  'curl -fsSL -o "$0/assets/emoji/${1##*_}.png" "https://em-content.zobj.net/source/apple/391/$1.png"' "$here" {}

export HOME="$sandbox" GIT_CONFIG_NOSYSTEM=1 npm_config_cache="$sandbox/.npm"
export GIT_AUTHOR_NAME=Dev GIT_AUTHOR_EMAIL=dev@example.com
export GIT_COMMITTER_NAME=Dev GIT_COMMITTER_EMAIL=dev@example.com

at() {
  export GIT_AUTHOR_DATE="2026-10-0$1T10:00:00Z" GIT_COMMITTER_DATE="2026-10-0$1T10:00:00Z"
}

commit() {
  at "$1"
  echo "$2" >>notes.txt
  git add .
  git commit -qm "$2"
}

# A small package with a test, before perfekt.
mkdir "$sandbox/acme" && cd "$sandbox/acme"
git init -q -b master
cat >package.json <<'JSON'
{
  "name": "acme",
  "version": "1.2.0",
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "node --test",
    "build": "tsc"
  }
}
JSON
cat >tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "module": "nodenext",
    "target": "es2022",
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.js"]
}
JSON
mkdir src
echo 'export const add = (left, right) => left + right' >src/add.js
cat >src/add.test.js <<'JS'
import assert from 'node:assert'
import { test } from 'node:test'
import { add } from './add.js'

test('should add two numbers', () => assert.equal(add(1, 2), 3))
JS
printf 'node_modules\ndist\n' >.gitignore
npm install --silent --no-audit --no-fund --save-dev --save-exact typescript@5.9.3

node "$perfekt" setup >"$out/setup.txt"
npm install --silent --no-audit --no-fund
npx biome check --write >/dev/null
at 1
git add .
git commit -qm "chore(release): 1.2.0"
git tag v1.2.0
git init -q --bare "$sandbox/origin.git"
git remote add origin "$sandbox/origin.git"
git push -q origin master
git remote set-head origin master

# The commit hook that setup wrote rejects a message that breaks the rules.
echo "rate limits" >>notes.txt
git add .
at 2
git commit -qm "Added new stuff." >"$out/hook.txt" 2>&1 && exit 1
true

commit 2 "feat(api): add rate limits per token"
commit 3 "fix(auth): refresh expired sessions"
commit 4 "feat(cli): add --json output"
commit 5 "docs: explain the config file"
commit 6 "perf(db): batch the nightly writes"

git log --oneline v1.2.0..HEAD >"$out/log.txt"
node "$perfekt" changelog >"$out/changelog.txt"
at 7
node "$perfekt" release new >"$out/release.txt"
node "$perfekt" ci >"$out/ci.txt" 2>&1
