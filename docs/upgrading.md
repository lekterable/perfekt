# Upgrading from perfekt 3

perfekt 4 replaces commitlint with the built-in [`perfekt lint`](documentation.md#lint), reads only JSON configs, and installs as one file with no dependencies.

## Commit linting

1. Delete `commitlint.config.cjs` and remove `@commitlint/cli` and `@commitlint/config-conventional` from `devDependencies`. The `perfekt/commitlint` export is gone.
2. In `.husky/commit-msg`, replace the commitlint line with `npx --no -- perfekt lint --edit "$1"`. If pull request title checks are enough, delete the hook instead, and drop `husky` and its `prepare` script when nothing else uses them.
3. Keep `.github/workflows/commitlint.yml` as it is. The shared workflow it calls already runs `perfekt lint`'s rules.

## Config

- A JSON `.perfektrc` keeps working, and so does an empty one.
- Move a YAML or JS config, or a `"perfekt"` key in `package.json`, to `perfekt.json`. Until you do, `changelog` and `release` stop with an `INVALID_CONFIG` error instead of running without your settings.
- Keep one config. Having both `perfekt.json` and an old config is an error too.
- `perfekt.json` is new in perfekt 4, so anything that still runs perfekt 3, such as a CI job pinned to `perfekt@3`, won't see it. Keep a JSON `.perfektrc` until everything runs perfekt 4.

## Commands

- `perfekt init` no longer asks for a format. It writes `{}` to `perfekt.json` and refuses when a config already exists.
- `perfekt setup commits` writes only the workflow. Its `--ci` option is gone, and its JSON result no longer has `packageManager`, `installCommand` or `prepareHint`.
- New: [`perfekt lint`](documentation.md#lint) and [`perfekt ci`](documentation.md#ci).
