import fs from 'node:fs'
import { createCommit, createConfig } from '~testing/fixtures'
import { resolveReadFile } from '~testing/fs'
import Changelog from './changelog'

vi.mock('node:fs')

const fsMock = vi.mocked(fs)

const mockVersion = '2.2.3'

const mockGrouped = [
  {
    feat: [
      createCommit(
        'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences',
      ),
      createCommit(
        'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat: make no-commits error more specific',
      ),
      createCommit(
        '17feea4af5e339532d680a6ef6e9ec331f8abd2e feat: add release version bumping',
      ),
    ],
    fix: [
      createCommit(
        '5fa8e6c9996444fa0d17493cf1e379a696682696 fix: throw error if there are no commits',
      ),
    ],
    misc: [
      createCommit(
        'ee24740b920b22e916ca5ab0449abb08e99143c4 ci: setup CI with GitHub Actions',
      ),
      createCommit(
        '1a0b3f3e91a9a71bf52882b75c7306046db13c8e refactor: rename function and format tests',
      ),
    ],
  },
]

const generateMockUnreleased = (title = 'Latest') =>
  `# ${title}\n\n## Features\n\n- replace all placeholder occurrences d0e72481\n- make no-commits error more specific a357a61a\n- add release version bumping 17feea4a\n\n## Fixes\n\n- throw error if there are no commits 5fa8e6c9\n\n## Misc\n\n- setup CI with GitHub Actions ee24740b\n- rename function and format tests 1a0b3f3e\n`

const generateMockReleased = (version = '1.0.0') =>
  `# ${version}\n\n## Features\n\n- make breaking and misc headers configurable 6b05a3b8\n- add release \`new\` keyword 86aa5dc1\n- make changelog ignored scopes configurable d34a9f12\n\n## Fixes\n\n- throw error if there are no commits 5fa8e6c9\n- check if changelog exists before accessing 4d95659f\n\n## Misc\n\n- include commit links in the changelog 8f622021\n`

describe('Changelog', () => {
  let changelog: Changelog

  beforeEach(() => {
    changelog = new Changelog(createConfig())
  })

  describe('getHistory', () => {
    it('should return undefined when no changelog exists', async () => {
      fsMock.existsSync.mockReturnValueOnce(false)

      await expect(changelog.getHistory(mockVersion)).resolves.toBeUndefined()
    })

    it.each([[{ from: '4e02179c' }], [{ root: true }]])(
      'should return undefined when %j is set',
      async (options) => {
        fsMock.existsSync.mockReturnValueOnce(true)
        changelog.options = options

        await expect(changelog.getHistory(mockVersion)).resolves.toBeUndefined()
      },
    )

    it('should throw when the changelog does not contain any history', async () => {
      fsMock.existsSync.mockReturnValueOnce(true)
      fsMock.readFile.mockImplementationOnce(resolveReadFile(''))

      await expect(changelog.getHistory(mockVersion)).rejects.toThrow(
        "CHANGELOG doesn't contain any history.",
      )
    })

    it('should return only the released history for the previous version', async () => {
      fsMock.existsSync.mockReturnValueOnce(true)
      fsMock.readFile.mockImplementationOnce(
        resolveReadFile(
          `${generateMockUnreleased()}\n${generateMockReleased(mockVersion)}`,
        ),
      )

      await expect(changelog.getHistory(mockVersion)).resolves.toBe(
        generateMockReleased(mockVersion),
      )
    })
  })

  describe('render', () => {
    it('should append the released history when a previous version is given', async () => {
      fsMock.existsSync.mockReturnValueOnce(true)
      fsMock.readFile.mockImplementationOnce(
        resolveReadFile(generateMockReleased('1.0.0')),
      )

      await expect(
        changelog.render(mockGrouped, '2.0.0', '1.0.0'),
      ).resolves.toBe(
        `${generateMockUnreleased('2.0.0')}\n${generateMockReleased('1.0.0')}`,
      )
    })
  })
})
