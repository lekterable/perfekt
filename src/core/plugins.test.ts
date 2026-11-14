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

const lint = (file: string, content: string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perfekt-plugins-'))
  dirs.push(dir)
  fs.writeFileSync(
    path.join(dir, 'biome.json'),
    JSON.stringify({
      linter: { rules: { recommended: false } },
      plugins: [path.join(root, 'biome/name.grit')],
      overrides: [
        {
          includes: ['**/*.test.*'],
          plugins: [path.join(root, 'biome/wait.grit')],
        },
      ],
    }),
  )
  fs.writeFileSync(path.join(dir, file), content)
  const result = spawnSync(biome, ['lint', '--max-diagnostics=50', file], {
    cwd: dir,
    encoding: 'utf8',
  })
  return [
    ...`${result.stdout}${result.stderr}`.matchAll(/:(\d+):\d+ plugin/g),
  ].map((match) => Number(match[1]))
}

describe('biome plugins', () => {
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
      "import { setTimeout as wait } from 'node:timers/promises'\nsetTimeout(() => {}, 10)\nawait wait(1)\n",
      [1, 2],
    ],
    [
      'setTimeout under fake timers in a test',
      'fake.test.ts',
      "import { vi } from 'vitest'\nvi.useFakeTimers()\nsetTimeout(() => {}, 10)\n",
      [],
    ],
    [
      'setTimeout under node:test context mock timers',
      'context.test.ts',
      "it('should tick', (context) => {\n  context.mock.timers.enable()\n  setTimeout(() => {}, 10)\n})\n",
      [],
    ],
    [
      'sleep and timers/promises under fake timers',
      'mixed.test.ts',
      "import { setTimeout as wait } from 'node:timers/promises'\nimport { vi } from 'vitest'\nvi.useFakeTimers()\nawait wait(1)\nawait sleep(1)\n",
      [1, 5],
    ],
    ['setTimeout outside tests', 'src.ts', 'setTimeout(() => {}, 10)\n', []],
    [
      'a wait inside a template string',
      'script.test.ts',
      'export const script = `setTimeout(() => {}, 10)`\n',
      [],
    ],
  ])('should flag the expected lines for %s', (_, file, content, lines) => {
    expect(lint(file, content)).toEqual(lines)
  })
})
