<h1 align="center">
  perfekt 👌
</h1>
<div align="center">
  <a href="https://github.com/lekterable/perfekt">
    <img alt="management: perfekt👌" src="https://img.shields.io/badge/management-perfekt👌-red.svg?style=for-the-badge">
  </a>
  <a href="https://www.npmjs.com/package/perfekt">
    <img alt="npm version" src="https://img.shields.io/npm/v/perfekt.svg?style=for-the-badge">
  </a>
  <a href="https://travis-ci.com/github/lekterable/perfekt"></a>
    <img alt="travis" src="https://img.shields.io/travis/com/lekterable/perfekt?logo=travis&style=for-the-badge">
  </a>
  <a href="https://codecov.io/gh/lekterable/perfekt"></a>
    <img alt="code coverage" src="https://img.shields.io/codecov/c/github/lekterable/perfekt?logo=codecov&style=for-the-badge" />
  </a>
  <a href="https://github.com/prettier/prettier">
    <img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=for-the-badge">
  </a>
  <a href="https://twitter.com/acdlite/status/974390255393505280">
    <img alt="Blazing Fast" src="https://img.shields.io/badge/speed-blazing%20%F0%9F%94%A5-brightgreen.svg?style=for-the-badge">
  </a>
  <a href="https://twitter.com/acdlite/status/974390255393505280">
    <img alt="license" src="https://img.shields.io/github/license/lekterable/perfekt?style=for-the-badge">
  </a>
</div>

## Intro

**perfekt** is a release, changelog and versioning manager. It is easy to use and doesn't require any configuration to get it up and running.

## Installation

`npm i -g perfekt`

Installing **perfekt** globally is recommended as this will allow you to conveniently use it on different projects.

If you'd like to use it as a git hook or integrate it into your CI/CD you can also install it locally.

## Prerequisites

For **perfekt** to run with its full power, your project must follow [conventional commits](https://www.conventionalcommits.org) specification, this makes it possible to know what type of changes were introduced in a given commit and categorize it.

If your project is not following this convention, you can start any time as there is no need to rewrite the git history, simply create an initial release that will contain all the "legacy" commits and after that start naming your commits accordingly.

## Getting started

How to get started, depends mostly on your needs and also on your project's state.

If you're not interested in executing a release, and just want to generate a changelog, go to [changelog documentation](#changelog)

If your project is fairly new, go ahead and start with the [new projects section](#new-projects), if it is in development for some time already AND it has a lot (and I mean A LOT) of commits, proceed to the [old projects section](#old-projects).

### New projects

For the new projects, all you need to do is to make sure that you don't have any leftover git tags that could cause a problem, to confirm that, run:

`git tag`

If the output is empty, you should be able to run:

`perfekt release <version>`

where `<version>` is the version of your new release

refer to [release documentation](#release) for more information

### Old projects

For the projects that have a long-existing git history, which could potentially make the process time out, you can use:

`perfekt release <version> --from <commit>`

where `<version>` is the version of your new release and `<commit>` is the hash of the last commit that should `NOT` be the part of the release.

after this, you can start referring to [new projects section](#new-projects) when executing future releases.

## Documentation

For the list of available commands you can always run:

`perfekt help`

### `init` [WIP]

Usage: `perfekt init [options]`

Starts an initialization process and generates an empty configuration file.

Options:

`-h, --help` - display help for command

### `release`

Usage: `perfekt release [options] <version>`

Executes a release

This will:

- Update the version in your `package.json` and `package-lock.json`
- Generate and save the [changelog](#changelog) using passed `version`
- Create a release commit with the changes in your `package.json`, `package-lock.json` and `CHANGELOG.md`
- Create a git tag

Options:

`-h, --help` - display help for command

`--from <commit>` - SHA of the last commit that will `NOT` be included in this release

Arguments:

`version` - _(required)_ version which will be used while executing the release. You can also use `major`, `minor` and `patch` instead of a specific version number to make **perfekt** bump the version for you automatically.

### `changelog`

Usage: `perfekt changelog [options] [version]`

Generates changelog

This will:

- Look for the latest git tag
  - if found transform unreleased into a release and append with the previous changelog
  - if `NOT`, try to generate a new changelog for the whole history
- Output changelog in the console, if you want to save it in the `CHANGELOG.md` file use `--write` option

Options:

`-h, --help` - display help for command

`--write` - write the output to file

`--root` - generate changelog for the entire history

`--from <commit>` - SHA of the last commit that will `NOT` be included in this changelog

Arguments:

`version` - _(optional)_ version which will be used for generating the changelog, fallbacks to [unreleased format](#unreleasedFormat) if not passed

## Configuration

**perfekt's** huge advantage is it's configurability.

See [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for more details on what configuration formats are supported.

Default config looks like this:

```json
{
  "unreleasedFormat": "# Latest",
  "releaseFormat": "# %version%",
  "breakingFormat": "## BREAKING",
  "groups": [
    { "name": "## Features", "aliases": ["feat", "feature"] },
    { "name": "## Fixes", "aliases": ["fix"] }
  ],
  "miscFormat": "## Misc",
  "lineFormat": "- %message% %hash%",
  "ignoredScopes": ["changelog"]
}
```

### `unreleasedFormat`

Format of the unreleased-block header in the generated changelog

Placeholders:

none

Default:

`# Latest`

### `breakingFormat`

Format of the breaking changes header in the generated changelog

Placeholders:

none

Default:

`## BREAKING`

### `releaseFormat`

Format of the release header in the generated changelog

Placeholders:

`%version%` - release version

Default:

`# %version%`

### `groups`

Used to define how commits should be grouped inside of the release block.

Each object is a separate group. The `name` property will be used as the group's header and the `types` array contains all commit types which will be associated with it.

All commits with unmatched types will become a part of the `Misc` group.

> commit type comes from: `type(scope?): message`

Default:

`[ { name: '## Features', types: ['feat', 'feature'] }, { name: '## Fixes', types: ['fix'] } ]`

### `miscFormat`

Format of the miscellaneous header in the generated changelog

Placeholders:

none

Default:

`## Misc`

### `lineFormat`

Format of the individual lines in the generated changelog

Placeholders:

`%message%` - commit message

`%hash%` - abbreviated (8-digit long) commit hash

`%HASH%` - full commit hash

Default:

`- %message% %hash%`

### `ignoredScopes`

Array of scopes which will be ignored while generating a changelog

Default:

`['changelog']`

## Badge

Want to let everyone know that your project is under a _**perfekt**_ management?

[![management: perfekt👌](https://img.shields.io/badge/management-perfekt👌-red.svg?style=flat-square)](https://github.com/lekterable/perfekt)

```md
[![management: perfekt👌](https://img.shields.io/badge/management-perfekt👌-red.svg?style=flat-square)](https://github.com/lekterable/perfekt)
```

[![management: perfekt👌](https://img.shields.io/badge/management-perfekt👌-red.svg?style=for-the-badge)](https://github.com/lekterable/perfekt)

```md
[![management: perfekt👌](https://img.shields.io/badge/management-perfekt👌-red.svg?style=for-the-badge)](https://github.com/lekterable/perfekt)
```

## License

[MIT](LICENSE)
