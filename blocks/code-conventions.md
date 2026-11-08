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
