import fs from 'fs'
import inquirer from 'inquirer'
import Perfekt from './perfekt'
import exec, { execFile } from '~utils/misc/exec'
import { createConfig } from '~testing/fixtures'
import { resolveReadFile, resolveWriteFile } from '~testing/fs'

jest.mock('fs')
jest.mock('inquirer')
jest.mock('~utils/misc/exec', () => ({
  __esModule: true,
  default: jest.fn(),
  execFile: jest.fn()
}))

const fsMock = jest.mocked(fs)
const inquirerMock = jest.mocked(inquirer)
const execMock = jest.mocked(exec)
const execFileMock = jest.mocked(execFile)

const mockLog = [
  'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
  'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
  'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
  'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug',
  '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
  'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
  '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
].join('\n')

const existingChangelog = `# 1.2.0

## Features

- existing released feature 11111111

## Fixes

- existing released fix 22222222
`

const expectedChangelog = `# 2.2.2

## Features

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

const mockWorkspaceFiles = (
  files: string[],
  packageManager: 'pnpm' | 'npm' | 'yarn' = 'pnpm'
) => {
  fsMock.existsSync.mockImplementation(fileName =>
    files.includes(String(fileName))
  )
  fsMock.readFileSync.mockImplementation(
    () =>
      JSON.stringify({ packageManager: `${packageManager}@10.32.0` }) as never
  )
}

describe('Perfekt', () => {
  let perfekt: Perfekt

  beforeEach(() => {
    perfekt = new Perfekt(createConfig())
  })

  it('should initialize the config file selected by the user', async () => {
    inquirerMock.prompt.mockResolvedValueOnce({ configFormat: '.perfektrc' })
    fsMock.writeFile.mockImplementationOnce(resolveWriteFile())

    await perfekt.init()

    expect(inquirerMock.prompt).toHaveBeenCalledTimes(1)
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      '.perfektrc',
      '',
      'utf8',
      expect.any(Function)
    )
  })

  describe('changelog', () => {
    let stdoutSpy: jest.SpiedFunction<typeof process.stdout.write>

    beforeEach(() => {
      stdoutSpy = jest
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true)
    })

    it.each([
      ['by latest tag', {}, 'git log --format="%H %s" 2.2.2..'],
      ['from the root', { root: true }, 'git log --format="%H %s"'],
      [
        'from an explicit commit',
        { from: '4e02179c' },
        'git log --format="%H %s" 4e02179c..'
      ]
    ])(
      'should renders the changelog %s',
      async (_label, options, expectedLogCommand) => {
        execMock.mockReturnValueOnce('2.2.2')
        execMock.mockReturnValueOnce(mockLog)

        await perfekt.changelog('2.2.2', options)

        expect(execMock).toHaveBeenNthCalledWith(1, 'git tag | tail -n 1')
        expect(execMock).toHaveBeenNthCalledWith(2, expectedLogCommand)
        expect(stdoutSpy).toHaveBeenCalledTimes(1)
        expect(stdoutSpy.mock.calls[0]?.[0]).toBe(expectedChangelog)
      }
    )

    it('should return silent changelog results without a tag and serializes release groups', async () => {
      const log = [
        '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0',
        'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat!: make no-commits error more specific',
        '8c56a8d694955eb02d665f9e78a95cd076e8fcf5 Add a new feature'
      ].join('\n')

      execMock.mockReturnValueOnce(undefined)
      execMock.mockReturnValueOnce(log)

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
          {
            type: 'chore',
            scope: 'release'
          },
          {
            type: 'feat',
            isBreaking: true
          },
          {
            type: null,
            scope: null
          }
        ],
        groups: [
          {
            release: {
              message: '1.2.0',
              isRelease: true
            },
            sections: [
              {
                key: 'breaking',
                title: '## BREAKING',
                change: 'major'
              },
              {
                key: 'misc',
                title: '## Misc',
                change: null
              }
            ]
          }
        ]
      })
    })

    it('should write the changelog to disk when write is enabled', async () => {
      fsMock.existsSync.mockReturnValue(false)
      fsMock.writeFile.mockImplementationOnce(resolveWriteFile())
      execMock.mockReturnValueOnce('2.2.2')
      execMock.mockReturnValueOnce(mockLog)

      const result = await perfekt.changelog('2.2.2', { write: true }, 'silent')

      expect(fsMock.writeFile).toHaveBeenCalledWith(
        'CHANGELOG.md',
        expectedChangelog,
        'utf8',
        expect.any(Function)
      )
      expect(result.write).toBe(true)
    })
  })

  describe('release', () => {
    beforeEach(() => {
      mockWorkspaceFiles(['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml'])
      fsMock.readFile
        .mockImplementationOnce(resolveReadFile('{ "version": "1.2.0" }'))
        .mockImplementationOnce(resolveReadFile(existingChangelog))
      fsMock.writeFile.mockImplementationOnce(resolveWriteFile())
      execMock.mockReturnValue('')
      execMock.mockReturnValueOnce('1.2.0')
      execMock.mockReturnValueOnce(mockLog)
    })

    it('should write the release changelog and executes the release commands', async () => {
      const result = await perfekt.release('2.2.2', {})

      expect(execMock).toHaveBeenNthCalledWith(1, 'git tag | tail -n 1')
      expect(execMock).toHaveBeenNthCalledWith(
        2,
        'git log --format="%H %s" 1.2.0..'
      )
      expect(fsMock.writeFile.mock.calls[0]?.[1]).toMatchInlineSnapshot(`
        "# 2.2.2

        ## Features

        - add option to write to local CHANGELOG file aa805ce7
        - add execute release feature 4e02179c

        ## Fixes

        - support other conventions b2f59019
        - a bug bffc2f9e

        ## Misc

        - extract line generating logic to function and promisify exec bffc2f9e
        - add core tests b2f59019
        - update dependencies 2ea04355

        # 1.2.0

        ## Features

        - existing released feature 11111111

        ## Fixes

        - existing released fix 22222222
        "
      `)
      expect(execMock).toHaveBeenCalledWith(
        'pnpm version 2.2.2 --no-git-tag-version'
      )
      expect(execMock).toHaveBeenCalledWith(
        'git add CHANGELOG.md package.json pnpm-lock.yaml'
      )
      expect(execMock).toHaveBeenCalledWith(
        "git commit --no-verify -m 'chore(release): 2.2.2'"
      )
      expect(execFileMock).toHaveBeenCalledWith('git', [
        'tag',
        '-a',
        '2.2.2',
        '-m',
        `## Features

- add option to write to local CHANGELOG file aa805ce7
- add execute release feature 4e02179c

## Fixes

- support other conventions b2f59019
- a bug bffc2f9e

## Misc

- extract line generating logic to function and promisify exec bffc2f9e
- add core tests b2f59019
- update dependencies 2ea04355

# 1.2.0

## Features

- existing released feature 11111111

## Fixes

- existing released fix 22222222
`
      ])
      expect(result).toMatchObject({
        dryRun: false,
        requestedVersion: '2.2.2',
        resolvedVersion: '2.2.2',
        resolvedBump: null,
        packageManager: 'pnpm',
        currentVersion: '1.2.0',
        latestTag: '1.2.0',
        from: '1.2.0',
        files: ['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml'],
        git: {
          commitMessage: 'chore(release): 2.2.2',
          tag: '2.2.2'
        },
        commitCount: 7
      })
    })

    it('should use the explicit from option when generating the release changelog', async () => {
      fsMock.readFile
        .mockReset()
        .mockImplementationOnce(resolveReadFile('{ "version": "1.2.0" }'))
        .mockImplementationOnce(resolveReadFile(existingChangelog))

      await perfekt.release('2.2.2', { from: '4e02179c' })

      expect(execMock).toHaveBeenNthCalledWith(
        2,
        'git log --format="%H %s" 4e02179c..'
      )
      expect(execMock).toHaveBeenCalledWith(
        'pnpm version 2.2.2 --no-git-tag-version'
      )
    })

    it('should return a release plan without changing files or git when dryRun is enabled', async () => {
      fsMock.readFile
        .mockReset()
        .mockImplementationOnce(resolveReadFile('{ "version": "1.2.0" }'))
        .mockImplementationOnce(resolveReadFile(existingChangelog))
      fsMock.writeFile.mockClear()
      execMock.mockReset()
      jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      execMock.mockReturnValueOnce('1.2.0')
      execMock.mockReturnValueOnce(mockLog)
      execMock.mockReturnValueOnce('1.2.0')
      execMock.mockReturnValueOnce(mockLog)

      const result = await perfekt.release('new', { dryRun: true })

      expect(fsMock.writeFile).not.toHaveBeenCalled()
      expect(execMock).toHaveBeenNthCalledWith(1, 'git tag | tail -n 1')
      expect(execMock).toHaveBeenNthCalledWith(
        2,
        'git log --format="%H %s" 1.2.0..'
      )
      expect(execMock).toHaveBeenNthCalledWith(3, 'git tag | tail -n 1')
      expect(execMock).toHaveBeenNthCalledWith(
        4,
        'git log --format="%H %s" 1.2.0..'
      )
      expect(execMock).toHaveBeenCalledTimes(4)
      expect(result).toMatchObject({
        dryRun: true,
        requestedVersion: 'new',
        resolvedVersion: '1.3.0',
        resolvedBump: 'minor',
        packageManager: 'pnpm',
        currentVersion: '1.2.0',
        latestTag: '1.2.0',
        from: '1.2.0',
        files: ['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml'],
        git: {
          commitMessage: 'chore(release): 1.3.0',
          tag: '1.3.0'
        },
        commitCount: 7
      })
    })

    it('should throw before writing files when the working tree is dirty', async () => {
      fsMock.readFile
        .mockReset()
        .mockImplementationOnce(resolveReadFile('{ "version": "1.2.0" }'))
        .mockImplementationOnce(resolveReadFile(existingChangelog))
      fsMock.writeFile.mockClear()
      execMock.mockReset()
      execMock.mockReturnValueOnce('1.2.0')
      execMock.mockReturnValueOnce(mockLog)
      execMock.mockReturnValueOnce(' M README.md')

      await expect(perfekt.release('2.2.2', {})).rejects.toThrow(
        'Working tree must be clean before creating a release.'
      )

      expect(execMock).toHaveBeenNthCalledWith(3, 'git status --porcelain')
      expect(fsMock.writeFile).not.toHaveBeenCalled()
      expect(execFileMock).not.toHaveBeenCalled()
    })

    it('should allow dirty working trees during release dry runs', async () => {
      fsMock.readFile
        .mockReset()
        .mockImplementationOnce(resolveReadFile('{ "version": "1.2.0" }'))
        .mockImplementationOnce(resolveReadFile(existingChangelog))
      fsMock.writeFile.mockClear()
      execMock.mockReset()
      execMock.mockReturnValueOnce('1.2.0')
      execMock.mockReturnValueOnce(mockLog)

      await expect(
        perfekt.release('2.2.2', { dryRun: true })
      ).resolves.toBeDefined()

      expect(execMock).toHaveBeenCalledTimes(2)
      expect(fsMock.writeFile).not.toHaveBeenCalled()
      expect(execFileMock).not.toHaveBeenCalled()
    })

    it('should include npm lockfiles when releasing npm-managed projects', async () => {
      mockWorkspaceFiles(
        ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        'npm'
      )
      fsMock.readFile
        .mockReset()
        .mockImplementationOnce(resolveReadFile('{ "version": "1.2.0" }'))
        .mockImplementationOnce(resolveReadFile(existingChangelog))
      fsMock.writeFile.mockImplementationOnce(resolveWriteFile())
      execMock.mockReset()
      execMock.mockReturnValue('')
      execMock.mockReturnValueOnce('1.2.0')
      execMock.mockReturnValueOnce(mockLog)

      const result = await perfekt.release('2.2.2', {})

      expect(execMock).toHaveBeenCalledWith(
        'npm version 2.2.2 --no-git-tag-version'
      )
      expect(execMock).toHaveBeenCalledWith(
        'git add CHANGELOG.md package.json package-lock.json'
      )
      expect(execFileMock).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['tag', '-a', '2.2.2'])
      )
      expect(result.files).toEqual([
        'CHANGELOG.md',
        'package.json',
        'package-lock.json'
      ])
    })

    it('should include yarn lockfiles when releasing yarn-managed projects', async () => {
      mockWorkspaceFiles(['CHANGELOG.md', 'package.json', 'yarn.lock'], 'yarn')
      fsMock.readFile
        .mockReset()
        .mockImplementationOnce(resolveReadFile('{ "version": "1.2.0" }'))
        .mockImplementationOnce(resolveReadFile(existingChangelog))
      fsMock.writeFile.mockImplementationOnce(resolveWriteFile())
      execMock.mockReset()
      execMock.mockReturnValue('')
      execMock.mockReturnValueOnce('1.2.0')
      execMock.mockReturnValueOnce(mockLog)

      const result = await perfekt.release('2.2.2', {})

      expect(execMock).toHaveBeenCalledWith(
        'yarn version --new-version 2.2.2 --no-git-tag-version'
      )
      expect(execMock).toHaveBeenCalledWith(
        'git add CHANGELOG.md package.json yarn.lock'
      )
      expect(execFileMock).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['tag', '-a', '2.2.2'])
      )
      expect(result.files).toEqual([
        'CHANGELOG.md',
        'package.json',
        'yarn.lock'
      ])
    })
  })
})
