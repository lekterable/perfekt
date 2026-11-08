# TODO

## Releases and publishing

- [ ] `perfekt publish`: publish the package version that isn't on the registry yet, so a release cut
  locally (`perfekt release`) reaches npm without the publish workflow. `--dry-run`, `--json`,
  `--tag <dist-tag>` and `--access public`; npm auth from the usual npm config; clear output when the
  version is already published. The publish workflow then calls it instead of `npm publish`.
- [ ] Release PR workflow: a reusable workflow that opens or updates a `chore(release)` PR with the
  version bump and changelog, then tags and publishes (through `perfekt publish`) when it merges. A
  release then needs no direct push to the default branch or a tag push from a local clone.
- [ ] Prerelease mode: `perfekt pre enter beta` / `perfekt pre exit`, versions like `5.0.0-beta.0`,
  published under the matching npm dist-tag.
- [ ] Snapshot versions: `perfekt release --snapshot canary` gives a throwaway version with a date or
  sha (`4.5.0-canary.<sha>`) for trying a change in another repo, without a release commit or tag.

## Monorepos

Each package in a workspace released on its own, with its own version and changelog, while commits
stay the fast path. Single-package repos keep working as they do now.

- [ ] Workspace discovery: read pnpm, npm and yarn workspaces; `perfekt packages list --json` prints
  each package's name, version, directory, private flag and local dependency edges.
- [ ] Changed packages: `perfekt packages changed --from <ref> --json`, with the changed files per
  package and a config list of root files that count as a change to every package.
- [ ] Per-package releases: `perfekt release new --packages` plans and applies a bump per package,
  writes each package's `CHANGELOG.md` and tags `<name>@<version>`.
- [ ] Release intent files: `.perfekt/changes/*.md` naming packages and bumps, created by
  `perfekt change`, consumed by the release, with `perfekt change status --check` for CI. Optional
  next to commit inference, for when a commit scope is ambiguous.
- [ ] Internal dependency ranges: bump local `workspace:` and version ranges in dependents when a
  dependency releases (`updateInternalDependencies`), with a changelog line for dependency-only
  releases.
- [ ] Fixed and linked groups: packages that always share one version, or move together.
- [ ] Ignored and private packages: listed by discovery but never released or published.
- [ ] Import from Changesets: read `.changeset/*.md` and map its config, warning on what doesn't map.

## Shared tooling

- [ ] Renovate preset: ship one from perfekt, so a repo's `renovate.json` is just
  `{ "extends": ["github>lekterable/perfekt"] }`, like `perfekt/biome` and `perfekt/tsconfig`. Rules:
  `config:recommended` with the Dependency Dashboard; semantic commits (`chore(deps): …`) so titles
  pass `perfekt lint`; weekly, before 6am on Monday, Europe/Warsaw; non-major updates in one PR, with
  Biome, Vitest, TypeScript and GitHub Actions in their own groups; automerge for patch, minor and
  devDependency updates once checks pass, majors wait for a human; monthly lockfile maintenance;
  `minimumReleaseAge` of 3 days; devDependencies pinned, runtime ranges kept. Open point: automerge
  needs green checks, so repos without Actions minutes turn it off (per-repo override). Done when the
  preset is in perfekt, `docs/tooling.md` documents it, and the Renovate app is installed with each
  repo extending the preset. (Was issue #30; the Mend app runs on Mend's servers, not Actions minutes,
  so check its pricing before installing.)
