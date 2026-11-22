import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')
const biome = path.join(root, 'node_modules/.bin/biome')
const dirs: string[] = []

afterAll(() => {
  dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }))
})

// Lints one file in a scratch repo that extends the shipped `perfekt/biome`, the
// way a consumer does, and returns the lines the house rules under test flag.
const lint = (file: string, content: string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perfekt-biome-'))
  dirs.push(dir)
  fs.mkdirSync(path.join(dir, 'node_modules'))
  fs.symlinkSync(root, path.join(dir, 'node_modules/perfekt'), 'dir')
  fs.writeFileSync(
    path.join(dir, 'biome.json'),
    JSON.stringify({ extends: ['perfekt/biome'], vcs: { enabled: false } }),
  )
  fs.writeFileSync(path.join(dir, file), content)
  const result = spawnSync(biome, ['lint', '--max-diagnostics=100', file], {
    cwd: dir,
    encoding: 'utf8',
  })
  const output = `${result.stdout}${result.stderr}`
  expect(output).not.toMatch(/Failed to load|configuration resulted in errors/i)
  return [
    ...output.matchAll(
      /:(\d+):\d+ (?:plugin|lint\/style\/noRestricted(?:Globals|Imports))/g,
    ),
  ].map((match) => Number(match[1]))
}

describe('perfekt/biome', () => {
  it.each([
    [
      'a one-letter variable, parameter and catch binding',
      'src.ts',
      'const p = 1\nexport const fn = (a: number) => a + p\ntry { fn(1) } catch (e) { fn(2) }\n',
      [1, 2, 3],
    ],
    [
      'type parameters, `_` and spelled-out names',
      'src.ts',
      'export const pick = <T,>(_: T, person: T) => person\n',
      [],
    ],
    [
      'one-letter imports',
      'src.ts',
      "import { z } from 'zod'\nimport * as R from 'remeda'\nexport const both = [z, R]\n",
      [],
    ],
    [
      'real waits in a test',
      'wait.test.ts',
      "import { setTimeout as wait } from 'node:timers/promises'\nsetTimeout(() => {}, 10)\nsetInterval(() => {}, 10)\nawait wait(1)\n",
      [1, 2, 3],
    ],
    ['setTimeout outside tests', 'src.ts', 'setTimeout(() => {}, 10)\n', []],
    [
      'an uppercase one-letter value',
      'src.ts',
      'const T = 1\nexport const pick = <U,>(value: U) => [value, T]\n',
      [1],
    ],
    [
      'a one-letter `import = require()`',
      'src.ts',
      "import z = require('zod')\nexport const schema = z\n",
      [],
    ],
    [
      'every timers import in a test',
      'timers.test.ts',
      "import 'timers/promises'\nimport { setTimeout as later } from 'node:timers'\nimport legacy = require('timers')\nexport const both = [later, legacy]\n",
      [1, 2, 3],
    ],
    [
      'a type-only `typeof setTimeout` in a test',
      'types.test.ts',
      'type Timer = typeof setTimeout\ntype Handle = typeof globalThis.setTimeout\nexport type Both = Timer | Handle\n',
      [1],
    ],
    [
      'a doubled "should" in test titles',
      'title.test.ts',
      "it('should should reject', () => 1)\nit('should not not reject', () => 1)\ntest.each([1])(`should not should %s`, () => 1)\nit('should not reject', () => 1)\nit('should shoulder the load', () => 1)\n",
      [1, 2, 3],
    ],
    [
      "the default React import, which tests still can't use",
      'view.test.tsx',
      "import React from 'react'\nexport const view = React\n",
      [1],
    ],
  ])('should flag the expected lines for %s', (_, file, content, lines) => {
    expect(lint(file, content)).toEqual(lines)
  })
})
