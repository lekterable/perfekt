import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { formatLint, lintMessage } from './lint'

// The same steps as the shared .github/workflows/ci.yml, run on this machine: install with the
// lockfile frozen (CI=true does that for pnpm and yarn, npm ci always does), lint the commits,
// then each of lint, typecheck, test and build the repo has.

const CI_SCRIPTS = ['lint', 'typecheck', 'test', 'build'] as const

export type CiStatus = 'passed' | 'failed' | 'skipped' | 'not run'

export type CiStep = {
  name: string
  status: CiStatus
  ms: number
  detail?: string
  output?: string
}

type CiOptions = {
  dirty?: boolean
  title?: string
  base?: string
}

export type CiResult = {
  success: boolean
  dir: string
  steps: CiStep[]
  /** Advice that doesn't fail CI, such as a leftover umbrella script. */
  warnings: string[]
}

export type Exec = (
  command: string,
  args: string[],
  cwd: string,
) => { status: number; output: string }

export const exec: Exec = (command, args, cwd) => {
  // CI=true is what makes pnpm and yarn refuse to touch the lockfile, as on GitHub Actions.
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true' },
    maxBuffer: 64 * 1024 * 1024,
  })

  return {
    status: result.status ?? 1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`,
  }
}

type PackageJson = {
  packageManager?: string
  scripts?: Record<string, string>
}

const readPackageJson = (dir: string): PackageJson =>
  JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))

/** The install command a CI runner would use: the packageManager field first, then the lockfile. */
export const getInstallCommand = (
  dir: string,
  packageJson: PackageJson,
): [string, string[]] => {
  const declared = packageJson.packageManager?.split('@')[0]
  const has = (file: string) => fs.existsSync(path.join(dir, file))
  const manager =
    declared ??
    (has('pnpm-lock.yaml')
      ? 'pnpm'
      : has('bun.lock') || has('bun.lockb')
        ? 'bun'
        : has('yarn.lock')
          ? 'yarn'
          : 'npm')

  if (manager === 'pnpm') return ['pnpm', ['install']]
  if (manager === 'bun') return ['bun', ['install', '--frozen-lockfile']]
  if (manager === 'yarn') {
    const classic =
      packageJson.packageManager?.startsWith('yarn@1') ?? !has('.yarnrc.yml')
    return ['yarn', ['install', classic ? '--frozen-lockfile' : '--immutable']]
  }

  return has('package-lock.json') ? ['npm', ['ci']] : ['npm', ['install']]
}

const UMBRELLA_SCRIPTS = ['check', 'validate', 'ci']

/** One warning naming the umbrella scripts `verify: perfekt ci` replaces, if any are left. */
export const getWarnings = (packageJson: PackageJson): string[] => {
  const leftover = UMBRELLA_SCRIPTS.filter(
    (name) => packageJson.scripts?.[name],
  )

  return leftover.length === 0
    ? []
    : [
        `package.json still has ${leftover.map((name) => `a \`${name}\``).join(' and ')} script: replace it with \`"verify": "perfekt ci"\` (perfekt setup scripts adds it)`,
      ]
}

export const CI_REUSABLE_WORKFLOW =
  'lekterable/perfekt/.github/workflows/ci.yml'

const WORKFLOWS_DIR = '.github/workflows'

/**
 * Jobs that call the shared CI without a `name:`. GitHub names a reusable workflow's checks
 * `<caller workflow> / <caller job> / <called job>`, and only the caller can set the middle part,
 * so a nameless caller shows its job id, as in `CI / ci / Node 26`. Reads the indentation of a
 * plain workflow file rather than parsing YAML: it only has to spot `jobs.<id>.uses` and `.name`.
 */
export const getUnnamedCiJobs = (workflow: string): string[] => {
  const lines = workflow.split('\n')
  const jobsAt = lines.findIndex((line) => /^jobs:\s*(#.*)?$/.test(line))
  if (jobsAt === -1) return []

  const body = lines.slice(jobsAt + 1)
  const end = body.findIndex((line) => /^\S/.test(line))
  const jobLines = end === -1 ? body : body.slice(0, end)
  const indent = jobLines
    .find((line) => line.trim() && !line.trim().startsWith('#'))
    ?.match(/^ */)?.[0].length

  if (!indent) return []

  const jobs = jobLines.reduce<{ id: string; lines: string[] }[]>(
    (all, line) => {
      const id = line.match(
        new RegExp(`^ {${indent}}([\\w-]+):\\s*(#.*)?$`),
      )?.[1]
      if (id) return [...all, { id, lines: [] }]
      const last = all.at(-1)
      return last
        ? [...all.slice(0, -1), { ...last, lines: [...last.lines, line] }]
        : all
    },
    [],
  )
  const key = (lines: string[], name: string) =>
    lines.find((line) => new RegExp(`^ {${indent * 2}}${name}:`).test(line))

  return jobs
    .filter(
      ({ lines }) =>
        key(lines, 'uses')?.includes(`${CI_REUSABLE_WORKFLOW}@`) &&
        !key(lines, 'name'),
    )
    .map(({ id }) => id)
}

/** One warning per caller of the shared CI whose checks would show a bare job id. */
export const getWorkflowWarnings = (root: string): string[] => {
  const dir = path.join(root, WORKFLOWS_DIR)
  const files = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((file) => /\.ya?ml$/.test(file))
        .sort()
    : []

  return files.flatMap((file) =>
    getUnnamedCiJobs(fs.readFileSync(path.join(dir, file), 'utf8')).map(
      (job) =>
        `${WORKFLOWS_DIR}/${file} calls the shared CI from job \`${job}\` with no \`name:\`, so its checks read \`… / ${job} / Node …\`: add \`name: Verify\` to that job`,
    ),
  )
}

const BASE_CANDIDATES = ['origin/main', 'origin/master', 'main', 'master']

/** The commits a pull request would add: everything since the base branch, if one is found. */
export const getBase = (
  dir: string,
  base?: string,
  run = exec,
): string | undefined => {
  if (base) return base

  const head = run(
    'git',
    ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'],
    dir,
  )
  if (head.status === 0) return head.output.trim()

  return BASE_CANDIDATES.find(
    (ref) =>
      run('git', ['rev-parse', '--verify', '--quiet', ref], dir).status === 0,
  )
}

const SEPARATOR = '\u0000'

const readCommitMessages = (dir: string, base: string, run = exec) => {
  const result = run(
    'git',
    ['log', '--no-merges', '--format=%B%x00', `${base}..HEAD`],
    dir,
  )

  if (result.status !== 0) {
    throw new Error(`Couldn't read the commits since ${base}`)
  }

  return result.output
    .split(SEPARATOR)
    .map((message) => message.trim())
    .filter(Boolean)
}

/** One report per message that breaks the shared rules. */
const lintMessages = (messages: string[]) =>
  messages.flatMap((message) => {
    const result = lintMessage(message)

    return result.valid ? [] : [formatLint(message, result)]
  })

const time = async <T>(work: () => T | Promise<T>) => {
  const start = Date.now()
  const value = await work()

  return { value, ms: Date.now() - start }
}

const tail = (output: string, lines = 60) =>
  output.trimEnd().split('\n').slice(-lines).join('\n')

/**
 * Runs the steps in order and stops at the first failure, like a CI job. A step leaves out the
 * `detail` and `output` it doesn't have, because `--json` prints a key set to undefined as null.
 */
export const runSteps = async (
  dir: string,
  options: CiOptions,
  run = exec,
): Promise<CiStep[]> => {
  const packageJson = readPackageJson(dir)
  const [installCommand, installArgs] = getInstallCommand(dir, packageJson)
  const manager = installCommand
  const steps: CiStep[] = []
  const failed = () => steps.some((step) => step.status === 'failed')

  const install = await time(() => run(installCommand, installArgs, dir))
  steps.push({
    name: 'install',
    status: install.value.status === 0 ? 'passed' : 'failed',
    ms: install.ms,
    detail: [installCommand, ...installArgs].join(' '),
    ...(install.value.status === 0
      ? {}
      : { output: tail(install.value.output) }),
  })

  const base = options.title ? undefined : getBase(dir, options.base, run)

  if (failed()) {
    steps.push({ name: 'commits', status: 'not run', ms: 0 })
  } else if (!options.title && !base) {
    steps.push({
      name: 'commits',
      status: 'skipped',
      ms: 0,
      detail: 'no base branch, pass --base',
    })
  } else {
    const commits = await time(async () => {
      try {
        const messages = base
          ? readCommitMessages(dir, base, run)
          : [options.title ?? '']

        return {
          count: messages.length,
          problems: lintMessages(messages),
        }
      } catch (error) {
        return {
          count: undefined,
          problems: [error instanceof Error ? error.message : String(error)],
        }
      }
    })
    steps.push({
      name: 'commits',
      status: commits.value.problems.length === 0 ? 'passed' : 'failed',
      ms: commits.ms,
      ...(options.title
        ? { detail: 'pull request title' }
        : commits.value.count === undefined
          ? {}
          : {
              detail: `${commits.value.count} commit${commits.value.count === 1 ? '' : 's'}`,
            }),
      ...(commits.value.problems.length === 0
        ? {}
        : { output: commits.value.problems.join('\n') }),
    })
  }

  // Scripts run one after another; once a step failed, the rest are not run.
  const scriptStep = async (
    script: string,
    done: CiStep[],
  ): Promise<CiStep> => {
    if (done.some((step) => step.status === 'failed')) {
      return { name: script, status: 'not run', ms: 0 }
    }
    if (!packageJson.scripts?.[script]) {
      return { name: script, status: 'skipped', ms: 0, detail: 'no script' }
    }
    const result = await time(() => run(manager, ['run', script], dir))
    return {
      name: script,
      status: result.value.status === 0 ? 'passed' : 'failed',
      ms: result.ms,
      ...(result.value.status === 0
        ? {}
        : { output: tail(result.value.output) }),
    }
  }

  return CI_SCRIPTS.reduce<Promise<CiStep[]>>(async (previous, script) => {
    const done = await previous
    return [...done, await scriptStep(script, done)]
  }, Promise.resolve(steps))
}

/**
 * Runs the CI steps on a clean checkout of HEAD in a temporary git worktree, so uncommitted
 * files can't make it pass, or in place with `dirty`.
 */
export const ci = async (
  options: CiOptions,
  cwd = process.cwd(),
  run = exec,
): Promise<CiResult> => {
  const root = run('git', ['rev-parse', '--show-toplevel'], cwd)
  if (root.status !== 0) throw new Error('perfekt ci runs inside a git repo')
  const repo = root.output.trim()
  const relative = path.relative(repo, cwd)

  if (options.dirty) {
    const steps = await runSteps(cwd, options, run)

    return {
      success: !steps.some((step) => step.status === 'failed'),
      dir: cwd,
      steps,
      warnings: [
        ...getWarnings(readPackageJson(cwd)),
        ...getWorkflowWarnings(repo),
      ],
    }
  }

  const worktree = fs.mkdtempSync(path.join(os.tmpdir(), 'perfekt-ci-'))
  const added = run(
    'git',
    ['worktree', 'add', '--detach', worktree, 'HEAD'],
    repo,
  )
  if (added.status !== 0) {
    fs.rmSync(worktree, { recursive: true, force: true })
    throw new Error(`Couldn't create a clean checkout: ${added.output.trim()}`)
  }

  try {
    const dir = path.join(worktree, relative)
    const steps = await runSteps(dir, options, run)

    return {
      success: !steps.some((step) => step.status === 'failed'),
      dir,
      steps,
      warnings: [
        ...getWarnings(readPackageJson(dir)),
        ...getWorkflowWarnings(worktree),
      ],
    }
  } finally {
    run('git', ['worktree', 'remove', '--force', worktree], repo)
  }
}
