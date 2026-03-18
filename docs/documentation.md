# Documentation

For the list of available commands you can always run:

`perfekt help`

## `init`

Usage: `perfekt init [options]`

Starts an initialization process and generates an empty configuration file.

Options:

`-h, --help` - display help for command

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

Options:

`-h, --help` - display help for command

`--dry-run` - preview the release without changing files or git state

`--json` - print the release result as JSON instead of human-readable output

`--from <commit>` - SHA of the last commit which will **NOT** be included in this release

Arguments:

`version` - _(required)_ version which will be used while executing the release. You can use `major`, `minor` and `patch` instead of a specific version number to bump it or `new` to make **perfekt** determine the version for you automatically based on the unreleased changes.

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
