import { exec } from 'child_process'
import { readFile } from 'fs'
import {
  commitRelease,
  generateChangelog,
  generateLine,
  generateReleased,
  getCommitDetails,
  getCommits,
  getLatestTag,
  groupCommits,
  updateVersion
} from './index'

jest.mock('child_process', () => ({
  exec: jest.fn()
}))
jest.mock('fs', () => ({
  readFile: jest.fn()
}))

describe('utils', () => {
  beforeEach(() => jest.resetAllMocks())

  describe('commitRelease', () => {
    it('should commit release', async () => {
      exec.mockImplementation((_, cb) => cb(null))
      const version = '2.2.2'
      await commitRelease(version)

      expect(exec).toBeCalledTimes(3)
      expect(exec).toBeCalledWith(
        'git add CHANGELOG.md package.json package-lock.json',
        expect.any(Function)
      )
      expect(exec).toBeCalledWith(
        `git commit -m 'chore(release): ${version}'`,
        expect.any(Function)
      )
      expect(exec).toBeCalledWith(`git tag ${version}`, expect.any(Function))
    })
  })

  describe('getLatestTag', () => {
    it('should return null if there is no tag', async () => {
      exec.mockImplementation((_, cb) => cb(null))
      const latestTag = await getLatestTag()

      expect(latestTag).toBe(null)
      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith('git tag | tail -n 1', expect.any(Function))
    })

    it('should return latest tag', async () => {
      exec.mockImplementation((_, cb) => cb(null, '2.2.2'))
      const latestTag = await getLatestTag()

      expect(latestTag).toBe('2.2.2')
      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith('git tag | tail -n 1', expect.any(Function))
    })
  })

  describe('getCommits', () => {
    it('should reject if receives an error', async () => {
      const error = 'error'
      exec.mockImplementation((_, cb) => cb(error))

      expect(getCommits()).rejects.toMatch(error)
    })

    it('should return commits', async () => {
      const mockedInput =
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec\naa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file\nf2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0\nb2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions\n4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
      const mockedOutput = [
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
      ]

      exec.mockImplementation((_, cb) => cb(null, mockedInput))
      const commits = await getCommits()

      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith(
        'git log --format="%H %s"',
        expect.any(Function)
      )
      expect(commits).toEqual(mockedOutput)
    })

    it('should return commits since tag', async () => {
      const mockedInput =
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec\naa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file\nf2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0\nb2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions\n4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
      const mockedOutput = [
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
      ]

      exec.mockImplementation((_, cb) => cb(null, mockedInput))
      const commits = await getCommits('2.2.2')

      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith(
        'git log --format="%H %s" 2.2.2..',
        expect.any(Function)
      )
      expect(commits).toEqual(mockedOutput)
    })
  })

  describe('getCommitDetails', () => {
    it("should return null if commit doesn't exist", () => {
      const mockedInput = null
      const mockedOutput = null

      const commitDetails = getCommitDetails(mockedInput)

      expect(commitDetails).toEqual(mockedOutput)
    })

    it('should return commit details', () => {
      const mockedInput =
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
      const mockedOutput = {
        hash: 'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb',
        scope: 'release',
        title: 'chore(release): 0.1.0',
        message: '0.1.0',
        type: 'chore'
      }

      const commitDetails = getCommitDetails(mockedInput)

      expect(commitDetails).toEqual(mockedOutput)
    })

    it('should return title for non conventional commits', () => {
      const mockedInput =
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb Add some old feature'
      const mockedOutput = 'Add some old feature'

      const commitDetails = getCommitDetails(mockedInput)

      expect(commitDetails).toEqual(mockedOutput)
    })
  })

  describe('generateReleased', () => {
    it('should reject if receives an error', async () => {
      const error = 'error'
      readFile.mockImplementation((_, __, cb) => cb(error))

      expect(generateReleased()).rejects.toMatch(error)
    })

    it('should reject if there is no released but tag provided', async () => {
      const error = 'Previous release not found in CHANGELOG'
      const mockedInput =
        '## Latest\n- feat: include changelog in the releases 2da21c56\n- test: add utils tests 217b25d0'
      readFile.mockImplementation((_, __, cb) => cb(null, mockedInput))

      expect(generateReleased('2.2.2')).rejects.toThrow(error)
    })

    it('should generate released', async () => {
      const mockedInput =
        '## Latest\n- feat: include changelog in the releases 2da21c56\n- test: add utils tests 217b25d0\n## 2.2.2\n- feat: add feature 2da21c56'
      const mockedOutput = '## 2.2.2\n- feat: add feature 2da21c56'
      readFile.mockImplementation((_, __, cb) => cb(null, mockedInput))
      const released = await generateReleased('2.2.2')

      expect(released).toBe(mockedOutput)
    })
  })

  describe('groupCommits', () => {
    it('should group commits with no releases', async () => {
      const mockedInput = [
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
      ]
      const mockedOutput = [
        {
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput)

      expect(grouped).toEqual(mockedOutput)
    })

    it('should group commits', async () => {
      const mockedInput = [
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 chore!: generate changelog',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore!: version releases',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
      ]
      const mockedOutput = [
        {
          breaking: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 chore!: generate changelog',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore!: version releases'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
          ]
        },
        {
          release:
            'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions'
          ],
          feat: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput)

      expect(grouped).toEqual(mockedOutput)
    })

    it('should skip changelog scope', async () => {
      const mockedInput = [
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
      ]
      const mockedOutput = [
        {
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests'
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput)

      expect(grouped).toEqual(mockedOutput)
    })
  })

  describe('generateChangelog', () => {
    it('should generate changelog', () => {
      const mockedInput = [
        {
          breaking: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 feat!: add new api',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 feat!: deprecate function'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
          ]
        },
        {
          release:
            'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions'
          ],
          feat: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 chore: update dependencies'
          ]
        }
      ]
      const mockedOutput =
        '## Latest\n\n### BREAKING\n\n- add new api b2f59019\n- deprecate function 2ea04355\n\n### Features\n\n- add option to write to local CHANGELOG file aa805ce7\n\n### Misc\n\n- extract line generating logic to function and promisify exec bffc2f9e\n\n## 0.1.0\n\n### Features\n\n- add execute release feature 4e02179c\n\n### Fixes\n\n- support other conventions b2f59019\n\n### Misc\n\n- update dependencies 4e02179c\n\n'

      expect(generateChangelog(null, mockedInput)).toBe(mockedOutput)
    })

    it('should generate changelog with version', () => {
      const mockedInput = [
        {
          breaking: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 feat!: add new api',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 feat!: deprecate function'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
          ]
        },
        {
          release:
            'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions'
          ],
          feat: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 chore: update dependencies'
          ]
        }
      ]
      const mockedOutput =
        '## 2.0.0\n\n### BREAKING\n\n- add new api b2f59019\n- deprecate function 2ea04355\n\n### Features\n\n- add option to write to local CHANGELOG file aa805ce7\n\n### Misc\n\n- extract line generating logic to function and promisify exec bffc2f9e\n\n## 0.1.0\n\n### Features\n\n- add execute release feature 4e02179c\n\n### Fixes\n\n- support other conventions b2f59019\n\n### Misc\n\n- update dependencies 4e02179c\n\n'

      expect(generateChangelog('2.0.0', mockedInput)).toBe(mockedOutput)
    })
  })

  describe('generateLine', () => {
    it('should generate line', () => {
      const mockedInput = {
        message: 'generate changelog',
        hash: 'b2f5901922505efbfb6dd684252e8df0cdffeeb2'
      }
      const mockedOutput = '- generate changelog b2f59019'

      const line = generateLine(mockedInput)

      expect(line).toEqual(mockedOutput)
    })
  })

  describe('updateVersion', () => {
    it('should update version', async () => {
      exec.mockImplementation((_, cb) => cb(null))
      const version = '3.3.3'
      await updateVersion(version)

      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith(
        `npm version ${version} --no-git-tag-version`,
        expect.any(Function)
      )
    })
  })
})
