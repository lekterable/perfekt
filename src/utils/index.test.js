import { exec } from 'child_process'
import {
  commitRelease,
  generateLine,
  getCommitDetails,
  getCommits,
  updateVersion
} from './index'

jest.mock('child_process', () => ({
  exec: jest.fn()
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
        message: '0.1.0'
      }

      const commitDetails = getCommitDetails(mockedInput)

      expect(commitDetails).toEqual(mockedOutput)
    })
  })

  describe('generateLine', () => {
    it('should generate release line', () => {
      const mockedInput = {
        hash: 'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb',
        scope: 'release',
        title: 'chore(release): 0.1.0',
        message: '0.1.0'
      }
      const mockedOutput = '## 0.1.0\n\n'

      const line = generateLine(mockedInput)

      expect(line).toEqual(mockedOutput)
    })

    it('should skip changelog line', () => {
      const mockedInput = {
        hash: 'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb',
        scope: 'changelog',
        title: 'chore(changelog): update changelog',
        message: 'update changelog'
      }
      const mockedOutput = null

      const line = generateLine(mockedInput)

      expect(line).toEqual(mockedOutput)
    })

    it('should generate common line', () => {
      const mockedInput = {
        hash: 'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb',
        title: 'feat: add feature',
        message: 'add feature'
      }
      const mockedOutput = '- feat: add feature f2191200\n'

      const line = generateLine(mockedInput)

      expect(line).toEqual(mockedOutput)
    })

    it('should add extra space when release line is next', () => {
      const mockedInput = {
        hash: 'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb',
        title: 'feat: add feature',
        message: 'add feature'
      }
      const mockedOutput = '- feat: add feature f2191200\n\n'

      const line = generateLine(mockedInput, true)

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
