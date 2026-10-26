# Getting started

Install perfekt in your project, or globally:

```sh
pnpm add -D perfekt   # or npm install -D perfekt, or pnpm add -g perfekt
```

perfekt needs no config. To change the changelog format, run `perfekt init` and see [configuration](configuration.md).

## Your first release

perfekt releases everything since the last tag, so check for leftover tags first:

```sh
git tag
```

If that prints nothing, release:

```sh
perfekt release 1.0.0      # or major, minor, patch, or new to pick from the commits
```

perfekt bumps `package.json` and the lockfile, writes `CHANGELOG.md`, commits and tags. Add `--dry-run` to preview it first.

In a repo with a long history, start from a recent commit instead: `perfekt release 1.0.0 --from <commit>`, where `<commit>` is the last commit to leave out.

To only see the changelog, run `perfekt changelog`. See [`release`](documentation.md#release) and [`changelog`](documentation.md#changelog).

## Keep commits conventional

perfekt groups the changelog and picks versions from commit types, so check messages with [`perfekt lint`](documentation.md#lint):

- `perfekt setup commits` adds a GitHub Action that lints pull request titles, which become the commits when you squash-merge.
- For local commits, add a `commit-msg` hook that runs `npx --no -- perfekt lint --edit "$1"`.

## Check before you push

`perfekt ci` runs install, the commit lint, and your `lint`, `typecheck`, `test` and `build` scripts on a clean checkout of `HEAD`, like CI would. See [`ci`](documentation.md#ci).
