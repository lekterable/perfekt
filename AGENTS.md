# Agent guide

perfekt is a release, changelog and versioning manager for Conventional Commits repos (`perfekt release`, `perfekt changelog`), with `perfekt lint` for commit messages and `perfekt ci` to run the shared CI steps locally.
It also ships the house tooling other repos extend: the shared commit rules (`src/core/lint.ts`, which the PR title workflow runs directly, so keep it free of imports), the Biome config (`perfekt/biome`) with its GritQL plugins in `biome/`, and reusable GitHub workflows in `.github/workflows/`.
Docs: `README.md` (also the docs site homepage), then `docs/` for getting started, the command reference, configuration, shared tooling and upgrading.
`demo/` holds the HyperFrames demo video, built from real CLI output: when `setup`, `changelog`, `release` or `ci` output changes, follow `demo/README.md` to capture, update the terminal scene and render again. Its HTML lint exceptions live in `demo/biome.json`, never in the root `biome.json`, which ships as `perfekt/biome`.
Only `changelog` and `release` load the config (`src/core/config/load.ts`), so `lint`, `ci`, `init` and `setup` keep working when it is broken.
Before pushing, run `pnpm verify` (it builds, then runs `perfekt ci`: install, commits, lint, typecheck, test and build). perfekt writes `CHANGELOG.md` itself on release, so never edit it by hand.

<!-- synapse:code-conventions -->
## Code conventions

[Synapse](https://github.com/lekterable/synapse-ai) keeps this block identical across repos, so change its shared source, not this copy.

- TypeScript first. Use types, not interfaces.
- Write arrow functions only; no `function` declarations or expressions. Generators, and the rare case a framework needs `this`, are the exceptions.
- Write declarative code: no `for`, `for…of`, `for…in`, `while` or `do…while` loops, tests included; `forEach` only for side effects (logging, writes), never to build a value. Use `map`/`filter`/`reduce`/`find`/`flatMap`/`Object.fromEntries`/`Object.groupBy` instead of loops and mutating accumulators, and `it.each` for test tables. Sequential async work, pagination and early exits go in one small named helper built on `reduce` or recursion, so call sites stay declarative.
- Give bindings descriptive names, comparators included (`(left, right)`, not `(a, b)`). Avoid single-letter and abbreviated names.
- Use small direct exports, and short file and package names: one self-explanatory word when possible.
- Use a library where custom code is risky: CLI parsing, escaping, frontmatter, schema validation. Add no new abstraction without two real callers.

### Tests

- Put tests next to the code (`name.test.ts`) or in a `tests/` folder.
- Name each case by behaviour, starting with "should" or "should not": `it("should reject an expired token")`.
- Test only what can realistically break and would matter: public behaviour, tricky logic, edge cases, past bugs. Don't test trivial code, types, framework behaviour or implementation details.
- Write one test per behaviour. Use a small table of cases instead of near-duplicate tests.
- Keep the suite fast: no real network, sleeps or long timeouts in unit tests.
- A bug fix adds one regression test that fails without the fix.
<!-- /synapse:code-conventions -->
