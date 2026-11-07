# Upgrading to perfekt 4.4

perfekt 4.4 needs Node 26 or later. Run it on Node 26 (`.nvmrc`, `engines.node`, your local install).

The shared workflows moved to Node 26 at the same time. Callers use `@master`, so they switched whichever perfekt version they install:

- The shared CI workflow tests on Node 26 by default, so its check reads `CI / Verify / Node 26`. Update a branch protection rule that requires `CI / Verify / Node 24`. A repo that still needs another version passes `node-versions`, such as `'["24"]'`.
- The commitlint, release and publish workflows run on Node 26 and take no version input. The release workflow installs corepack itself, since Node 26 no longer ships it.

The shared CI workflow also spends fewer Actions minutes:

- It starts no job for a draft pull request. Open pull requests as drafts and mark them ready once; `ready_for_review` must be in your caller's `types`.
- It lints the pull request title in the same job. Next to it, narrow your commitlint caller to `types: [edited]`. The shared commitlint job now also skips drafts and edits that leave the title as it was.
- Run CI on pull requests only. [CI](tooling.md#ci) has the caller to copy, or run [`perfekt setup ci`](documentation.md#setup-ci) to write it, then `perfekt setup commits --force` to narrow commitlint.

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
