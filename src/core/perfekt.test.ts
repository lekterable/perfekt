import fs from 'node:fs'
import type { MockInstance } from 'vitest'
import { createConfig } from '~testing/fixtures'
import { resolveReadFile, resolveWriteFile } from '~testing/fs'
import exec, { execFile } from '~utils/misc/exec'
import Perfekt from './perfekt'

vi.mock('node:fs')
vi.mock('~utils/misc/exec')

const fsMock = vi.mocked(fs)
const execMock = vi.mocked(exec)
const execFileMock = vi.mocked(execFile)

const mockLog = [
  'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
  'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
  'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
  'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug',
  '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
  'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
  '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies',
].join('\n')

const existingChangelog = `# 1.2.0

## Features

- existing released feature 11111111

## Fixes

- existing released fix 22222222
`

const releaseNotes = `## Features

- add option to write to local CHANGELOG file aa805ce7
- add execute release feature 4e02179c

## Fixes

- support other conventions b2f59019
- a bug bffc2f9e

## Misc

- extract line generating logic to function and promisify exec bffc2f9e
- add core tests b2f59019
- update dependencies 2ea04355
`

const expectedChangelog = `# 2.2.2\n\n${releaseNotes}`

// git describe twice (latestTag, then latestRelease), the release commit lookup, then the log.
const mockGitLog = (tag: string | undefined = '2.2.2') =>
  execMock
    .mockReturnValueOnce(tag)
    .mockReturnValueOnce(tag)
    .mockReturnValueOnce(undefined)
    .mockReturnValueOnce(mockLog)

const mockWorkspace = (
  files: string[],
  packageManager: 'pnpm' | 'npm' | 'yarn' = 'pnpm',
) => {
  fsMock.existsSync.mockImplementation((fileName) =>
    files.includes(String(fileName)),
  )
  fsMock.readFileSync.mockImplementation(
    () =>
      JSON.stringify({ packageManager: `${packageManager}@10.32.0` }) as never,
  )
  fsMock.readFile
    .mockImplementationOnce(resolveReadFile('{ "version": "1.2.0" }'))
    .mockImplementationOnce(resolveReadFile(existingChangelog))
  fsMock.writeFile.mockImplementation(resolveWriteFile())
  execMock.mockReturnValue('')
}

describe('Perfekt', () => {
  let perfekt: Perfekt

  beforeEach(() => {
    perfekt = new Perfekt(createConfig())
  })

  describe('changelog', () => {
    let stdoutSpy: MockInstance<typeof process.stdout.write>

    beforeEach(() => {
      stdoutSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true)
    })

    it.each([
      ['by latest tag', {}, 'git log --format="%H %s" 2.2.2..'],
      ['from the root', { root: true }, 'git log --format="%H %s"'],
      [
        'from an explicit commit',
        { from: '4e02179c' },
        'git log --format="%H %s" 4e02179c..',
      ],
    ])(
      'should render the changelog %s',
      async (_label, options, expectedLogCommand) => {
        mockGitLog()

        await perfekt.changelog('2.2.2', options)

        expect(execMock).toHaveBeenCalledWith(expectedLogCommand)
        expect(stdoutSpy).toHaveBeenCalledTimes(1)
        expect(stdoutSpy).toHaveBeenCalledWith(expectedChangelog)
      },
    )

    it('should return silent changelog results without a tag and serialize release groups', async () => {
      execMock
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(
          [
            '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0',
            'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat!: make no-commits error more specific',
            '8c56a8d694955eb02d665f9e78a95cd076e8fcf5 Add a new feature',
          ].join('\n'),
        )

      const result = await perfekt.changelog(undefined, {}, 'silent')

      expect(stdoutSpy).not.toHaveBeenCalled()
      expect(result).toMatchObject({
        version: null,
        latestTag: null,
        from: null,
        root: false,
        write: false,
        commitCount: 3,
        commits: [
          { type: 'chore', scope: 'release' },
          { type: 'feat', isBreaking: true },
          { type: null, scope: null },
        ],
        groups: [
          {
            release: { message: '1.2.0', isRelease: true },
            sections: [
              { key: 'breaking', title: '## BREAKING', change: 'major' },
              { key: 'misc', title: '## Misc', change: null },
            ],
          },
        ],
      })
    })

    it('should use the latest release commit as the changelog boundary when a newer tag is missing', async () => {
      fsMock.existsSync.mockReturnValueOnce(true)
      fsMock.readFile.mockImplementationOnce(
        resolveReadFile(`# 1.1.0

## Features

- add source removal command and polish test structure 87857821

# 1.0.0

## Features

- init :seedling: afdc5f4f
`),
      )
      execMock
        .mockReturnValueOnce('1.0.0')
        .mockReturnValueOnce('1.0.0')
        .mockReturnValueOnce(
          '60a2d0a9b503d6c8bd0209ac4971dae463c67b34 chore(release): 1.1.0',
        )
        .mockReturnValueOnce('6b83b6ab0f7d6e2bdf4f1794dc3d3e2df59a7d45')
        .mockReturnValueOnce('true')
        .mockReturnValueOnce(
          [
            '29d6eb7f00000000000000000000000000000000 chore: add release script',
            '0408144700000000000000000000000000000000 feat(cli): show last sync dates in project list',
          ].join('\n'),
        )

      await perfekt.changelog('1.2.0', {})

      expect(stdoutSpy).toHaveBeenCalledWith(`# 1.2.0

## Features

- show last sync dates in project list 04081447

## Misc

- add release script 29d6eb7f

# 1.1.0

## Features

- add source removal command and polish test structure 87857821

# 1.0.0

## Features

- init :seedling: afdc5f4f
`)
    })

    it('should write the changelog to disk when write is enabled', async () => {
      fsMock.existsSync.mockReturnValue(false)
      fsMock.writeFile.mockImplementationOnce(resolveWriteFile())
      mockGitLog()

      const result = await perfekt.changelog('2.2.2', { write: true }, 'silent')

      expect(fsMock.writeFile).toHaveBeenCalledWith(
        'CHANGELOG.md',
        expectedChangelog,
        'utf8',
        expect.any(Function),
      )
      expect(result.write).toBe(true)
    })
  })

  describe('release', () => {
    beforeEach(() => {
      mockWorkspace(['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml'])
    })

    it('should prepend the release to the changelog and tag it with the release notes', async () => {
      mockGitLog('1.2.0')

      const result = await perfekt.release('2.2.2', {})

      expect(execMock).toHaveBeenCalledWith('git log --format="%H %s" 1.2.0..')
      expect(fsMock.writeFile.mock.calls[0]?.[1]).toBe(
        `${expectedChangelog}\n${existingChangelog}`,
      )
      expect(execMock).toHaveBeenCalledWith(
        "git commit --no-verify -m 'chore(release): 2.2.2'",
      )
      expect(execFileMock).toHaveBeenCalledWith('git', [
        'tag',
        '-a',
        '2.2.2',
        '-m',
        releaseNotes,
      ])
      expect(result).toMatchObject({
        dryRun: false,
        requestedVersion: '2.2.2',
        resolvedVersion: '2.2.2',
        resolvedBump: null,
        currentVersion: '1.2.0',
        latestTag: '1.2.0',
        from: '1.2.0',
        git: { commitMessage: 'chore(release): 2.2.2', tag: '2.2.2' },
        commitCount: 7,
      })
    })

    it.each([
      [
        'pnpm' as const,
        'pnpm-lock.yaml',
        'pnpm version 2.2.2 --no-git-tag-version --no-git-checks',
      ],
      [
        'npm' as const,
        'package-lock.json',
        'npm version 2.2.2 --no-git-tag-version',
      ],
      [
        'yarn' as const,
        'yarn.lock',
        'yarn version --new-version 2.2.2 --no-git-tag-version',
      ],
    ])(
      'should bump and commit the %s lockfile',
      async (manager, lockfile, versionCommand) => {
        fsMock.readFile.mockReset()
        mockWorkspace(['CHANGELOG.md', 'package.json', lockfile], manager)
        mockGitLog('1.2.0')

        const result = await perfekt.release('2.2.2', {})

        expect(execMock).toHaveBeenCalledWith(versionCommand)
        expect(execMock).toHaveBeenCalledWith(
          `git add CHANGELOG.md package.json ${lockfile}`,
        )
        expect(result.packageManager).toBe(manager)
        expect(result.files).toEqual(['CHANGELOG.md', 'package.json', lockfile])
      },
    )

    it('should use the explicit from option when generating the release changelog', async () => {
      mockGitLog('1.2.0')

      await perfekt.release('2.2.2', { from: '4e02179c' })

      expect(execMock).toHaveBeenCalledWith(
        'git log --format="%H %s" 4e02179c..',
      )
    })

    it('should return a release plan without changing files or git when dryRun is enabled', async () => {
      execMock
        .mockReturnValueOnce('1.2.0')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(mockLog)
      mockGitLog('1.2.0')
      // A dirty tree must not matter for a plan.
      execMock.mockReturnValue(' M README.md')

      const result = await perfekt.release('new', { dryRun: true })

      expect(fsMock.writeFile).not.toHaveBeenCalled()
      expect(execFileMock).not.toHaveBeenCalled()
      expect(
        execMock.mock.calls.filter(([command]) =>
          /^git (add|commit|status)|version/.test(command),
        ),
      ).toEqual([])
      expect(result).toMatchObject({
        dryRun: true,
        requestedVersion: 'new',
        resolvedVersion: '1.3.0',
        resolvedBump: 'minor',
        packageManager: 'pnpm',
        currentVersion: '1.2.0',
        files: ['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml'],
        git: { commitMessage: 'chore(release): 1.3.0', tag: '1.3.0' },
        commitCount: 7,
      })
    })

    it('should throw before writing files when the working tree is dirty', async () => {
      mockGitLog('1.2.0')
      execMock.mockReturnValueOnce(' M README.md')

      await expect(perfekt.release('2.2.2', {})).rejects.toThrow(
        'Working tree must be clean before creating a release.',
      )

      expect(fsMock.writeFile).not.toHaveBeenCalled()
      expect(execFileMock).not.toHaveBeenCalled()
    })
  })
})
