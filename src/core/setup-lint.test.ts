import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import setupLint, { LINT_CONFIG } from './setup-lint'

const dirs: string[] = []

afterAll(() => {
  dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }))
})

const makeDir = (files: Record<string, string> = {}) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perfekt-lint-'))
  dirs.push(dir)
  Object.entries(files).forEach(([name, content]) =>
    fs.writeFileSync(path.join(dir, name), content),
  )
  return dir
}

const versions = { biome: '2.5.15', perfekt: '4.1.0' }

const readJson = (dir: string, file: string) =>
  JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))

describe('setupLint', () => {
  it('should write the config and add the dev dependencies and scripts', () => {
    const dir = makeDir({
      'package.json': '{"name":"app","packageManager":"pnpm@12.15.0"}',
    })

    const result = setupLint({ dir, versions })

    expect(fs.readFileSync(path.join(dir, 'biome.json'), 'utf8')).toBe(
      LINT_CONFIG,
    )
    expect(readJson(dir, 'package.json')).toEqual({
      name: 'app',
      packageManager: 'pnpm@12.15.0',
      scripts: { lint: 'biome check', format: 'biome check --write' },
      devDependencies: { '@biomejs/biome': '2.5.15', perfekt: '^4.1.0' },
    })
    expect(result).toEqual({
      files: [
        { path: 'biome.json', status: 'written' },
        { path: 'package.json', status: 'written' },
      ],
      installCommand: 'pnpm install',
    })
  })

  it('should keep the scripts and dependencies a repo already has', () => {
    const packageJson = {
      scripts: { lint: 'eslint .', format: 'prettier -w .' },
      devDependencies: { '@biomejs/biome': '2.6.0', perfekt: '4.0.0' },
    }
    const dir = makeDir({ 'package.json': JSON.stringify(packageJson) })

    const result = setupLint({ dir, versions })

    expect(readJson(dir, 'package.json')).toEqual(packageJson)
    expect(result).toEqual({
      files: [{ path: 'biome.json', status: 'written' }],
      installCommand: null,
    })
  })

  it.each(['biome.json', 'biome.jsonc'])(
    'should skip an existing %s unless force is set',
    (file) => {
      const dir = makeDir({ [file]: '{}\n' })

      expect(setupLint({ dir, versions }).files).toEqual([
        { path: file, status: 'skipped' },
      ])
      expect(fs.readFileSync(path.join(dir, file), 'utf8')).toBe('{}\n')

      setupLint({ dir, versions, force: true })

      expect(fs.readFileSync(path.join(dir, file), 'utf8')).toBe(LINT_CONFIG)
      expect(
        fs.readdirSync(dir).filter((name) => name.startsWith('biome')),
      ).toEqual([file])
    },
  )

  it('should not ship repo-only paths in the shared Biome config', () => {
    const shared = JSON.parse(
      fs.readFileSync(
        path.resolve(import.meta.dirname, '../../biome.json'),
        'utf8',
      ),
    )
    const ignores = shared.files.includes.filter((pattern: string) =>
      pattern.startsWith('!'),
    )

    expect(
      ignores.filter((pattern: string) => !pattern.startsWith('!**/')),
    ).toEqual([])
  })
})
