import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import setupScripts from './setup-scripts'

const dirs: string[] = []

afterAll(() => {
  dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }))
})

const makeDir = (files: Record<string, string> = {}) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perfekt-scripts-'))
  dirs.push(dir)
  Object.entries(files).forEach(([name, content]) =>
    fs.writeFileSync(path.join(dir, name), content),
  )
  return dir
}

const readScripts = (dir: string) =>
  JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts

const STANDARD = {
  lint: 'biome check',
  format: 'biome check --write',
  verify: 'perfekt ci',
}

describe('setupScripts', () => {
  it.each([
    ['without a tsconfig.json', {}, STANDARD],
    [
      'with a tsconfig.json',
      { 'tsconfig.json': '{}' },
      {
        lint: 'biome check',
        format: 'biome check --write',
        typecheck: 'tsc --noEmit',
        verify: 'perfekt ci',
      },
    ],
  ])('should add the standard scripts %s', (_case, files, expected) => {
    const dir = makeDir({ ...files, 'package.json': '{"name":"app"}' })

    const result = setupScripts({ dir })

    expect(readScripts(dir)).toEqual(expected)
    expect(result).toEqual({
      files: [{ path: 'package.json', status: 'written' }],
      scripts: Object.keys(expected),
    })
  })

  it('should keep existing scripts unless force is set', () => {
    const existing = {
      lint: 'eslint .',
      format: 'prettier -w .',
      verify: 'make',
      test: 'vitest',
    }
    const dir = makeDir({
      'package.json': JSON.stringify({ scripts: existing }),
    })

    expect(setupScripts({ dir })).toEqual({
      files: [{ path: 'package.json', status: 'skipped' }],
      scripts: [],
    })
    expect(readScripts(dir)).toEqual(existing)

    expect(setupScripts({ dir, force: true }).scripts).toEqual([
      'lint',
      'format',
      'verify',
    ])
    expect(readScripts(dir)).toEqual({ ...existing, ...STANDARD })
  })

  it('should skip a folder without a package.json', () => {
    const dir = makeDir()

    expect(setupScripts({ dir })).toEqual({
      files: [{ path: 'package.json', status: 'skipped' }],
      scripts: [],
    })
    expect(fs.existsSync(path.join(dir, 'package.json'))).toBe(false)
  })
})
