import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ci, type Exec, exec, getBase, getInstallCommand, runSteps } from './ci'

const dirs: string[] = []

afterAll(() => {
  dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }))
})

const makeDir = (files: Record<string, string>) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perfekt-ci-test-'))
  dirs.push(dir)
  Object.entries(files).forEach(([name, content]) =>
    fs.writeFileSync(path.join(dir, name), content),
  )
  return dir
}

const git = (dir: string, ...args: string[]) =>
  execFileSync(
    'git',
    [
      '-c',
      'user.email=t@t',
      '-c',
      'user.name=t',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { cwd: dir, encoding: 'utf8' },
  )

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
  it.each([
    [{ 'package.json': '{"packageManager":"pnpm@12.15.0"}' }, 'pnpm install'],
    [{ 'package.json': '{}', 'bun.lock': '' }, 'bun install --frozen-lockfile'],
    [
      { 'package.json': '{}', 'bun.lockb': '' },
      'bun install --frozen-lockfile',
    ],
    [
      { 'package.json': '{}', 'yarn.lock': '' },
      'yarn install --frozen-lockfile',
    ],
    [
      { 'package.json': '{}', 'yarn.lock': '', '.yarnrc.yml': '' },
      'yarn install --immutable',
    ],
    [
      { 'package.json': '{"packageManager":"yarn@4.5.0"}' },
      'yarn install --immutable',
    ],
    [{ 'package.json': '{}', 'package-lock.json': '{}' }, 'npm ci'],
    [{ 'package.json': '{}' }, 'npm install'],
  ])('should install %j with %s like CI would', (files, expected) => {
    const dir = makeDir(files)
    const packageJson = JSON.parse(files['package.json'])

    expect(getInstallCommand(dir, packageJson).flat().join(' ')).toBe(expected)
  })

  it('should run commands with CI=true so lockfiles stay frozen', () => {
    expect(
      exec(
        process.execPath,
        ['-e', 'process.stdout.write(process.env.CI)'],
        '.',
      ).output,
    ).toBe('true')
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

  it('should run nothing after a failed install', async () => {
    const dir = makeDir({
      'package.json': JSON.stringify({ scripts: { test: 'jest' } }),
    })
    const { calls, run } = recorder(['npm install'])

    const steps = await runSteps(dir, { title: 'feat: add ci' }, run)

    expect(steps.map((step) => step.status)).toEqual([
      'failed',
      'not run',
      'not run',
      'not run',
      'not run',
      'not run',
    ])
    expect(calls).toEqual(['npm install'])
  })

  it('should fall back to a local base branch and skip without one', async () => {
    const dir = makeDir({ 'package.json': '{}' })
    git(dir, 'init', '--quiet', '--initial-branch=main')

    const steps = await runSteps(dir, {}, recorder().run)
    expect(steps[1]).toMatchObject({ name: 'commits', status: 'skipped' })

    git(dir, 'commit', '--quiet', '--allow-empty', '-m', 'feat: init')
    expect(getBase(dir)).toBe('main')
  })

  it.each([
    [{ title: 'Added CI.' }, 'subject may not end with full stop'],
    [{ base: 'nope' }, "Couldn't read the commits since nope"],
  ])('should fail the commits step for %j', async (options, problem) => {
    const dir = makeDir({ 'package.json': '{}' })
    git(dir, 'init', '--quiet')

    const steps = await runSteps(dir, options, recorder().run)

    expect(steps[1]).toMatchObject({ name: 'commits', status: 'failed' })
    expect(steps[1].output).toContain(problem)
    expect(steps[2].status).toBe('not run')
  })

  it('should not let uncommitted changes pass unless dirty', async () => {
    const dir = makeDir({ 'package.json': '{}' })
    git(dir, 'init', '--quiet', '--initial-branch=master')
    git(
      dir,
      'commit',
      '--quiet',
      '--allow-empty',
      '-m',
      'feat: init :seedling:',
    )
    git(dir, 'add', 'package.json')
    git(dir, 'commit', '--quiet', '-m', 'feat: add package')
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
    expect(git(dir, 'worktree', 'list').trim().split('\n')).toHaveLength(1)
  })

  it('should remove the temporary folder when the clean checkout fails', async () => {
    const mkdtempSpy = jest.spyOn(fs, 'mkdtempSync')
    const run: Exec = (_command, args) =>
      args[0] === 'worktree'
        ? { status: 128, output: 'fatal: invalid reference: HEAD' }
        : { status: 0, output: os.tmpdir() }

    await expect(ci({}, os.tmpdir(), run)).rejects.toThrow(
      "Couldn't create a clean checkout",
    )

    const worktree = mkdtempSpy.mock.results[0]?.value as string
    expect(worktree).toContain('perfekt-ci-')
    expect(fs.existsSync(worktree)).toBe(false)
  })
})
