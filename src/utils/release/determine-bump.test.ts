import determineBump from './determine-bump'
import * as getCommitsTypes from './get-commits-types'
import * as getChangesType from './get-changes-type'
import Config from '~config'
import Git from '~libs/git'
import Commit from '~libs/commit'

jest.mock('../misc/exec')

const mockCommits = [
  new Commit(
    'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences'
  ),
  new Commit(
    'd34a9f12500df6ea21a17b85b783a41b1fca5347 feat: make changelog ignored scopes configurable'
  ),
  new Commit(
    '5fa8e6c9996444fa0d17493cf1e379a696682696 fix: throw error if there are no commits'
  ),
  new Commit(
    '86aa5dc18c363514e518b16b6eeb0bb2c5d94617 feat: add release `new` keyword'
  )
]

describe('determineBump', () => {
  const { config } = new Config()

  let warnSpy: jest.SpiedFunction<typeof console.warn>
  let getUnreleasedCommitsSpy: jest.SpiedFunction<
    typeof Git.prototype.getUnreleasedCommits
  >
  let getCommitsTypesSpy: jest.SpiedFunction<typeof getCommitsTypes.default>
  let getChangesTypeSpy: jest.SpiedFunction<typeof getChangesType.default>

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn')
    getUnreleasedCommitsSpy = jest.spyOn(Git.prototype, 'getUnreleasedCommits')
    getCommitsTypesSpy = jest.spyOn(getCommitsTypes, 'default')
    getChangesTypeSpy = jest.spyOn(getChangesType, 'default')
  })

  it('should throw if no unreleased commits', () => {
    getUnreleasedCommitsSpy.mockReturnValueOnce([])

    expect(determineBump(config)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"No unreleased commits, nothing to release."`
    )
    expect(getUnreleasedCommitsSpy).toBeCalledTimes(1)
  })

  it('should throw if could not determine bump', async () => {
    getUnreleasedCommitsSpy.mockReturnValueOnce(mockCommits)
    getChangesTypeSpy.mockReturnValueOnce(undefined)

    expect(determineBump(config)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Couldn't determine the version update, provided commit types are invalid."`
    )
    expect(getUnreleasedCommitsSpy).toBeCalledTimes(1)
    expect(getCommitsTypesSpy).toBeCalledTimes(1)
    expect(getCommitsTypesSpy).toBeCalledWith(mockCommits)
  })

  it('should determine bump', async () => {
    const mockBump = 'minor'
    const mockTypes = ['feat', 'fix']

    getUnreleasedCommitsSpy.mockReturnValueOnce(mockCommits)

    const bump = await determineBump(config)

    expect(warnSpy).not.toBeCalled()
    expect(getUnreleasedCommitsSpy).toBeCalledTimes(1)
    expect(getCommitsTypesSpy).toBeCalledTimes(1)
    expect(getCommitsTypesSpy).toBeCalledWith(mockCommits)
    expect(getChangesTypeSpy).toBeCalledTimes(1)
    expect(getChangesTypeSpy).toBeCalledWith(mockTypes, config)
    expect(bump).toBe(mockBump)
  })

  it('should determine bump with breaking', async () => {
    const commits = [
      ...mockCommits,
      new Commit(
        'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat!: make no-commits error more specific'
      )
    ]
    const mockBump = 'major'
    const mockTypes = ['feat', 'fix', 'breaking']

    getUnreleasedCommitsSpy.mockReturnValueOnce(commits)

    const bump = await determineBump(config)

    expect(warnSpy).not.toBeCalled()
    expect(getUnreleasedCommitsSpy).toBeCalledTimes(1)
    expect(getCommitsTypesSpy).toBeCalledTimes(1)
    expect(getCommitsTypesSpy).toBeCalledWith(commits)
    expect(getChangesTypeSpy).toBeCalledTimes(1)
    expect(getChangesTypeSpy).toBeCalledWith(mockTypes, config)
    expect(bump).toBe(mockBump)
  })

  it('should determine bump with unknown types', async () => {
    const commits = [
      ...mockCommits,
      new Commit(
        'ee24740b920b22e916ca5ab0449abb08e99143c4 ci: setup CI with GitHub Actions'
      ),
      new Commit(
        '1a0b3f3e91a9a71bf52882b75c7306046db13c8e refactor: rename function and format tests'
      )
    ]
    const mockBump = 'minor'
    const mockTypes = ['feat', 'fix', 'ci', 'refactor']

    getUnreleasedCommitsSpy.mockReturnValueOnce(commits)
    warnSpy.mockImplementation()

    const bump = await determineBump(config)

    expect(warnSpy).toBeCalledTimes(2)
    expect(getUnreleasedCommitsSpy).toBeCalledTimes(1)
    expect(getCommitsTypesSpy).toBeCalledTimes(1)
    expect(getCommitsTypesSpy).toBeCalledWith(commits)
    expect(getChangesTypeSpy).toBeCalledTimes(1)
    expect(getChangesTypeSpy).toBeCalledWith(mockTypes, config)
    expect(bump).toBe(mockBump)
  })
})
