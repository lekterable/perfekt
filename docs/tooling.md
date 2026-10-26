# Shared tooling

Besides the CLI, perfekt ships tooling other repos extend, so lint, format and CI rules change in one place.

## Biome

`perfekt/biome` is the house [Biome](https://biomejs.dev) config. It replaces Prettier and ESLint with one tool: single quotes, no semicolons, trailing commas, 80 columns, sorted imports and Tailwind classes, and an explicit rule list (types over interfaces, `import type`, no `console.log`). React and Next rules switch on by themselves when a repo depends on them. `perfekt setup lint` sets it up: it writes a `biome.json` that extends `perfekt/biome`, adds `@biomejs/biome` and `perfekt` as dev dependencies, and adds `biome check` as the `lint` script and `biome check --write` as `format` when those are missing. To do it by hand, install both packages and write:

```json
{ "extends": ["perfekt/biome"] }
```

Biome doesn't format Markdown or YAML.

The config also enforces the house code conventions:

| Rule | Enforces | How |
| --- | --- | --- |
| `complexity/useArrowFunction` | Function expressions become arrows: `const add = (left, right) => left + right`, not `function (left, right) {}`. Functions that use `this` are left alone. Auto-fixable. | Biome core rule |
| No function declarations | `function name() {}` and `export default function () {}` are errors. Generators (`function*`) are allowed, since arrows can't yield. | GritQL plugin `biome/arrow.grit` |
| No loops | `for`, `for…of`, `for…in`, `for await`, `while` and `do…while` are errors; `.forEach(...)` is allowed for side effects. Use `map`/`filter`/`reduce`/`flatMap`/`find`, `it.each` for test tables, and one named helper built on `reduce` or recursion for sequential async work. | GritQL plugin `biome/loop.grit` |
| Test titles start with "should" | In `**/*.test.*` and `**/tests/**`, every `it(...)` and `test(...)` title (including `.only`, `.skip`, `.todo` and `.each`) must start with "should" or "should not": `it('should reject an expired token')`. `describe` blocks are exempt. | GritQL plugin `biome/should.grit` |
| `style/useConsistentTypeDefinitions` | `type` instead of `interface`. | Biome core rule |

When you adopt the config, expect `biome check` to flag existing function declarations, function expressions, loops and test titles. `biome check --write` fixes the function expressions; the rest need a rename or a rewrite (`const name = () => {}`, or a loop turned into `map`/`reduce`).

Biome resolves plugin paths from your project root, so the config points at `./node_modules/perfekt/biome/`. That works with pnpm, npm and Yarn's `node-modules` linker when `biome.json` sits next to the `node_modules` that has `perfekt`. Yarn Plug'n'Play has no `node_modules`, so the plugins can't load there.

## CI

Call the shared CI workflow. It installs with pnpm and runs `lint`, `typecheck`, `test` and `build`, skipping any script your `package.json` doesn't have:

```yaml
jobs:
  checks:
    name: Checks
    uses: lekterable/perfekt/.github/workflows/ci.yml@master
    # with:
    #   node-versions: '["22", "24"]'
    #   bun: true
```

It needs a `packageManager` field in `package.json` for the pnpm version. Its checks read `CI / Checks / Node 22`, one per Node version.

`perfekt ci` runs the same steps on your machine, plus [`perfekt lint`](documentation.md#lint) on the branch's commits. See [`ci`](documentation.md#ci).

## Pull request titles

When you squash-merge, the pull request title becomes the commit, so lint titles with the shared workflow:

```yaml
jobs:
  pr-title:
    name: PR title
    permissions:
      contents: read
    uses: lekterable/perfekt/.github/workflows/commitlint.yml@master
```

Its check reads `Commitlint / PR title / Conventional Commits`. `perfekt setup commits` writes that caller for you. The workflow runs `perfekt lint`'s rules straight from perfekt's `master` with Node 24, so it installs nothing and rule changes reach every repo at once.

## Releases

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
