import exec from './utils/misc/exec'
import Git from './git'
import Commit from './commit'

jest.mock('./utils/misc/exec')

const mockLog = [
  'abfb3d86c05b3680a6aed505d0f9194f13912878 chore: update README badges',
  'ee24740b920b22e916ca5ab0449abb08e99143c4 ci: setup CI with GitHub Actions',
  '8c3ff1c8776cb3cf739b5c8133fa2883b7909f7a chore: reword question',
  'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences',
  '73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0'
]

describe('Git', () => {
  const git = new Git()

  describe('get latestTag', () => {
    it('should return null if there is no tag', () => {
      exec.mockReturnValueOnce(null)

      expect(git.latestTag).toBe(null)
      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith('git tag | tail -n 1')
    })

    it('should return latest tag', () => {
      exec.mockReturnValueOnce('2.2.2')

      expect(git.latestTag).toBe('2.2.2')
      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith('git tag | tail -n 1')
    })
  })

  describe('getCommits', () => {
    it('should throw if there is no commits', () => {
      exec.mockReturnValueOnce(null)

      expect(() => git.getCommits()).toThrowErrorMatchingInlineSnapshot(
        `"Could't find any commits."`
      )
      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith('git log --format="%H %s"')
    })

    it('should throw if there is no commits since tag', () => {
      exec.mockReturnValueOnce(null)

      expect(() => git.getCommits('0.1.0')).toThrowErrorMatchingInlineSnapshot(
        `"Could't find any commits since \`0.1.0\`."`
      )
      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith('git log --format="%H %s" 0.1.0..')
    })

    it('should return commits', () => {
      const commits = mockLog.map(line => new Commit(line))

      exec.mockReturnValueOnce(mockLog.join('\n'))

      const result = git.getCommits()

      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith('git log --format="%H %s"')
      expect(result).toEqual(commits)
    })

    it('should return commits since tag', () => {
      const commits = mockLog.map(line => new Commit(line))

      exec.mockReturnValueOnce(mockLog.join('\n'))

      const result = git.getCommits('0.1.0')

      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith('git log --format="%H %s" 0.1.0..')
      expect(result).toEqual(commits)
    })
  })

  describe('getUnreleasedCommits', () => {
    it('should throw if there is no tag', () => {
      exec.mockReturnValueOnce(null)

      expect(() =>
        git.getUnreleasedCommits()
      ).toThrowErrorMatchingInlineSnapshot(
        `"Couldn't get unreleased commits without an existing tag."`
      )
      expect(exec).toBeCalledTimes(1)
      expect(exec).toHaveBeenCalledWith('git tag | tail -n 1')
    })

    it('should return unreleased commits', () => {
      const commits = mockLog.map(line => new Commit(line))

      exec.mockReturnValueOnce('1.2.0')
      exec.mockReturnValueOnce(mockLog.join('\n'))

      const result = git.getUnreleasedCommits()

      expect(exec).toBeCalledTimes(2)
      expect(exec).toHaveBeenNthCalledWith(1, 'git tag | tail -n 1')
      expect(exec).toHaveBeenNthCalledWith(
        2,
        'git log --format="%H %s" 1.2.0..'
      )
      expect(result).toEqual(commits)
    })
  })
})
