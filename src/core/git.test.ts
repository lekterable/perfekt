import exec, { execFile } from '../utils/misc/exec'
import Git from './git'
import Commit from './commit'
import { getReleaseFiles } from '../utils/npm/get-package-manager'

jest.mock('child_process')
jest.mock('../utils/misc/exec', () => ({
  __esModule: true,
  default: jest.fn(),
  execFile: jest.fn()
}))
jest.mock('../utils/npm/get-package-manager', () => ({
  getReleaseFiles: jest.fn()
}))

const execMock = jest.mocked(exec)
const execFileMock = jest.mocked(execFile)
const getReleaseFilesMock = jest.mocked(getReleaseFiles)

const mockLog = [
  'abfb3d86c05b3680a6aed505d0f9194f13912878 chore: update README badges',
  'ee24740b920b22e916ca5ab0449abb08e99143c4 ci: setup CI with GitHub Actions',
  '8c3ff1c8776cb3cf739b5c8133fa2883b7909f7a chore: reword question',
  'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences',
  '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0'
]

describe('Git', () => {
  let git: Git

  beforeEach(() => {
    git = new Git()
  })

  describe('release', () => {
    it('should add, commit and create an annotated tag for release files', () => {
      getReleaseFilesMock.mockReturnValueOnce([
        'CHANGELOG.md',
        'package.json',
        'pnpm-lock.yaml'
      ])
      const tagMessage = '## Misc\n\n- tidy up release notes'

      git.release('2.0.0', tagMessage)

      expect(getReleaseFilesMock).toHaveBeenCalledTimes(1)
      expect(execMock).toHaveBeenNthCalledWith(
        1,
        'git add CHANGELOG.md package.json pnpm-lock.yaml'
      )
      expect(execMock).toHaveBeenNthCalledWith(
        2,
        "git commit --no-verify -m 'chore(release): 2.0.0'"
      )
      expect(execFileMock).toHaveBeenCalledWith('git', [
        'tag',
        '-a',
        '2.0.0',
        '-m',
        tagMessage
      ])
    })
  })

  describe('get latestTag', () => {
    it('should return `undefined` when git cannot describe a tag', () => {
      execMock.mockImplementationOnce(() => {
        throw new Error('fatal: No names found, cannot describe anything.')
      })

      expect(git.latestTag).toBe(undefined)
      expect(execMock).toHaveBeenCalledTimes(1)
      expect(execMock).toHaveBeenCalledWith('git describe --tags --abbrev=0')
    })

    it('should return latest tag', () => {
      execMock.mockReturnValueOnce('2.2.2')

      expect(git.latestTag).toBe('2.2.2')
      expect(execMock).toHaveBeenCalledTimes(1)
      expect(execMock).toHaveBeenCalledWith('git describe --tags --abbrev=0')
    })
  })

  describe('get latestRelease', () => {
    it('should return the latest tag when there is no release commit', () => {
      execMock.mockReturnValueOnce('1.2.0').mockReturnValueOnce(undefined)

      expect(git.latestRelease).toEqual({ ref: '1.2.0', version: '1.2.0' })
    })

    it('should return the latest release commit when there is no tag', () => {
      execMock
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(
          '60a2d0a9b503d6c8bd0209ac4971dae463c67b34 chore(release): 1.1.0'
        )

      expect(git.latestRelease).toEqual({
        ref: '60a2d0a9b503d6c8bd0209ac4971dae463c67b34',
        version: '1.1.0'
      })
    })

    it('should prefer the newer release commit when it is ahead of the latest tag', () => {
      execMock
        .mockReturnValueOnce('1.0.0')
        .mockReturnValueOnce(
          '60a2d0a9b503d6c8bd0209ac4971dae463c67b34 chore(release): 1.1.0'
        )
        .mockReturnValueOnce('6b83b6ab0f7d6e2bdf4f1794dc3d3e2df59a7d45')
        .mockReturnValueOnce('true')

      expect(git.latestRelease).toEqual({
        ref: '60a2d0a9b503d6c8bd0209ac4971dae463c67b34',
        version: '1.1.0'
      })
    })

    it('should keep the latest tag when it is not behind the latest release commit', () => {
      execMock
        .mockReturnValueOnce('1.1.0')
        .mockReturnValueOnce(
          '60a2d0a9b503d6c8bd0209ac4971dae463c67b34 chore(release): 1.0.0'
        )
        .mockReturnValueOnce('60a2d0a9b503d6c8bd0209ac4971dae463c67b34')
        .mockReturnValueOnce('false')

      expect(git.latestRelease).toEqual({ ref: '1.1.0', version: '1.1.0' })
    })
  })

  describe('get isClean', () => {
    it('should return true when the working tree is clean', () => {
      execMock.mockReturnValueOnce('')

      expect(git.isClean).toBe(true)
      expect(execMock).toHaveBeenCalledTimes(1)
      expect(execMock).toHaveBeenCalledWith('git status --porcelain')
    })

    it('should return false when the working tree has changes', () => {
      execMock.mockReturnValueOnce(' M README.md\n')

      expect(git.isClean).toBe(false)
      expect(execMock).toHaveBeenCalledTimes(1)
      expect(execMock).toHaveBeenCalledWith('git status --porcelain')
    })
  })

  describe('getCommits', () => {
    it('should throw if there is no commits', () => {
      execMock.mockReturnValueOnce(undefined)

      expect(() => git.getCommits()).toThrowErrorMatchingInlineSnapshot(
        `"Couldn't find any commits."`
      )
      expect(execMock).toHaveBeenCalledTimes(1)
      expect(execMock).toHaveBeenCalledWith('git log --format="%H %s"')
    })

    it('should throw if there is no commits since tag', () => {
      execMock.mockReturnValueOnce(undefined)

      expect(() => git.getCommits('0.1.0')).toThrowErrorMatchingInlineSnapshot(
        `"Couldn't find any commits since \`0.1.0\`."`
      )
      expect(execMock).toHaveBeenCalledTimes(1)
      expect(execMock).toHaveBeenCalledWith('git log --format="%H %s" 0.1.0..')
    })

    it('should return commits', () => {
      const commits = mockLog.map(line => new Commit(line))

      execMock.mockReturnValueOnce(mockLog.join('\n'))

      const result = git.getCommits()

      expect(execMock).toHaveBeenCalledTimes(1)
      expect(execMock).toHaveBeenCalledWith('git log --format="%H %s"')
      expect(result).toEqual(commits)
    })

    it('should return commits since tag', () => {
      const commits = mockLog.map(line => new Commit(line))

      execMock.mockReturnValueOnce(mockLog.join('\n'))

      const result = git.getCommits('0.1.0')

      expect(execMock).toHaveBeenCalledTimes(1)
      expect(execMock).toHaveBeenCalledWith('git log --format="%H %s" 0.1.0..')
      expect(result).toEqual(commits)
    })
  })

  describe('getUnreleasedCommits', () => {
    it('should throw if there is no tag or release commit', () => {
      execMock.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined)

      expect(() =>
        git.getUnreleasedCommits()
      ).toThrowErrorMatchingInlineSnapshot(
        `"Couldn't get unreleased commits without an existing tag or release commit."`
      )
      expect(execMock).toHaveBeenCalledTimes(2)
    })

    it('should return unreleased commits since the latest tag', () => {
      const commits = mockLog.map(line => new Commit(line))

      execMock.mockReturnValueOnce('1.2.0')
      execMock.mockReturnValueOnce(
        '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0'
      )
      execMock.mockReturnValueOnce('73f2ecbf494ed97fcf34fce833014241fe74a6b6')
      execMock.mockReturnValueOnce(mockLog.join('\n'))

      const result = git.getUnreleasedCommits()

      expect(execMock).toHaveBeenCalledTimes(4)
      expect(execMock).toHaveBeenNthCalledWith(
        4,
        'git log --format="%H %s" 1.2.0..'
      )
      expect(result).toEqual(commits)
    })

    it('should return unreleased commits since the latest release commit when a newer tag is missing', () => {
      const commits = mockLog.map(line => new Commit(line))

      execMock.mockReturnValueOnce('1.0.0')
      execMock.mockReturnValueOnce(
        '60a2d0a9b503d6c8bd0209ac4971dae463c67b34 chore(release): 1.1.0'
      )
      execMock.mockReturnValueOnce('6b83b6ab0f7d6e2bdf4f1794dc3d3e2df59a7d45')
      execMock.mockReturnValueOnce('true')
      execMock.mockReturnValueOnce(mockLog.join('\n'))

      const result = git.getUnreleasedCommits()

      expect(execMock).toHaveBeenNthCalledWith(
        5,
        'git log --format="%H %s" 60a2d0a9b503d6c8bd0209ac4971dae463c67b34..'
      )
      expect(result).toEqual(commits)
    })
  })
})
