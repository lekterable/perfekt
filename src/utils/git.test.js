import { exec } from 'child_process'
import {
  commitRelease,
  getCommitDetails,
  getCommits,
  getLatestTag,
  getUnreleasedCommits
} from './git'

jest.mock('child_process', () => ({ exec: jest.fn() }))

describe('git', () => {
  describe('getLatestTag', () => {
    it('should return null if there is no tag', async () => {
      exec.mockImplementationOnce((_, cb) => cb(null))
      const latestTag = await getLatestTag()

      expect(latestTag).toBe(null)
      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith('git tag | tail -n 1', expect.any(Function))
    })

    it('should return latest tag', async () => {
      exec.mockImplementationOnce((_, cb) => cb(null, '2.2.2'))
      const latestTag = await getLatestTag()

      expect(latestTag).toBe('2.2.2')
      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith('git tag | tail -n 1', expect.any(Function))
    })
  })

  describe('getCommits', () => {
    it('should reject if receives an error', async () => {
      const error = 'error'
      exec.mockImplementationOnce((_, cb) => cb(error))

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

      exec.mockImplementationOnce((_, cb) => cb(null, mockedInput))
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
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec\naa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file\nf2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
      const mockedOutput = [
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
      ]

      exec.mockImplementationOnce((_, cb) => cb(null, mockedInput))

      const commits = await getCommits('0.1.0')

      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith(
        'git log --format="%H %s" 0.1.0..',
        expect.any(Function)
      )
      expect(commits).toEqual(mockedOutput)
    })
  })

  describe('getUnreleasedCommits', () => {
    it('should return null if there is no tag', async () => {
      exec.mockImplementationOnce((_, cb) => cb(null, null))

      const commits = await getUnreleasedCommits()

      expect(exec).toBeCalledTimes(1)
      expect(exec).toHaveBeenCalledWith(
        'git tag | tail -n 1',
        expect.any(Function)
      )
      expect(commits).toEqual(null)
    })

    it('should return unreleased commits', async () => {
      const mockedInput =
        'abfb3d86c05b3680a6aed505d0f9194f13912878 chore: update README badges\nee24740b920b22e916ca5ab0449abb08e99143c4 ci: setup CI with GitHub Actions\n8c3ff1c8776cb3cf739b5c8133fa2883b7909f7a chore: reword question\nd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences\n73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0'
      const mockedOutput = [
        'abfb3d86c05b3680a6aed505d0f9194f13912878 chore: update README badges',
        'ee24740b920b22e916ca5ab0449abb08e99143c4 ci: setup CI with GitHub Actions',
        '8c3ff1c8776cb3cf739b5c8133fa2883b7909f7a chore: reword question',
        'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences',
        '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0'
      ]

      exec.mockImplementationOnce((_, cb) => cb(null, '1.2.0'))
      exec.mockImplementationOnce((_, cb) => cb(null, mockedInput))

      const commits = await getUnreleasedCommits()

      expect(exec).toBeCalledTimes(2)
      expect(exec).toHaveBeenNthCalledWith(
        1,
        'git tag | tail -n 1',
        expect.any(Function)
      )
      expect(exec).toHaveBeenNthCalledWith(
        2,
        'git log --format="%H %s" 1.2.0..',
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

    it('should return title and hash for commits using other convention', () => {
      const mockedInput =
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb Add some old feature'
      const mockedOutput = {
        hash: 'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb',
        message: 'Add some old feature'
      }

      const commitDetails = getCommitDetails(mockedInput)

      expect(commitDetails).toEqual(mockedOutput)
    })

    it('should return title for non conventional commits', () => {
      const mockedInput =
        'c31c0ae217dde31fa858070916fbed4931d3c50b init :seedling:'
      const mockedOutput = {
        hash: 'c31c0ae217dde31fa858070916fbed4931d3c50b',
        message: 'init :seedling:'
      }

      const commitDetails = getCommitDetails(mockedInput)

      expect(commitDetails).toEqual(mockedOutput)
    })
  })

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
})
