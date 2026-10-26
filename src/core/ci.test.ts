import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ci, type Exec, exec, getBase, getInstallCommand, runSteps } from './ci'

const dirs: string[] = []

afterAll(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true })
})

const makeDir = (files: Record<string, string>) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perfekt-ci-test-'))
  dirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content)
  }
  return dir
}

// Real git, recorded package-manager calls that pass unless told to fail.
const recorder = (failing: string[] = []) => {
  const calls: string[] = []
  const run: Exec = (command, args, cwd) => {
    if (command === 'git') return exec(command, args, cwd)
    const call = [command, ...args].join(' ')
    calls.push(call)
    return { status: failing.includes(call) ? 1 : 0, output: `${call} output` }
  }
  return { calls, run }
}

describe('ci', () => {
  it('should pick the install command CI would use', () => {
    const cases: [Record<string, string>, string][] = [
      [{ 'package.json': '{"packageManager":"pnpm@12.15.0"}' }, 'pnpm install'],
      [
        { 'package.json': '{}', 'bun.lock': '' },
        'bun install --frozen-lockfile',
      ],
      [
        { 'package.json': '{}', 'yarn.lock': '' },
        'yarn install --frozen-lockfile',
      ],
      [
        { 'package.json': '{"packageManager":"yarn@4.5.0"}' },
        'yarn install --immutable',
      ],
      [{ 'package.json': '{}', 'package-lock.json': '{}' }, 'npm ci'],
      [{ 'package.json': '{}' }, 'npm install'],
    ]
    for (const [files, expected] of cases) {
      const dir = makeDir(files)
      const packageJson = JSON.parse(files['package.json'])
      expect(getInstallCommand(dir, packageJson).flat().join(' ')).toBe(
        expected,
      )
    }
  })

  it('should skip missing scripts and stop at the first failure', async () => {
    const dir = makeDir({
      'package.json': JSON.stringify({
        packageManager: 'pnpm@12.15.0',
        scripts: { lint: 'biome check', test: 'jest', build: 'tsdown' },
      }),
    })
    const { calls, run } = recorder(['pnpm run test'])

    const steps = await runSteps(dir, { title: 'feat: add ci' }, run)

    expect(steps.map((step) => [step.name, step.status])).toEqual([
      ['install', 'passed'],
      ['commits', 'passed'],
      ['lint', 'passed'],
      ['typecheck', 'skipped'],
      ['test', 'failed'],
      ['build', 'not run'],
    ])
    expect(steps[4].output).toBe('pnpm run test output')
    expect(calls).toEqual(['pnpm install', 'pnpm run lint', 'pnpm run test'])
  })

  it('should fall back to a local base branch and skip without one', async () => {
    const dir = makeDir({ 'package.json': '{}' })
    execFileSync('git', ['init', '--quiet', '--initial-branch=main'], {
      cwd: dir,
    })

    const steps = await runSteps(dir, {}, recorder().run)
    expect(steps[1]).toMatchObject({ name: 'commits', status: 'skipped' })

    execFileSync(
      'git',
      [
        '-c',
        'user.email=t@t',
        '-c',
        'user.name=t',
        'commit',
        '--quiet',
        '--allow-empty',
        '-m',
        'feat: init',
      ],
      { cwd: dir },
    )
    expect(getBase(dir)).toBe('main')
  })

  it('should fail a title that breaks the shared commit rules', async () => {
    const dir = makeDir({ 'package.json': '{}' })
    const steps = await runSteps(dir, { title: 'Added CI.' }, recorder().run)

    expect(steps[1]).toMatchObject({ name: 'commits', status: 'failed' })
    expect(steps[2].status).toBe('not run')
  })

  it('should not let uncommitted changes pass unless dirty', async () => {
    const dir = makeDir({ 'package.json': '{}' })
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: dir, encoding: 'utf8' })
    git('init', '--quiet', '--initial-branch=master')
    git(
      '-c',
      'user.email=t@t',
      '-c',
      'user.name=t',
      'commit',
      '--quiet',
      '--allow-empty',
      '-m',
      'feat: init :seedling:',
    )
    git('add', 'package.json')
    git(
      '-c',
      'user.email=t@t',
      '-c',
      'user.name=t',
      'commit',
      '--quiet',
      '-m',
      'feat: add package',
    )
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ scripts: { test: 'jest' } }),
    )

    const clean = await ci({ base: 'HEAD~1' }, dir, recorder().run)
    const dirty = await ci({ base: 'HEAD~1', dirty: true }, dir, recorder().run)

    expect(clean.steps.find((step) => step.name === 'test')?.status).toBe(
      'skipped',
    )
    expect(dirty.steps.find((step) => step.name === 'test')?.status).toBe(
      'passed',
    )
    expect(clean.steps.find((step) => step.name === 'commits')).toMatchObject({
      status: 'passed',
      detail: '1 commit',
    })
    expect(git('worktree', 'list').trim().split('\n')).toHaveLength(1)
  })
})
