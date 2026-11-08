import fs from 'node:fs'
import { isatty } from 'node:tty'
import { CommanderError } from 'commander'
import type { Mock, MockInstance } from 'vitest'
import { createProgram, getErrorCode, run } from './cli'
import { Config, Perfekt } from './core'
import { ci } from './core/ci'
import { loadConfig } from './core/config/load'

vi.mock('node:fs', () => ({
  default: { readFileSync: vi.fn() },
}))

vi.mock('node:tty', () => ({
  isatty: vi.fn(),
}))

vi.mock('./core/config/load', () => ({
  loadConfig: vi.fn(),
}))

vi.mock('./core', () => ({
  Config: vi.fn(),
  Perfekt: vi.fn(),
}))

vi.mock('./core/ci', () => ({
  ci: vi.fn(),
}))

const readFileSyncMock = vi.mocked(fs.readFileSync)
const isattyMock = vi.mocked(isatty)
const loadConfigMock = vi.mocked(loadConfig)
const ciMock = vi.mocked(ci)
// Stand-ins for the Config and Perfekt classes, which the CLI calls with `new`.
type Constructor = new (...args: never[]) => object
const ConfigMock = Config as unknown as Mock<Constructor>
const PerfektMock = Perfekt as unknown as Mock<Constructor>

const createChangelogResult = () => ({
  write: false,
  version: '2.1.0',
  latestTag: '2.0.0',
  from: '2.0.0',
  root: false,
  commitCount: 1,
  commits: [],
  groups: [],
  markdown: '# 2.1.0',
})

const createReleaseResult = () => ({
  dryRun: false,
  requestedVersion: 'new',
  resolvedVersion: '2.1.0',
  resolvedBump: 'minor' as const,
  packageManager: 'pnpm' as const,
  currentVersion: '2.0.0',
  latestTag: '2.0.0',
  from: '2.0.0',
  files: ['package.json', 'CHANGELOG.md', 'pnpm-lock.yaml'],
  git: {
    commitMessage: 'chore(release): 2.1.0',
    tag: '2.1.0',
  },
  commitCount: 1,
  commits: [],
  groups: [],
  changelog: {
    markdown: '# 2.1.0',
  },
})

const createSetupCommitsResult = () => ({
  files: [
    { path: '.github/workflows/commitlint.yml', status: 'written' as const },
  ],
  defaultBranch: 'main',
})

const createPerfektDouble = () => ({
  init: vi.fn().mockResolvedValue('perfekt.json'),
  setupCi: vi.fn().mockResolvedValue({
    files: [{ path: '.github/workflows/ci.yml', status: 'written' as const }],
    defaultBranch: 'main',
  }),
  setupCommits: vi.fn().mockResolvedValue(createSetupCommitsResult()),
  setupHooks: vi.fn().mockReturnValue({
    files: [{ path: '.githooks/commit-msg', status: 'written' as const }],
    hooksPath: '.githooks',
    clonesNeed: undefined,
  }),
  setupLint: vi.fn().mockReturnValue({
    files: [{ path: 'biome.json', status: 'written' as const }],
    installCommand: 'pnpm install',
  }),
  setupScripts: vi.fn().mockReturnValue({
    files: [{ path: 'package.json', status: 'written' as const }],
    scripts: ['verify'],
  }),
  changelog: vi.fn().mockResolvedValue(createChangelogResult()),
  release: vi.fn().mockResolvedValue(createReleaseResult()),
})

const mockLoadedPerfekt = (instance = createPerfektDouble()) => {
  readFileSyncMock.mockReturnValue(
    JSON.stringify({ version: '3.0.0' }) as never,
  )
  loadConfigMock.mockReturnValue({ answer: 42 })
  // Vitest calls constructor mocks with `new`, so the implementations are classes.
  ConfigMock.mockImplementation(
    class {
      config: unknown
      constructor(value: unknown) {
        this.config = { normalized: value }
      }
    },
  )
  PerfektMock.mockImplementation(
    class {
      constructor() {
        Object.assign(this, instance)
      }
    },
  )

  return instance
}

const parse = (...args: string[]) =>
  createProgram(createPerfektDouble(), '3.0.0').parseAsync([
    'node',
    'perfekt',
    ...args,
  ])

const lastJson = (spy: MockInstance<typeof process.stdout.write>) =>
  JSON.parse(spy.mock.calls[spy.mock.calls.length - 1]?.[0] as string)

describe('cli', () => {
  let stdoutSpy: MockInstance<typeof process.stdout.write>
  let stderrSpy: MockInstance<typeof process.stderr.write>

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    process.exitCode = undefined
  })

  afterEach(() => {
    process.exitCode = undefined
  })

  it.each([
    [
      new CommanderError(1, 'commander.unknownCommand', 'oops'),
      'INVALID_COMMAND',
    ],
    [
      new Error('Invalid perfekt config: `groups` must be an array.'),
      'INVALID_CONFIG',
    ],
    [new Error("version doesn't look right"), 'INVALID_VERSION'],
    [new Error("version couldn't be bumped"), 'INVALID_VERSION'],
    [new Error('No unreleased commits.'), 'NO_UNRELEASED_COMMITS'],
    [
      new Error('Working tree must be clean before creating a release.'),
      'DIRTY_WORKTREE',
    ],
    [
      new Error("Couldn't determine a version bump from unreleased commits."),
      'INVALID_COMMIT_TYPES',
    ],
    [
      new Error("Couldn't get unreleased commits without an existing tag."),
      'MISSING_RELEASE_TAG',
    ],
    [new Error('wat'), 'UNKNOWN_ERROR'],
    ['plain string failure', 'UNKNOWN_ERROR'],
  ])('should map %p to %s', (error, code) => {
    expect(getErrorCode(error)).toBe(code)
  })

  describe('createProgram', () => {
    it('should suppress commander help output when top-level json mode is enabled', async () => {
      await expect(
        createProgram(createPerfektDouble(), '3.0.0', true).parseAsync([
          'node',
          'perfekt',
          '--help',
        ]),
      ).rejects.toMatchObject({
        code: 'commander.helpDisplayed',
      })

      expect(stdoutSpy).not.toHaveBeenCalled()
    })

    it('should run the init command and name the written file', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'init',
      ])

      expect(perfekt.init).toHaveBeenCalledTimes(1)
      expect(stdoutSpy).toHaveBeenCalledWith('🌱 Wrote perfekt.json\n')
    })

    it('should run every setup with a bare setup', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '4.1.0').parseAsync([
        'node',
        'perfekt',
        'setup',
        '--json',
      ])

      expect(perfekt.setupCi).toHaveBeenCalledWith({ force: false })
      expect(perfekt.setupCommits).toHaveBeenCalledWith({ force: false })
      expect(perfekt.setupCi.mock.invocationCallOrder[0]).toBeLessThan(
        perfekt.setupCommits.mock.invocationCallOrder[0] ?? 0,
      )
      expect(perfekt.setupHooks).toHaveBeenCalledWith({
        force: false,
        major: '4',
      })
      expect(perfekt.setupLint).toHaveBeenCalledWith({ force: false })
      expect(perfekt.setupScripts).toHaveBeenCalledWith({ force: false })
      expect(lastJson(stdoutSpy)).toMatchObject({
        command: 'setup',
        files: [
          { path: '.github/workflows/ci.yml', status: 'written' },
          { path: '.github/workflows/commitlint.yml', status: 'written' },
          { path: '.githooks/commit-msg', status: 'written' },
          { path: 'biome.json', status: 'written' },
          { path: 'package.json', status: 'written' },
        ],
        defaultBranch: 'main',
        hooksPath: '.githooks',
        installCommand: 'pnpm install',
        scripts: ['verify'],
      })
    })

    it('should run the setup hooks command', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '4.1.0').parseAsync([
        'node',
        'perfekt',
        'setup',
        'hooks',
      ])

      expect(perfekt.setupCommits).not.toHaveBeenCalled()
      expect(perfekt.setupHooks).toHaveBeenCalledWith({
        force: false,
        major: '4',
      })
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('.githooks/commit-msg'),
      )
    })

    it('should run the setup ci command', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'setup',
        'ci',
      ])

      expect(perfekt.setupCi).toHaveBeenCalledWith({ force: false })
      const output = stdoutSpy.mock.calls.map(([text]) => String(text)).join('')

      expect(output).toContain('🚦 CI setup')
      expect(output).toMatch(/Written:\s+\.github\/workflows\/ci\.yml/)
      expect(output).toContain('Default branch')
      expect(output).toContain('It runs on pull requests only')
    })

    it.each([
      [['.github/workflows/ci.yml'], 'pass --force to overwrite it'],
      [
        ['.github/workflows/ci.yaml'],
        '--force writes .github/workflows/ci.yml too, so CI then runs twice',
      ],
      [
        ['.github/workflows/ci.yml', '.github/workflows/ci.yaml'],
        '--force overwrites .github/workflows/ci.yml, so CI then runs twice',
      ],
    ])(
      'should say what --force does when setup ci keeps %j',
      async (paths, hint) => {
        const perfekt = createPerfektDouble()
        perfekt.setupCi.mockResolvedValue({
          files: paths.map((path) => ({ path, status: 'skipped' as const })),
          defaultBranch: 'master',
        })

        await createProgram(perfekt, '3.0.0').parseAsync([
          'node',
          'perfekt',
          'setup',
          'ci',
        ])

        expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining(hint))
      },
    )

    it('should warn that CI runs twice after --force writes next to another caller', async () => {
      const perfekt = createPerfektDouble()
      perfekt.setupCi.mockResolvedValue({
        files: [
          { path: '.github/workflows/ci.yml', status: 'written' },
          { path: '.github/workflows/ci.yaml', status: 'skipped' },
        ],
        defaultBranch: 'master',
      })

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'setup',
        'ci',
        '--force',
      ])

      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Wrote .github/workflows/ci.yml next to a workflow that already calls the shared CI',
        ),
      )
    })

    it.each([true, false])(
      'should say the PR title workflow lints edits only when editsOnly is %s',
      async (editsOnly) => {
        const perfekt = createPerfektDouble()
        perfekt.setupCommits.mockResolvedValue({
          ...createSetupCommitsResult(),
          editsOnly,
        })

        await createProgram(perfekt, '3.0.0').parseAsync([
          'node',
          'perfekt',
          'setup',
          'commits',
        ])

        const output = stdoutSpy.mock.calls
          .map(([text]) => String(text))
          .join('')
        expect(output.includes('lints title edits only')).toBe(editsOnly)
      },
    )

    it('should run the setup commits command', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'setup',
        'commits',
        '--force',
      ])

      expect(perfekt.setupCommits).toHaveBeenCalledWith({ force: true })
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('🌱 Commit linting setup'),
      )
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('.github/workflows/commitlint.yml'),
      )
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('squash-merge'),
      )
    })

    it.each([
      [
        'setup',
        ['setup', 'commits', '--json'],
        'setupCommits' as const,
        [{ force: false }],
      ],
      [
        'setup',
        ['setup', 'ci', '--force', '--json'],
        'setupCi' as const,
        [{ force: true }],
      ],
      [
        'setup',
        ['setup', 'scripts', '--force', '--json'],
        'setupScripts' as const,
        [{ force: true }],
      ],
      [
        'changelog',
        ['changelog', '--json'],
        'changelog' as const,
        [undefined, {}, 'silent'],
      ],
      [
        'release',
        ['release', 'new', '--dry-run', '--json', '--from', 'def456'],
        'release' as const,
        ['new', { dryRun: true, from: 'def456' }],
      ],
    ])('should print %s JSON', async (command, args, method, call) => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        ...args,
      ])

      expect(perfekt[method]).toHaveBeenCalledWith(...call)
      expect(lastJson(stdoutSpy)).toMatchObject({ success: true, command })
    })

    it('should print an undefined result field as null in JSON', async () => {
      const perfekt = createPerfektDouble()
      perfekt.changelog.mockResolvedValue({
        ...createChangelogResult(),
        version: undefined,
      })

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'changelog',
        '--json',
      ])

      expect(lastJson(stdoutSpy)).toHaveProperty('version', null)
    })

    it('should parse changelog options', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'changelog',
        '2.1.0',
        '--write',
        '--root',
        '--from',
        'abc123',
      ])

      expect(perfekt.changelog).toHaveBeenCalledWith(
        '2.1.0',
        { from: 'abc123', root: true, write: true },
        'default',
      )
    })

    it('should pass release options and print the release summary', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'release',
        'new',
        '--from',
        'def456',
      ])

      expect(perfekt.release).toHaveBeenCalledWith('new', { from: 'def456' })
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('📦 Release summary'),
      )
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('  Version:'),
      )
    })

    it('should print a release plan and root fallback for dry-run summaries', async () => {
      const perfekt = createPerfektDouble()

      perfekt.release.mockResolvedValueOnce({
        ...createReleaseResult(),
        dryRun: true,
        from: null,
      })

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'release',
        'new',
        '--dry-run',
      ])

      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('🧭 Release plan'),
      )
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('root'))
    })
  })

  describe('ci', () => {
    const failed = {
      success: false,
      dir: '/repo',
      steps: [
        {
          name: 'install',
          status: 'passed' as const,
          ms: 1200,
          detail: 'pnpm install',
        },
        { name: 'test', status: 'failed' as const, ms: 300, output: 'boom' },
        { name: 'build', status: 'not run' as const, ms: 0 },
      ],
      warnings: ['package.json still has a `check` script'],
    }

    it('should print the failing step output and exit 1 when CI fails', async () => {
      ciMock.mockResolvedValueOnce(failed)

      await parse('ci', '--dirty', '--base', 'main')

      expect(ciMock).toHaveBeenCalledWith({ dirty: true, base: 'main' })
      const output = stdoutSpy.mock.calls.map(([text]) => text).join('')
      expect(output).toContain('❌ CI failed')
      expect(output).toContain('✗ test    0.3s')
      expect(output).toContain('boom')
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  package.json still has a `check` script'),
      )
      expect(process.exitCode).toBe(1)
    })

    it('should print the CI result as JSON and exit 1 when CI fails', async () => {
      ciMock.mockResolvedValueOnce(failed)

      await parse('ci', '--json')

      expect(lastJson(stdoutSpy)).toEqual({ command: 'ci', ...failed })
      expect(process.exitCode).toBe(1)
    })

    it('should not set an exit code when CI passes', async () => {
      ciMock.mockResolvedValueOnce({
        success: true,
        dir: '/repo',
        steps: [{ name: 'install', status: 'passed', ms: 10 }],
        warnings: [],
      })

      await parse('ci')

      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ CI passed'),
      )
      expect(process.exitCode).toBe(undefined)
    })
  })

  describe('lint', () => {
    it.each([
      ['a valid message', ['feat: add x'], undefined, undefined],
      ['an invalid message', ['Added stuff.'], 1, 'stderr'],
      ['a warning', ['feat: added x'], undefined, 'stdout'],
    ])(
      'should lint %s and report it',
      async (_label, args, exitCode, stream) => {
        await parse('lint', ...args)

        expect(process.exitCode).toBe(exitCode)
        expect(stdoutSpy).toHaveBeenCalledTimes(stream === 'stdout' ? 1 : 0)
        expect(stderrSpy).toHaveBeenCalledTimes(stream === 'stderr' ? 1 : 0)
      },
    )

    it('should lint piped stdin without its trailing newline', async () => {
      readFileSyncMock.mockReturnValueOnce('Added stuff.\n\n')

      await parse('lint', '--json')

      expect(readFileSyncMock).toHaveBeenCalledWith(0, 'utf8')
      expect(lastJson(stdoutSpy)).toMatchObject({
        success: false,
        command: 'lint',
        input: 'Added stuff.',
        ignored: false,
      })
      expect(process.exitCode).toBe(1)
    })

    it('should lint a commit message file without git comments', async () => {
      readFileSyncMock.mockReturnValueOnce(
        'feat: add x\n\n# Please enter the commit message\n# ------------------------ >8 ------------------------\nDiff Here.',
      )

      await parse('lint', '--edit', '.git/COMMIT_EDITMSG', '--json')

      expect(readFileSyncMock).toHaveBeenCalledWith(
        '.git/COMMIT_EDITMSG',
        'utf8',
      )
      expect(lastJson(stdoutSpy)).toMatchObject({
        success: true,
        input: 'feat: add x',
      })
    })

    it.each([
      [
        'a message and --edit',
        ['feat: add x', '--edit', 'file'],
        false,
        'not both',
      ],
      ['nothing on a terminal', [], true, 'pipe the message in'],
    ])('should reject %s', async (_label, args, terminal, message) => {
      isattyMock.mockReturnValue(terminal)

      await expect(parse('lint', ...args)).rejects.toThrow(message)
      expect(readFileSyncMock).not.toHaveBeenCalled()
    })
  })

  describe('run', () => {
    it('should run successfully in normal mode', async () => {
      const perfekt = mockLoadedPerfekt()

      await run(['node', 'perfekt', 'changelog'])

      expect(perfekt.changelog).toHaveBeenCalledWith(undefined, {}, 'default')
    })

    it('should report an invalid config as an error, not a crash', async () => {
      mockLoadedPerfekt()
      ConfigMock.mockImplementation(
        class {
          constructor() {
            throw new Error('Invalid perfekt config: expected an object.')
          }
        },
      )

      await expect(
        run(['node', 'perfekt', 'changelog', '--json']),
      ).resolves.toBe(undefined)

      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('INVALID_CONFIG'),
      )
      expect(process.exitCode).toBe(1)
    })

    it('should lint without loading the config', async () => {
      mockLoadedPerfekt()
      ConfigMock.mockImplementation(
        class {
          constructor() {
            throw new Error('Invalid perfekt config: expected an object.')
          }
        },
      )

      await run(['node', 'perfekt', 'lint', 'feat: add x'])

      expect(ConfigMock).not.toHaveBeenCalled()
      expect(process.exitCode).not.toBe(1)
    })

    it.each([
      [['-v'], '3.0.0\n'],
      [['help'], expect.stringContaining('Usage: perfekt')],
    ])('should not print a failure block for %j', async (args, expected) => {
      mockLoadedPerfekt()

      await expect(run(['node', 'perfekt', ...args])).resolves.toBe(undefined)

      expect(stdoutSpy).toHaveBeenCalledWith(expected)
      expect(stderrSpy).not.toHaveBeenCalled()
      expect(process.exitCode).toBe(undefined)
    })

    it('should print help and fail without a command', async () => {
      mockLoadedPerfekt()

      await run(['node', 'perfekt'])

      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: perfekt'),
      )
      expect(process.exitCode).toBe(1)
    })

    it('should hide warnings in JSON mode and restore console.warn', async () => {
      const warnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined)
      const perfekt = mockLoadedPerfekt()

      perfekt.changelog.mockImplementation(async () => {
        console.warn('hidden warning')
        return createChangelogResult()
      })

      await run(['node', 'perfekt', 'changelog', '--json'])

      expect(warnSpy).not.toHaveBeenCalled()

      console.warn('visible warning')
      expect(warnSpy).toHaveBeenCalledWith('visible warning')
    })

    it('should print friendly commander errors in normal mode', async () => {
      mockLoadedPerfekt()

      await expect(run(['node', 'perfekt', 'wat'])).resolves.toBe(undefined)
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('⛔️ Command failed'),
      )
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining("error: unknown command 'wat'"),
      )
      expect(process.exitCode).toBe(1)
    })

    it('should print friendly non-commander errors in normal mode', async () => {
      const perfekt = mockLoadedPerfekt()

      perfekt.release.mockRejectedValueOnce(new Error('boom'))

      await expect(run(['node', 'perfekt', 'release', 'new'])).resolves.toBe(
        undefined,
      )

      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('⛔️ Release failed'),
      )
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('boom'))
      expect(process.exitCode).toBe(1)
    })

    it.each([
      [
        ['wat', '--json'],
        undefined,
        {
          command: 'unknown',
          code: 'INVALID_COMMAND',
          message: "error: unknown command 'wat'",
        },
      ],
      [
        ['release', 'new', '--json'],
        new Error("Couldn't determine a version bump from unreleased commits."),
        {
          command: 'release',
          code: 'INVALID_COMMIT_TYPES',
          message: "Couldn't determine a version bump from unreleased commits.",
        },
      ],
      [
        ['release', 'new', '--json'],
        'string failure',
        {
          command: 'release',
          code: 'UNKNOWN_ERROR',
          message: 'string failure',
        },
      ],
    ])(
      'should print a JSON error for %j',
      async (args, rejection, { command, code, message }) => {
        const perfekt = mockLoadedPerfekt()
        if (rejection) perfekt.release.mockRejectedValueOnce(rejection)

        await expect(run(['node', 'perfekt', ...args])).resolves.toBe(undefined)

        expect(lastJson(stdoutSpy)).toEqual({
          success: false,
          command,
          error: { code, message },
        })
        expect(process.exitCode).toBe(1)
      },
    )
  })
})
