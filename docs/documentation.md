# Documentation

Every command and option. Run `perfekt help` or `perfekt <command> --help` for the same in your terminal. Upgrading from perfekt 3? See [upgrading](upgrading.md).

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

By default it runs on a clean checkout of `HEAD` in a temporary git worktree, so uncommitted or untracked files can't make it pass. It runs on one Node version, the one on your PATH, not the shared workflow's matrix.

Options:

`-h, --help` - display help for command

`--dirty` - run in the current folder instead, uncommitted changes included

`--title <title>` - lint this pull request title instead of the branch's commits

`--base <ref>` - lint the commits since this ref; defaults to `origin/HEAD`, else the first of `origin/main`, `origin/master`, `main` and `master` that exists; with none, the step is skipped

`--json` - print `{ success, command, dir, steps }`, where each step has its `name`, `status` (`passed`, `failed`, `skipped` or `not run`), time in `ms`, an optional `detail` (the install command, the number of commits linted, why a step was skipped) and the failing step's `output`

Exit codes: `0` when every step passes or is skipped, `1` on the first failure.

## `setup commits`

Usage: `perfekt setup commits [options]`

Writes `.github/workflows/commitlint.yml`, which lints pull request titles by calling the shared `lekterable/perfekt/.github/workflows/commitlint.yml@master` workflow. That workflow runs `perfekt lint`'s rules straight from perfekt's `master` with Node 24, so it installs nothing and title rules change everywhere at once. The `pull_request` filter uses the detected default branch when git exposes one.

When you squash-merge, the pull request title becomes the commit, so this covers what lands on the default branch. A trailing `(#N)` from GitHub squash is allowed.

An existing workflow is left alone unless you pass `--force`.

Options:

`-h, --help` - display help for command

`--force` - overwrite the workflow if it already exists

`--json` - print the command result as JSON instead of human-readable output

## `init`

Usage: `perfekt init`

Writes an empty `perfekt.json`, the config file perfekt reads first. It never overwrites an existing config.

Options:

`-h, --help` - display help for command
