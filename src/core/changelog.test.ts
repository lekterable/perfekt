import fs from 'fs'
import Changelog from './changelog'
import { createCommit, createConfig } from '~testing/fixtures'
import { rejectReadFile, resolveReadFile, resolveWriteFile } from '~testing/fs'

jest.mock('fs')

const fsMock = jest.mocked(fs)

const mockVersion = '2.2.3'
const CHANGELOG = 'CHANGELOG.md'

const mockGrouped = [
  {
    feat: [
      createCommit(
        'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences'
      ),
      createCommit(
        'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat: make no-commits error more specific'
      ),
      createCommit(
        '17feea4af5e339532d680a6ef6e9ec331f8abd2e feat: add release version bumping'
      )
    ],
    fix: [
      createCommit(
        '5fa8e6c9996444fa0d17493cf1e379a696682696 fix: throw error if there are no commits'
      )
    ],
    misc: [
      createCommit(
        'ee24740b920b22e916ca5ab0449abb08e99143c4 ci: setup CI with GitHub Actions'
      ),
      createCommit(
        '1a0b3f3e91a9a71bf52882b75c7306046db13c8e refactor: rename function and format tests'
      )
    ]
  },
  {
    feat: [
      createCommit(
        '6b05a3b8430eb18af4c2d9fa67addc78c7357cfb feat: make breaking and misc headers configurable'
      ),
      createCommit(
        '86aa5dc18c363514e518b16b6eeb0bb2c5d94617 feat: add release `new` keyword'
      ),
      createCommit(
        'd34a9f12500df6ea21a17b85b783a41b1fca5347 feat: make changelog ignored scopes configurable'
      )
    ],
    fix: [
      createCommit(
        '5fa8e6c9996444fa0d17493cf1e379a696682696 fix: throw error if there are no commits'
      ),
      createCommit(
        '4d95659f302e0fe968154e17214876849172509f fix: check if changelog exists before accessing'
      )
    ],
    misc: [
      createCommit(
        '8f622021665bc6076d00fde6527800980eba836a chore: include commit links in the changelog'
      )
    ],
    release: createCommit(
      '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0'
    )
  }
]

const generateMockUnreleased = (title = 'Latest') =>
  `# ${title}\n\n## Features\n\n- replace all placeholder occurrences d0e72481\n- make no-commits error more specific a357a61a\n- add release version bumping 17feea4a\n\n## Fixes\n\n- throw error if there are no commits 5fa8e6c9\n\n## Misc\n\n- setup CI with GitHub Actions ee24740b\n- rename function and format tests 1a0b3f3e\n`

const generateMockReleased = (version = '1.0.0') =>
  `# ${version}\n\n## Features\n\n- make breaking and misc headers configurable 6b05a3b8\n- add release \`new\` keyword 86aa5dc1\n- make changelog ignored scopes configurable d34a9f12\n\n## Fixes\n\n- throw error if there are no commits 5fa8e6c9\n- check if changelog exists before accessing 4d95659f\n\n## Misc\n\n- include commit links in the changelog 8f622021\n`

const generateMockChangelog = (
  version = '1.0.0',
  unreleasedVersion?: string
) =>
  unreleasedVersion
    ? generateMockUnreleased(unreleasedVersion) +
      '\n' +
      generateMockReleased(version)
    : generateMockReleased(version)

describe('Changelog', () => {
  let changelog: Changelog
  let stdoutSpy: jest.SpiedFunction<typeof process.stdout.write>

  beforeEach(() => {
    changelog = new Changelog(createConfig())
    stdoutSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
  })

  describe('get hasChangelog', () => {
    it('should return false if CHANGELOG.md does not exist', () => {
      fsMock.existsSync.mockReturnValueOnce(false)

      expect(changelog.hasChangelog).toBe(false)
      expect(fsMock.existsSync).toHaveBeenCalledWith(CHANGELOG)
    })

    it('should return true if CHANGELOG.md exists', () => {
      fsMock.existsSync.mockReturnValueOnce(true)

      expect(changelog.hasChangelog).toBe(true)
      expect(fsMock.existsSync).toHaveBeenCalledWith(CHANGELOG)
    })
  })

  describe('getChangelog', () => {
    it('should reject when reading the changelog fails', async () => {
      fsMock.readFile.mockImplementationOnce(rejectReadFile('error'))

      await expect(changelog.getChangelog()).rejects.toThrow('error')
      expect(fsMock.readFile).toHaveBeenCalledWith(
        CHANGELOG,
        'utf8',
        expect.any(Function)
      )
    })

    it('should return the changelog contents', async () => {
      fsMock.readFile.mockImplementationOnce(resolveReadFile('file'))

      await expect(changelog.getChangelog()).resolves.toBe('file')
    })
  })

  describe('getHistory', () => {
    it('should return undefined when no changelog exists', async () => {
      fsMock.existsSync.mockReturnValueOnce(false)

      await expect(changelog.getHistory(mockVersion)).resolves.toBeUndefined()
    })

    it('should return undefined when the from option is set', async () => {
      fsMock.existsSync.mockReturnValueOnce(true)
      changelog.options = { from: '4e02179c' }

      await expect(changelog.getHistory(mockVersion)).resolves.toBeUndefined()
    })

    it('should return undefined when the root option is set', async () => {
      fsMock.existsSync.mockReturnValueOnce(true)
      changelog.options = { root: true }

      await expect(changelog.getHistory(mockVersion)).resolves.toBeUndefined()
    })

    it('should throw when the changelog does not contain any history', async () => {
      fsMock.existsSync.mockReturnValueOnce(true)
      fsMock.readFile.mockImplementationOnce(resolveReadFile(''))

      await expect(changelog.getHistory(mockVersion)).rejects.toThrow(
        "CHANGELOG doesn't contain any history."
      )
    })

    it('should return only the released history for the previous version', async () => {
      fsMock.existsSync.mockReturnValueOnce(true)
      fsMock.readFile.mockImplementationOnce(
        resolveReadFile(generateMockChangelog(mockVersion))
      )

      await expect(changelog.getHistory(mockVersion)).resolves.toBe(
        generateMockReleased(mockVersion)
      )
    })
  })

  describe('generate', () => {
    it('should generate changelog', () => {
      const result = changelog.generate(mockGrouped, mockVersion)

      expect(result).toMatchSnapshot()
    })
  })

  describe('save', () => {
    it('should write the changelog file', async () => {
      const mockChangelog = generateMockChangelog(mockVersion)
      fsMock.writeFile.mockImplementationOnce(resolveWriteFile())

      await changelog.save(mockChangelog)

      expect(fsMock.writeFile).toHaveBeenCalledWith(
        CHANGELOG,
        mockChangelog,
        'utf8',
        expect.any(Function)
      )
    })
  })

  describe('print', () => {
    it('should print the changelog to stdout', () => {
      const mockChangelog = generateMockChangelog(mockVersion)

      changelog.print(mockChangelog)

      expect(stdoutSpy).toHaveBeenCalledWith(mockChangelog)
    })
  })

  describe('finish', () => {
    it('should print unreleased output when no previous changelog exists', async () => {
      fsMock.existsSync.mockReturnValueOnce(false)

      await changelog.finish([mockGrouped[0]], undefined, undefined)

      expect(stdoutSpy).toHaveBeenCalledWith(generateMockUnreleased())
      expect(fsMock.writeFile).not.toHaveBeenCalled()
    })

    it('should print versioned output when a version is provided', async () => {
      fsMock.existsSync.mockReturnValueOnce(false)

      await changelog.finish([mockGrouped[0]], '2.0.0', undefined)

      expect(stdoutSpy).toHaveBeenCalledWith(generateMockUnreleased('2.0.0'))
    })

    it('should append released history when a previous version is provided', async () => {
      fsMock.existsSync.mockReturnValueOnce(true)
      fsMock.readFile.mockImplementationOnce(
        resolveReadFile(generateMockReleased('1.0.0'))
      )

      await changelog.finish([mockGrouped[0]], '2.0.0', '1.0.0')

      expect(stdoutSpy).toHaveBeenCalledWith(
        generateMockChangelog('1.0.0', '2.0.0')
      )
    })

    it('should write the changelog when the write option is enabled', async () => {
      changelog.options = { write: true }
      fsMock.existsSync.mockReturnValueOnce(false)
      fsMock.writeFile.mockImplementationOnce(resolveWriteFile())

      await changelog.finish([mockGrouped[0]], undefined, undefined)

      expect(fsMock.writeFile).toHaveBeenCalledWith(
        CHANGELOG,
        generateMockUnreleased(),
        'utf8',
        expect.any(Function)
      )
      expect(stdoutSpy).not.toHaveBeenCalled()
    })

    it('should write merged output when history already exists', async () => {
      changelog.options = { write: true }
      fsMock.existsSync.mockReturnValueOnce(true)
      fsMock.readFile.mockImplementationOnce(
        resolveReadFile(generateMockReleased('1.0.0'))
      )
      fsMock.writeFile.mockImplementationOnce(resolveWriteFile())

      await changelog.finish([mockGrouped[0]], '2.0.0', '1.0.0')

      expect(fsMock.writeFile).toHaveBeenCalledWith(
        CHANGELOG,
        generateMockChangelog('1.0.0', '2.0.0'),
        'utf8',
        expect.any(Function)
      )
    })
  })
})
