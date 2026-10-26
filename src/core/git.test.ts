import exec from '../utils/misc/exec'
import Git from './git'

vi.mock('../utils/misc/exec')

const execMock = vi.mocked(exec)

const releaseCommit = (version: string) =>
  `60a2d0a9b503d6c8bd0209ac4971dae463c67b34 chore(release): ${version}`

describe('Git', () => {
  let git: Git

  beforeEach(() => {
    git = new Git()
  })

  it('should return `undefined` as the latest tag when git cannot describe one', () => {
    execMock.mockImplementationOnce(() => {
      throw new Error('fatal: No names found, cannot describe anything.')
    })

    expect(git.latestTag).toBe(undefined)
  })

  describe('get latestRelease', () => {
    it.each([
      [
        'the tag when there is no release commit',
        ['1.2.0', undefined],
        { ref: '1.2.0', version: '1.2.0' },
      ],
      [
        'the release commit when there is no tag',
        [undefined, releaseCommit('1.1.0')],
        { ref: '60a2d0a9b503d6c8bd0209ac4971dae463c67b34', version: '1.1.0' },
      ],
      [
        'the release commit when it is ahead of the tag',
        [
          '1.0.0',
          releaseCommit('1.1.0'),
          '6b83b6ab0f7d6e2bdf4f1794dc3d3e2df59a7d45',
          'true',
        ],
        { ref: '60a2d0a9b503d6c8bd0209ac4971dae463c67b34', version: '1.1.0' },
      ],
      [
        'the tag when it points at the latest release commit',
        [
          '1.1.0',
          releaseCommit('1.1.0'),
          '60a2d0a9b503d6c8bd0209ac4971dae463c67b34',
        ],
        { ref: '1.1.0', version: '1.1.0' },
      ],
      [
        'the tag when the release commit is not ahead of it',
        [
          '1.1.0',
          releaseCommit('1.0.0'),
          '6b83b6ab0f7d6e2bdf4f1794dc3d3e2df59a7d45',
          'false',
        ],
        { ref: '1.1.0', version: '1.1.0' },
      ],
    ])('should return %s', (_label, outputs, expected) => {
      outputs.forEach((output) => execMock.mockReturnValueOnce(output))

      expect(git.latestRelease).toEqual(expected)
    })
  })

  describe('getCommits', () => {
    it.each([
      [undefined, 'git log --format="%H %s"', "Couldn't find any commits."],
      [
        '0.1.0',
        'git log --format="%H %s" 0.1.0..',
        "Couldn't find any commits since `0.1.0`.",
      ],
    ])('should read commits since %j', (from, command, error) => {
      execMock.mockReturnValueOnce(
        'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences\n73f2ecbf494ed97fcf34fce833014241fe74a6b6 chore(release): 1.2.0',
      )

      expect(git.getCommits(from).map((commit) => commit.message)).toEqual([
        'replace all placeholder occurrences',
        '1.2.0',
      ])
      expect(execMock).toHaveBeenCalledWith(command)

      execMock.mockReturnValueOnce(undefined)
      expect(() => git.getCommits(from)).toThrow(error)
    })
  })

  it('should not get unreleased commits without a tag or release commit', () => {
    execMock.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined)

    expect(() => git.getUnreleasedCommits()).toThrow(
      "Couldn't get unreleased commits without an existing tag or release commit.",
    )
  })
})
