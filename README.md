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
  <a href="https://github.com/lekterable/perfekt/actions/workflows/ci.yml">
    <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/lekterable/perfekt/ci.yml?branch=master&label=CI&logo=github&style=for-the-badge">
  </a>
  <a href="https://app.codecov.io/gh/lekterable/perfekt">
    <img alt="code coverage" src="https://img.shields.io/codecov/c/github/lekterable/perfekt?logo=codecov&style=for-the-badge" />
  </a>
  <a href="https://biomejs.dev">
    <img alt="code style: biome" src="https://img.shields.io/badge/code_style-biome-60a5fa.svg?style=for-the-badge">
  </a>
  <a href="https://twitter.com/acdlite/status/974390255393505280">
    <img alt="Blazing Fast" src="https://img.shields.io/badge/speed-blazing%20%F0%9F%94%A5-brightgreen.svg?style=for-the-badge">
  </a>
  <a href="https://twitter.com/acdlite/status/974390255393505280">
    <img alt="license" src="https://img.shields.io/github/license/lekterable/perfekt?style=for-the-badge">
  </a>
</div>

## Intro

**perfekt** is a release, changelog and versioning manager for [Conventional Commits](https://www.conventionalcommits.org) repos. It needs no config to start, works with `pnpm`, `npm` and `yarn`, and installs as one file with no dependencies.

| Command | What it does |
| --- | --- |
| `perfekt release <version>` | Bumps the version, writes `CHANGELOG.md`, commits and tags |
| `perfekt changelog` | Prints the changelog, or writes it with `--write` |
| `perfekt lint [message]` | Checks a commit message or pull request title against the shared rules |
| `perfekt ci` | Runs install, commit lint, lint, typecheck, test and build like CI does |
| `perfekt setup commits` | Adds a GitHub Action that lints pull request titles |
| `perfekt init` | Writes an empty `perfekt.json` config |

Every command except `init` prints JSON with `--json`, for scripts, CI jobs and agents.

perfekt also ships shared tooling other repos extend: a [Biome](https://biomejs.dev) config and reusable GitHub workflows for CI, pull request titles and releases. See [shared tooling](https://lekterable.github.io/perfekt/#/tooling).

## Install

```sh
pnpm add -D perfekt   # or npm install -D perfekt, or pnpm add -g perfekt
```

## Quick start

```sh
perfekt release new                  # pick the next version from the commits and release it
perfekt changelog                    # preview the unreleased changes
perfekt lint "feat(cli): add x"      # check a message
perfekt ci                           # check the branch like CI would, before you push
perfekt setup commits                # lint pull request titles on GitHub
```

`release new` picks the version from the commit types: `feat` is a minor release, `fix` a patch, and a `!` or `BREAKING CHANGE` a major. You can also pass `major`, `minor`, `patch` or an exact version. Start with [getting started](https://lekterable.github.io/perfekt/#/getting-started), and see the [documentation](https://lekterable.github.io/perfekt/#/documentation) for every option.

Upgrading from perfekt 3? See [upgrading](https://lekterable.github.io/perfekt/#/upgrading).

## Commit convention

perfekt reads the commit type to group the changelog and pick the next version, so commits should look like `type(scope): subject`:

- Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `build`, `style`, `perf`, `revert`
- A subject that starts lower-case with an imperative verb (`add`, not `added`) and has no trailing `.`
- Header up to 72 characters; subjects over 50 characters get a warning
- `!` after the type, or a `BREAKING CHANGE:` footer, marks a breaking change

`perfekt lint` enforces these rules (commitlint's `config-conventional` plus a few house overrides, built in). When you squash-merge, the pull request title becomes the commit, so `perfekt setup commits` lints titles on GitHub, and `perfekt lint --edit "$1"` in a `commit-msg` hook lints local commits.

Adopting the convention in an older repo needs no history rewrite: release once to collect the old commits, then name new commits by the convention. perfekt still works without it, but can't group changes by type or pick the version with `new`.

## Badge

Would you like to let the whole world know that your project is under the _**perfekt**_ management?

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
