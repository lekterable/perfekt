import Git from '~core/git'
import { createCommits, createConfig } from '~testing/fixtures'
import determineBump from './determine-bump'

const feat =
  'd0e72481e9b9dc2bed8e495b8943d2d90399db32 feat: replace all placeholder occurrences'
const fix =
  '5fa8e6c9996444fa0d17493cf1e379a696682696 fix: throw error if there are no commits'
const breaking =
  'a357a61a4197d01201a84b9ae7ed7f447e16c7d7 feat!: make no-commits error more specific'
const refactor =
  '1a0b3f3e91a9a71bf52882b75c7306046db13c8e refactor: rename function and format tests'
const ci =
  'ee24740b920b22e916ca5ab0449abb08e99143c4 ci: setup CI with GitHub Actions'

describe('determineBump', () => {
  const config = createConfig()

  const mockUnreleased = (log: string[]) =>
    vi
      .spyOn(Git.prototype, 'getUnreleasedCommits')
      .mockReturnValueOnce(createCommits(log))

  it.each([
    [[feat, fix], 'minor'],
    [[feat, fix, breaking], 'major'],
    [[fix, ci], 'patch'],
    [[ci, refactor], 'patch'],
  ])('should bump %j as %s', async (log, bump) => {
    mockUnreleased(log)

    await expect(determineBump(config)).resolves.toBe(bump)
  })

  it.each([
    [[], 'No unreleased commits, nothing to release.'],
    [[ci], "Couldn't determine a version bump from unreleased commits."],
  ])('should reject %j', async (log, message) => {
    mockUnreleased(log)

    await expect(determineBump(config)).rejects.toThrow(message)
  })
})
