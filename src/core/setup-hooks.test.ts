import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import setupHooks from './setup-hooks'

const dirs: string[] = []

afterAll(() => {
  dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }))
})

const makeRepo = (files: Record<string, string> = {}) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perfekt-hooks-'))
  dirs.push(dir)
  execFileSync('git', ['init', '-q'], { cwd: dir })
  Object.entries(files).forEach(([name, content]) => {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), content)
  })
  return dir
}

const read = (dir: string, file: string) =>
  fs.readFileSync(path.join(dir, file), 'utf8')

const hooksPath = (dir: string) =>
  execFileSync('git', ['config', 'core.hooksPath'], { cwd: dir })
    .toString()
    .trim()

describe('setupHooks', () => {
  it('should write an executable hook, set the hooks path and add a prepare script', () => {
    const dir = makeRepo({ 'package.json': '{"name":"app","scripts":{}}' })

    const result = setupHooks({ dir, major: '4' })

    expect(read(dir, '.githooks/commit-msg')).toContain(
      'npx --yes perfekt@4 lint --edit "$1"',
    )
    expect(
      fs.statSync(path.join(dir, '.githooks/commit-msg')).mode & 0o111,
    ).not.toBe(0)
    expect(hooksPath(dir)).toBe('.githooks')
    expect(JSON.parse(read(dir, 'package.json')).scripts.prepare).toBe(
      'git config core.hooksPath .githooks',
    )
    expect(result).toEqual({
      files: [
        { path: '.githooks/commit-msg', status: 'written' },
        { path: 'package.json', status: 'written' },
      ],
      hooksPath: '.githooks',
      clonesNeed: null,
    })
  })

  it('should run the installed perfekt when it is a dependency', () => {
    const dir = makeRepo({
      'package.json': '{"devDependencies":{"perfekt":"4.1.0"}}',
    })

    setupHooks({ dir, major: '4' })

    expect(read(dir, '.githooks/commit-msg')).toContain(
      'npx --no -- perfekt lint --edit "$1"',
    )
  })

  it('should keep an existing prepare script and say what other clones need', () => {
    const dir = makeRepo({
      'package.json': '{"scripts":{"prepare":"pnpm build"}}',
    })

    const result = setupHooks({ dir, major: '4' })

    expect(JSON.parse(read(dir, 'package.json')).scripts.prepare).toBe(
      'pnpm build',
    )
    expect(result.clonesNeed).toBe('git config core.hooksPath .githooks')
  })

  it('should write into .husky and leave git config alone in a husky repo', () => {
    const dir = makeRepo({ '.husky/pre-commit': 'pnpm lint\n' })

    const result = setupHooks({ dir, major: '4' })

    expect(read(dir, '.husky/commit-msg')).toContain('perfekt@4 lint')
    expect(() => hooksPath(dir)).toThrow()
    expect(result.hooksPath).toBeNull()
  })

  it('should skip an existing hook unless force is set', () => {
    const dir = makeRepo({ '.githooks/commit-msg': 'custom\n' })

    expect(setupHooks({ dir, major: '4' }).files).toEqual([
      { path: '.githooks/commit-msg', status: 'skipped' },
    ])
    expect(read(dir, '.githooks/commit-msg')).toBe('custom\n')

    setupHooks({ dir, major: '4', force: true })

    expect(read(dir, '.githooks/commit-msg')).toContain('perfekt@4 lint')
  })
})
