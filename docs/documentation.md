# Documentation

For the list of available commands you can always run:

`perfekt help`

## `init`

Usage: `perfekt init [options]`

Starts an initialization process and generates an empty configuration file.

Options:

`-h, --help` - display help for command

## `setup commits`

Usage: `perfekt setup commits [options]`

Scaffolds Conventional Commits linting in the current repo:

- Writes a one-line `commitlint.config.cjs` that extends the shared `perfekt/commitlint` rules, so every repo follows the same rules and a rule change ships with a `perfekt` bump
- Writes `.husky/commit-msg` so local commits are linted
- Prints the exact `@commitlint/cli` + `husky` + `perfekt` install command for the detected package manager
- Reminds you to run `husky` from `package.json` `scripts.prepare`
- Detects the current default branch for the optional `--ci` workflow
- Prints a lekterable tip. Our repos use `master` and first commit `feat: init :seedling:`. That is advisory. Setup does not fail on `main`.

The shared rules (`perfekt/commitlint`, on top of `@commitlint/config-conventional`):

- Allow only `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `build`, `style`, `perf`, `revert`
- Accept `feat: init :seedling:` and scoped subjects like `feat(web): add x`
- Accept a trailing GitHub squash suffix like `(#123)`
- Reject subjects that end with `.` and headers longer than 72 characters
- Warn when the subject is longer than 50 characters
- Warn when the subject does not start with an imperative verb (`add`, not `added`, `adding` or `adds`)

Add a scope only when it narrows the change to one area (`fix(seo): ...`); leave it out for repo-wide changes.

Existing files are left alone unless you pass `--force`.

`perfekt setup commits` only guards local commits and CI you add yourself. GitHub squash-merge titles still need repo settings or merge habit to strip `(#N)`.

Options:

`-h, --help` - display help for command

`--ci` - also write `.github/workflows/commitlint.yml`, which lints pull request titles by calling the shared `lekterable/perfekt/.github/workflows/commitlint.yml@master` workflow. That workflow always reads the rules from perfekt's `master`, so title rules change everywhere at once. The `pull_request` filter uses the detected default branch when git exposes one.

`--force` - overwrite generated files if they already exist

`--json` - print the command result as JSON instead of human-readable output

## `release`

Usage: `perfekt release [options] <version>`

Executes a release

This will:

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

### Releasing from GitHub Actions

To cut releases from CI instead of your machine, call the shared release workflow from a manually triggered one. It runs `perfekt release` on the branch you pick, pushes the release commit and tag, and publishes a GitHub release with the new changelog section as notes. Every run, dry or not, shows that section in the job summary.

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: Version, or major, minor, patch or new
        default: new
      dry-run:
        description: Preview without committing or pushing
        type: boolean
        default: false

jobs:
  release:
    permissions:
      contents: write
    uses: lekterable/perfekt/.github/workflows/release.yml@master
    with:
      version: ${{ inputs.version }}
      dry-run: ${{ inputs.dry-run }}
```

Inputs:

`version` - passed to `perfekt release`, defaults to `new`

`dry-run` - preview the release in the job summary without committing, tagging or pushing, defaults to `false`

`github-release` - also publish a GitHub release for the tag, defaults to `true`

Outputs:

`released` - `'true'` when a release commit and tag were pushed

`version` - the released version, which is also the tag name (tags have no `v` prefix)

Tags pushed with the workflow's `GITHUB_TOKEN` don't start other workflows, so publish in a job of the same run instead of on `push: tags`:

```yaml
publish:
  needs: release
  if: needs.release.outputs.released == 'true'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
      with:
        ref: ${{ needs.release.outputs.version }}
    # set up your package manager, build and publish
```

The release needs at least one earlier tag or `chore(release):` commit to know where the unreleased changes start, and the branch must accept pushes from `github-actions[bot]`.

## `changelog`

Usage: `perfekt changelog [options] [version]`

Generates changelog

This will:

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

`version` - _(optional)_ version which will be used for generating the changelog, fallbacks to [unreleased format](#unreleasedHeader) if not passed

When `--json` is used, `perfekt` prints only JSON to `stdout`. This is useful for CI jobs, scripts, and agents that want structured release or changelog data.
