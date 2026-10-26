# Agent guide

perfekt is a release, changelog and versioning CLI for Conventional Commits repos (`perfekt release`, `perfekt changelog`), with `perfekt lint` for commit messages and `perfekt ci` to run the shared CI steps locally.
It also ships the house tooling other repos extend: the shared commit rules (`src/core/lint.ts`, which the PR title workflow runs directly, so keep it free of imports), the Biome config (`perfekt/biome`) with its GritQL plugins in `biome/`, and reusable GitHub workflows in `.github/workflows/`.
Before pushing, run `pnpm build && node dist/cli.cjs ci` (or `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`). perfekt writes `CHANGELOG.md` itself on release, so never edit it by hand.

<!-- conventions:start -->
## Code conventions

These are shared across Kornel's repos. Keep this block identical in every repo, and edit it in all of them at once.

- TypeScript first. Use types, not interfaces.
- Write arrow functions only; no `function` declarations or expressions. Generators, and the rare case a framework needs `this`, are the exceptions.
- Prefer declarative code to imperative. Use `map`/`filter`/`reduce`/`find`/`flatMap`/`Object.fromEntries` instead of `for`/`while` loops and mutating accumulators. When sequential async work or an early exit genuinely needs a loop, hide it behind one named helper so call sites stay declarative.
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
<!-- conventions:end -->
