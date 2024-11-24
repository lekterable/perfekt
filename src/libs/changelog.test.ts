import fs from 'fs'
import * as generateChangelog from '../utils/changelog/generate-changelog'
import * as writeFile from '../utils/misc/write-file'
import * as readFile from '../utils/misc/read-file'
import * as fileExists from '../utils/misc/file-exists'
import * as printOutput from '../utils/misc/print-output'
import * as createReleasedFilter from '../utils/changelog/create-released-filter'
import Git from './git'
import Config from '../config'
import Commit from './commit'
import Changelog from './changelog'

jest.mock('fs')

const fsMock = jest.mocked(fs)

const mockVersion = '2.2.3'
const CHANGELOG = 'CHANGELOG.md'

const mockGrouped = [
  {
    feat: [
      new Commit(
        'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences'
      ),
      new Commit(
        'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat: make no-commits error more specific'
      ),
      new Commit(
        '17feea4af5e339532d680a6ef6e9ec331f8abd2e feat: add release version bumping'
      )
    ],
    fix: [
      new Commit(
        '5fa8e6c9996444fa0d17493cf1e379a696682696 fix: throw error if there are no commits'
      )
    ],
    misc: [
      new Commit(
        'ee24740b920b22e916ca5ab0449abb08e99143c4 ci: setup CI with GitHub Actions'
      ),
      new Commit(
        '1a0b3f3e91a9a71bf52882b75c7306046db13c8e refactor: rename function and format tests'
      )
    ]
  },
  {
    feat: [
      new Commit(
        '6b05a3b8430eb18af4c2d9fa67addc78c7357cfb feat: make breaking and misc headers configurable'
      ),
      new Commit(
        '86aa5dc18c363514e518b16b6eeb0bb2c5d94617 feat: add release `new` keyword'
      ),
      new Commit(
        'd34a9f12500df6ea21a17b85b783a41b1fca5347 feat: make changelog ignored scopes configurable'
      )
    ],
    fix: [
      new Commit(
        '5fa8e6c9996444fa0d17493cf1e379a696682696 fix: throw error if there are no commits'
      ),
      new Commit(
        '4d95659f302e0fe968154e17214876849172509f fix: check if changelog exists before accessing'
      )
    ],
    misc: [
      new Commit(
        '8f622021665bc6076d00fde6527800980eba836a chore: include commit links in the changelog'
      )
    ],
    release: new Commit(
      '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0'
    )
  }
]

const generateMockUnreleased = (title = 'Latest') =>
  `# ${title}\n\n## Features\n\n- replace all placeholder occurrences d0e72481\n- make no-commits error more specific a357a61a\n- add release version bumping 17feea4a\n\n## Fixes\n\n- throw error if there are no commits 5fa8e6c9\n\n## Misc\n\n- setup CI with GitHub Actions ee24740b\n- rename function and format tests 1a0b3f3e\n`

const generateMockReleased = (version = '1.0.0') =>
  `# ${version}\n\n## Features\n\n- make breaking and misc headers configurable 6b05a3b8\n- add release \`new\` keyword 86aa5dc1\n- make changelog ignored scopes configurable d34a9f12\n\n## Fixes\n\n- throw error if there are no commits 5fa8e6c9\n- check if changelog exists before accessing 4d95659f\n\n## Misc\n\n- include commit links in the changelog 8f622021\n`

const generateMockChangelog = (
  version: string = '1.0.0',
  unreleasedVersion?: string
) =>
  unreleasedVersion
    ? generateMockUnreleased(unreleasedVersion) +
      '\n' +
      generateMockReleased(version)
    : generateMockReleased(version)

describe('Changelog', () => {
  const { config } = new Config()
  const changelog = new Changelog(config)

  let latestTagSpy: jest.SpyInstance<typeof Git.prototype.latestTag>
  let hasChangelogSpy: jest.SpyInstance<typeof Changelog.prototype.hasChangelog>
  let stdoutSpy: jest.SpiedFunction<typeof process.stdout.write>

  beforeEach(() => {
    changelog.options = {}

    latestTagSpy = jest.spyOn(Git.prototype, 'latestTag', 'get')
    hasChangelogSpy = jest.spyOn(Changelog.prototype, 'hasChangelog', 'get')
    stdoutSpy = jest.spyOn(process.stdout, 'write')
  })

  describe('get hasChangelog', () => {
    let fileExistsSpy: jest.SpiedFunction<typeof fileExists.default>

    beforeEach(() => {
      fileExistsSpy = jest.spyOn(fileExists, 'default')
    })

    it('should return `false` if CHANGELOG.md does not exist', async () => {
      fsMock.existsSync.mockReturnValueOnce(false)

      const hasChangelog = changelog.hasChangelog

      expect(fileExistsSpy).toBeCalledTimes(1)
      expect(fileExistsSpy).toBeCalledWith(CHANGELOG)
      expect(hasChangelog).toBe(false)
    })

    it('should return `true` if CHANGELOG.md exists', async () => {
      fsMock.existsSync.mockReturnValueOnce(true)

      const hasChangelog = changelog.hasChangelog

      expect(fileExistsSpy).toBeCalledTimes(1)
      expect(fileExistsSpy).toBeCalledWith(CHANGELOG)
      expect(hasChangelog).toBe(true)
    })
  })

  describe('getChangelog', () => {
    let readFileSpy: jest.SpiedFunction<typeof readFile.default>

    beforeEach(() => {
      readFileSpy = jest.spyOn(readFile, 'default')
    })

    it('should reject if receives an error', () => {
      const mockError = 'error'
      // @ts-expect-error -- Make type-safe later
      fsMock.readFile.mockImplementationOnce((_, __, cb) => cb(mockError))

      expect(changelog.getChangelog()).rejects.toMatch(mockError)
      expect(readFileSpy).toBeCalledTimes(1)
      expect(readFileSpy).toBeCalledWith('CHANGELOG.md')
    })

    it('should return the changelog file', async () => {
      const file = 'file'
      // @ts-expect-error -- Make type-safe later
      fsMock.readFile.mockImplementationOnce((_, __, cb) => cb(undefined, file))

      expect(await changelog.getChangelog()).toMatchInlineSnapshot(`"file"`)
      expect(readFileSpy).toBeCalledTimes(1)
      expect(readFileSpy).toBeCalledWith('CHANGELOG.md')
    })
  })

  describe('getHistory', () => {
    let getChangelogSpy: jest.SpiedFunction<
      typeof Changelog.prototype.getChangelog
    >
    let createReleasedFilterSpy: jest.SpiedFunction<
      typeof createReleasedFilter.default
    >

    beforeEach(() => {
      getChangelogSpy = jest.spyOn(Changelog.prototype, 'getChangelog')
      createReleasedFilterSpy = jest.spyOn(createReleasedFilter, 'default')
    })

    it('should not get history if there is no existing CHANGELOG', async () => {
      hasChangelogSpy.mockReturnValueOnce(false)

      const history = await changelog.getHistory(mockVersion)

      expect(getChangelogSpy).not.toBeCalled()
      expect(createReleasedFilterSpy).not.toBeCalled()
      expect(history).toEqual(undefined)
    })

    it('should not get history with `--from` option', async () => {
      const options = { from: '4e02179c' }

      hasChangelogSpy.mockReturnValueOnce(true)

      changelog.options = options
      const history = await changelog.getHistory(mockVersion)

      expect(getChangelogSpy).not.toBeCalled()
      expect(createReleasedFilterSpy).not.toBeCalled()
      expect(history).toEqual(undefined)
    })

    it('should not get history with `--root` option', async () => {
      const options = { root: true }

      hasChangelogSpy.mockReturnValueOnce(true)

      changelog.options = options
      const history = await changelog.getHistory(mockVersion)

      expect(getChangelogSpy).not.toBeCalled()
      expect(createReleasedFilterSpy).not.toBeCalled()
      expect(history).toEqual(undefined)
    })

    it('should throw if there is no history', () => {
      hasChangelogSpy.mockReturnValueOnce(true)
      const mockChangelog = ''
      // @ts-expect-error -- Make type-safe later
      fsMock.readFile.mockImplementationOnce((_, __, cb) =>
        cb(undefined, mockChangelog)
      )

      expect(
        changelog.getHistory(mockVersion)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"CHANGELOG doesn't contain any history."`
      )
    })

    it('should get history', async () => {
      hasChangelogSpy.mockReturnValue(true)
      const mockChangelog = generateMockChangelog(mockVersion)
      // @ts-expect-error -- Make type-safe later
      fsMock.readFile.mockImplementationOnce((_, __, cb) =>
        cb(undefined, mockChangelog)
      )
      const mockReleased = generateMockReleased(mockVersion)

      const history = await changelog.getHistory(mockVersion)

      expect(getChangelogSpy).toBeCalledTimes(1)
      expect(createReleasedFilterSpy).toBeCalledTimes(1)
      expect(createReleasedFilterSpy).toBeCalledWith(mockVersion, config)
      expect(history).toEqual(mockReleased)
    })
  })

  describe('generate', () => {
    let generateChangelogSpy: jest.SpiedFunction<
      typeof generateChangelog.default
    >

    beforeEach(() => {
      generateChangelogSpy = jest.spyOn(generateChangelog, 'default')
    })

    it('should generate changelog', () => {
      const result = changelog.generate(mockGrouped, mockVersion)

      expect(generateChangelogSpy).toBeCalledTimes(1)
      expect(generateChangelogSpy).toBeCalledWith(
        mockGrouped,
        mockVersion,
        config
      )
      expect(result).toMatchSnapshot()
    })
  })

  describe('save', () => {
    let writeFileSpy: jest.SpiedFunction<typeof writeFile.default>

    beforeEach(() => {
      writeFileSpy = jest.spyOn(writeFile, 'default')
    })

    it('should save changelog', () => {
      const mockChangelog = generateMockChangelog(mockVersion)

      writeFileSpy.mockResolvedValueOnce()

      changelog.save(mockChangelog)

      expect(writeFileSpy).toBeCalledTimes(1)
      expect(writeFileSpy).toBeCalledWith(CHANGELOG, mockChangelog)
    })
  })

  describe('print', () => {
    let printOutputSpy: jest.SpiedFunction<typeof printOutput.default>

    beforeEach(() => {
      printOutputSpy = jest.spyOn(printOutput, 'default')
    })

    it('should print changelog', () => {
      const mockChangelog = generateMockChangelog(mockVersion)

      stdoutSpy.mockImplementation()

      changelog.print(mockChangelog)

      expect(printOutputSpy).toBeCalledTimes(1)
      expect(printOutputSpy).toBeCalledWith(mockChangelog)
    })
  })

  describe('finish', () => {
    let generateSpy: jest.SpiedFunction<typeof Changelog.prototype.generate>
    let getHistorySpy: jest.SpiedFunction<typeof Changelog.prototype.getHistory>
    let printSpy: jest.SpiedFunction<typeof Changelog.prototype.print>
    let saveSpy: jest.SpiedFunction<typeof Changelog.prototype.save>

    beforeEach(() => {
      generateSpy = jest.spyOn(Changelog.prototype, 'generate')
      getHistorySpy = jest.spyOn(Changelog.prototype, 'getHistory')
      printSpy = jest.spyOn(Changelog.prototype, 'print')
      saveSpy = jest.spyOn(Changelog.prototype, 'save')
    })

    it('should print to output', async () => {
      const mockVersion = undefined
      const mockReleased = ''
      const mockUnreleased = generateMockUnreleased()
      hasChangelogSpy.mockReturnValueOnce(false)
      latestTagSpy.mockReturnValueOnce(mockVersion)
      // @ts-expect-error -- Make type-safe later
      fsMock.readFile.mockImplementationOnce((_, __, cb) =>
        cb(undefined, mockReleased)
      )
      stdoutSpy.mockImplementation()

      await changelog.finish([mockGrouped[0]], mockVersion, undefined)

      expect(generateSpy).toBeCalledTimes(1)
      expect(generateSpy).toBeCalledWith([mockGrouped[0]], mockVersion)
      expect(saveSpy).not.toBeCalled()
      expect(printSpy).toBeCalledTimes(1)
      expect(printSpy).toBeCalledWith(mockUnreleased)
    })

    it('should generate changelog with version', async () => {
      const mockReleased = ''
      const mockVersion = '2.0.0'
      const mockUnreleased = generateMockUnreleased(mockVersion)
      hasChangelogSpy.mockReturnValueOnce(false)
      latestTagSpy.mockReturnValueOnce(mockVersion)
      // @ts-expect-error -- Make type-safe later
      fsMock.readFile.mockImplementationOnce((_, __, cb) =>
        cb(undefined, mockReleased)
      )
      stdoutSpy.mockImplementation()

      await changelog.finish([mockGrouped[0]], mockVersion, undefined)

      expect(generateSpy).toBeCalledTimes(1)
      expect(generateSpy).toBeCalledWith([mockGrouped[0]], mockVersion)
      expect(saveSpy).not.toBeCalled()
      expect(printSpy).toBeCalledTimes(1)
      expect(printSpy).toBeCalledWith(mockUnreleased)
    })

    it('should generate changelog with released', async () => {
      const mockVersion = '1.0.0'
      const mockNextVersion = '2.0.0'
      const mockChangelog = generateMockChangelog(mockVersion, mockNextVersion)
      const mockReleased = generateMockReleased(mockVersion)

      hasChangelogSpy.mockReturnValueOnce(true)
      latestTagSpy.mockReturnValueOnce(mockVersion)
      // @ts-expect-error -- Make type-safe later
      fsMock.readFile.mockImplementationOnce((_, __, cb) =>
        cb(undefined, mockReleased)
      )
      stdoutSpy.mockImplementation()

      await changelog.finish([mockGrouped[0]], mockNextVersion, mockVersion)

      expect(generateSpy).toBeCalledTimes(1)
      expect(generateSpy).toBeCalledWith([mockGrouped[0]], mockNextVersion)
      expect(saveSpy).not.toBeCalled()
      expect(printSpy).toBeCalledTimes(1)
      expect(printSpy).toBeCalledWith(mockChangelog)
    })

    it('should write to file with `--write` option', async () => {
      const options = { write: true }
      const mockVersion = undefined
      const mockUnreleased = generateMockUnreleased()
      const mockReleased = ''

      hasChangelogSpy.mockReturnValueOnce(false)
      // @ts-expect-error -- Make type-safe later
      fsMock.readFile.mockImplementationOnce((_, __, cb) =>
        cb(undefined, mockReleased)
      )
      // @ts-expect-error -- Make type-safe later
      fsMock.writeFile.mockImplementationOnce((_, __, ___, cb) => cb(undefined))

      changelog.options = options
      await changelog.finish([mockGrouped[0]], mockVersion, undefined)

      expect(generateSpy).toBeCalledTimes(1)
      expect(generateSpy).toBeCalledWith([mockGrouped[0]], mockVersion)
      expect(saveSpy).toBeCalledTimes(1)
      expect(saveSpy).toBeCalledWith(mockUnreleased)
      expect(printSpy).not.toBeCalled()
    })

    it('should write to file with `--write` option and released', async () => {
      const options = { write: true }
      const mockVersion = '1.0.0'
      const mockNextVersion = '2.0.0'
      const mockChangelog = generateMockChangelog(mockVersion, mockNextVersion)
      const mockReleased = generateMockReleased(mockVersion)

      hasChangelogSpy.mockReturnValueOnce(true)
      // @ts-expect-error -- Make type-safe later
      fsMock.readFile.mockImplementationOnce((_, __, cb) =>
        cb(undefined, mockReleased)
      )
      // @ts-expect-error -- Make type-safe later
      fsMock.writeFile.mockImplementationOnce((_, __, ___, cb) => cb(undefined))

      changelog.options = options
      await changelog.finish([mockGrouped[0]], mockNextVersion, mockVersion)

      expect(generateSpy).toBeCalledTimes(1)
      expect(generateSpy).toBeCalledWith([mockGrouped[0]], mockNextVersion)
      expect(saveSpy).toBeCalledTimes(1)
      expect(saveSpy).toBeCalledWith(mockChangelog)
      expect(printSpy).not.toBeCalled()
    })
  })
})
