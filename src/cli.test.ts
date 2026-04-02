import { Command, CommanderError } from 'commander'
import { cosmiconfigSync } from 'cosmiconfig'
import fs from 'node:fs'
import { Config, Perfekt } from './core'
import {
  createPerfekt as createPerfektInstance,
  createProgram,
  getCommandName,
  getErrorCode,
  loadConfig,
  readPackageVersion,
  run
} from './cli'

jest.mock('node:fs', () => ({
  readFileSync: jest.fn()
}))

jest.mock('cosmiconfig', () => ({
  cosmiconfigSync: jest.fn()
}))

jest.mock('./core', () => ({
  Config: jest.fn(),
  Perfekt: jest.fn()
}))

const readFileSyncMock = jest.mocked(fs.readFileSync)
const cosmiconfigSyncMock = jest.mocked(cosmiconfigSync)
const ConfigMock = Config as unknown as jest.Mock
const PerfektMock = Perfekt as unknown as jest.Mock

const createChangelogResult = () => ({
  write: false,
  version: '2.1.0',
  latestTag: '2.0.0',
  from: '2.0.0',
  root: false,
  commitCount: 1,
  commits: [],
  groups: [],
  markdown: '# 2.1.0'
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
    tag: '2.1.0'
  },
  commitCount: 1,
  commits: [],
  groups: [],
  changelog: {
    markdown: '# 2.1.0'
  }
})

const createPerfektDouble = () => ({
  init: jest.fn(),
  changelog: jest.fn().mockResolvedValue(createChangelogResult()),
  release: jest.fn().mockResolvedValue(createReleaseResult())
})

const mockLoadedConfig = (config: Record<string, unknown> = { answer: 42 }) => {
  const search = jest.fn().mockReturnValue({ config })

  cosmiconfigSyncMock.mockReturnValue({ search } as never)

  return search
}

const mockLoadedPerfekt = (
  instance = createPerfektDouble(),
  overrides: Record<string, unknown> = { answer: 42 }
) => {
  readFileSyncMock.mockReturnValue(
    JSON.stringify({ version: '3.0.0' }) as never
  )
  mockLoadedConfig(overrides)
  ConfigMock.mockImplementation(value => ({ config: { normalized: value } }))
  PerfektMock.mockImplementation(() => instance)

  return instance
}

describe('cli', () => {
  let stdoutSpy: jest.SpiedFunction<typeof process.stdout.write>
  let stderrSpy: jest.SpiedFunction<typeof process.stderr.write>

  beforeEach(() => {
    jest.clearAllMocks()
    stdoutSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
    stderrSpy = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true)
    process.exitCode = undefined
  })

  afterEach(() => {
    stdoutSpy.mockRestore()
    stderrSpy.mockRestore()
    process.exitCode = undefined
  })

  describe('helpers', () => {
    it('should read the package version from package.json', () => {
      readFileSyncMock.mockReturnValue(
        JSON.stringify({ version: '3.1.4' }) as never
      )

      expect(readPackageVersion()).toBe('3.1.4')
      expect(readFileSyncMock).toHaveBeenCalledWith(
        expect.stringMatching(/package\.json$/),
        'utf8'
      )
    })

    it('should load config when present and returns undefined otherwise', () => {
      const search = jest
        .fn()
        .mockReturnValueOnce({ config: { foo: 'bar' } })
        .mockReturnValueOnce(undefined)

      cosmiconfigSyncMock.mockReturnValue({ search } as never)

      expect(loadConfig()).toEqual({ foo: 'bar' })
      expect(loadConfig()).toBe(undefined)
      expect(cosmiconfigSyncMock).toHaveBeenNthCalledWith(1, 'perfekt')
      expect(cosmiconfigSyncMock).toHaveBeenNthCalledWith(2, 'perfekt')
    })

    it('should create a perfekt instance from loaded config', () => {
      mockLoadedConfig({ foo: 'bar' })
      ConfigMock.mockImplementation(value => ({
        config: { normalized: value }
      }))

      const instance = createPerfektInstance()

      expect(ConfigMock).toHaveBeenCalledWith({ foo: 'bar' })
      expect(PerfektMock).toHaveBeenCalledWith({
        normalized: { foo: 'bar' }
      })
      expect(PerfektMock).toHaveBeenCalledTimes(1)
      expect(instance).toBeDefined()
    })

    it('should return command names for valid commands and unknown otherwise', () => {
      expect(getCommandName(['node', 'perfekt', 'release'])).toBe('release')
      expect(getCommandName(['node', 'perfekt', 'changelog'])).toBe('changelog')
      expect(getCommandName(['node', 'perfekt', 'init'])).toBe('init')
      expect(getCommandName(['node', 'perfekt', 'wat'])).toBe('unknown')
    })

    it('should use process argv when no command name args are provided', () => {
      const argv = process.argv

      process.argv = ['node', 'perfekt', 'init']

      expect(getCommandName()).toBe('init')

      process.argv = argv
    })

    it.each([
      [
        new CommanderError(1, 'commander.unknownCommand', 'oops'),
        'INVALID_COMMAND'
      ],
      [
        new Error('Invalid perfekt config: `groups` must be an array.'),
        'INVALID_CONFIG'
      ],
      [new Error("version doesn't look right"), 'INVALID_VERSION'],
      [new Error("version couldn't be bumped"), 'INVALID_VERSION'],
      [new Error('No unreleased commits.'), 'NO_UNRELEASED_COMMITS'],
      [
        new Error('Working tree must be clean before creating a release.'),
        'DIRTY_WORKTREE'
      ],
      [
        new Error("Couldn't determine a version bump from unreleased commits."),
        'INVALID_COMMIT_TYPES'
      ],
      [
        new Error("Couldn't get unreleased commits without an existing tag."),
        'MISSING_RELEASE_TAG'
      ],
      [new Error('wat'), 'UNKNOWN_ERROR'],
      ['plain string failure', 'UNKNOWN_ERROR']
    ])('should map %p to %s', (error, code) => {
      expect(getErrorCode(error)).toBe(code)
    })
  })

  describe('createProgram', () => {
    it('should configure commander output when top-level json mode is enabled', () => {
      const configureOutputSpy = jest.spyOn(
        Command.prototype,
        'configureOutput'
      )

      createProgram(createPerfektDouble(), '3.0.0', true)

      expect(configureOutputSpy).toHaveBeenCalledTimes(1)
      configureOutputSpy.mockRestore()
    })

    it('should configure commander stderr output in normal mode', () => {
      const configureOutputSpy = jest.spyOn(
        Command.prototype,
        'configureOutput'
      )

      createProgram(createPerfektDouble(), '3.0.0')

      expect(configureOutputSpy).toHaveBeenCalledWith({
        writeErr: expect.any(Function)
      })
      configureOutputSpy.mockRestore()
    })

    it('should suppress commander help output when top-level json mode is enabled', async () => {
      await expect(
        createProgram(createPerfektDouble(), '3.0.0', true).parseAsync([
          'node',
          'perfekt',
          '--help'
        ])
      ).rejects.toMatchObject({
        code: 'commander.helpDisplayed'
      })

      expect(stdoutSpy).not.toHaveBeenCalled()
    })

    it('should run the init command', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'init'
      ])

      expect(perfekt.init).toHaveBeenCalledTimes(1)
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
        'abc123'
      ])

      expect(perfekt.changelog).toHaveBeenCalledTimes(1)
      expect(perfekt.changelog).toHaveBeenCalledWith(
        '2.1.0',
        {
          from: 'abc123',
          root: true,
          write: true
        },
        'default'
      )
    })

    it('should print changelog json output', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'changelog',
        '--json'
      ])

      expect(perfekt.changelog).toHaveBeenCalledWith(undefined, {}, 'silent')
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('"command": "changelog"')
      )
    })

    it('should parse release options and prints the release summary', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'release',
        'new',
        '--from',
        'def456'
      ])

      expect(perfekt.release).toHaveBeenCalledTimes(1)
      expect(perfekt.release).toHaveBeenCalledWith('new', {
        from: 'def456'
      })
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('📦 Release summary')
      )
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('  Version:')
      )
    })

    it('should print a release plan and root fallback for dry-run summaries', async () => {
      const perfekt = createPerfektDouble()

      perfekt.release.mockResolvedValueOnce({
        ...createReleaseResult(),
        dryRun: true,
        from: null
      })

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'release',
        'new',
        '--dry-run'
      ])

      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('🧭 Release plan')
      )
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('root'))
    })

    it('should parse release dry-run json options and prints release json', async () => {
      const perfekt = createPerfektDouble()

      await createProgram(perfekt, '3.0.0').parseAsync([
        'node',
        'perfekt',
        'release',
        'new',
        '--dry-run',
        '--json',
        '--from',
        'def456'
      ])

      expect(perfekt.release).toHaveBeenCalledTimes(1)
      expect(perfekt.release).toHaveBeenCalledWith('new', {
        dryRun: true,
        from: 'def456'
      })
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('"command": "release"')
      )
    })
  })

  describe('run', () => {
    it('should run successfully in normal mode', async () => {
      const perfekt = mockLoadedPerfekt()

      await run(['node', 'perfekt', 'changelog'])

      expect(perfekt.changelog).toHaveBeenCalledWith(undefined, {}, 'default')
    })

    it('should use process argv when run is called without explicit args', async () => {
      const argv = process.argv
      const perfekt = mockLoadedPerfekt()

      process.argv = ['node', 'perfekt', 'changelog']

      await run()

      expect(perfekt.changelog).toHaveBeenCalledWith(undefined, {}, 'default')

      process.argv = argv
    })

    it('should suppress warnings in json mode and restores console.warn afterwards', async () => {
      const warnSpy = jest
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

      warnSpy.mockRestore()
    })

    it('should print friendly commander errors in normal mode', async () => {
      mockLoadedPerfekt()

      await expect(run(['node', 'perfekt', 'wat'])).resolves.toBe(undefined)
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('⛔️ Command failed')
      )
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining("error: unknown command 'wat'")
      )
      expect(process.exitCode).toBe(1)
    })

    it('should print friendly non-commander errors in normal mode', async () => {
      const perfekt = mockLoadedPerfekt()

      perfekt.release.mockRejectedValueOnce(new Error('boom'))

      await expect(run(['node', 'perfekt', 'release', 'new'])).resolves.toBe(
        undefined
      )

      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('⛔️ Release failed')
      )
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('boom'))
      expect(process.exitCode).toBe(1)
    })

    it('should print json errors for unknown commands in json mode', async () => {
      mockLoadedPerfekt()

      await expect(run(['node', 'perfekt', 'wat', '--json'])).resolves.toBe(
        undefined
      )

      const output = stdoutSpy.mock.calls[
        stdoutSpy.mock.calls.length - 1
      ]?.[0] as string

      expect(JSON.parse(output)).toEqual({
        success: false,
        command: 'unknown',
        error: {
          code: 'INVALID_COMMAND',
          message: "error: unknown command 'wat'"
        }
      })
      expect(process.exitCode).toBe(1)
    })

    it('should print mapped json errors for command failures in json mode', async () => {
      const perfekt = mockLoadedPerfekt()

      perfekt.release.mockRejectedValueOnce(
        new Error("Couldn't determine a version bump from unreleased commits.")
      )

      await expect(
        run(['node', 'perfekt', 'release', 'new', '--json'])
      ).resolves.toBe(undefined)

      const output = stdoutSpy.mock.calls[
        stdoutSpy.mock.calls.length - 1
      ]?.[0] as string

      expect(JSON.parse(output)).toEqual({
        success: false,
        command: 'release',
        error: {
          code: 'INVALID_COMMIT_TYPES',
          message: "Couldn't determine a version bump from unreleased commits."
        }
      })
      expect(process.exitCode).toBe(1)
    })

    it('should print string failures in json mode', async () => {
      const perfekt = mockLoadedPerfekt()

      perfekt.release.mockRejectedValueOnce('string failure')

      await expect(
        run(['node', 'perfekt', 'release', 'new', '--json'])
      ).resolves.toBe(undefined)

      const output = stdoutSpy.mock.calls[
        stdoutSpy.mock.calls.length - 1
      ]?.[0] as string

      expect(JSON.parse(output)).toEqual({
        success: false,
        command: 'release',
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'string failure'
        }
      })
      expect(process.exitCode).toBe(1)
    })
  })
})
