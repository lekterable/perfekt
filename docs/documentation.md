# Documentation

Every command and option. Run `perfekt help` or `perfekt <command> --help` for the same in your terminal. Upgrading from perfekt 3 or 4? See [upgrading](upgrading.md).

## `release`

Usage: `perfekt release [options] <version>`

Releases a new version:

- Update the version in your `package.json` using the detected package manager command
- Refresh the matching lockfile when your package manager writes one
- Generate and save the [changelog](#changelog) using passed `version`
- Create a release commit with the changes in your `package.json`, matching lockfile and `CHANGELOG.md`
- Create a git tag

`perfekt` detects the package manager from the `packageManager` field in `package.json` when available, otherwise from `pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock`. If none of those are present, it falls back to `npm`.

For non-dry-run releases, the working tree must be clean before `perfekt` starts writing release files. This avoids accidentally mixing unrelated changes into the generated release commit.

Options:

`-h, --help` - display help for command

`--dry-run` - preview the release without changing files or git state

`--json` - print the release result as JSON instead of human-readable output

`--from <commit>` - SHA of the last commit which will **NOT** be included in this release

Arguments:

`version` - _(required)_ version which will be used while executing the release. You can use `major`, `minor` and `patch` instead of a specific version number to bump it or `new` to make **perfekt** determine the version for you automatically based on the unreleased changes.

To release from GitHub Actions instead, see [shared tooling](tooling.md#releases).

## `changelog`

Usage: `perfekt changelog [options] [version]`

Generates the changelog without releasing:

- Look for the latest git tag
  - if found transform unreleased into a release and append with the previous changelog
  - if **NOT**, try to generate a new changelog for the whole history
- Output changelog in the console, if you want to save it in the `CHANGELOG.md` file use `--write` option

Options:

`-h, --help` - display help for command

`--json` - print the changelog result as JSON instead of markdown output

`--write` - write the output to file

`--root` - generate changelog for the entire history

`--from <commit>` - SHA of the last commit which will **NOT** be included in this changelog

Arguments:

`version` - _(optional)_ version which will be used for generating the changelog, fallbacks to [unreleased format](configuration.md#unreleasedheader) if not passed

When `--json` is used, `perfekt` prints only JSON to `stdout`. This is useful for CI jobs, scripts, and agents that want structured release or changelog data.

## `lint`

Usage: `perfekt lint [message] [options]`

Lints a commit message or pull request title with the shared rules, read from the argument, from `--edit <file>`, or from stdin. It prints commitlint's report format and exits 1 on an error; warnings don't fail. The rules are `@commitlint/config-conventional` plus the house overrides, built into perfekt, so there is no commitlint to install:

- Allow only `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `build`, `style`, `perf`, `revert`, in lower case
- Accept `feat: init :seedling:`, scoped subjects like `feat(web): add x` and `feat!:` breaking changes
- Accept a trailing GitHub squash suffix like `(#123)`
- Reject an empty type or subject, a subject that starts with a capital letter or ends with `.`, a header longer than 72 characters or wrapped in whitespace, and body lines longer than 100 characters unless they hold a URL
- Warn when the subject is longer than 50 characters, does not start with an imperative verb (`add`, not `added`, `adding` or `adds`), or the body or a `BREAKING CHANGE:` footer has no blank line before it
- Skip merge, revert, `fixup!`/`squash!`/`amend!` and release (`chore(release): 1.2.3`) messages, as commitlint does

Add a scope only when it narrows the change to one area (`fix(seo): ...`); leave it out for repo-wide changes.

To lint local commits too, add a `commit-msg` hook that runs `npx --no -- perfekt lint --edit "$1"`.

Options:

`-h, --help` - display help for command

`--edit <file>` - lint the message in this file, dropping git's `#` comments and the `git commit -v` diff. Use it instead of a message, not with one

`--json` - print `{ success, command, input, ignored, errors, warnings }` instead of the report

Exit codes: `0` when the message passes (warnings included), `1` when it breaks a rule or no message was given. Run in a terminal with nothing piped in, it fails instead of waiting for input.

Examples:

```sh
perfekt lint "feat(cli): add x"
git log -1 --format=%B | perfekt lint
perfekt lint --edit "$1"   # in a git commit-msg hook
```

## `ci`

Usage: `perfekt ci [options]`

Runs the shared CI steps on your machine, for when GitHub Actions can't (no minutes left on a private repo) or before you push:

1. `install`, with the lockfile frozen: `npm ci`, `pnpm install` with `CI=true`, `yarn install --frozen-lockfile` (`--immutable` on Yarn 2+) or `bun install --frozen-lockfile`. The package manager comes from `packageManager`, then the lockfile.
2. `commits`, which lints every commit since the base branch with [`perfekt lint`](#lint), or only the pull request title with `--title`. These are the rules of the perfekt version you have installed; the shared workflow reads perfekt's `master`.
3. `lint`, `typecheck`, `test` and `build`, each only when `package.json` has that script.

Every step runs with `CI=true`, like on GitHub Actions. It stops at the first failing step, prints the end of its output, and exits 1.

When `package.json` still has an umbrella `check`, `validate` or `ci` script, it prints one warning to stderr suggesting `"verify": "perfekt ci"` instead (see [`setup scripts`](#setup-scripts)). The warning never fails the run.

By default it runs on a clean checkout of `HEAD` in a temporary git worktree, so uncommitted or untracked files can't make it pass. It runs on one Node version, the one on your PATH, not the shared workflow's matrix.

Options:

`-h, --help` - display help for command

`--dirty` - run in the current folder instead, uncommitted changes included

`--title <title>` - lint this pull request title instead of the branch's commits

`--base <ref>` - lint the commits since this ref; defaults to `origin/HEAD`, else the first of `origin/main`, `origin/master`, `main` and `master` that exists; with none, the step is skipped

`--json` - print `{ success, command, dir, steps, warnings }`, where `warnings` lists advice that doesn't fail CI (such as a leftover umbrella script) and each step has its `name`, `status` (`passed`, `failed`, `skipped` or `not run`), time in `ms`, an optional `detail` (the install command, the number of commits linted, why a step was skipped) and the failing step's `output`

Exit codes: `0` when every step passes or is skipped, `1` on the first failure.

## `setup`

Usage: `perfekt setup [options]`

Runs [`setup ci`](#setup-ci), [`setup commits`](#setup-commits), [`setup hooks`](#setup-hooks), [`setup lint`](#setup-lint) and [`setup scripts`](#setup-scripts). It writes the CI caller first, so the PR title workflow only lints later title edits.

Options:

`-h, --help` - display help for command

`--force` - overwrite the workflows, the hook, the Biome config and the standard scripts if they already exist. `ci.yml` is written even when another workflow calls the shared CI, so CI then runs more than once: keep only one caller

`--json` - print `{ success, command, files, defaultBranch, editsOnly, hooksPath, clonesNeed, installCommand, scripts }`, with the files of every step (`editsOnly` only when the PR title workflow is written)

## `setup ci`

Usage: `perfekt setup ci [options]`

Writes `.github/workflows/ci.yml`, which calls the shared `lekterable/perfekt/.github/workflows/ci.yml@master` workflow on pull requests only (`opened`, `synchronize`, `reopened` and `ready_for_review`), with no `paths-ignore`, so every pull request gets its title linted and reports `Verify`. A new push cancels the older run. The shared job starts nothing for a draft and lints the pull request title, so open pull requests as drafts and mark them ready once. The `pull_request` filter uses the detected default branch when git exposes one. See [CI](tooling.md#ci) for the caller and the inputs it takes.

The shared job installs with pnpm, so `package.json` needs a `packageManager` field. An existing `ci.yml`, or any workflow that already calls the shared CI (such as `ci.yaml`), is left alone unless you pass `--force`, so CI never runs more than once.

Options:

`-h, --help` - display help for command

`--force` - write `ci.yml` even if it exists or another workflow calls the shared CI (in that case CI then runs more than once, so keep only one caller)

`--json` - print `{ success, command, files, defaultBranch }`. A skipped `ci.yml` is what `--force` overwrites; any other skipped path already calls the shared CI, and `--force` writes `ci.yml` beside it

## `setup commits`

Usage: `perfekt setup commits [options]`

Writes `.github/workflows/commitlint.yml`, which lints pull request titles by calling the shared `lekterable/perfekt/.github/workflows/commitlint.yml@master` workflow. That workflow runs `perfekt lint`'s rules straight from perfekt's `master` with Node 26, so it installs nothing and title rules change everywhere at once. The `pull_request` filter uses the detected default branch when git exposes one. It runs on `opened`, `edited` and `reopened`, so a push to the pull request does not lint the title again. When a workflow in `.github/workflows` already calls the shared CI, which lints the title on every run, it runs on `edited` only. A YAML comment, on its own line or after code, doesn't count. The shared job skips pushes, drafts and edits that leave the title as it was.

When you squash-merge, the pull request title becomes the commit, so this covers what lands on the default branch. A trailing `(#N)` from GitHub squash is allowed.

An existing workflow is left alone unless you pass `--force`.

Options:

`-h, --help` - display help for command

`--force` - overwrite the workflow if it already exists

`--json` - print `{ success, command, files, defaultBranch, editsOnly }`, where `editsOnly` (set when the workflow is written) is `true` when it lints title edits only

## `setup hooks`

Usage: `perfekt setup hooks [options]`

Writes a `commit-msg` hook that runs `perfekt lint --edit` on every commit, so a message that breaks the rules is rejected before it is made. A repo with `perfekt` in its dependencies runs that copy; any other repo runs `npx --yes perfekt@<major>`.

- In a repo with a `.husky/` folder, the hook goes in `.husky/commit-msg` and husky runs it.
- Otherwise it goes in `.githooks/commit-msg`, and git's `core.hooksPath` is set to `.githooks` in this clone. When `package.json` has no `prepare` script, setup adds `git config core.hooksPath .githooks` as one, so every other clone picks the hook up on install. When it already has one, setup leaves it alone and prints the command to add to it.

An existing hook is left alone unless you pass `--force`.

Options:

`-h, --help` - display help for command

`--force` - overwrite the hook if it already exists

`--json` - print `{ success, command, files, hooksPath, clonesNeed }`, where `hooksPath` is the hooks path set in this clone (or `null`) and `clonesNeed` is the command other clones still need (or `null`)

## `setup lint`

Usage: `perfekt setup lint [options]`

Sets up the [shared Biome config](tooling.md#biome) for linting and formatting code. It writes a `biome.json` that extends `perfekt/biome`. In `package.json` it adds `@biomejs/biome` (the version perfekt is tested with) and `perfekt` as dev dependencies, and `lint` (`biome check`) and `format` (`biome check --write`) scripts. Dependencies and scripts the repo already has are kept. Run the printed install command afterwards.

An existing `biome.json` or `biome.jsonc` is left alone unless you pass `--force`, which rewrites it in place.

Options:

`-h, --help` - display help for command

`--force` - overwrite an existing Biome config

`--json` - print `{ success, command, files, installCommand }`, where `installCommand` is the install to run when dependencies were added (or `null`)

## `setup scripts`

Usage: `perfekt setup scripts [options]`

Adds the standard scripts to `package.json` where they are missing:

- `lint`: `biome check`
- `format`: `biome check --write`
- `typecheck`: `tsc --noEmit`, only when the folder has a `tsconfig.json`
- `verify`: `perfekt ci`, so `npm run verify` runs everything CI runs

Scripts the repo already has are kept unless you pass `--force`. Without a `package.json`, it skips with no error.

Options:

`-h, --help` - display help for command

`--force` - overwrite those scripts if they already exist

`--json` - print `{ success, command, files, scripts }`, where `scripts` names the scripts this run added or overwrote

## `init`

Usage: `perfekt init`

Writes an empty `perfekt.json`, the config file perfekt reads first. It never overwrites an existing config.

Options:

`-h, --help` - display help for command
